const assert = require('node:assert/strict')
const express = require('../backend/node_modules/express')
const { createRequireAuth } = require('../backend/middleware/requireAuth')
const assistantRouter = require('../backend/routes/assistant')
const { createAssistantOrchestrator } = require('../backend/services/assistantOrchestrator')
const { createAssistantToolRegistry } = require('../backend/services/assistantToolRegistry')
const { createMockProvider } = require('../backend/services/providers/mockProvider')
const { getSystemHelp } = require('../backend/services/helpRetrieval')
const { canUseAssistantTool } = require('../backend/policies/assistantPermissions')

const { createAssistantRouter } = assistantRouter
const TOKEN_PROFILES = {
  'student-token': { user_id: 'user-student', role: 'student', status: 'active' },
  'researcher-token': { user_id: 'user-researcher', role: 'researcher', status: 'approved' },
  'fake-role-token': { user_id: 'user-student', role: 'student', status: 'active' },
  'unknown-role-token': { user_id: 'user-unknown', role: 'owner', status: 'active' },
}

function authMiddleware() {
  return createRequireAuth({
    verifyAccessToken: async (token) => {
      if (token === 'invalid-token' || token === 'expired-token') return { user: null, error: new Error('mock verification failure') }
      const profile = TOKEN_PROFILES[token]
      return profile ? { user: { id: profile.user_id }, error: null } : { user: null, error: new Error('mock verification failure') }
    },
    resolveUserProfile: async (userId, token) => ({
      profile: TOKEN_PROFILES[token] || null,
      client: { marker: `scoped:${userId}` },
      error: null,
    }),
  })
}

function fakeQueries() {
  return {
    searchSpecimens: async (filters, client) => ({ type: 'SPECIMEN_RESULTS', records: [{ specimenId: 'SK001', boneType: filters.boneType, scoped: client?.marker }] }),
    getSpecimen: async (id) => ({ type: 'SPECIMEN_RESULTS', records: [{ specimenId: id }] }),
    getMeasurements: async (id) => ({ type: 'MEASUREMENT_RESULTS', specimen: { specimenId: id }, records: [] }),
    searchImages: async () => ({ type: 'IMAGE_RESULTS', records: [] }),
    getSkeletonCoverage: async (code) => ({ type: 'COVERAGE_RESULT', skeletonCode: code, groups: [] }),
  }
}

function fakeOrchestrator() {
  return {
    respond: async ({ user }) => ({
      type: 'SYSTEM_HELP',
      answer: 'Authenticated help.',
      presentation: { specimens: [], images: [], measurements: [], coverage: null, helpTopic: null },
      sources: [],
      meta: { tool: 'get_system_help', grounded: true, provider: 'mock', roleUsed: user.role },
    }),
  }
}

async function withServer(run) {
  const app = express()
  app.use(express.json())
  app.use('/api/assistant', createAssistantRouter({
    authMiddleware: authMiddleware(),
    queries: fakeQueries(),
    wholeSystemQueries: {
      searchSites: async () => ({ type: 'SITE_RESULTS', records: [] }),
      getSite: async ({ siteId }) => ({ type: 'SITE_RESULT', status: 'resolved', site: { siteId }, linkedSpecimens: [] }),
      getSpecimenContext: async (specimenId) => ({ type: 'SPECIMEN_CONTEXT', specimen: { specimenId } }),
      getImage: async (imageId) => ({ type: 'IMAGE_RESULT', image: { imageId } }),
      getSkeletalAnalysisResult: async (caseId) => ({ type: 'SKELETAL_ANALYSIS_RESULT', analysis: { caseId } }),
      getSpecimenDataQuality: async (specimenId) => ({ type: 'DATA_QUALITY_RESULT', specimenId }),
    },
    getSystemHelp,
    orchestrator: fakeOrchestrator(),
  }))
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  try {
    const address = server.address()
    await run(`http://127.0.0.1:${address.port}/api/assistant`)
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

async function api(base, path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return { status: response.status, body: await response.json() }
}

async function routeTests() {
  await withServer(async (base) => {
    const missingGet = await api(base, '/specimens?boneType=Femur')
    assert.equal(missingGet.status, 401)
    assert.equal(missingGet.body.error.code, 'AUTH_REQUIRED')

    const missingPost = await api(base, '/respond', { method: 'POST', body: { message: 'How do I use the skeleton viewer?' } })
    assert.equal(missingPost.status, 401)

    for (const token of ['invalid-token', 'expired-token']) {
      const result = await api(base, '/help?q=viewer', { token })
      assert.equal(result.status, 401)
      assert.equal(result.body.error.code, 'AUTH_SESSION_INVALID')
    }

    const help = await api(base, '/help?q=How%20do%20I%20use%20the%20skeleton%20viewer%3F', { token: 'student-token' })
    assert.equal(help.status, 200)
    assert.equal(help.body.data.type, 'SYSTEM_HELP')

    const retrieval = await api(base, '/specimens?boneType=Femur', { token: 'student-token' })
    assert.equal(retrieval.status, 200)
    assert.equal(retrieval.body.data.records[0].scoped, 'scoped:user-student')

    const denied = await api(base, '/help?q=How%20do%20I%20add%20a%20specimen%3F', { token: 'student-token' })
    assert.equal(denied.status, 403)
    assert.equal(denied.body.error.code, 'ACCESS_DENIED')
    assert.equal(JSON.stringify(denied.body).includes('/specimens/add'), false)

    const privileged = await api(base, '/help?q=How%20do%20I%20add%20a%20specimen%3F', { token: 'researcher-token' })
    assert.equal(privileged.status, 200)
    assert.equal(privileged.body.data.topic.id, 'add-specimen')

    const studentQuality = await api(base, '/specimens/SK001/data-quality', { token: 'student-token' })
    assert.equal(studentQuality.status, 403)
    assert.equal(studentQuality.body.error.code, 'ACCESS_DENIED')
    const researcherQuality = await api(base, '/specimens/SK001/data-quality', { token: 'researcher-token' })
    assert.equal(researcherQuality.status, 200)
    assert.equal(researcherQuality.body.data.type, 'DATA_QUALITY_RESULT')

    const fakeRole = await api(base, '/respond', { token: 'fake-role-token', method: 'POST', body: { message: 'How do I use the skeleton viewer?', role: 'admin' } })
    assert.equal(fakeRole.status, 400)
    assert.equal(fakeRole.body.error.code, 'INVALID_ASSISTANT_REQUEST')

    const validPost = await api(base, '/respond', { token: 'fake-role-token', method: 'POST', body: { message: 'How do I use the skeleton viewer?' } })
    assert.equal(validPost.status, 200)
    assert.equal(validPost.body.data.meta.roleUsed, 'student')

    const unknownRole = await api(base, '/help?q=viewer', { token: 'unknown-role-token' })
    assert.equal(unknownRole.status, 403)

    for (const result of [missingGet, missingPost, denied, unknownRole]) {
      const serialized = JSON.stringify(result.body)
      assert.equal(/service_role|SUPABASE_KEY|eyJ[a-zA-Z0-9_-]+\./.test(serialized), false)
    }
  })
}

async function authorizationTests() {
  assert.equal(canUseAssistantTool('student', 'get_specimen_data_quality'), false)
  assert.equal(canUseAssistantTool('researcher', 'get_specimen_data_quality'), true)
  assert.equal(canUseAssistantTool('admin', 'get_specimen_data_quality'), true)
  assert.equal(canUseAssistantTool('unknown', 'search_specimens'), false)

  let executed = false
  const restrictedRegistry = {
    getDefinitions: () => [{ name: 'get_specimen_data_quality', description: 'Reserved test tool.', inputSchema: { type: 'object', additionalProperties: false, required: ['specimenId'], properties: { specimenId: { type: 'string' } } } }],
    has: (name) => name === 'get_specimen_data_quality',
    validate: (_name, args) => args,
    execute: async () => { executed = true; return { type: 'QUALITY_RESULT' } },
  }
  const provider = createMockProvider({ selection: { toolCalls: [{ name: 'get_specimen_data_quality', arguments: { specimenId: 'SK001' } }] } })
  const restricted = createAssistantOrchestrator({ provider, toolRegistry: restrictedRegistry })
  const denied = await restricted.respond({ message: 'Retrieve the protected quality result.', user: { id: 'student-user', role: 'student' } })
  assert.equal(denied.type, 'ACCESS_DENIED')
  assert.equal(denied.meta.code, 'ACCESS_DENIED')
  assert.equal(executed, false)

  const services = {
    searchSpecimens: async () => ({ type: 'SPECIMEN_RESULTS', records: [] }),
    getSpecimen: async () => ({ type: 'NOT_FOUND' }),
    searchImages: async () => ({ type: 'IMAGE_RESULTS', records: [] }),
    getMeasurements: async () => ({ type: 'MEASUREMENT_RESULTS', records: [] }),
    getSkeletonCoverage: async () => ({ type: 'NOT_FOUND' }),
    getSystemHelp,
  }
  const guidance = createAssistantOrchestrator({ provider: createMockProvider(), toolRegistry: createAssistantToolRegistry(services) })
  const student = await guidance.respond({ message: 'How do I add a specimen?', user: { id: 'student-user', role: 'student' } })
  assert.equal(student.type, 'ACCESS_DENIED')
  assert.equal(student.presentation.helpTopic, null)
  const researcher = await guidance.respond({ message: 'How do I add a specimen?', user: { id: 'researcher-user', role: 'researcher' } })
  assert.equal(researcher.type, 'SYSTEM_HELP')
  assert.equal(researcher.presentation.helpTopic.id, 'add-specimen')

  const noUser = await guidance.respond({ message: 'How do I use the skeleton viewer?' })
  assert.equal(noUser.type, 'ACCESS_DENIED')
}

async function main() {
  await routeTests()
  await authorizationTests()
  console.log('OAHRIS assistant authentication tests passed: 17/17')
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
