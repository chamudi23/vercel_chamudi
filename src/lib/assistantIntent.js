import { CONDITION_OPTIONS, IMAGE_TYPE_OPTIONS, IMAGE_VIEW_OPTIONS, PP1_BONE_OPTIONS, normalize, resolveBoneCategory } from '../utils/pp1ImageModule.js'
const specimenCode = /\bSK[-\s]?\d+\b/gi
const imageCode = /\bIMG[-\s]?[A-Z0-9-]+\b/i
const analysisCaseCode = /\bKGC-[A-Z0-9-]+\b/i
const interpretationTerms = /\b(diagnos|patholog|disease|estimate age|determine age|calculate age|what is the age|estimate sex|determine sex|calculate sex|estimate stature|determine stature|calculate stature|biological profile|cause of death|trauma assessment)\b/i
function firstCode(text) { return Array.from(text.matchAll(specimenCode))[0]?.[0]?.replace(/\s+/g, '').toUpperCase() || '' }
function includesOption(text, options) { return options.find((item) => text.includes(item.toLowerCase())) || '' }
function findBone(text) { const option = [...PP1_BONE_OPTIONS].sort((a, b) => b.length - a.length).find((item) => new RegExp(`(^|\\W)${item.replace(/[()]/g, '\\$&').replace(/\\s+/g, '\\s+')}(?=\\W|$)`, 'i').test(text)); return option ? resolveBoneCategory(option).category?.label || '' : '' }
function isHelpQuestion(text) { return /\b(how(?: do i| can i| to)?|guide me|show me how|where can i|where do i|where do i see|what does|what can|steps?|instructions?|help me (?:to|with)|walk me through)\b/.test(text) && /\b(add|create|upload|attach|edit|update|change|search|use|view|viewer|coverage|assistant|specimen|image|measurement|documentation|record|import|excavation|dating|spatial|gis|dbscan|cluster|site|similar findings|skeletal|analysis|report|results?|data quality|completeness|annotation)\b/.test(text) }
function isCompoundImageAndHelpRequest(text) { return /\b(image|images|photo|photos|picture|pictures)\b/.test(text) && /\b(?:and|also)\b[\s\S]{0,60}\b(upload|attach|how|guide|help)\b/.test(text) }
function sitePeriod(raw) { return raw.match(/\b(?:find|show|search|list)\s+(?:archaeological\s+|excavation\s+)?sites?\s+(?:from|in|of)\s+(.{1,120}?)\s+period\b/i)?.[1]?.trim() || '' }
export function parseAssistantIntent(prompt) {
  const raw = String(prompt || '').trim(); const text = normalize(raw).replace(/\s+/g, ' ')
  if (!raw) return { type: 'UNSUPPORTED_QUERY', message: 'Enter a specific OAHRIS record request.' }
  if (interpretationTerms.test(text)) return { type: 'UNSUPPORTED_QUERY', message: 'This assistant only retrieves recorded OAHRIS data and does not provide diagnostic or research interpretations.' }
  if (isCompoundImageAndHelpRequest(text)) return { type: 'UNSUPPORTED_QUERY', message: 'This request contains more than one assistant action.' }
  const code = firstCode(raw); const boneType = findBone(text); const side = /\bleft\b/.test(text) ? 'Left' : /\bright\b/.test(text) ? 'Right' : ''
  const imageId = raw.match(imageCode)?.[0]?.replace(/\s+/g, '').toUpperCase() || ''
  const caseId = raw.match(analysisCaseCode)?.[0]?.toUpperCase() || ''
  const siteId = raw.match(/\b(?:show|get|view)\s+site\s+([A-Z0-9][A-Z0-9-]{2,119})\b/i)?.[1] || ''
  const period = sitePeriod(raw)
  if (/\b(?:skeletal\s+)?analysis\b/.test(text) && /\bspecimen\b/.test(text) && code) return { type: 'UNSUPPORTED_QUERY', message: 'Stored skeletal analyses cannot currently be looked up by specimen ID. Use an exact analysis case ID.' }
  if (/\b(excavation|dating|context)\b/.test(text) && code) return { type: 'SPECIMEN_CONTEXT', specimenId: code }
  if (/\b(data quality|completeness)\b/.test(text) && code) return { type: 'DATA_QUALITY_RESULT', specimenId: code }
  if (/\b(image|photo|picture)\b/.test(text) && /\b(detail|details|record|show|get|view)\b/.test(text) && imageId) return { type: 'IMAGE_RESULT', imageId }
  if (/\b(?:stored|saved|existing|show|get|view)\b/.test(text) && /\b(?:skeletal\s+)?analysis\b/.test(text) && caseId) return { type: 'SKELETAL_ANALYSIS_RESULT', caseId }
  if (period) return { type: 'SITE_RESULTS', filters: { timePeriod: period } }
  if (siteId) return { type: 'SITE_RESULT', siteId }
  if (/\b(measurement|measurements)\b/.test(text) && code) return { type: 'MEASUREMENT_RESULTS', specimenId: code }
  if (/\b(coverage|documentation)\b/.test(text) && code && /\b(skeleton|sk)\b/.test(text)) return { type: 'COVERAGE_RESULT', skeletonCode: code }
  if (/\b(find|show|get|lookup)\b/.test(text) && /\bspecimen\b/.test(text) && code) return { type: 'SPECIMEN_RESULTS', filters: { specimenId: code } }
  if (/\b(image|images|photo|photos|picture|pictures)\b/.test(text)) { const filters = { boneType, side, condition: includesOption(text, CONDITION_OPTIONS), imageView: includesOption(text, IMAGE_VIEW_OPTIONS), imageType: includesOption(text, IMAGE_TYPE_OPTIONS) }; if (code) { if (/\b(from|skeleton)\b/.test(text)) filters.skeletonCode = code; else filters.specimenId = code } if (Object.values(filters).some(Boolean)) return { type: 'IMAGE_RESULTS', filters } }
  if (isHelpQuestion(text)) return { type: 'SYSTEM_HELP', query: raw }
  return { type: 'UNSUPPORTED_QUERY', message: "I couldn't determine your request yet. You can ask me to retrieve OAHRIS records or explain how to use the system." }
}
