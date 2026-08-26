const { PROVIDER_RESULT_TYPES } = require('./assistantProvider')

const BONE_TERMS = Object.freeze({
  skull: 'Skull', cranium: 'Skull', mandible: 'Mandible', maxilla: 'Maxilla', incisor: 'Incisor', canine: 'Canine', premolar: 'Premolar', molar: 'Molar', clavicle: 'Clavicle', scapula: 'Scapula', humerus: 'Humerus', radius: 'Radius', ulna: 'Ulna', vertebra: 'Vertebra', vertebrae: 'Vertebra', sacrum: 'Sacrum', coccyx: 'Coccyx', rib: 'Rib', sternum: 'Sternum', pelvis: 'Pelvis', pubis: 'Pubis', femur: 'Femur', patella: 'Patella', tibia: 'Tibia', fibula: 'Fibula', metacarpal: 'Metacarpal', metatarsal: 'Metatarsal',
})
const CONDITIONS = ['Partially Complete', 'Heavily Damaged', 'Complete', 'Fragmented', 'Unknown']
const VIEWS = ['Anterior', 'Posterior', 'Lateral', 'Superior', 'Inferior', 'Medial', 'Other']
const IMAGE_TYPES = ['Excavation', 'Laboratory', 'Museum', 'Field', 'Reference']

function firstOption(text, options) { return options.find((option) => text.includes(option.toLowerCase())) }
function firstCode(message) { return message.match(/\b(?:SK[-\s]?\d+|SPEC-[A-Z0-9-]+)\b/i)?.[0].replace(/\s+/g, '').toUpperCase() }
function firstImageId(message) { return message.match(/\bIMG[-\s]?[A-Z0-9-]+\b/i)?.[0].replace(/\s+/g, '').toUpperCase() }
function firstCaseId(message) { return message.match(/\bKGC-[A-Z0-9-]+\b/i)?.[0].toUpperCase() }
function sitePeriod(message) { return message.match(/\bsites?\s+(?:from|in|of)\s+(.{1,120}?)\s+period\b/i)?.[1]?.trim() }
function exactSiteName(message) { return message.match(/^\s*(?:(?:could you\s+)?tell me about|what do we know about|(?:give me\s+)?information about)\s+(.+?)[?.!]*\s*$/i)?.[1]?.trim().replace(/\s+/g, ' ') }
function firstBone(text) { return Object.entries(BONE_TERMS).find(([term]) => new RegExp(`\\b${term}s?\\b`, 'i').test(text))?.[1] }
function filtersFrom(message) {
  const text = message.toLowerCase()
  const filters = {}
  const code = firstCode(message)
  const boneType = firstBone(text)
  if (code) filters.skeletonCode = code
  if (boneType) filters.boneType = boneType
  if (/\bleft\b/i.test(text)) filters.side = 'Left'
  else if (/\bright\b/i.test(text)) filters.side = 'Right'
  else if (/\bmidline\b/i.test(text)) filters.side = 'Midline'
  const condition = firstOption(text, CONDITIONS)
  const imageView = firstOption(text, VIEWS)
  const imageType = firstOption(text, IMAGE_TYPES)
  if (condition) filters.condition = condition
  if (imageView) filters.imageView = imageView
  if (imageType) filters.imageType = imageType
  return filters
}

function defaultSelection({ message }) {
  const text = message.toLowerCase()
  const code = firstCode(message)
  const imageId = firstImageId(message)
  const caseId = firstCaseId(message)
  const period = sitePeriod(message)
  const siteName = exactSiteName(message)
  const contextTerms = /\b(?:where|found|excavat(?:ed|ion)|dating|archaeological context)\b/i.test(message)
  if (code && contextTerms && /\b(image|images|photo|photos|picture|pictures)\b/.test(text)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_specimen_context', arguments: { specimenId: code } }, { name: 'search_images', arguments: { specimenId: code } }] }
  if (/\b(?:skeletal\s+)?analysis\b/.test(text) && /\bspecimen\b/.test(text) && code) return { type: PROVIDER_RESULT_TYPES.CLARIFICATION, toolCalls: [], clarification: 'Stored Skeletal Analysis results are currently retrieved by analysis case ID. Please provide the case ID.' }
  if (/\b(?:run|perform|calculate|find)\b[\s\S]{0,30}\b(?:dbscan|k[ -]?means|knn|similar findings|anomaly analysis)\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_system_help', arguments: { query: message } }] }
  if (/\b(?:estimate|determine|calculate|infer|predict)\b[\s\S]{0,30}\b(?:age|sex|stature)\b|\b(?:create|build)\b[\s\S]{0,20}\bbiological[ -]?profile\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_system_help', arguments: { query: 'How do I run skeletal analysis?' } }] }
  if (code && /\b(?:missing important (?:data|information)|data quality|completeness|incomplete)\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_specimen_data_quality', arguments: { specimenId: code } }] }
  if (code && contextTerms) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_specimen_context', arguments: { specimenId: code } }] }
  if (imageId && /\b(?:metadata|information|detail|details|attached|stored)\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_image', arguments: { imageId } }] }
  if (caseId && /\b(?:analysis|saved result|stored result|result)\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_skeletal_analysis_result', arguments: { caseId } }] }
  if (period && /\bsites?\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'search_sites', arguments: { timePeriod: period } }] }
  if (siteName && !/\b(?:specimen|image|analysis case)\b/i.test(siteName)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_site', arguments: { siteName } }] }
  if (/\b(?:what|which)\b[\s\S]{0,50}\b(?:archaeological\s+|excavation\s+)?sites?\b[\s\S]{0,30}\b(?:available|have)\b|\b(?:show|list)\s+(?:me\s+)?(?:archaeological\s+|excavation\s+)?sites?\b/i.test(message)) return { type: PROVIDER_RESULT_TYPES.CLARIFICATION, toolCalls: [], clarification: 'I can search sites by name, district, province, period, site type, or risk level. Which filter would you like to use?' }
  if (/\b(measurement|measurements|measured)\b/.test(text) && code) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_measurements', arguments: { specimenId: code } }] }
  if (/\b(coverage|documentation status|documented)\b/.test(text) && code) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_skeleton_coverage', arguments: { skeletonCode: code } }] }
  if (/\b(image|images|photo|photos|picture|pictures)\b/.test(text)) {
    const args = filtersFrom(message)
    if (code && !/\b(skeleton|coverage)\b/.test(text)) { args.specimenId = code; delete args.skeletonCode }
    return Object.keys(args).length
      ? { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'search_images', arguments: args }] }
      : { type: PROVIDER_RESULT_TYPES.CLARIFICATION, toolCalls: [], clarification: 'Which specimen, skeleton, bone, side, condition, view, or image type should I search for?' }
  }
  if (/\b(specimen|specimens|skeletal record|skeletal records)\b/.test(text)) {
    if (code && /\b(exact|record|details?|specimen)\b/.test(text)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_specimen', arguments: { specimenId: code } }] }
    const args = filtersFrom(message)
    if (code) { args.specimenId = code; delete args.skeletonCode }
    return Object.keys(args).length
      ? { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'search_specimens', arguments: args }] }
      : { type: PROVIDER_RESULT_TYPES.CLARIFICATION, toolCalls: [], clarification: 'Which specimen ID, skeleton code, bone, side, site, district, period, or preservation status should I search for?' }
  }
  if (/\b(how|where|workflow|use|using|upload|attach|viewer|assistant)\b/.test(text)) return { type: PROVIDER_RESULT_TYPES.TOOL_SELECTION, toolCalls: [{ name: 'get_system_help', arguments: { query: message } }] }
  return { type: PROVIDER_RESULT_TYPES.UNSUPPORTED, toolCalls: [] }
}

function defaultSynthesis({ toolName, toolResult }) {
  if (toolResult.type === 'SYSTEM_HELP') return { answer: toolResult.topic.summary }
  if (toolResult.type === 'COVERAGE_RESULT') return { answer: `OAHRIS documentation coverage was retrieved for ${toolResult.skeletonCode}.` }
  if (toolResult.type === 'SITE_RESULTS') return { answer: `${toolResult.records?.length || 0} matching stored OAHRIS archaeological site record${toolResult.records?.length === 1 ? '' : 's'} found.` }
  if (toolResult.type === 'SITE_RESULT') return { answer: toolResult.status === 'ambiguous' ? 'I found more than one OAHRIS site record with that name. Please verify which site you mean.' : toolResult.status === 'reference_only' ? `${toolResult.requestedSiteName || 'That site'} is referenced by OAHRIS specimen records, but it does not resolve to a unique stored site record.` : `Stored OAHRIS site information was retrieved for ${toolResult.site?.siteName || 'the requested site'}.` }
  if (toolResult.type === 'SPECIMEN_CONTEXT') return { answer: toolResult.laboratoryDating ? `Recorded excavation and laboratory-dating information was retrieved for ${toolResult.specimen?.specimenId}.` : `Recorded excavation context was retrieved for ${toolResult.specimen?.specimenId}. There is no laboratory dating information recorded for this specimen.` }
  if (toolResult.type === 'IMAGE_RESULT') return { answer: `Stored OAHRIS image metadata and annotations were retrieved for ${toolResult.image?.imageId}.` }
  if (toolResult.type === 'SKELETAL_ANALYSIS_RESULT') return { answer: `Recorded result produced by the Skeletal Analysis module was retrieved for ${toolResult.analysis?.caseId}.` }
  if (toolResult.type === 'DATA_QUALITY_RESULT') return { answer: `The current deterministic OAHRIS completeness check and previously stored measurement-analysis logs were retrieved for ${toolResult.specimenId}.` }
  const count = Array.isArray(toolResult.records) ? toolResult.records.length : 0
  if (toolName === 'get_specimen' && toolResult.records?.[0] && ['recordedAgeEstimate', 'recordedSexEstimate', 'recordedHeightEstimate'].some((key) => toolResult.records[0][key] !== null && toolResult.records[0][key] !== undefined)) return { answer: `The requested values are recorded in the specimen record for ${toolResult.records[0].specimenId}.` }
  const label = toolName === 'search_images' ? 'image' : toolName === 'get_measurements' ? 'measurement' : 'specimen'
  return { answer: `${count} matching ${label} record${count === 1 ? '' : 's'} found in OAHRIS.` }
}

function createMockProvider(options = {}) {
  const stats = { selectionCalls: 0, synthesisCalls: 0 }
  return {
    name: 'mock',
    stats,
    async selectTool(context) {
      stats.selectionCalls += 1
      if (options.failSelection) throw new Error('Mock provider selection failure with internal details.')
      if (typeof options.selectTool === 'function') return options.selectTool(context)
      if (options.selection !== undefined) return options.selection
      return defaultSelection(context)
    },
    async synthesize(context) {
      stats.synthesisCalls += 1
      if (options.failSynthesis) throw new Error('Mock provider synthesis failure with internal details.')
      if (typeof options.synthesize === 'function') return options.synthesize(context)
      if (options.synthesis !== undefined) return options.synthesis
      return defaultSynthesis(context)
    },
  }
}

module.exports = { createMockProvider }
