const express = require('express')
const defaultQueries = require('../services/oahrisQueries')
const defaultWholeSystemQueries = require('../services/wholeSystemQueries')
const { getSystemHelp: defaultGetSystemHelp } = require('../services/helpRetrieval')
const { createDefaultAssistantOrchestrator } = require('../services/assistantOrchestrator')
const { ALLOWED_CURRENT_ROUTES, ORCHESTRATION_LIMITS } = require('../policies/assistantSystemPolicy')
const { normalizeConversationContext } = require('../services/assistantConversation')
const { ACCESS_DENIED_MESSAGE, canUseAssistantTool, canUseHelpTopic } = require('../policies/assistantPermissions')
const { requireAuth } = require('../middleware/requireAuth')

const allowed = {
  specimens: new Set(['specimenId', 'skeletonCode', 'boneType', 'side', 'site', 'district', 'timePeriod', 'preservationStatus', 'limit']),
  images: new Set(['specimenId', 'skeletonCode', 'boneType', 'side', 'condition', 'imageView', 'imageType', 'limit']),
  sites: new Set(['siteName', 'district', 'province', 'timePeriod', 'siteType', 'riskLevel']),
}

function cleanQuery(keys) {
  return (req, res, next) => {
    const unsupported = Object.keys(req.query).filter((key) => !keys.has(key))
    const invalid = Object.entries(req.query).find(([, value]) => Array.isArray(value) || typeof value !== 'string' || value.length > 120)
    if (unsupported.length || invalid) return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Unsupported or invalid assistant query parameter.' } })
    next()
  }
}

function identifier(name) {
  return (req, res, next) => {
    if (!String(req.params[name] || '').trim() || String(req.params[name]).length > 120) return res.status(400).json({ success: false, error: { code: 'INVALID_IDENTIFIER', message: 'A valid identifier is required.' } })
    next()
  }
}

function requireTool(toolName) {
  return (req, res, next) => {
    if (!canUseAssistantTool(req.user?.role, toolName)) return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: ACCESS_DENIED_MESSAGE } })
    next()
  }
}

function handle(call) {
  return async (req, res) => {
    try {
      const data = await call(req)
      res.json({ success: true, data, meta: data.meta || {} })
    } catch (error) {
      const validationError = ['INVALID_FILTER', 'FILTER_REQUIRED'].includes(error.code)
      res.status(validationError ? 400 : 500).json({ success: false, error: { code: error.code || 'RETRIEVAL_FAILED', message: validationError ? error.message : 'The requested OAHRIS records could not be retrieved.' } })
    }
  }
}

function createAssistantRouter({ authMiddleware = requireAuth, queries = defaultQueries, wholeSystemQueries = defaultWholeSystemQueries, getSystemHelp = defaultGetSystemHelp, orchestrator } = {}) {
  const router = express.Router()
  let assistantOrchestrator = orchestrator
  let assistantConfigurationError
  if (!assistantOrchestrator) {
    try { assistantOrchestrator = createDefaultAssistantOrchestrator() } catch (error) {
      if (error?.name !== 'AssistantProviderConfigurationError') throw error
      assistantConfigurationError = error
    }
  }

  // Every deterministic endpoint and the provider-backed endpoint share this boundary.
  router.use(authMiddleware)

  router.get('/specimens', requireTool('search_specimens'), cleanQuery(allowed.specimens), handle((req) => queries.searchSpecimens(req.query, req.supabase)))
  router.get('/specimens/:id/context', requireTool('get_specimen_context'), identifier('id'), handle((req) => wholeSystemQueries.getSpecimenContext(req.params.id, req.supabase)))
  router.get('/specimens/:id/data-quality', requireTool('get_specimen_data_quality'), identifier('id'), handle((req) => wholeSystemQueries.getSpecimenDataQuality(req.params.id, req.supabase)))
  router.get('/specimens/:id/measurements', requireTool('get_measurements'), identifier('id'), handle((req) => queries.getMeasurements(req.params.id, req.supabase)))
  router.get('/specimens/:id', requireTool('get_specimen'), identifier('id'), handle((req) => queries.getSpecimen(req.params.id, req.supabase)))
  router.get('/images', requireTool('search_images'), cleanQuery(allowed.images), handle((req) => queries.searchImages(req.query, req.supabase)))
  router.get('/images/:id', requireTool('get_image'), identifier('id'), handle((req) => wholeSystemQueries.getImage(req.params.id, req.supabase)))
  router.get('/sites', requireTool('search_sites'), cleanQuery(allowed.sites), handle((req) => wholeSystemQueries.searchSites(req.query, req.supabase)))
  router.get('/sites/:id', requireTool('get_site'), identifier('id'), handle((req) => wholeSystemQueries.getSite({ siteId: req.params.id }, req.supabase)))
  router.get('/analyses/:caseId', requireTool('get_skeletal_analysis_result'), identifier('caseId'), handle((req) => wholeSystemQueries.getSkeletalAnalysisResult(req.params.caseId, req.supabase)))
  router.get('/skeletons/:code/coverage', requireTool('get_skeleton_coverage'), identifier('code'), handle((req) => queries.getSkeletonCoverage(req.params.code, req.supabase)))
  router.get('/help', requireTool('get_system_help'), cleanQuery(new Set(['q', 'currentRoute'])), (req, res) => {
    const query = String(req.query.q || '').trim()
    if (!query) return res.status(400).json({ success: false, error: { code: 'HELP_QUERY_REQUIRED', message: 'A help query is required.' } })
    const data = getSystemHelp(query)
    if (data.type === 'SYSTEM_HELP' && !canUseHelpTopic(req.user.role, data.topic)) {
      return res.status(403).json({ success: false, error: { code: 'ACCESS_DENIED', message: 'This workflow requires additional OAHRIS permissions.' } })
    }
    res.json({ success: true, data, meta: {} })
  })

  router.post('/respond', async (req, res) => {
    const body = req.body
    const validBody = body && typeof body === 'object' && !Array.isArray(body)
    const unsupported = validBody ? Object.keys(body).filter((key) => !['message', 'currentRoute', 'context'].includes(key)) : ['body']
    const message = validBody && typeof body.message === 'string' ? body.message.trim() : ''
    const routeIsValid = body?.currentRoute === undefined || (typeof body.currentRoute === 'string' && ALLOWED_CURRENT_ROUTES.includes(body.currentRoute))
    if (!validBody || unsupported.length || !message || message.length > ORCHESTRATION_LIMITS.maxUserMessageLength || !routeIsValid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ASSISTANT_REQUEST', message: 'A valid message and supported currentRoute are required.' } })
    }
    let context
    try { context = normalizeConversationContext(body.context) } catch (_) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_CONVERSATION_CONTEXT', message: 'Conversation context must contain only bounded text fields.' } })
    }
    if (assistantConfigurationError) return res.status(503).json({ success: false, error: { code: assistantConfigurationError.code, message: 'The configured assistant provider is unavailable.' } })
    try {
      const data = await assistantOrchestrator.respond({ message, currentRoute: body.currentRoute, context, user: req.user, toolContext: { supabase: req.supabase } })
      res.json({ success: true, data, meta: data.meta || {} })
    } catch (_) {
      res.status(500).json({ success: false, error: { code: 'ASSISTANT_FAILED', message: 'OAHRIS Assistant could not complete the request.' } })
    }
  })

  return router
}

const router = createAssistantRouter()
router.createAssistantRouter = createAssistantRouter
module.exports = router
