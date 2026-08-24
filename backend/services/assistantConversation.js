const { TOOL_DEFINITIONS } = require('./assistantToolRegistry')
const { ORCHESTRATION_LIMITS, isGuidanceRequest } = require('../policies/assistantSystemPolicy')

const BROAD_DENTAL_TERMS = /\b(teeth|tooth)\b/i
const DENTAL_TYPES = Object.freeze(['Incisor', 'Canine', 'Premolar', 'Molar'])
const IMAGE_TERMS = /\b(image|images|photo|photos|picture|pictures)\b/i
const MEASUREMENT_TERMS = /\b(measurement|measurements)\b/i
const SPECIMEN_TERMS = /\b(specimen|specimens|record|records|information|details)\b/i
const BONE_VALUES = TOOL_DEFINITIONS.search_images.inputSchema.properties.boneType.enum.filter((value) => !['Tooth', 'Teeth'].includes(value))

function contextError(message) { return Object.assign(new Error(message), { code: 'INVALID_CONVERSATION_CONTEXT' }) }
function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype }

function normalizeConversationContext(value) {
  if (value === undefined || value === null) return {}
  if (!isPlainObject(value)) throw contextError('Conversation context must be an object.')
  const allowed = new Set(['previousUserMessage', 'previousAssistantMessage'])
  if (Object.keys(value).some((key) => !allowed.has(key))) throw contextError('Conversation context contains unsupported properties.')
  const normalized = {}
  for (const [key, limit] of [['previousUserMessage', ORCHESTRATION_LIMITS.maxPreviousUserMessageLength], ['previousAssistantMessage', ORCHESTRATION_LIMITS.maxPreviousAssistantMessageLength]]) {
    if (value[key] === undefined) continue
    if (typeof value[key] !== 'string' || value[key].length > limit) throw contextError(`The ${key} context value is invalid.`)
    const text = value[key].trim()
    if (text) normalized[key] = text
  }
  return normalized
}

function firstCode(text) { return String(text || '').match(/\bSK[-\s]?\d+\b/i)?.[0].replace(/\s+/g, '').toUpperCase() || '' }
function firstSide(text) { return /\bleft\b/i.test(text) ? 'Left' : /\bright\b/i.test(text) ? 'Right' : /\bmidline\b/i.test(text) ? 'Midline' : '' }
function firstBone(text) {
  const normalized = String(text || '').trim()
  return [...BONE_VALUES].sort((a, b) => b.length - a.length).find((bone) => new RegExp(`(^|\\W)${bone.replace(/[()]/g, '\\$&').replace(/\\s+/g, '\\s+')}s?(?=\\W|$)`, 'i').test(normalized)) || ''
}
function hasSpecificDentalType(text) { return DENTAL_TYPES.some((type) => new RegExp(`\\b${type}\\b`, 'i').test(text)) }
function broadDentalClarification(message) {
  return BROAD_DENTAL_TERMS.test(message) && !hasSpecificDentalType(message)
    ? 'Which tooth type would you like to search: Incisor, Canine, Premolar, or Molar?'
    : ''
}
function tool(name, args) { return { type: 'TOOL_SELECTION', toolCalls: [{ name, arguments: args }], deterministic: true } }
function clarification(answer) { return { type: 'CLARIFICATION', answer, toolCalls: [], deterministic: true } }

function imageFilters(message) {
  const filters = {}
  const boneType = firstBone(message); const side = firstSide(message); const code = firstCode(message)
  if (boneType) filters.boneType = boneType
  if (side) filters.side = side
  if (/\bfragmented\b/i.test(message)) filters.condition = 'Fragmented'
  else if (/\bpartially complete\b/i.test(message)) filters.condition = 'Partially Complete'
  else if (/\bheavily damaged\b/i.test(message)) filters.condition = 'Heavily Damaged'
  else if (/\bcomplete\b/i.test(message)) filters.condition = 'Complete'
  if (code) filters[/\bskeleton\b/i.test(message) ? 'skeletonCode' : 'specimenId'] = code
  return filters
}

function looksLikeOnlyBone(message, boneType) {
  if (!boneType) return false
  const reduced = String(message).replace(new RegExp(boneType.replace(/[()]/g, '\\$&'), 'i'), '').replace(/\b(i mean|the|bone|please)\b/gi, '').replace(/[^a-z0-9]+/gi, '')
  return !reduced
}

function resolveConversationTurn({ message, context = {} }) {
  const current = String(message || '').trim()
  const previousUser = context.previousUserMessage || ''
  const previousAssistant = context.previousAssistantMessage || ''
  const boneType = firstBone(current)
  const code = firstCode(current)
  const side = firstSide(current)

  const dentalClarification = broadDentalClarification(current)
  if (dentalClarification) return clarification(dentalClarification)
  if (/\b(?:and|also)\b/i.test(current) && IMAGE_TERMS.test(current) && /\b(upload|attach|how|guide|help)\b/i.test(current)) {
    return clarification('I can help with one part at a time. Should I search the images first, or explain how to upload one?')
  }
  if (isGuidanceRequest(current)) return tool('get_system_help', { query: current })

  if (boneType && /\b(which|what)\b[\s\S]{0,30}\b(bone|bone type|skeletal element)\b/i.test(previousAssistant) && IMAGE_TERMS.test(previousUser)) return tool('search_images', { boneType })
  if (code && /\bwhich specimen|specimen id\b/i.test(previousAssistant)) {
    if (MEASUREMENT_TERMS.test(previousUser)) return tool('get_measurements', { specimenId: code })
    return tool('get_specimen', { specimenId: code })
  }
  if (code && /\bwhich skeleton|skeleton code\b/i.test(previousAssistant)) return tool('get_skeleton_coverage', { skeletonCode: code })
  if (side && /\bwhich side\b/i.test(previousAssistant)) {
    const priorBone = firstBone(previousUser)
    if (IMAGE_TERMS.test(previousUser)) return tool('search_images', { ...(priorBone ? { boneType: priorBone } : {}), side })
    if (SPECIMEN_TERMS.test(previousUser)) return tool('search_specimens', { ...(priorBone ? { boneType: priorBone } : {}), side })
  }
  if (/^(yes|yes please|correct|that'?s right)[.!]?$/i.test(current) && /\bdo you mean\b[\s\S]{0,40}\bimage\b/i.test(previousAssistant) && /\bupload|attach\b/i.test(previousUser)) return tool('get_system_help', { query: 'How do I upload a specimen image?' })
  if (IMAGE_TERMS.test(current) && /\b(specimen records?|images?|which type|what type)\b/i.test(previousAssistant)) {
    const priorBone = firstBone(previousUser); if (priorBone) return tool('search_images', { boneType: priorBone })
  }
  if (MEASUREMENT_TERMS.test(current) && /\b(specimen records?|images?|measurements?|which type|what type)\b/i.test(previousAssistant)) {
    const priorCode = firstCode(previousUser); if (priorCode) return tool('get_measurements', { specimenId: priorCode })
  }

  if (IMAGE_TERMS.test(current)) {
    const filters = imageFilters(current)
    if (Object.keys(filters).length) return tool('search_images', filters)
    return clarification('Which bone type, specimen ID, or skeleton code would you like me to use for the image search?')
  }
  if (looksLikeOnlyBone(current, boneType) || (boneType && !IMAGE_TERMS.test(current) && !SPECIMEN_TERMS.test(current) && !MEASUREMENT_TERMS.test(current))) return clarification(`Would you like specimen records, images, or another type of OAHRIS information for ${boneType}?`)
  return null
}

function multiToolClarification(toolCalls) {
  const names = new Set((toolCalls || []).map((call) => call?.name))
  if (names.has('search_images') && names.has('get_system_help')) return 'I can help with one part at a time. Should I search the images first, or explain the OAHRIS workflow?'
  return 'I can help with one part at a time. Which part would you like to start with?'
}

module.exports = { DENTAL_TYPES, broadDentalClarification, multiToolClarification, normalizeConversationContext, resolveConversationTurn }
