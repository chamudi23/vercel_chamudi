import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { calculateSpecimenCompleteness } from '../src/lib/dataQuality.js'
import { parseAssistantIntent } from '../src/lib/assistantIntent.js'

const require = createRequire(import.meta.url)
const whole = require('../backend/services/wholeSystemQueries.js')
const specimenQueries = require('../backend/services/oahrisQueries.js')
const { TOOL_DEFINITIONS, createAssistantToolRegistry, validateToolArguments } = require('../backend/services/assistantToolRegistry.js')
const { canUseAssistantTool } = require('../backend/policies/assistantPermissions.js')
const { findPolicyRejection } = require('../backend/policies/assistantSystemPolicy.js')
const { resolveConversationTurn } = require('../backend/services/assistantConversation.js')
const { createAssistantOrchestrator } = require('../backend/services/assistantOrchestrator.js')
const { createMockProvider } = require('../backend/services/providers/mockProvider.js')

class Query {
  constructor(client, table) { this.client = client; this.table = table; this.filters = []; this.maximum = Infinity; this.sort = null }
  select(columns) { this.client.calls.push([this.table, 'select', columns]); return this }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this }
  ilike(column, value) {
    const pattern = String(value).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
    const matcher = new RegExp(`^${pattern}$`, 'i')
    this.filters.push((row) => matcher.test(String(row[column] ?? '')))
    return this
  }
  in(column, values) { this.filters.push((row) => values.includes(row[column])); return this }
  order(column, { ascending = true } = {}) { this.sort = { column, ascending }; return this }
  limit(value) { this.maximum = value; return this }
  range(from, to) { this.maximum = to - from + 1; this.offset = from; return this }
  then(resolve, reject) { return this.run().then(resolve, reject) }
  async run() {
    let rows = [...(this.client.tables[this.table] || [])].filter((row) => this.filters.every((filter) => filter(row)))
    if (this.sort) rows.sort((a, b) => String(a[this.sort.column] ?? '').localeCompare(String(b[this.sort.column] ?? '')) * (this.sort.ascending ? 1 : -1))
    rows = rows.slice(this.offset || 0, (this.offset || 0) + this.maximum)
    return { data: rows.map((row) => structuredClone(row)), error: null }
  }
}

class MockClient {
  constructor(tables) { this.tables = tables; this.calls = [] }
  from(table) { this.calls.push([table, 'from']); return new Query(this, table) }
}

function fixtureClient() {
  const alpha = { id: 'SITE-1', site_name: 'Alpha Cave', district: 'Kandy', province: 'Central', latitude: 7.123456, longitude: 80.654321, time_period: 'Iron Age', site_type: 'Cave Site', risk_level: 'Low', protected_status: 'Protected', description: 'Recorded site summary.' }
  const specimens = Array.from({ length: 25 }, (_, index) => ({ specimen_id: index ? `SP-${index}` : 'SK001', skeleton_code: `SKELETON-${index}`, bone_type: 'Femur', side: 'Left', site_name: 'Alpha Cave', district: 'Kandy', province: 'Central', time_period: 'Iron Age', preservation_state: 'Complete', location_stored: index ? 'Store A' : null, excavation_year: index ? 2020 : null, burial_context: index ? 'Burial' : null, notes: index ? 'Recorded note' : null, age_estimate: index ? null : '30-45 years', sex_estimate: index ? null : 'Female', height_estimate: index ? null : 168.5, created_at: '2026-01-01' }))
  specimens.push({ specimen_id: 'SKMISS', skeleton_code: 'SM', bone_type: 'Tibia', side: 'Right', site_name: 'Missing Site', district: null, province: null, time_period: null, preservation_state: null, location_stored: null, excavation_year: null, burial_context: null, notes: null })
  specimens.push({ specimen_id: 'SKAMB', skeleton_code: 'SA', bone_type: 'Skull', side: 'Midline', site_name: 'Twin Site', district: 'Kandy', province: 'Central', time_period: 'Iron Age', preservation_state: null, location_stored: null, excavation_year: null, burial_context: null, notes: null })
  specimens.push({ specimen_id: 'SKREF', skeleton_code: 'SR', bone_type: 'Radius', side: 'Left', site_name: 'Reference   Only', district: 'Matale', province: 'Central', time_period: 'Historic', preservation_state: 'Fragmented', location_stored: null, excavation_year: null, burial_context: null, notes: null })
  specimens.push({ specimen_id: 'SKSPACE', skeleton_code: 'SS', bone_type: 'Ulna', side: 'Right', site_name: 'spaced site', district: 'Kandy', province: 'Central', time_period: 'Iron Age', preservation_state: 'Complete', location_stored: null, excavation_year: null, burial_context: null, notes: null })
  return new MockClient({
    sites: [alpha, { ...alpha, id: 'SPACE-1', site_name: '  Spaced   Site  ' }, { ...alpha, id: 'TWIN-1', site_name: 'Twin Site' }, { ...alpha, id: 'TWIN-2', site_name: 'Twin Site' }, ...Array.from({ length: 25 }, (_, index) => ({ ...alpha, id: `K-${index}`, site_name: `Kandy Site ${index}` }))],
    specimens,
    excavation_records: [{ specimen_id: 'SK001', excavation_date: '2024-01-02', excavation_phase: 'Phase 1', depth_found: null, excavation_notes: null }],
    laboratory_dating_results: [{ specimen_id: 'SK001', dating_method: 'Radiocarbon', date_result: '2450 BP', date_range_min: 2400, date_range_max: 2500, lab_name: 'OAHRIS Lab', result_notes: null }],
    bone_images: [{ image_id: 'IMG001', specimen_id: 'SK001', image_url: 'https://example.test/image.jpg', file_url: null, bone_name: 'Femur', side: 'Left', condition: 'Complete', image_view: 'Anterior', view_angle: null, image_type: 'Laboratory', notes: 'Visible cortical surface.', image_notes: null, annotation_text: null, tags: Array.from({ length: 25 }, (_, i) => `tag-${i}`).join(','), uploaded_at: '2026-01-01', specimen: { specimen_id: 'SK001', skeleton_code: 'SKELETON-0', bone_type: 'Femur', side: 'Left' } }],
    image_annotations: Array.from({ length: 25 }, (_, index) => ({ image_id: 'IMG001', annotation_id: `ANN-${index}`, annotation_type: 'Region', annotation_description: `Stored annotation ${index}`, x_coordinate: index, y_coordinate: index, width: 10, height: 20, annotated_at: `2026-01-${String(index + 1).padStart(2, '0')}` })),
    analyses: [{ case_id: 'KGC-20260826-0001', basic_info: { caseId: 'KGC-20260826-0001', location: 'Lab A', dateFound: '2025-01-01', bonesType: 'Pelvis', analysisDate: '2026-08-26', userName: 'Private Investigator', email: 'private@example.test' }, measurements: { bonesType: 'Pelvis', ventralArc: 'Present' }, predictions: { gender: 'Female', ageRange: '30-40', height: 'Unknown', confidence: '80%', email: 'private@example.test' }, created_at: '2026-08-26' }],
    measurements: [{ measurement_id: 'M-1', specimen_id: 'SK001', bone_type: 'Femur', measurement_type: 'Maximum length', value: 450, unit: 'mm', notes: null }],
    data_quality_log: [{ specimen_id: 'SK001', log_id: 'LOG-1', field_name: 'bone_analysis_femur', issue_type: 'Likely Human Bone', status: '85/100', notes: 'Stored rule result.', created_at: '2026-08-25' }],
  })
}

const tests = []
function test(name, fn) { tests.push({ name, fn }) }

test('search_sites requires a filter, caps results, and omits coordinates', async () => {
  const client = fixtureClient()
  await assert.rejects(() => whole.searchSites({}, client), { code: 'FILTER_REQUIRED' })
  const result = await whole.searchSites({ district: 'Kandy' }, client)
  assert.equal(result.type, 'SITE_RESULTS'); assert.equal(result.records.length, 20)
  assert.equal(result.records.some((site) => 'latitude' in site || 'longitude' in site), false)
})

test('get_site resolves normalized exact names and returns explicit resolved, reference-only, missing, and ambiguous states', async () => {
  const client = fixtureClient()
  const found = await whole.getSite({ siteId: 'SITE-1' }, client)
  assert.equal(found.status, 'resolved'); assert.equal(found.site.siteName, 'Alpha Cave'); assert.equal(found.linkedSpecimens.length, 20)
  const normalized = await whole.getSite({ siteName: '  spaced   SITE ' }, client)
  assert.equal(normalized.status, 'resolved'); assert.equal(normalized.site.siteId, 'SPACE-1'); assert.equal(normalized.linkedSpecimens[0].specimenId, 'SKSPACE')
  const referenceOnly = await whole.getSite({ siteName: ' reference only ' }, client)
  assert.equal(referenceOnly.status, 'reference_only'); assert.equal(referenceOnly.site, null); assert.equal(referenceOnly.linkedSpecimens[0].specimenId, 'SKREF')
  assert.equal(referenceOnly.linkedSpecimens[0].siteResolutionStatus, 'missing')
  assert.equal((await whole.getSite({ siteId: 'NO-SITE' }, client)).type, 'NOT_FOUND')
  assert.equal((await whole.getSite({ siteName: 'Unknown Place' }, client)).type, 'NOT_FOUND')
  const ambiguous = await whole.getSite({ siteName: 'Twin Site' }, client)
  assert.equal(ambiguous.status, 'ambiguous'); assert.equal(ambiguous.linkedSpecimens.length, 0)
})

test('get_specimen_context reuses site resolution and preserves excavation, dating, missing, ambiguous, and null values', async () => {
  const client = fixtureClient()
  const found = await whole.getSpecimenContext('SK001', client)
  assert.equal(found.siteResolution.status, 'resolved')
  assert.equal(found.excavation.excavationPhase, 'Phase 1'); assert.equal(found.excavation.depthFound, null)
  assert.equal(found.laboratoryDating.method, 'Radiocarbon'); assert.equal(found.laboratoryDating.notes, null)
  assert.equal((await whole.getSpecimenContext('SKMISS', client)).siteResolution.status, 'missing')
  assert.equal((await whole.getSpecimenContext('SKAMB', client)).siteResolution.status, 'ambiguous')
})

test('get_image returns exact bounded safe image detail and missing state', async () => {
  const client = fixtureClient()
  const result = await whole.getImage('IMG001', client)
  assert.equal(result.type, 'IMAGE_RESULT'); assert.equal(result.image.annotations.length, 20); assert.equal(result.image.tags.length, 20)
  assert.equal(result.image.imageUrl, 'https://example.test/image.jpg')
  assert.equal((await whole.getImage('IMG999', client)).type, 'NOT_FOUND')
})

test('stored skeletal analysis is exact, labelled, bounded, and private identity is omitted', async () => {
  const client = fixtureClient()
  const result = await whole.getSkeletalAnalysisResult('KGC-20260826-0001', client)
  assert.equal(result.analysis.source, 'stored_skeletal_analysis')
  assert.match(result.analysis.resultLabel, /Recorded result produced/)
  assert.equal(result.analysis.storedPredictions.gender, 'Female')
  assert.equal(JSON.stringify(result).includes('private@example.test'), false)
  assert.equal(JSON.stringify(result).includes('Private Investigator'), false)
  assert.equal((await whole.getSkeletalAnalysisResult('KGC-UNKNOWN', client)).type, 'NOT_FOUND')
})

test('specimen data quality matches shared rules and separates stored logs without algorithms', async () => {
  const client = fixtureClient()
  const result = await whole.getSpecimenDataQuality('SK001', client)
  const raw = client.tables.specimens.find((row) => row.specimen_id === 'SK001')
  assert.equal(result.currentCompleteness.percentage, calculateSpecimenCompleteness(raw))
  assert.deepEqual(result.currentCompleteness.missingTrackedFields, ['excavation_year', 'location_stored', 'burial_context', 'notes'])
  assert.equal(result.currentCompleteness.hasMeasurements, true)
  assert.equal(result.storedMeasurementAnalysisLogs[0].label, 'Stored measurement-analysis log')
  assert.equal(result.meta.algorithmsExecuted, false)
})

test('get_specimen exposes only labelled stored estimates and preserves nulls', async () => {
  const client = fixtureClient()
  const result = await specimenQueries.getSpecimen('SK001', client)
  assert.equal(result.records[0].recordedAgeEstimate, '30-45 years')
  assert.equal(result.records[0].recordedSexEstimate, 'Female')
  assert.equal(result.records[0].recordedHeightEstimate, 168.5)
  assert.equal(result.records[0].estimateSource, 'stored_specimen_record')
})

test('tool registry contains six strict Phase 4C tools and no generic or mutation tools', () => {
  for (const name of ['search_sites', 'get_site', 'get_specimen_context', 'get_image', 'get_skeletal_analysis_result', 'get_specimen_data_quality']) {
    assert.ok(TOOL_DEFINITIONS[name]); assert.equal(TOOL_DEFINITIONS[name].inputSchema.additionalProperties, false)
  }
  for (const name of ['query_database', 'query_table', 'execute_sql', 'run_analysis', 'get_any_record', 'delete_specimen', 'update_specimen']) assert.equal(TOOL_DEFINITIONS[name], undefined)
  assert.throws(() => validateToolArguments('search_sites', {}), { code: 'INVALID_TOOL_ARGUMENTS' })
  assert.throws(() => validateToolArguments('get_image', { imageId: 'IMG001', table: 'profiles' }), { code: 'INVALID_TOOL_ARGUMENTS' })
})

test('data quality authorization allows curators, denies students and unknown roles', () => {
  assert.equal(canUseAssistantTool('admin', 'get_specimen_data_quality'), true)
  assert.equal(canUseAssistantTool('researcher', 'get_specimen_data_quality'), true)
  assert.equal(canUseAssistantTool('student', 'get_specimen_data_quality'), false)
  assert.equal(canUseAssistantTool('owner', 'get_specimen_data_quality'), false)
})

test('deterministic intents select exact tools and reject unsupported specimen analysis lookup', () => {
  assert.equal(parseAssistantIntent('show site SITE-1').type, 'SITE_RESULT')
  assert.equal(parseAssistantIntent('show excavation context for SK001').type, 'SPECIMEN_CONTEXT')
  assert.equal(parseAssistantIntent('show image IMG001 details').type, 'IMAGE_RESULT')
  assert.equal(parseAssistantIntent('show stored skeletal analysis case KGC-20260826-0001').type, 'SKELETAL_ANALYSIS_RESULT')
  assert.equal(parseAssistantIntent('check data quality for SK001').type, 'DATA_QUALITY_RESULT')
  const unsupported = resolveConversationTurn({ message: 'What skeletal analysis exists for specimen SK001?' })
  assert.equal(unsupported.type, 'CLARIFICATION'); assert.equal(unsupported.toolCalls.length, 0)
  assert.equal(findPolicyRejection('Estimate sex from this pelvis.'), null)
  assert.equal(resolveConversationTurn({ message: 'Estimate sex from this pelvis.' }).toolCalls[0].name, 'get_system_help')
})

test('server provenance is generated after the authorized tool and provider cannot replace it', async () => {
  const services = {
    searchSpecimens: async () => ({ type: 'SPECIMEN_RESULTS', records: [] }), getSpecimen: async () => ({ type: 'NOT_FOUND' }), searchImages: async () => ({ type: 'IMAGE_RESULTS', records: [] }), getMeasurements: async () => ({ type: 'MEASUREMENT_RESULTS', records: [] }), getSkeletonCoverage: async () => ({ type: 'NOT_FOUND' }), getSystemHelp: () => ({ type: 'HELP_NOT_FOUND' }),
    searchSites: whole.searchSites, getSite: whole.getSite, getSpecimenContext: whole.getSpecimenContext, getImage: whole.getImage, getSkeletalAnalysisResult: whole.getSkeletalAnalysisResult, getSpecimenDataQuality: whole.getSpecimenDataQuality,
  }
  const provider = createMockProvider({ selection: { toolCalls: [{ name: 'get_image', arguments: { imageId: 'IMG001' } }] }, synthesis: { answer: 'Stored image retrieved.', sources: [{ type: 'secret', id: 'fake', route: '/admin/users' }] } })
  const orchestrator = createAssistantOrchestrator({ provider, toolRegistry: createAssistantToolRegistry(services) })
  const result = await orchestrator.respond({ message: 'Retrieve the exact stored attachment.', user: { id: 'user-1', role: 'student' }, toolContext: { supabase: fixtureClient() } })
  assert.deepEqual(result.sources, [{ type: 'image', id: 'IMG001', route: '/image/IMG001' }])
  assert.equal(result.meta.grounded, true)
})

test('assistant projections are explicit and never request broad table access', async () => {
  const client = fixtureClient()
  await whole.searchSites({ district: 'Kandy' }, client)
  await whole.getImage('IMG001', client)
  await whole.getSkeletalAnalysisResult('KGC-20260826-0001', client)
  assert.equal(client.calls.some(([, operation, projection]) => operation === 'select' && projection === '*'), false)
})

async function main() {
  let passed = 0
  for (const { name, fn } of tests) {
    try { await fn(); passed += 1; console.log(`PASS ${name}`) } catch (error) { console.error(`FAIL ${name}`); throw error }
  }
  console.log(`OAHRIS whole-system retrieval tests passed: ${passed}/${tests.length}`)
}

main().catch((error) => { console.error(error); globalThis.process.exitCode = 1 })
