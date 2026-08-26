export async function executeAssistantIntent(intent, request, client) {
  if (!intent || typeof intent.type !== 'string') throw Object.assign(new Error('Invalid assistant intent.'), { code: 'INVALID_ASSISTANT_INTENT' })
  if (!client) throw Object.assign(new Error('Assistant client is required.'), { code: 'ASSISTANT_CLIENT_REQUIRED' })

  switch (intent.type) {
    case 'UNSUPPORTED_QUERY': return client.respond(request.content, request.currentRoute, request.context)
    case 'SYSTEM_HELP': return client.getSystemHelp(intent.query, request.currentRoute)
    case 'IMAGE_RESULTS': return client.searchImages(intent.filters)
    case 'SPECIMEN_RESULTS': return client.searchSpecimens(intent.filters)
    case 'MEASUREMENT_RESULTS': return client.getMeasurements(intent.specimenId)
    case 'COVERAGE_RESULT': return client.getSkeletonCoverage(intent.skeletonCode)
    case 'SITE_RESULTS': return client.searchSites(intent.filters)
    case 'SITE_RESULT': return client.getSite(intent.siteId)
    case 'SPECIMEN_CONTEXT': return client.getSpecimenContext(intent.specimenId)
    case 'IMAGE_RESULT': return client.getImage(intent.imageId)
    case 'SKELETAL_ANALYSIS_RESULT': return client.getSkeletalAnalysisResult(intent.caseId)
    case 'DATA_QUALITY_RESULT': return client.getSpecimenDataQuality(intent.specimenId)
    default: throw Object.assign(new Error('Unsupported assistant intent.'), { code: 'UNSUPPORTED_ASSISTANT_INTENT' })
  }
}
