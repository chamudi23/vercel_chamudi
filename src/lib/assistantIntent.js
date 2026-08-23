import { CONDITION_OPTIONS, IMAGE_TYPE_OPTIONS, IMAGE_VIEW_OPTIONS, PP1_BONE_OPTIONS, normalize, resolveBoneCategory } from '../utils/pp1ImageModule.js'
const specimenCode = /\bSK[-\s]?\d+\b/gi
const interpretationTerms = /\b(diagnos|patholog|disease|estimate age|determine age|calculate age|what is the age|estimate sex|determine sex|calculate sex|estimate stature|determine stature|calculate stature|biological profile|cause of death|trauma assessment)\b/i
function firstCode(text) { return Array.from(text.matchAll(specimenCode))[0]?.[0]?.replace(/\s+/g, '').toUpperCase() || '' }
function includesOption(text, options) { return options.find((item) => text.includes(item.toLowerCase())) || '' }
function findBone(text) { const option = [...PP1_BONE_OPTIONS].sort((a, b) => b.length - a.length).find((item) => new RegExp(`(^|\\W)${item.replace(/[()]/g, '\\$&').replace(/\\s+/g, '\\s+')}(?=\\W|$)`, 'i').test(text)); return option ? resolveBoneCategory(option).category?.label || '' : '' }
function isHelpQuestion(text) { return /\b(how do i|how can i|how to|where can i|where do i|what does|what can)\b/.test(text) && /\b(add|create|upload|attach|search|use|viewer|coverage|assistant|specimen|image|measurement|documentation)\b/.test(text) }
export function parseAssistantIntent(prompt) {
  const raw = String(prompt || '').trim(); const text = normalize(raw).replace(/\s+/g, ' ')
  if (!raw) return { type: 'UNSUPPORTED_QUERY', message: 'Enter a specific OAHRIS record request.' }
  if (interpretationTerms.test(text)) return { type: 'UNSUPPORTED_QUERY', message: 'This assistant only retrieves recorded OAHRIS data and does not provide diagnostic or research interpretations.' }
  const code = firstCode(raw); const boneType = findBone(text); const side = /\bleft\b/.test(text) ? 'Left' : /\bright\b/.test(text) ? 'Right' : ''
  if (/\b(measurement|measurements)\b/.test(text) && code) return { type: 'MEASUREMENT_RESULTS', specimenId: code }
  if (/\b(coverage|documentation)\b/.test(text) && code && /\b(skeleton|sk)\b/.test(text)) return { type: 'COVERAGE_RESULT', skeletonCode: code }
  if (/\b(find|show|get|lookup)\b/.test(text) && /\bspecimen\b/.test(text) && code) return { type: 'SPECIMEN_RESULTS', filters: { specimenId: code } }
  if (/\b(image|images|photo|photos|picture|pictures)\b/.test(text)) { const filters = { boneType, side, condition: includesOption(text, CONDITION_OPTIONS), imageView: includesOption(text, IMAGE_VIEW_OPTIONS), imageType: includesOption(text, IMAGE_TYPE_OPTIONS) }; if (code) { if (/\b(from|skeleton)\b/.test(text)) filters.skeletonCode = code; else filters.specimenId = code } if (Object.values(filters).some(Boolean)) return { type: 'IMAGE_RESULTS', filters } }
  if (isHelpQuestion(text)) return { type: 'SYSTEM_HELP', query: raw }
  return { type: 'UNSUPPORTED_QUERY', message: "I couldn't determine your request yet. You can ask me to retrieve OAHRIS records or explain how to use the system." }
}
