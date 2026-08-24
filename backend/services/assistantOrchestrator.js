const { createAssistantToolRegistry } = require('./assistantToolRegistry')
const { assertAssistantProvider, PROVIDER_RESULT_TYPES } = require('./providers/assistantProvider')
const { createAssistantProvider } = require('./providers/providerFactory')
const { multiToolClarification, normalizeConversationContext, resolveConversationTurn } = require('./assistantConversation')
const {
  ALLOWED_CURRENT_ROUTES,
  ASSISTANT_SYSTEM_POLICY,
  ORCHESTRATION_LIMITS,
  findPolicyRejection,
} = require('../policies/assistantSystemPolicy')

const EMPTY_PRESENTATION = Object.freeze({ specimens: [], images: [], measurements: [], coverage: null, helpTopic: null })
const DETERMINISTIC_PROVIDER = Object.freeze({ name: 'deterministic' })

function presentation(overrides = {}) {
  return { specimens: [], images: [], measurements: [], coverage: null, helpTopic: null, ...overrides }
}

function meta(provider, overrides = {}) {
  return {
    tool: null,
    grounded: false,
    provider: provider.name,
    usage: { inputTokens: null, outputTokens: null, totalTokens: null },
    ...overrides,
  }
}

function safeResponse(type, answer, provider, overrides = {}) {
  return {
    type,
    answer,
    presentation: presentation(overrides.presentation),
    sources: Array.isArray(overrides.sources) ? overrides.sources : [],
    meta: meta(provider, overrides.meta),
  }
}

function cleanAnswer(value, fallback) {
  const answer = typeof value === 'string' ? value.trim() : ''
  return (answer || fallback).slice(0, ORCHESTRATION_LIMITS.maxResponseLength)
}

function normalizeProviderUsage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const token = (count) => Number.isFinite(count) && count >= 0 ? count : null
  return { inputTokens: token(value.inputTokens), outputTokens: token(value.outputTokens), totalTokens: token(value.totalTokens) }
}

function combineProviderUsage(...values) {
  const normalized = values.map(normalizeProviderUsage).filter(Boolean)
  if (!normalized.length) return undefined
  const sum = (key) => {
    const counts = normalized.map((usage) => usage[key]).filter(Number.isFinite)
    return counts.length ? counts.reduce((total, count) => total + count, 0) : null
  }
  return { inputTokens: sum('inputTokens'), outputTokens: sum('outputTokens'), totalTokens: sum('totalTokens') }
}

function boundedCopy(value, depth = 0) {
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'string') return value.slice(0, ORCHESTRATION_LIMITS.maxToolTextLength)
  if (depth >= ORCHESTRATION_LIMITS.maxToolOutputDepth) return null
  if (Array.isArray(value)) return value.slice(0, ORCHESTRATION_LIMITS.maxToolRecords).map((item) => boundedCopy(item, depth + 1))
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, boundedCopy(item, depth + 1)]))
  return undefined
}

function sourceKey(source) { return `${source.type}:${source.id}` }
function addSource(list, seen, source) {
  if (!source.id || seen.has(sourceKey(source)) || list.length >= ORCHESTRATION_LIMITS.maxToolRecords) return
  seen.add(sourceKey(source)); list.push(source)
}

function buildSources(toolName, result) {
  const sources = []; const seen = new Set()
  for (const record of result.records || []) {
    if (record?.specimenId) addSource(sources, seen, { type: 'specimen', id: record.specimenId, route: `/specimens/${encodeURIComponent(record.specimenId)}` })
    if (record?.imageId) addSource(sources, seen, { type: 'image', id: record.imageId, route: `/image/${encodeURIComponent(record.imageId)}` })
    if (record?.measurementId) addSource(sources, seen, { type: 'measurement', id: record.measurementId, route: `/specimens/${encodeURIComponent(record.specimenId || result.specimen?.specimenId || '')}` })
  }
  if (result.specimen?.specimenId) addSource(sources, seen, { type: 'specimen', id: result.specimen.specimenId, route: `/specimens/${encodeURIComponent(result.specimen.specimenId)}` })
  if (result.type === 'COVERAGE_RESULT' && result.skeletonCode) addSource(sources, seen, { type: 'skeleton', id: result.skeletonCode, route: '/skeleton' })
  if (result.type === 'SYSTEM_HELP' && result.topic?.id) {
    const trustedRoute = result.topic.routes?.find((route) => typeof route.path === 'string' && route.path.startsWith('/'))?.path || '/ai-assistant'
    addSource(sources, seen, { type: 'help', id: result.topic.id, route: trustedRoute })
  }
  return sources
}

function buildPresentation(result) {
  if (result.type === 'SPECIMEN_RESULTS') return presentation({ specimens: result.records || [] })
  if (result.type === 'IMAGE_RESULTS') return presentation({ images: result.records || [] })
  if (result.type === 'MEASUREMENT_RESULTS') return presentation({ specimens: result.specimen ? [result.specimen] : [], measurements: result.records || [] })
  if (result.type === 'COVERAGE_RESULT') return presentation({ coverage: result })
  if (result.type === 'SYSTEM_HELP') return presentation({ helpTopic: result.topic || null })
  return presentation()
}

function hasNoResult(result) {
  return result.type === 'NOT_FOUND' || result.type === 'HELP_NOT_FOUND' || (Array.isArray(result.records) && result.records.length === 0)
}

function notFoundAnswer(toolName, result) {
  if (result.type === 'HELP_NOT_FOUND') return "I don't have verified OAHRIS guidance for that workflow yet."
  if (result.type === 'NOT_FOUND') return `No matching OAHRIS ${result.resource || 'record'} was found.`
  if (toolName === 'search_images') return 'No matching OAHRIS image records were found.'
  if (toolName === 'get_measurements') return 'No recorded OAHRIS measurements were found for that specimen.'
  return 'No matching OAHRIS specimen records were found.'
}

function deterministicAnswer(toolName, result) {
  if (result.type === 'SYSTEM_HELP') return result.topic?.summary || 'Verified OAHRIS guidance was retrieved.'
  if (result.type === 'COVERAGE_RESULT') return `Coverage retrieved for ${result.skeletonCode}.`
  const count = Array.isArray(result.records) ? result.records.length : 0
  if (toolName === 'search_images') return `${count} matching image record${count === 1 ? '' : 's'} found.`
  if (toolName === 'get_measurements') return `${count} measurement record${count === 1 ? '' : 's'} found.`
  return `${count} matching specimen record${count === 1 ? '' : 's'} found.`
}

function providerCall(work) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(Object.assign(new Error('Provider timeout.'), { code: 'PROVIDER_TIMEOUT' })), ORCHESTRATION_LIMITS.providerTimeoutMs)
  })
  return Promise.race([Promise.resolve().then(work), timeout]).finally(() => clearTimeout(timeoutId))
}

function createAssistantOrchestrator({ provider = createAssistantProvider(), toolRegistry = createAssistantToolRegistry() } = {}) {
  const activeProvider = assertAssistantProvider(provider)
  return {
    async respond({ message, currentRoute, context } = {}) {
      const normalizedMessage = typeof message === 'string' ? message.trim() : ''
      if (!normalizedMessage || normalizedMessage.length > ORCHESTRATION_LIMITS.maxUserMessageLength) {
        return safeResponse('ERROR', 'A message between 1 and 1000 characters is required.', activeProvider, { meta: { code: 'INVALID_MESSAGE' } })
      }
      if (currentRoute !== undefined && currentRoute !== null && !ALLOWED_CURRENT_ROUTES.includes(currentRoute)) {
        return safeResponse('ERROR', 'The current OAHRIS route is not supported.', activeProvider, { meta: { code: 'INVALID_CURRENT_ROUTE' } })
      }
      let normalizedContext
      try { normalizedContext = normalizeConversationContext(context) } catch (error) {
        return safeResponse('ERROR', 'The supplied conversation context is invalid.', activeProvider, { meta: { code: error.code || 'INVALID_CONVERSATION_CONTEXT' } })
      }
      const rejection = findPolicyRejection(normalizedMessage)
      if (rejection) return safeResponse('POLICY_REJECTION', rejection.message, activeProvider, { meta: { code: rejection.code } })

      let selection = resolveConversationTurn({ message: normalizedMessage, context: normalizedContext })
      const deterministic = Boolean(selection?.deterministic)
      if (!selection) {
        try {
          selection = await providerCall(() => activeProvider.selectTool({
            message: normalizedMessage,
            currentRoute: currentRoute || null,
            conversationContext: normalizedContext,
            systemPolicy: ASSISTANT_SYSTEM_POLICY,
            tools: toolRegistry.getDefinitions(),
            limits: ORCHESTRATION_LIMITS,
          }))
        } catch (_) {
          return safeResponse('ERROR', 'OAHRIS Assistant could not process the request.', activeProvider, { meta: { code: 'PROVIDER_FAILURE' } })
        }
      }

      if (!selection || !Array.isArray(selection.toolCalls)) return safeResponse('ERROR', 'OAHRIS Assistant received an invalid provider response.', activeProvider, { meta: { code: 'INVALID_PROVIDER_RESPONSE' } })
      if (selection.toolCalls.length > ORCHESTRATION_LIMITS.maxToolCalls) return safeResponse('CLARIFICATION', multiToolClarification(selection.toolCalls), activeProvider, { meta: { code: 'MULTIPLE_ACTIONS_NEED_CLARIFICATION', ...(selection.usage ? { usage: normalizeProviderUsage(selection.usage) } : {}) } })
      if (selection.toolCalls.length === 0) {
        const selectionUsage = normalizeProviderUsage(selection.usage)
        if (selection.type === PROVIDER_RESULT_TYPES.CLARIFICATION || selection.clarification || selection.answer) return safeResponse('CLARIFICATION', cleanAnswer(selection.clarification || selection.answer, 'Please provide a more specific OAHRIS record or workflow request.'), deterministic ? DETERMINISTIC_PROVIDER : activeProvider, { meta: selectionUsage ? { usage: selectionUsage } : {} })
        return safeResponse('UNSUPPORTED_QUERY', 'I could not map that request to a supported read-only OAHRIS operation.', activeProvider, { meta: selectionUsage ? { usage: selectionUsage } : {} })
      }

      const toolCall = selection.toolCalls[0]
      if (!toolCall || typeof toolCall.name !== 'string' || !toolRegistry.has(toolCall.name)) return safeResponse('POLICY_REJECTION', 'The requested assistant tool is not allowed.', activeProvider, { meta: { code: 'TOOL_NOT_ALLOWED' } })
      let args
      try { args = toolRegistry.validate(toolCall.name, toolCall.arguments) } catch (error) {
        return safeResponse('POLICY_REJECTION', 'The assistant tool request contained invalid arguments.', activeProvider, { meta: { code: error.code || 'INVALID_TOOL_ARGUMENTS' } })
      }

      let toolResult
      try { toolResult = boundedCopy(await toolRegistry.execute(toolCall.name, args)) } catch (_) {
        return safeResponse('ERROR', 'The requested OAHRIS records could not be retrieved.', activeProvider, { meta: { code: 'TOOL_EXECUTION_FAILED', tool: toolCall.name } })
      }
      if (!toolResult || typeof toolResult !== 'object' || typeof toolResult.type !== 'string') return safeResponse('ERROR', 'The OAHRIS service returned an invalid result.', activeProvider, { meta: { code: 'INVALID_TOOL_RESULT', tool: toolCall.name } })

      const responseProvider = deterministic ? DETERMINISTIC_PROVIDER : activeProvider
      const groundedMeta = { tool: toolCall.name, grounded: true }
      const serverPresentation = buildPresentation(toolResult)
      const serverSources = buildSources(toolCall.name, toolResult)
      if (hasNoResult(toolResult)) return safeResponse('NOT_FOUND', notFoundAnswer(toolCall.name, toolResult), responseProvider, { presentation: serverPresentation, sources: serverSources, meta: groundedMeta })
      if (deterministic) return safeResponse(toolCall.name === 'get_system_help' ? 'SYSTEM_HELP' : 'GROUNDED_ANSWER', deterministicAnswer(toolCall.name, toolResult), DETERMINISTIC_PROVIDER, { presentation: serverPresentation, sources: serverSources, meta: groundedMeta })

      let synthesis
      try {
        synthesis = await providerCall(() => activeProvider.synthesize({
          message: normalizedMessage,
          currentRoute: currentRoute || null,
          systemPolicy: ASSISTANT_SYSTEM_POLICY,
          toolName: toolCall.name,
          toolResult,
          limits: ORCHESTRATION_LIMITS,
        }))
      } catch (_) {
        return safeResponse('ERROR', 'OAHRIS Assistant could not produce a grounded response.', activeProvider, { meta: { code: 'PROVIDER_FAILURE', tool: toolCall.name } })
      }
      const answer = cleanAnswer(synthesis?.answer, 'The requested OAHRIS information was retrieved.')
      const usage = combineProviderUsage(selection.usage, synthesis?.usage)
      return safeResponse('GROUNDED_ANSWER', answer, activeProvider, { presentation: serverPresentation, sources: serverSources, meta: { ...groundedMeta, ...(usage ? { usage } : {}) } })
    },
  }
}

function createDefaultAssistantOrchestrator() {
  return createAssistantOrchestrator({ provider: createAssistantProvider(), toolRegistry: createAssistantToolRegistry() })
}

module.exports = {
  EMPTY_PRESENTATION,
  createAssistantOrchestrator,
  createDefaultAssistantOrchestrator,
}
