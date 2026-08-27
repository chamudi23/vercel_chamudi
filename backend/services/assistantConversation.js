const { TOOL_DEFINITIONS } = require('./assistantToolRegistry')
const { MODULE_COMPUTATION_GUIDANCE, ORCHESTRATION_LIMITS, isGuidanceRequest } = require('../policies/assistantSystemPolicy')

const BROAD_DENTAL_TERMS = /\b(teeth|tooth)\b/i
const DENTAL_TYPES = Object.freeze(['Incisor', 'Canine', 'Premolar', 'Molar'])
const IMAGE_TERMS = /\b(image|images|photo|photos|picture|pictures)\b/i
const MEASUREMENT_TERMS = /\b(measurement|measurements)\b/i
const SPECIMEN_TERMS = /\b(specimen|specimens|record|records|information|details)\b/i
const SITE_CONTEXT_TERMS = /\b(?:archaeological|excavation)?\s*sites?\b|no matching OAHRIS site|site record|site name/i
const SOCIAL_RESPONSES = Object.freeze({
  greeting: Object.freeze(['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening']),
  thanks: Object.freeze(['thank you', 'thanks', 'thanks a lot', 'thank you very much', 'cheers']),
  acknowledgement: Object.freeze(['ok', 'okay', 'got it', 'understood', 'alright', 'all right', 'great', 'nice', 'cool', 'perfect']),
  farewell: Object.freeze(['bye', 'goodbye', 'see you', 'see you later']),
})
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

function firstCode(text) { return String(text || '').match(/\b(?:SK[-\s]?\d+|SPEC-[A-Z0-9-]+)\b/i)?.[0].replace(/\s+/g, '').toUpperCase() || '' }
function firstImageId(text) { return String(text || '').match(/\bIMG[-\s]?[A-Z0-9-]+\b/i)?.[0].replace(/\s+/g, '').toUpperCase() || '' }
function firstAnalysisCaseId(text) { return String(text || '').match(/\bKGC-[A-Z0-9-]+\b/i)?.[0].toUpperCase() || '' }
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
function conversation(answer) { return { type: 'CONVERSATION', answer, toolCalls: [], deterministic: true } }
function normalizedPhrase(value) { return String(value || '').trim().toLowerCase().replace(/[.!]+$/, '').replace(/\s+/g, ' ') }
function socialReply(message) {
  const phrase = normalizedPhrase(message)
  if (SOCIAL_RESPONSES.greeting.includes(phrase)) return 'Hello! What would you like to explore in OAHRIS?'
  if (SOCIAL_RESPONSES.thanks.includes(phrase)) return phrase === 'thank you' ? "You're welcome! Let me know if you need anything else in OAHRIS." : "You're welcome!"
  if (SOCIAL_RESPONSES.acknowledgement.includes(phrase)) return phrase === 'great' ? 'Glad that helped.' : 'Got it.'
  if (SOCIAL_RESPONSES.farewell.includes(phrase)) return 'See you later!'
  return ''
}
function sitePeriod(message) { return String(message || '').match(/\b(?:find|show|search|list)\s+(?:archaeological\s+|excavation\s+)?sites?\s+(?:from|in|of)\s+(.{1,120}?)\s+period\b/i)?.[1]?.trim() || '' }
function cleanSiteName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').replace(/[?.!]+$/, '').trim()
}
function validSiteName(value) {
  const name = cleanSiteName(value)
  if (!name || name.length > 120 || !/\p{L}/u.test(name) || !/^[\p{L}\p{N}][\p{L}\p{N}\s'’().,&/-]*$/u.test(name)) return ''
  if (socialReply(name)) return ''
  if (/^(?:this part|that one|yes this|the site|site|sites|site record|linked specimens?|something else|information|details)$/i.test(name)) return ''
  return name
}
function describedSiteName(message) {
  const current = String(message || '')
  const match = current.match(/^\s*(?:please\s+)?(?:tell me about|what do we know about|(?:give me\s+)?information about)\s+(.+?)\s*$/i)
  return validSiteName(match?.[1])
}
function bareSiteName(message) {
  const current = cleanSiteName(message)
  if (current.split(' ').length > 8 || /\b(?:show|find|search|list|tell|what|which|how|why|image|specimen|record|details?|information)\b/i.test(current)) return ''
  return validSiteName(current)
}
function isBroadSiteRequest(message) {
  return /\b(?:what|which)\b[\s\S]{0,50}\b(?:archaeological\s+|excavation\s+)?sites?\b[\s\S]{0,30}\bavailable\b/i.test(message)
    || /\b(?:show|list)\s+(?:me\s+)?(?:the\s+)?(?:available\s+)?(?:archaeological\s+|excavation\s+)?sites?\b[.!?]?$/i.test(message)
}
function moduleGuidanceQuery(message) {
  if (!MODULE_COMPUTATION_GUIDANCE.test(message)) return ''
  if (/\bdbscan\b/i.test(message)) return 'How do I use DBSCAN clusters in Spatial Analysis?'
  if (/\b(?:k[ -]?means|knn|similar findings)\b/i.test(message)) return 'How do I use Similar Findings with KNN or K-Means?'
  if (/\banomaly analysis\b/i.test(message)) return 'How do I use the Data Quality dashboard for anomaly review?'
  return 'How do I run a Skeletal Analysis for age, sex, stature, or biological-profile output?'
}

function systemKnowledgeQuery(message, context = {}) {
  const current = String(message || '').trim()
  const previousUser = context.previousUserMessage || ''
  const previousAssistant = context.previousAssistantMessage || ''
  const catalogueContext = /\b(?:skeletal|bone)\s+(?:catalogue|categories|types)\b|\bcanonical skeletal categories\b/i.test(`${previousUser} ${previousAssistant}`)
  if (/^(?:what are they|which are they|list them|what are those|which ones)[?.!]*$/i.test(current) && catalogueContext) return 'What skeletal categories does OAHRIS support?'
  if (/\b(?:what (?:are )?(?:the )?things (?:do )?you know|what do you know)\b[\s\S]{0,40}\b(?:oahris|this system|the system)\b/i.test(current)) return current
  if (/\b(?:what is|tell me about|describe|overview of|what can)\b[\s\S]{0,30}\bOAHRIS\b|\bwhat can OAHRIS do\b/i.test(current)) return current
  if (/\b(?:what|which|list)\b[\s\S]{0,30}\b(?:modules?|areas?)\b[\s\S]{0,30}\b(?:OAHRIS|available|have|include)\b/i.test(current)) return current
  if (/\b(?:what can (?:you|skully)|what does skully|assistant capabilities|your limitations|assistant limitations|what can(?:not|'t) (?:you|skully))\b/i.test(current)) return current
  if (/\b(?:how many|what|which|list|supported)\b[\s\S]{0,35}\b(?:skeletal|bone)\s+(?:catalogue|categories|types)\b|\b(?:what|which|list)\b[\s\S]{0,20}\bsupported bones\b|\bwhat bones does OAHRIS support\b/i.test(current)) return current
  if (/\b(?:what|which)\b[\s\S]{0,25}\b(?:roles?|permissions?|access levels?)\b[\s\S]{0,25}\b(?:OAHRIS|available|have|support)|\broles? and access\b/i.test(current)) return current
  const area = '(?:specimen records?|spatial analysis|image library|skeleton viewer|skeletal analysis|data quality|research assistant)'
  if (new RegExp(`\\b(?:what is|what does|tell me (?:more )?about|describe|purpose of|what about)\\b[\\s\\S]{0,30}\\b${area}\\b`, 'i').test(current)) return current
  return ''
}

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
  const imageId = firstImageId(current)
  const caseId = firstAnalysisCaseId(current)
  const siteId = current.match(/\b(?:show|get|view)\s+site\s+([A-Z0-9][A-Z0-9-]{2,119})\b/i)?.[1] || ''
  const period = sitePeriod(current)
  const directSiteName = describedSiteName(current)

  const social = socialReply(current)
  if (social) return conversation(social)
  const moduleQuery = moduleGuidanceQuery(current)
  if (moduleQuery) return tool('get_system_help', { query: moduleQuery })
  const knowledgeQuery = systemKnowledgeQuery(current, context)
  if (knowledgeQuery) return tool('search_system_knowledge', { query: knowledgeQuery })
  const dentalClarification = broadDentalClarification(current)
  if (dentalClarification) return clarification(dentalClarification)
  if (/\b(?:and|also)\b/i.test(current) && IMAGE_TERMS.test(current) && /\b(upload|attach|how|guide|help)\b/i.test(current)) {
    return clarification('I can help with one part at a time. Should I search the images first, or explain how to upload one?')
  }
  if (/\b(?:and|also)\b/i.test(current) && IMAGE_TERMS.test(current) && SITE_CONTEXT_TERMS.test(current)) {
    return clarification('I can help with one part at a time. Would you like the site record or its images first?')
  }
  if (code && IMAGE_TERMS.test(current) && /\b(?:where|found|excavat(?:ed|ion)|dating|archaeological context)\b/i.test(current)) {
    return clarification('I can help with one part at a time. Would you like the specimen context or its images first?')
  }
  if (/\b(?:skeletal\s+)?analysis\b/i.test(current) && /\bspecimen\b/i.test(current) && code) return clarification('Stored skeletal analyses cannot currently be looked up by specimen ID. Please provide the exact analysis case ID.')
  if (/\b(excavation|dating|context)\b/i.test(current) && code) return tool('get_specimen_context', { specimenId: code })
  if (/\b(data quality|completeness)\b/i.test(current) && code) return tool('get_specimen_data_quality', { specimenId: code })
  if (IMAGE_TERMS.test(current) && /\b(detail|details|record|show|get|view)\b/i.test(current) && imageId) return tool('get_image', { imageId })
  if (/\b(?:stored|saved|existing|show|get|view)\b/i.test(current) && /\b(?:skeletal\s+)?analysis\b/i.test(current) && caseId) return tool('get_skeletal_analysis_result', { caseId })
  if (/^(?:this part|that one|yes this|the site)[.!]?$/i.test(current)) return clarification('Do you want the site record, linked specimens, or something else?')
  if (directSiteName) return tool('get_site', { siteName: directSiteName })
  if (period) return tool('search_sites', { timePeriod: period })
  if (siteId) return tool('get_site', { siteId })
  if (isBroadSiteRequest(current)) return clarification('Which site name, district, province, time period, site type, or risk level would you like me to search?')
  if (isGuidanceRequest(current)) return tool('get_system_help', { query: current })

  if (boneType && /\b(which|what)\b[\s\S]{0,30}\b(bone|bone type|skeletal element)\b/i.test(previousAssistant) && IMAGE_TERMS.test(previousUser)) return tool('search_images', { boneType })
  if (code && /\bwhich specimen|specimen id\b/i.test(previousAssistant)) {
    if (/\b(excavat(?:ed|ion)|dating|archaeological context|where.*found)\b/i.test(previousUser)) return tool('get_specimen_context', { specimenId: code })
    if (/\b(data quality|completeness|missing important (?:data|information))\b/i.test(previousUser)) return tool('get_specimen_data_quality', { specimenId: code })
    if (MEASUREMENT_TERMS.test(previousUser)) return tool('get_measurements', { specimenId: code })
    return tool('get_specimen', { specimenId: code })
  }
  if (caseId && /\bwhich (?:analysis )?case|case id\b/i.test(previousAssistant) && /\b(?:stored|saved|existing|skeletal)\b[\s\S]{0,30}\banalysis\b/i.test(previousUser)) return tool('get_skeletal_analysis_result', { caseId })
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
  const contextualSiteName = bareSiteName(current)
  if (contextualSiteName && (SITE_CONTEXT_TERMS.test(previousAssistant) || SITE_CONTEXT_TERMS.test(previousUser))) return tool('get_site', { siteName: contextualSiteName })

  // An exact image ID with non-command wording is safe for provider selection;
  // do not downgrade it to the broad image-search clarification below.
  if (imageId) return null
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
  if (names.has('get_site') && names.has('search_images')) return 'I can help with one part at a time. Would you like the site record or its images first?'
  if (names.has('get_site') && names.has('search_specimens')) return 'I can help with one part at a time. Would you like the site record or linked specimens first?'
  return 'I can help with one part at a time. Which part would you like to start with?'
}

module.exports = { DENTAL_TYPES, broadDentalClarification, multiToolClarification, normalizeConversationContext, resolveConversationTurn }
