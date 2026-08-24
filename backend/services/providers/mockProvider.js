const { PROVIDER_RESULT_TYPES } = require('./assistantProvider')

const BONE_TERMS = Object.freeze({
  skull: 'Skull', cranium: 'Skull', mandible: 'Mandible', maxilla: 'Maxilla', incisor: 'Incisor', canine: 'Canine', premolar: 'Premolar', molar: 'Molar', clavicle: 'Clavicle', scapula: 'Scapula', humerus: 'Humerus', radius: 'Radius', ulna: 'Ulna', vertebra: 'Vertebra', vertebrae: 'Vertebra', sacrum: 'Sacrum', coccyx: 'Coccyx', rib: 'Rib', sternum: 'Sternum', pelvis: 'Pelvis', pubis: 'Pubis', femur: 'Femur', patella: 'Patella', tibia: 'Tibia', fibula: 'Fibula', metacarpal: 'Metacarpal', metatarsal: 'Metatarsal',
})
const CONDITIONS = ['Partially Complete', 'Heavily Damaged', 'Complete', 'Fragmented', 'Unknown']
const VIEWS = ['Anterior', 'Posterior', 'Lateral', 'Superior', 'Inferior', 'Medial', 'Other']
const IMAGE_TYPES = ['Excavation', 'Laboratory', 'Museum', 'Field', 'Reference']

function firstOption(text, options) { return options.find((option) => text.includes(option.toLowerCase())) }
function firstCode(message) { return message.match(/\bSK[-\s]?\d+\b/i)?.[0].replace(/\s+/g, '').toUpperCase() }
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
  const count = Array.isArray(toolResult.records) ? toolResult.records.length : 0
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
