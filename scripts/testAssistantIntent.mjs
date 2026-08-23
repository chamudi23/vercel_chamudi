import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { parseAssistantIntent } from '../src/lib/assistantIntent.js'
import { calculateCoverage } from '../src/lib/skeletonCoverage.js'

const require = createRequire(import.meta.url)
const policy = require('../backend/services/assistantQueryPolicy.js')
const { getSystemHelp } = require('../backend/services/helpRetrieval.js')

const cases = [
  ['show images of left femur', 'IMAGE_RESULTS'], ['show images of right tibia', 'IMAGE_RESULTS'],
  ['find specimen SK001', 'SPECIMEN_RESULTS'], ['show measurements for specimen SK001', 'MEASUREMENT_RESULTS'],
  ['show skeleton SK001 coverage', 'COVERAGE_RESULT'], ['show fragmented skull images', 'IMAGE_RESULTS'],
  ['show laboratory images from SK-002', 'IMAGE_RESULTS'], ['diagnose pathology for SK001', 'UNSUPPORTED_QUERY'],
  ['what is in the database', 'UNSUPPORTED_QUERY'],
  ['what is the age of SK001', 'UNSUPPORTED_QUERY'],
]
for (const [prompt, type] of cases) assert.equal(parseAssistantIntent(prompt).type, type, prompt)
const image = parseAssistantIntent('show images of left femur')
assert.deepEqual(image.filters, { boneType: 'Femur', side: 'Left', condition: '', imageView: '', imageType: '' })
assert.deepEqual(parseAssistantIntent('find specimen SK001').filters, { specimenId: 'SK001' })
assert.equal('filters' in parseAssistantIntent('what is in the database'), false)
assert.match(parseAssistantIntent('what is the age of SK001').message, /only retrieves recorded OAHRIS data/i)
for (const [prompt, id] of [['how do I add a specimen', 'add-specimen'], ['where can I upload an image', 'upload-image'], ['how do I add measurements', 'add-measurements'], ['how do I search images', 'search-images'], ['how do I use the skeleton viewer', 'skeleton-viewer'], ['what does image documentation coverage mean', 'skeleton-coverage'], ['what can the research assistant do', 'research-assistant']]) { const intent = parseAssistantIntent(prompt); assert.equal(intent.type, 'SYSTEM_HELP'); assert.equal(getSystemHelp(intent.query).topic.id, id) }
for (const prompt of ['how do I add measurements', 'How do I add measurements?', 'How do I add a specimen?', 'How do I use the skeleton viewer?', 'Show images of left femur', 'Find specimen SK001']) assert.notEqual(parseAssistantIntent(prompt).type, 'UNSUPPORTED_QUERY', prompt)
assert.equal(getSystemHelp('how do I add measurements').type, 'SYSTEM_HELP')
assert.equal(getSystemHelp('how do I add measurements').topic.id, 'add-measurements')
assert.equal(parseAssistantIntent('how   can I   add measurements?').type, 'SYSTEM_HELP')
assert.equal(parseAssistantIntent('show measurements for SK001').type, 'MEASUREMENT_RESULTS')
assert.equal(parseAssistantIntent('show left femur images').type, 'IMAGE_RESULTS')
assert.equal(parseAssistantIntent('find specimen SK001').type, 'SPECIMEN_RESULTS')
assert.equal(getSystemHelp('random unrelated phrase').type, 'HELP_NOT_FOUND')
assert.equal(getSystemHelp('select * from specimens; drop table specimens').type, 'HELP_NOT_FOUND')

assert.throws(() => policy.requireFilter({}, policy.SPECIMEN_FILTER_KEYS, 'At least one specimen search filter is required.'), { code: 'FILTER_REQUIRED' })
assert.throws(() => policy.requireFilter({}, policy.IMAGE_FILTER_KEYS, 'At least one image search filter is required.'), { code: 'FILTER_REQUIRED' })
assert.equal(policy.MAX_RESULTS, 20)

const candidateRows = Array.from({ length: policy.CANDIDATE_PAGE_SIZE + 1 }, (_, index) => ({ specimen_id: `S${index}` }))
const calls = []; const query = { range(from, to) { calls.push(['range', from, to]); return Promise.resolve({ data: candidateRows.slice(from, to + 1), error: null }) } }
const candidates = await policy.collectPagedSpecimenIds(query)
assert.equal(candidates.length, policy.CANDIDATE_PAGE_SIZE + 1)
assert.equal(calls.filter(([name]) => name === 'range').length, 2)
assert.equal(policy.text('SK001'), 'SK001')
assert.notEqual(policy.text('SK001'), policy.text('SK-001'))

const emptyCoverage = calculateCoverage([], [], [])
assert.equal(emptyCoverage.knownCategoryCount, 0)
assert.equal(emptyCoverage.recordedCategoryCoveragePercent, 0)
assert.equal(emptyCoverage.imageDocumentationPercent, 0)
const documentedCoverage = calculateCoverage([{ specimen_id: 'S1', bone_type: 'Femur', side: 'Left', preservation_state: 'Fragmented' }], [], [{ image_id: 'I1', specimen_id: 'S1', image_url: 'https://example.test/image.jpg', bone_name: 'Femur', condition: 'Fragmented' }])
assert.equal(documentedCoverage.knownCategoryCount, 1)
assert.equal(documentedCoverage.documentedCount, 1)
assert.equal(documentedCoverage.imageDocumentationPercent, 100)
console.log('Assistant intent tests passed.')
