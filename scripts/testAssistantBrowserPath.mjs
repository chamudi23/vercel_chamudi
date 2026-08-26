import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { parseAssistantIntent } from '../src/lib/assistantIntent.js'
import { deterministicAssistantMessage, selectAssistantPresentation } from '../src/lib/assistantPresentation.js'
import { executeAssistantIntent } from '../src/lib/assistantRequestRouter.js'

const require = createRequire(import.meta.url)
const { createAssistantOrchestrator } = require('../backend/services/assistantOrchestrator.js')
const { createAssistantToolRegistry } = require('../backend/services/assistantToolRegistry.js')
const { createMockProvider } = require('../backend/services/providers/mockProvider.js')

const backendCalls = []
const services = {
  searchSpecimens: async () => ({ type: 'SPECIMEN_RESULTS', records: [] }),
  getSpecimen: async () => ({ type: 'NOT_FOUND', resource: 'specimen', identifier: 'missing' }),
  searchImages: async () => ({ type: 'IMAGE_RESULTS', records: [] }),
  getMeasurements: async () => ({ type: 'MEASUREMENT_RESULTS', records: [] }),
  getSkeletonCoverage: async (skeletonCode) => ({ type: 'COVERAGE_RESULT', skeletonCode }),
  getSystemHelp: () => ({ type: 'HELP_NOT_FOUND' }),
  searchSites: async (args) => { backendCalls.push(['search_sites', args]); return { type: 'SITE_RESULTS', records: args.timePeriod === 'Missing' ? [] : [{ siteId: 'SITE-1', siteName: 'Anuradhapura', timePeriod: args.timePeriod }] } },
  getSite: async () => ({ type: 'NOT_FOUND', resource: 'site', identifier: 'missing', operation: 'get_site' }),
  getSpecimenContext: async (specimenId) => { backendCalls.push(['get_specimen_context', { specimenId }]); return { type: 'NOT_FOUND', resource: 'specimen context', identifier: specimenId, operation: 'get_specimen_context' } },
  getImage: async () => ({ type: 'NOT_FOUND', resource: 'image', identifier: 'missing', operation: 'get_image' }),
  getSkeletalAnalysisResult: async (caseId) => { backendCalls.push(['get_skeletal_analysis_result', { caseId }]); return { type: 'NOT_FOUND', resource: 'skeletal analysis', identifier: caseId, operation: 'get_skeletal_analysis_result' } },
  getSpecimenDataQuality: async () => ({ type: 'NOT_FOUND', resource: 'specimen', identifier: 'missing', operation: 'get_specimen_data_quality' }),
}
const provider = createMockProvider()
const securedOrchestrator = createAssistantOrchestrator({ provider, toolRegistry: createAssistantToolRegistry(services) })
const respond = (message, currentRoute, context) => securedOrchestrator.respond({ message, currentRoute, context, user: { id: 'browser-test', role: 'researcher' } })

const frontendCalls = []
const client = {
  respond,
  getSystemHelp: async () => ({ type: 'HELP_NOT_FOUND' }),
  searchImages: async () => ({ type: 'IMAGE_RESULTS', records: [] }),
  searchSpecimens: async () => ({ type: 'SPECIMEN_RESULTS', records: [] }),
  getMeasurements: async () => ({ type: 'MEASUREMENT_RESULTS', records: [] }),
  getSkeletonCoverage: async (skeletonCode) => { frontendCalls.push(['getSkeletonCoverage', skeletonCode]); return { type: 'COVERAGE_RESULT', skeletonCode } },
  searchSites: async (filters) => { frontendCalls.push(['searchSites', filters]); return services.searchSites(filters) },
  getSite: async () => ({ type: 'NOT_FOUND', resource: 'site', identifier: 'missing', operation: 'get_site' }),
  getSpecimenContext: async (specimenId) => { frontendCalls.push(['getSpecimenContext', specimenId]); return services.getSpecimenContext(specimenId) },
  getImage: async () => ({ type: 'NOT_FOUND', resource: 'image', identifier: 'missing', operation: 'get_image' }),
  getSkeletalAnalysisResult: async (caseId) => { frontendCalls.push(['getSkeletalAnalysisResult', caseId]); return services.getSkeletalAnalysisResult(caseId) },
  getSpecimenDataQuality: async () => ({ type: 'NOT_FOUND', resource: 'specimen', identifier: 'missing', operation: 'get_specimen_data_quality' }),
}

async function browserPath(prompt, context) {
  const intent = parseAssistantIntent(prompt)
  const data = await executeAssistantIntent(intent, { content: prompt, currentRoute: '/ai-assistant', context }, client)
  const message = intent.type === 'UNSUPPORTED_QUERY'
    ? { role: 'assistant', type: data.type, text: data.answer, presentation: data.presentation, meta: data.meta }
    : deterministicAssistantMessage(data)
  return { intent, message, visiblePresentation: selectAssistantPresentation(message) }
}

const unrelatedContext = { previousUserMessage: 'show coverage', previousAssistantMessage: 'Which skeleton code?' }

const contextResult = await browserPath('show excavation context for SK-977', unrelatedContext)
assert.equal(contextResult.intent.type, 'SPECIMEN_CONTEXT')
assert.deepEqual(frontendCalls[0], ['getSpecimenContext', 'SK-977'])
assert.equal(contextResult.message.type, 'NOT_FOUND')
assert.match(contextResult.message.text, /excavation or dating context.*SK-977/i)
assert.doesNotMatch(contextResult.message.text, /coverage|undefined/i)
assert.equal(contextResult.visiblePresentation, null)

const analysisResult = await browserPath('show stored skeletal analysis case KGC-123', unrelatedContext)
assert.equal(analysisResult.intent.type, 'SKELETAL_ANALYSIS_RESULT')
assert.deepEqual(frontendCalls[1], ['getSkeletalAnalysisResult', 'KGC-123'])
assert.equal(analysisResult.message.type, 'NOT_FOUND')
assert.match(analysisResult.message.text, /stored skeletal analysis.*KGC-123/i)
assert.doesNotMatch(analysisResult.message.text, /coverage|undefined/i)
assert.equal(analysisResult.visiblePresentation, null)

const siteResult = await browserPath('find sites from Anuradhapura period', unrelatedContext)
assert.deepEqual(siteResult.intent, { type: 'SITE_RESULTS', filters: { timePeriod: 'Anuradhapura' } })
assert.deepEqual(frontendCalls[2], ['searchSites', { timePeriod: 'Anuradhapura' }])
assert.equal(siteResult.message.type, 'SITE_RESULTS')
assert.equal(siteResult.visiblePresentation.sites.length, 1)

const broadResult = await browserPath('what are the excavation sites available', unrelatedContext)
assert.equal(broadResult.message.type, 'CLARIFICATION')
assert.match(broadResult.message.text, /site name, district, province, time period/i)
assert.equal(broadResult.visiblePresentation, null)
for (const prompt of ['what sites are available', 'show me archaeological sites']) {
  const result = await browserPath(prompt, unrelatedContext)
  assert.equal(result.message.type, 'CLARIFICATION')
  assert.equal(result.visiblePresentation, null)
}

const greetingResult = await browserPath('hi', unrelatedContext)
assert.equal(greetingResult.message.type, 'CLARIFICATION')
assert.match(greetingResult.message.text, /^Hello!/)
assert.equal(greetingResult.visiblePresentation, null)

const missingSiteResult = await browserPath('find sites from Missing period', unrelatedContext)
assert.equal(missingSiteResult.message.type, 'NOT_FOUND')
assert.equal(missingSiteResult.message.text, 'No matching OAHRIS site records were found.')
assert.equal(missingSiteResult.visiblePresentation, null)

const coverageResult = await browserPath('coverage for skeleton SK-977', unrelatedContext)
assert.equal(coverageResult.intent.type, 'COVERAGE_RESULT')
assert.equal(coverageResult.message.type, 'COVERAGE_RESULT')
assert.equal(coverageResult.message.text, 'Coverage retrieved for SK-977.')
assert.deepEqual(frontendCalls.at(-1), ['getSkeletonCoverage', 'SK-977'])

const invalidCoverageMessage = deterministicAssistantMessage({ type: 'COVERAGE_RESULT' })
assert.equal(invalidCoverageMessage.type, 'ERROR')
assert.doesNotMatch(invalidCoverageMessage.text, /undefined/)

for (const prompt of ['show excavation context for SK-977', 'show stored skeletal analysis case KGC-123', 'find sites from Anuradhapura period']) {
  await respond(prompt, '/ai-assistant', unrelatedContext)
}
assert.deepEqual(backendCalls.slice(-3), [
  ['get_specimen_context', { specimenId: 'SK-977' }],
  ['get_skeletal_analysis_result', { caseId: 'KGC-123' }],
  ['search_sites', { timePeriod: 'Anuradhapura' }],
])
assert.equal(provider.stats.selectionCalls, 0)
assert.equal(provider.stats.synthesisCalls, 0)
assert.equal(frontendCalls.filter(([name]) => name === 'getSkeletonCoverage').length, 1)

console.log('OAHRIS Assistant browser-path regression tests passed.')
