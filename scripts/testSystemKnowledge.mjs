import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { CONTROLLED_BONE_CATEGORIES } from '../src/utils/pp1ImageModule.js'

const require = createRequire(import.meta.url)
const { TOOL_DEFINITIONS, createAssistantToolRegistry, validateToolArguments } = require('../backend/services/assistantToolRegistry.js')
const { resolveConversationTurn } = require('../backend/services/assistantConversation.js')
const { createAssistantOrchestrator } = require('../backend/services/assistantOrchestrator.js')
const { createMockProvider } = require('../backend/services/providers/mockProvider.js')
const { searchSystemKnowledge, MAX_SECTIONS } = require('../backend/services/systemKnowledgeRetrieval.js')

const tests = []
const test = (name, fn) => tests.push({ name, fn })
const selectedTool = (message, context = {}) => resolveConversationTurn({ message, context })?.toolCalls?.[0]

test('registry exposes one strict bounded knowledge tool', () => {
  const definition = TOOL_DEFINITIONS.search_system_knowledge
  assert.ok(definition)
  assert.deepEqual(definition.inputSchema.required, ['query'])
  assert.equal(definition.inputSchema.additionalProperties, false)
  assert.equal(definition.inputSchema.properties.query.maxLength, 120)
  assert.deepEqual(validateToolArguments('search_system_knowledge', { query: ' What is OAHRIS? ' }), { query: 'What is OAHRIS?' })
  assert.throws(() => validateToolArguments('search_system_knowledge', { query: 'OAHRIS', limit: '3' }), { code: 'INVALID_TOOL_ARGUMENTS' })
})

for (const [query, expectedId] of [
  ['What is OAHRIS?', 'system-overview'],
  ['What does Spatial Analysis do?', 'spatial-analysis'],
  ['Tell me about the Image Library', 'image-library'],
  ['What is the Skeleton Viewer?', 'skeleton-viewer'],
  ['What does Skeletal Analysis do?', 'skeletal-analysis'],
  ['What is Data Quality?', 'data-quality'],
  ['What is the Research Assistant?', 'research-assistant'],
  ['What roles and access levels does OAHRIS support?', 'roles-and-access'],
  ['What are your limitations?', 'assistant-limitations'],
]) test(`retrieves verified section: ${expectedId}`, async () => {
  const result = await searchSystemKnowledge(query)
  assert.equal(result.type, 'SYSTEM_KNOWLEDGE')
  assert.equal(result.sections[0].id, expectedId)
  assert.ok(result.sections.length <= MAX_SECTIONS)
  assert.equal('aliases' in result.sections[0], false)
  assert.equal('keywords' in result.sections[0], false)
})

test('broad capability retrieval remains capped at three sections', async () => {
  const result = await searchSystemKnowledge('What are the things you know about this system?')
  assert.equal(result.type, 'SYSTEM_KNOWLEDGE')
  assert.ok(result.sections.some(({ id }) => id === 'system-overview'))
  assert.ok(result.sections.some(({ id }) => id === 'assistant-capabilities'))
  assert.ok(result.sections.length <= 3)
})

test('skeletal catalogue is derived from the canonical frontend source', async () => {
  const result = await searchSystemKnowledge('How many bone categories are supported?')
  const section = result.sections.find(({ id }) => id === 'skeletal-catalogue')
  assert.ok(section)
  assert.equal(section.categoryCount, CONTROLLED_BONE_CATEGORIES.length)
  assert.deepEqual(section.categories, CONTROLLED_BONE_CATEGORIES.map(({ label }) => label))
})

test('unknown terms return an honest bounded miss', async () => {
  assert.deepEqual(await searchSystemKnowledge('quantum chronology engine'), { type: 'KNOWLEDGE_NOT_FOUND', query: 'quantum chronology engine' })
})

for (const prompt of [
  'What are the things you know about this system?',
  'What can OAHRIS do?',
  'Tell me about OAHRIS',
  'What modules are available?',
  'What can you help me with?',
  'What does Spatial Analysis do?',
  'What is the Skeleton Viewer?',
  'What is Skeletal Analysis?',
  'What are your limitations?',
  'How many skeletal categories are supported?',
  'What are the supported bones?',
  'Tell me more about spatial analysis',
  'What about skeletal analysis?',
]) test(`obvious knowledge query routes deterministically: ${prompt}`, () => {
  const call = selectedTool(prompt)
  assert.equal(call.name, 'search_system_knowledge')
  assert.equal(call.arguments.query, prompt)
})

test('category follow-up is bounded by explicit catalogue context', () => {
  const call = selectedTool('What are they?', {
    previousUserMessage: 'How many skeletal categories are supported?',
    previousAssistantMessage: `OAHRIS currently supports ${CONTROLLED_BONE_CATEGORIES.length} canonical skeletal categories.`,
  })
  assert.deepEqual(call, { name: 'search_system_knowledge', arguments: { query: 'What skeletal categories does OAHRIS support?' } })
  assert.equal(selectedTool('What are they?', { previousUserMessage: 'How many sites are there?', previousAssistantMessage: 'There are several.' }), undefined)
})

test('workflow guidance stays on get_system_help', () => {
  assert.equal(selectedTool('How do I run Skeletal Analysis?').name, 'get_system_help')
})

test('live record requests retain their existing tools', async () => {
  assert.equal(selectedTool('Show skull images').name, 'search_images')
  assert.equal((await createMockProvider().selectTool({ message: 'Show specimen SPEC-664' })).toolCalls[0].name, 'get_specimen')
  assert.equal(selectedTool('Show stored skeletal analysis KGC-123').name, 'get_skeletal_analysis_result')
})

test('deterministic knowledge answers do not invoke provider selection or synthesis', async () => {
  const calls = []
  const services = {
    searchSystemKnowledge: async (query) => { calls.push(query); return searchSystemKnowledge(query) },
  }
  const provider = createMockProvider()
  const orchestrator = createAssistantOrchestrator({ provider, toolRegistry: createAssistantToolRegistry(services) })
  const response = await orchestrator.respond({ message: 'What is OAHRIS?', currentRoute: '/ai-assistant', user: { id: 'knowledge-test', role: 'researcher' } })
  assert.equal(response.type, 'GROUNDED_ANSWER')
  assert.equal(response.meta.tool, 'search_system_knowledge')
  assert.equal(response.meta.grounded, true)
  assert.equal(response.meta.provider, 'deterministic')
  assert.equal(provider.stats.selectionCalls, 0)
  assert.equal(provider.stats.synthesisCalls, 0)
  assert.deepEqual(calls, ['What is OAHRIS?'])
})

test('provider-selected knowledge can synthesize only retrieved content', async () => {
  const provider = createMockProvider({ selection: { type: 'TOOL_SELECTION', toolCalls: [{ name: 'search_system_knowledge', arguments: { query: 'spatial analysis' } }] } })
  const registry = createAssistantToolRegistry({ searchSystemKnowledge })
  const orchestrator = createAssistantOrchestrator({ provider, toolRegistry: registry })
  const response = await orchestrator.respond({ message: 'Explain the verified spatial area.', currentRoute: '/ai-assistant', user: { id: 'provider-test', role: 'student' } })
  assert.equal(response.type, 'GROUNDED_ANSWER')
  assert.match(response.answer, /Spatial Analysis/)
  assert.equal(provider.stats.selectionCalls, 1)
  assert.equal(provider.stats.synthesisCalls, 1)
})

test('provider-selected unknown knowledge returns the safe knowledge fallback', async () => {
  const provider = createMockProvider({ selection: { type: 'TOOL_SELECTION', toolCalls: [{ name: 'search_system_knowledge', arguments: { query: 'quantum chronology engine' } }] } })
  const orchestrator = createAssistantOrchestrator({ provider, toolRegistry: createAssistantToolRegistry({ searchSystemKnowledge }) })
  const response = await orchestrator.respond({ message: 'Explain the quantum chronology engine.', currentRoute: '/ai-assistant', user: { id: 'unknown-test', role: 'researcher' } })
  assert.equal(response.type, 'NOT_FOUND')
  assert.equal(response.answer, "I don't have verified OAHRIS knowledge for that question yet.")
  assert.equal(provider.stats.synthesisCalls, 0)
})

async function main() {
  let passed = 0
  for (const { name, fn } of tests) {
    try { await fn(); passed += 1; console.log(`PASS ${name}`) }
    catch (error) { console.error(`FAIL ${name}`); throw error }
  }
  console.log(`OAHRIS system-knowledge tests passed: ${passed}/${tests.length}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
