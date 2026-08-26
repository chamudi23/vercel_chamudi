const assert = require('node:assert/strict')
const { createDeepSeekProvider, DEEPSEEK_DEFAULTS } = require('../backend/services/providers/deepseekProvider')
const { createAssistantProvider } = require('../backend/services/providers/providerFactory')
const { createAssistantOrchestrator } = require('../backend/services/assistantOrchestrator')
const { createAssistantToolRegistry } = require('../backend/services/assistantToolRegistry')
const { ASSISTANT_SYSTEM_POLICY } = require('../backend/policies/assistantSystemPolicy')
const { completion, selections, toolCall } = require('./fixtures/deepseekResponses.cjs')

const FAKE_KEY = 'test-deepseek-key'
globalThis.fetch = async () => { throw new Error('Unmocked network access is disabled in DeepSeek provider tests.') }

function response(body, status = 200) { return { ok: status >= 200 && status < 300, status, async json() { return body } } }
function invalidJsonResponse() { return { ok: true, status: 200, async json() { throw new SyntaxError('mock invalid json') } } }
function queueFetch(entries, captures = []) {
  let index = 0
  return async (url, options) => {
    captures.push({ url, options, body: JSON.parse(options.body) })
    const entry = entries[index++]
    if (entry instanceof Error) throw entry
    if (typeof entry === 'function') return entry(url, options)
    if (!entry) throw new Error('Unplanned mocked fetch call.')
    return entry
  }
}

function serviceSet(overrides = {}) {
  const calls = []
  return {
    calls,
    searchSpecimens: async (args) => { calls.push(['search_specimens', args]); return { type: 'SPECIMEN_RESULTS', records: [{ specimenId: 'SP-1', skeletonCode: 'SK001', boneType: 'Femur', side: 'Left', notes: null }] } },
    getSpecimen: async (id) => { calls.push(['get_specimen', { specimenId: id }]); return { type: 'SPECIMEN_RESULTS', records: [{ specimenId: id, skeletonCode: 'SK001', notes: null }] } },
    searchImages: async (args) => { calls.push(['search_images', args]); return { type: 'IMAGE_RESULTS', records: [{ imageId: 'IMG-1', specimenId: 'SP-1', boneType: 'Femur', side: 'Left', condition: 'Fragmented', notes: null }] } },
    getMeasurements: async (id) => { calls.push(['get_measurements', { specimenId: id }]); return { type: 'MEASUREMENT_RESULTS', specimen: { specimenId: id }, records: [{ measurementId: 'M-1', specimenId: id, value: null, unit: 'mm' }] } },
    getSkeletonCoverage: async (code) => { calls.push(['get_skeleton_coverage', { skeletonCode: code }]); return { type: 'COVERAGE_RESULT', skeletonCode: code, categoryCoveragePercentage: 25, imageDocumentationPercentage: 50, groups: [] } },
    getSystemHelp: (query) => { calls.push(['get_system_help', { query }]); return { type: 'SYSTEM_HELP', topic: { id: 'skeleton-viewer', title: 'Skeleton viewer', summary: 'Verified help.', steps: [], routes: [{ label: 'Open', path: '/skeleton' }] } } },
    ...overrides,
  }
}

const registryForDefinitions = createAssistantToolRegistry(serviceSet())
const selectionContext = { message: 'A bounded OAHRIS request.', currentRoute: '/ai-assistant', systemPolicy: ASSISTANT_SYSTEM_POLICY, tools: registryForDefinitions.getDefinitions() }

function providerWith(entries, options = {}) {
  const captures = []
  const provider = createDeepSeekProvider({ apiKey: FAKE_KEY, fetchImpl: queueFetch(entries, captures), timeoutMs: options.timeoutMs, maxOutputTokens: options.maxOutputTokens, model: options.model })
  return { provider, captures }
}

function integrated(entries, overrides = {}) {
  const captures = []
  const services = serviceSet(overrides.services)
  const provider = createDeepSeekProvider({ apiKey: FAKE_KEY, fetchImpl: queueFetch(entries, captures), timeoutMs: overrides.timeoutMs })
  const secured = createAssistantOrchestrator({ provider, toolRegistry: createAssistantToolRegistry(services) })
  const orchestrator = { respond: (request) => secured.respond({ user: { id: 'test-researcher', role: 'researcher' }, ...request }) }
  return { captures, services, provider, orchestrator }
}

const tests = []
function test(name, fn) { tests.push({ name, fn }) }

for (const name of ['search_images', 'search_specimens', 'get_specimen', 'get_measurements', 'get_skeleton_coverage', 'get_system_help']) {
  test(`valid ${name} tool call is normalized`, async () => {
    const { provider } = providerWith([response(selections[name])])
    const selected = await provider.selectTool(selectionContext)
    assert.equal(selected.toolCalls.length, 1)
    assert.equal(selected.toolCalls[0].name, name)
    assert.equal(typeof selected.toolCalls[0].arguments, 'object')
  })
}

test('no tool call returns a clarification without executing prose', async () => {
  const fixture = completion({ content: 'Which bone category should I search?' })
  const { provider } = providerWith([response(fixture)])
  const selected = await provider.selectTool(selectionContext)
  assert.equal(selected.type, 'CLARIFICATION'); assert.deepEqual(selected.toolCalls, [])
})

test('provider prose pretending to be a tool remains non-executable prose', async () => {
  const fixture = completion({ content: 'search_images({"boneType":"Femur"})' })
  const { provider } = providerWith([response(fixture)])
  const selected = await provider.selectTool(selectionContext)
  assert.equal(selected.type, 'CLARIFICATION'); assert.equal(selected.toolCalls.length, 0)
})

test('unknown tool reaches the strict orchestrator rejection without execution', async () => {
  const fixture = completion({ toolCalls: [toolCall('delete_specimen', { specimenId: 'SP-1' })] })
  const { orchestrator, services } = integrated([response(fixture)])
  const result = await orchestrator.respond({ message: 'Perform the proposed read-only request.' })
  assert.equal(result.type, 'POLICY_REJECTION'); assert.equal(result.meta.code, 'TOOL_NOT_ALLOWED'); assert.equal(services.calls.length, 0)
})

test('multiple tool calls request clarification without partial execution', async () => {
  const fixture = completion({ toolCalls: [toolCall('search_images', { boneType: 'Femur' }), toolCall('get_system_help', { query: 'viewer' })] })
  const { orchestrator, services } = integrated([response(fixture)])
  const result = await orchestrator.respond({ message: 'Handle a compound request.' })
  assert.equal(result.type, 'CLARIFICATION'); assert.equal(result.meta.code, 'MULTIPLE_ACTIONS_NEED_CLARIFICATION'); assert.equal(services.calls.length, 0)
})

test('malformed tool JSON returns a normalized provider error', async () => {
  const fixture = completion({ toolCalls: [toolCall('search_images', '{not-json')] })
  const { provider } = providerWith([response(fixture)])
  await assert.rejects(provider.selectTool(selectionContext), { code: 'DEEPSEEK_INVALID_TOOL_JSON' })
})

test('missing required arguments are rejected by the server registry', async () => {
  const fixture = completion({ toolCalls: [toolCall('get_specimen', {})] })
  const { orchestrator, services } = integrated([response(fixture)])
  const result = await orchestrator.respond({ message: 'Retrieve one specimen.' })
  assert.equal(result.meta.code, 'INVALID_TOOL_ARGUMENTS'); assert.equal(services.calls.length, 0)
})

test('additional properties are rejected by the server registry', async () => {
  const fixture = completion({ toolCalls: [toolCall('search_images', { boneType: 'Femur', limit: 999 })] })
  const { orchestrator, services } = integrated([response(fixture)])
  const result = await orchestrator.respond({ message: 'Handle the requested OAHRIS lookup.' })
  assert.equal(result.meta.code, 'INVALID_TOOL_ARGUMENTS'); assert.equal(services.calls.length, 0)
})

test('non-object tool arguments are rejected by the server registry', async () => {
  const fixture = completion({ toolCalls: [toolCall('get_specimen', ['SP-1'])] })
  const { orchestrator, services } = integrated([response(fixture)])
  const result = await orchestrator.respond({ message: 'Retrieve one specimen.' })
  assert.equal(result.meta.code, 'INVALID_TOOL_ARGUMENTS'); assert.equal(services.calls.length, 0)
})

test('timeout aborts the mocked HTTP request', async () => {
  const hangingFetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => { const error = new Error('mock abort'); error.name = 'AbortError'; reject(error) }, { once: true }))
  const provider = createDeepSeekProvider({ apiKey: FAKE_KEY, fetchImpl: hangingFetch, timeoutMs: 5 })
  await assert.rejects(provider.selectTool(selectionContext), { code: 'DEEPSEEK_TIMEOUT' })
})

test('network failure is normalized', async () => {
  const { provider } = providerWith([new Error('socket failure with internals')])
  await assert.rejects(provider.selectTool(selectionContext), { code: 'DEEPSEEK_NETWORK_FAILURE', message: 'DeepSeek could not be reached.' })
})

for (const [status, code] of [[401, 'DEEPSEEK_AUTHENTICATION_FAILED'], [403, 'DEEPSEEK_ACCESS_DENIED'], [429, 'DEEPSEEK_RATE_LIMITED'], [500, 'DEEPSEEK_UNAVAILABLE'], [502, 'DEEPSEEK_UNAVAILABLE'], [503, 'DEEPSEEK_UNAVAILABLE']]) {
  test(`HTTP ${status} is normalized`, async () => {
    const { provider } = providerWith([response({ secret: 'must-not-surface' }, status)])
    await assert.rejects(provider.selectTool(selectionContext), { code, status })
  })
}

test('malformed response JSON is normalized', async () => {
  const { provider } = providerWith([invalidJsonResponse()])
  await assert.rejects(provider.selectTool(selectionContext), { code: 'DEEPSEEK_INVALID_JSON' })
})

test('unexpected response structure is normalized', async () => {
  const { provider } = providerWith([response({ choices: [] })])
  await assert.rejects(provider.selectTool(selectionContext), { code: 'DEEPSEEK_UNEXPECTED_RESPONSE' })
})

test('valid synthesis returns plain answer and normalized usage', async () => {
  const fixture = completion({ content: 'One matching specimen is recorded.', usage: { prompt_tokens: 20, completion_tokens: 6, total_tokens: 26 } })
  const { provider } = providerWith([response(fixture)])
  const result = await provider.synthesize({ ...selectionContext, toolName: 'get_specimen', toolResult: { type: 'SPECIMEN_RESULTS', records: [{ specimenId: 'SP-1' }] } })
  assert.equal(result.answer, 'One matching specimen is recorded.')
  assert.deepEqual(result.usage, { inputTokens: 20, outputTokens: 6, totalTokens: 26 })
})

test('synthesis preserves missing and null fields in bounded context', async () => {
  const captures = []
  const provider = createDeepSeekProvider({ apiKey: FAKE_KEY, fetchImpl: queueFetch([response(completion({ content: 'Notes are not recorded.' }))], captures) })
  await provider.synthesize({ ...selectionContext, toolName: 'get_specimen', toolResult: { type: 'SPECIMEN_RESULTS', records: [{ specimenId: 'SP-1', notes: null }] } })
  const supplied = JSON.parse(captures[0].body.messages[1].content)
  assert.equal(supplied.result.records[0].notes, null)
  assert.equal(Object.hasOwn(supplied.result.records[0], 'boneType'), false)
})

test('fabricated provenance in synthesis cannot override server sources', async () => {
  const fakeAnswer = JSON.stringify({ answer: 'Found one.', sources: [{ id: 'FORGED', route: '/admin' }] })
  const { orchestrator } = integrated([response(selections.search_images), response(completion({ content: fakeAnswer }))])
  const result = await orchestrator.respond({ message: 'Find fragmented left femur images.', currentRoute: '/ai-assistant' })
  assert.deepEqual(result.sources, [{ type: 'specimen', id: 'SP-1', route: '/specimens/SP-1' }, { type: 'image', id: 'IMG-1', route: '/image/IMG-1' }])
  assert.equal(result.sources.some((source) => source.id === 'FORGED'), false)
})

test('selection and synthesis usage metadata are parsed and combined', async () => {
  const selection = completion({ toolCalls: [toolCall('get_specimen', { specimenId: 'SP-1' })], usage: { prompt_tokens: 8, completion_tokens: 2, total_tokens: 10 } })
  const synthesis = completion({ content: 'One record.', usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 } })
  const { orchestrator } = integrated([response(selection), response(synthesis)])
  const result = await orchestrator.respond({ message: 'Retrieve specimen SP-1.' })
  assert.deepEqual(result.meta.usage, { inputTokens: 20, outputTokens: 5, totalTokens: 25 })
})

test('missing DeepSeek key fails closed without reading local environment', () => {
  assert.throws(() => createAssistantProvider({ LLM_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: '' }, { fetchImpl: () => { throw new Error('must not run') } }), { code: 'DEEPSEEK_API_KEY_REQUIRED' })
})

test('provider factory selects DeepSeek and applies server configuration', async () => {
  const captures = []
  const provider = createAssistantProvider({ LLM_PROVIDER: 'deepseek', DEEPSEEK_API_KEY: FAKE_KEY, DEEPSEEK_MODEL: 'deepseek-v4-pro', ASSISTANT_LLM_TIMEOUT_MS: '12000', ASSISTANT_LLM_MAX_OUTPUT_TOKENS: '321' }, { fetchImpl: queueFetch([response(selections.search_images)], captures) })
  assert.equal(provider.name, 'deepseek')
  await provider.selectTool(selectionContext)
  assert.equal(captures[0].body.model, 'deepseek-v4-pro')
  assert.equal(captures[0].body.max_tokens, 321)
})

test('mock provider still works without a DeepSeek key', async () => {
  const provider = createAssistantProvider({ LLM_PROVIDER: 'mock' })
  assert.equal(provider.name, 'mock')
  const selected = await provider.selectTool({ message: 'Find fragmented left femur pictures.' })
  assert.equal(selected.toolCalls[0].name, 'search_images')
})

test('request payload is bounded and excludes credentials and backend capabilities', async () => {
  const { provider, captures } = providerWith([response(selections.search_images)], { maxOutputTokens: 700 })
  await provider.selectTool(selectionContext)
  assert.equal(captures[0].url, `${DEEPSEEK_DEFAULTS.baseUrl}/chat/completions`)
  assert.equal(captures[0].body.max_tokens, 700)
  assert.equal(captures[0].body.messages.length, 2)
  assert.equal(captures[0].body.tools.length, 12)
  const payload = JSON.stringify(captures[0].body)
  for (const forbidden of [FAKE_KEY, 'SUPABASE_URL', 'SUPABASE_KEY', 'bone_images', 'service_role', '/sites', 'PostgREST', 'storage.from', 'process.env']) assert.equal(payload.includes(forbidden), false)
  assert.equal(captures[0].options.headers.Authorization, `Bearer ${FAKE_KEY}`)
})

test('DeepSeek receives only the normalized short conversation context', async () => {
  const { provider, captures } = providerWith([response(selections.search_images)])
  await provider.selectTool({ ...selectionContext, conversationContext: { previousUserMessage: 'What images do we have?', previousAssistantMessage: 'Which bone type?' } })
  const turn = JSON.parse(captures[0].body.messages[1].content)
  assert.deepEqual(turn, { currentRoute: '/ai-assistant', previousUserMessage: 'What images do we have?', previousAssistantMessage: 'Which bone type?', currentUserMessage: 'A bounded OAHRIS request.' })
  assert.equal(captures[0].body.messages.length, 2)
})

async function main() {
  let passed = 0
  for (const { name, fn } of tests) {
    try { await fn(); passed += 1; console.log(`PASS ${name}`) }
    catch (error) { console.error(`FAIL ${name}`); throw error }
  }
  console.log(`OAHRIS DeepSeek mocked-provider tests passed: ${passed}/${tests.length}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
