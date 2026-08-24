const express = require('express')
const queries = require('../services/oahrisQueries')
const { getSystemHelp } = require('../services/helpRetrieval')
const { createDefaultAssistantOrchestrator } = require('../services/assistantOrchestrator')
const { ALLOWED_CURRENT_ROUTES, ORCHESTRATION_LIMITS } = require('../policies/assistantSystemPolicy')
const { normalizeConversationContext } = require('../services/assistantConversation')
const router = express.Router()
let assistantOrchestrator
let assistantConfigurationError
try { assistantOrchestrator = createDefaultAssistantOrchestrator() } catch (error) {
  if (error?.name !== 'AssistantProviderConfigurationError') throw error
  assistantConfigurationError = error
}
const allowed = { specimens: new Set(['specimenId', 'skeletonCode', 'boneType', 'side', 'site', 'district', 'timePeriod', 'preservationStatus', 'limit']), images: new Set(['specimenId', 'skeletonCode', 'boneType', 'side', 'condition', 'imageView', 'imageType', 'limit']) }
function cleanQuery(keys) { return (req, res, next) => { const unsupported = Object.keys(req.query).filter((key) => !keys.has(key)); const invalid = Object.entries(req.query).find(([, value]) => Array.isArray(value) || typeof value !== 'string' || value.length > 120); if (unsupported.length || invalid) return res.status(400).json({ success: false, error: { code: 'INVALID_QUERY', message: 'Unsupported or invalid assistant query parameter.' } }); next() } }
function identifier(name) { return (req, res, next) => { if (!String(req.params[name] || '').trim() || String(req.params[name]).length > 120) return res.status(400).json({ success: false, error: { code: 'INVALID_IDENTIFIER', message: 'A valid identifier is required.' } }); next() } }
function handle(call) { return async (req, res) => { try { const data = await call(req); res.json({ success: true, data, meta: data.meta || {} }) } catch (error) { const validationError = ['INVALID_FILTER', 'FILTER_REQUIRED'].includes(error.code); res.status(validationError ? 400 : 500).json({ success: false, error: { code: error.code || 'RETRIEVAL_FAILED', message: validationError ? error.message : 'The requested OAHRIS records could not be retrieved.' } }) } } }
router.get('/specimens', cleanQuery(allowed.specimens), handle((req) => queries.searchSpecimens(req.query)))
router.get('/specimens/:id', identifier('id'), handle((req) => queries.getSpecimen(req.params.id)))
router.get('/specimens/:id/measurements', identifier('id'), handle((req) => queries.getMeasurements(req.params.id)))
router.get('/images', cleanQuery(allowed.images), handle((req) => queries.searchImages(req.query)))
router.get('/help', cleanQuery(new Set(['q', 'currentRoute'])), (req, res) => { const query = String(req.query.q || '').trim(); if (!query) return res.status(400).json({ success: false, error: { code: 'HELP_QUERY_REQUIRED', message: 'A help query is required.' } }); res.json({ success: true, data: getSystemHelp(query), meta: {} }) })
router.get('/skeletons/:code/coverage', identifier('code'), handle((req) => queries.getSkeletonCoverage(req.params.code)))
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
    const data = await assistantOrchestrator.respond({ message, currentRoute: body.currentRoute, context })
    res.json({ success: true, data, meta: data.meta || {} })
  } catch (_) {
    res.status(500).json({ success: false, error: { code: 'ASSISTANT_FAILED', message: 'OAHRIS Assistant could not complete the request.' } })
  }
})
module.exports = router
