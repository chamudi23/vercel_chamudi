const TOOL_PRESENTATION_KEYS = Object.freeze({
  search_specimens: ['specimens'],
  get_specimen: ['specimens'],
  search_images: ['images'],
  get_measurements: ['specimens', 'measurements'],
  get_skeleton_coverage: ['coverage'],
  get_system_help: ['helpTopic'],
  search_sites: ['sites'],
  get_site: ['site'],
  get_specimen_context: ['specimenContext'],
  get_image: ['imageDetail'],
  get_skeletal_analysis_result: ['skeletalAnalysis'],
  get_specimen_data_quality: ['dataQuality'],
})

const TYPE_PRESENTATION_KEYS = Object.freeze({
  SYSTEM_HELP: ['helpTopic'],
  IMAGE_RESULTS: ['images'],
  SPECIMEN_RESULTS: ['specimens'],
  MEASUREMENT_RESULTS: ['measurements'],
  COVERAGE_RESULT: ['coverage'],
  SITE_RESULTS: ['sites'],
  SITE_RESULT: ['site'],
  SPECIMEN_CONTEXT: ['specimenContext'],
  IMAGE_RESULT: ['imageDetail'],
  SKELETAL_ANALYSIS_RESULT: ['skeletalAnalysis'],
  DATA_QUALITY_RESULT: ['dataQuality'],
})

function directPresentation(data) {
  switch (data.type) {
    case 'SYSTEM_HELP': return { helpTopic: data.topic }
    case 'IMAGE_RESULTS': return { images: data.records || [] }
    case 'SPECIMEN_RESULTS': return { specimens: data.records || [] }
    case 'MEASUREMENT_RESULTS': return { measurements: data.records || [] }
    case 'COVERAGE_RESULT': return { coverage: data }
    case 'SITE_RESULTS': return { sites: data.records || [] }
    case 'SITE_RESULT': return { site: data }
    case 'SPECIMEN_CONTEXT': return { specimenContext: data }
    case 'IMAGE_RESULT': return { imageDetail: data.image }
    case 'SKELETAL_ANALYSIS_RESULT': return { skeletalAnalysis: data.analysis }
    case 'DATA_QUALITY_RESULT': return { dataQuality: data }
    default: return null
  }
}

function notFoundText(data) {
  switch (data.operation) {
    case 'get_specimen_context': return `No stored excavation or dating context was found for ${data.identifier}.`
    case 'get_skeletal_analysis_result': return `No stored skeletal analysis was found for case ${data.identifier}.`
    case 'get_image': return `No stored OAHRIS image was found for ${data.identifier}.`
    case 'get_site': return `No matching OAHRIS site was found for ${data.identifier}.`
    case 'get_specimen_data_quality': return `No OAHRIS specimen was found for data-quality check ${data.identifier}.`
    default: return `No matching OAHRIS ${data.resource || 'record'} was found.`
  }
}

export function deterministicAssistantMessage(data) {
  if (!data || typeof data.type !== 'string') return { role: 'assistant', type: 'ERROR', text: 'OAHRIS Assistant received an invalid retrieval response.' }
  if (data.type === 'HELP_NOT_FOUND') return { role: 'assistant', type: data.type, text: "I don't have verified OAHRIS guidance for that workflow yet." }
  if (data.type === 'NOT_FOUND') return { role: 'assistant', type: data.type, text: notFoundText(data) }

  const count = Array.isArray(data.records) ? data.records.length : 0
  let text
  switch (data.type) {
    case 'SYSTEM_HELP': text = data.topic?.summary || 'Verified OAHRIS guidance was retrieved.'; break
    case 'IMAGE_RESULTS': text = count ? `${count} matching image record${count === 1 ? '' : 's'} found.` : 'No matching OAHRIS image records were found.'; break
    case 'SPECIMEN_RESULTS': text = count ? `${count} matching specimen record${count === 1 ? '' : 's'} found.` : 'No matching OAHRIS specimen records were found.'; break
    case 'MEASUREMENT_RESULTS': text = count ? `${count} measurement record${count === 1 ? '' : 's'} found.` : 'No recorded OAHRIS measurements were found for that specimen.'; break
    case 'SITE_RESULTS':
      if (!count) return { role: 'assistant', type: 'NOT_FOUND', text: 'No matching OAHRIS site records were found.' }
      text = `${count} matching archaeological site record${count === 1 ? '' : 's'} found.`; break
    case 'SITE_RESULT': text = data.status === 'ambiguous' ? 'Multiple sites share that exact name, so no site was guessed.' : `Stored site record retrieved for ${data.site?.siteName || 'the requested site'}.`; break
    case 'SPECIMEN_CONTEXT': text = `Stored excavation and dating context retrieved for ${data.specimen?.specimenId}.`; break
    case 'IMAGE_RESULT': text = `Stored image detail retrieved for ${data.image?.imageId}.`; break
    case 'SKELETAL_ANALYSIS_RESULT': text = data.analysis?.resultLabel || `Stored skeletal analysis retrieved for ${data.analysis?.caseId}.`; break
    case 'DATA_QUALITY_RESULT': text = `Current completeness and stored logs retrieved for ${data.specimenId}.`; break
    case 'COVERAGE_RESULT':
      if (!data.skeletonCode) return { role: 'assistant', type: 'ERROR', text: 'OAHRIS Assistant received an invalid coverage result.' }
      text = `Coverage retrieved for ${data.skeletonCode}.`; break
    default: return { role: 'assistant', type: 'ERROR', text: 'OAHRIS Assistant received an unsupported retrieval response.' }
  }
  return { role: 'assistant', type: data.type, text, presentation: directPresentation(data) }
}

export function selectAssistantPresentation(message) {
  if (!message?.presentation) return null
  const keys = message.type === 'GROUNDED_ANSWER'
    ? TOOL_PRESENTATION_KEYS[message.meta?.tool]
    : TYPE_PRESENTATION_KEYS[message.type]
  if (!keys) return null
  const selected = Object.fromEntries(keys.filter((key) => message.presentation[key] !== undefined && message.presentation[key] !== null).map((key) => [key, message.presentation[key]]))
  return Object.keys(selected).length ? selected : null
}
