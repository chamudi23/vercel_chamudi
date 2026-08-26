const path = require('path')
const { pathToFileURL } = require('url')

const MAX_RESULTS = 20
const MAX_ANNOTATIONS = 20
const MAX_TAGS = 20
const MAX_LOGS = 20
const MAX_TEXT = 500
const SITE_FILTER_KEYS = Object.freeze(['siteName', 'district', 'province', 'timePeriod', 'siteType', 'riskLevel'])

let siteContextModulePromise
let dataQualityModulePromise
const siteContextModule = () => (siteContextModulePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../src/lib/specimenSiteContext.js')).href))
const dataQualityModule = () => (dataQualityModulePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../src/lib/dataQuality.js')).href))

function serviceError(error) { const safe = new Error('The OAHRIS records could not be retrieved.'); safe.code = 'RETRIEVAL_FAILED'; safe.cause = error; return safe }
function text(value, maximum = MAX_TEXT) { return value === null || value === undefined ? null : String(value).slice(0, maximum) }
function clean(value, maximum = MAX_TEXT) { const result = text(value, maximum); return result === null ? null : result.trim() }
function exactFilter(value) {
  const result = clean(value, 120)
  if (!result || /[*%_]/.test(result)) throw Object.assign(new Error('The search filter contains unsupported wildcard characters.'), { code: 'INVALID_FILTER' })
  return result
}
function notFound(resource, identifier, operation) { return { type: 'NOT_FOUND', resource, identifier, operation } }
function safeUrl(value) {
  if (!value) return null
  try { const url = new URL(String(value)); return ['https:', 'http:'].includes(url.protocol) ? url.toString().slice(0, 1200) : null } catch (_) { return null }
}
function finite(value) { const number = Number(value); return Number.isFinite(number) ? number : null }
function safeScalar(value, maximum = 200) {
  if (value === null || value === undefined || typeof value === 'boolean' || typeof value === 'number') return value
  return typeof value === 'string' ? value.slice(0, maximum) : null
}
function safeObject(value, { allowedKeys, maximumKeys = 30 } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const blocked = /(?:email|user(?:name|id)?|investigator|password|token|secret|role|profile)/i
  const entries = Object.entries(value)
    .filter(([key]) => (!allowedKeys || allowedKeys.includes(key)) && !blocked.test(key))
    .slice(0, maximumKeys)
    .map(([key, item]) => [key, safeScalar(item)])
    .filter(([, item]) => item !== null || value !== undefined)
  return Object.fromEntries(entries)
}

function mapSite(row) {
  if (!row) return null
  return {
    siteId: clean(row.id, 120),
    siteName: clean(row.site_name),
    district: clean(row.district),
    province: clean(row.province),
    timePeriod: clean(row.time_period),
    siteType: clean(row.site_type),
    riskLevel: clean(row.risk_level),
    protectedStatus: clean(row.protected_status),
    description: clean(row.description),
  }
}

function mapLinkedSpecimen(row, resolutionStatus) {
  return {
    specimenId: clean(row.specimen_id, 120),
    skeletonCode: clean(row.skeleton_code, 120),
    boneType: clean(row.bone_type),
    side: clean(row.side),
    timePeriod: clean(row.time_period),
    preservationStatus: clean(row.preservation_state),
    siteResolutionStatus: resolutionStatus,
  }
}

async function searchSites(filters = {}, client) {
  const supplied = SITE_FILTER_KEYS.filter((key) => filters[key] !== undefined && filters[key] !== null && String(filters[key]).trim())
  if (!supplied.length) throw Object.assign(new Error('At least one site search filter is required.'), { code: 'FILTER_REQUIRED' })
  let query = client.from('sites').select('id,site_name,district,province,time_period,site_type,risk_level,protected_status,description')
  const columns = { siteName: 'site_name', district: 'district', province: 'province', timePeriod: 'time_period', siteType: 'site_type', riskLevel: 'risk_level' }
  for (const key of supplied) query = query.ilike(columns[key], exactFilter(filters[key]))
  const { data, error } = await query.order('site_name', { ascending: true }).limit(MAX_RESULTS)
  if (error) throw serviceError(error)
  return { type: 'SITE_RESULTS', records: (data || []).slice(0, MAX_RESULTS).map(mapSite), meta: { limit: MAX_RESULTS, coordinatesIncluded: false } }
}

async function getSite(input = {}, client) {
  const siteId = input.siteId ? exactFilter(input.siteId) : ''
  const siteName = input.siteName ? exactFilter(input.siteName) : ''
  if ((siteId ? 1 : 0) + (siteName ? 1 : 0) !== 1) throw Object.assign(new Error('Provide exactly one site ID or exact site name.'), { code: 'INVALID_FILTER' })

  let candidates
  if (siteId) {
    const { data, error } = await client.from('sites').select('id,site_name,district,province,time_period,site_type,risk_level,protected_status,description').eq('id', siteId).limit(2)
    if (error) throw serviceError(error)
    candidates = data || []
  } else {
    const { data, error } = await client.from('sites').select('id,site_name,district,province,time_period,site_type,risk_level,protected_status,description').ilike('site_name', siteName).limit(MAX_RESULTS)
    if (error) throw serviceError(error)
    candidates = data || []
  }
  if (!candidates.length) return notFound('site', siteId || siteName, 'get_site')
  if (!siteId && candidates.length > 1) return { type: 'SITE_RESULT', status: 'ambiguous', site: null, matches: candidates.slice(0, MAX_RESULTS).map(mapSite), linkedSpecimens: [], meta: { coordinatesIncluded: false } }

  const selected = candidates[0]
  const { data: sameName, error: duplicateError } = await client.from('sites').select('id,site_name,district,province,time_period,site_type,risk_level,protected_status,description').ilike('site_name', exactFilter(selected.site_name)).limit(MAX_RESULTS)
  if (duplicateError) throw serviceError(duplicateError)
  if ((sameName || []).length > 1) {
    return { type: 'SITE_RESULT', status: 'resolved', site: mapSite(selected), siteLinkageStatus: 'ambiguous', matches: sameName.slice(0, MAX_RESULTS).map(mapSite), linkedSpecimens: [], meta: { coordinatesIncluded: false, linkage: 'ambiguous_site_name' } }
  }

  const { data: specimens, error: specimenError } = await client
    .from('specimens')
    .select('specimen_id,skeleton_code,bone_type,side,site_name,district,province,time_period,preservation_state')
    .eq('site_name', selected.site_name)
    .order('skeleton_code', { ascending: true })
    .limit(MAX_RESULTS)
  if (specimenError) throw serviceError(specimenError)
  const { resolveSpecimenSite } = await siteContextModule()
  const linkedSpecimens = (specimens || []).slice(0, MAX_RESULTS).map((specimen) => mapLinkedSpecimen(specimen, resolveSpecimenSite(specimen, [selected]).status))
  return { type: 'SITE_RESULT', status: 'resolved', site: mapSite(selected), siteLinkageStatus: 'resolved', linkedSpecimens, meta: { limit: MAX_RESULTS, coordinatesIncluded: false, linkage: 'exact_site_name' } }
}

function mapSpecimenIdentity(row) {
  return {
    specimenId: clean(row.specimen_id, 120),
    skeletonCode: clean(row.skeleton_code, 120),
    boneType: clean(row.bone_type),
    side: clean(row.side),
    siteName: clean(row.site_name),
    district: clean(row.district),
    province: clean(row.province),
    timePeriod: clean(row.time_period),
    excavationYear: row.excavation_year ?? null,
    burialContext: clean(row.burial_context),
    notes: clean(row.notes),
  }
}

async function getSpecimenContext(specimenId, client) {
  const id = exactFilter(specimenId)
  const { data: specimens, error: specimenError } = await client.from('specimens').select('specimen_id,skeleton_code,bone_type,side,site_name,district,province,time_period,excavation_year,burial_context,notes').eq('specimen_id', id).limit(2)
  if (specimenError) throw serviceError(specimenError)
  const specimen = specimens?.[0]
  if (!specimen) return notFound('specimen context', id, 'get_specimen_context')

  const siteQuery = specimen.site_name
    ? client.from('sites').select('id,site_name,district,province,time_period,site_type,risk_level,protected_status,description,latitude,longitude').ilike('site_name', exactFilter(specimen.site_name)).limit(MAX_RESULTS)
    : Promise.resolve({ data: [], error: null })
  const [sitesResult, excavationResult, datingResult] = await Promise.all([
    siteQuery,
    client.from('excavation_records').select('excavation_date,excavation_phase,depth_found,excavation_notes').eq('specimen_id', id).limit(1),
    client.from('laboratory_dating_results').select('dating_method,date_result,date_range_min,date_range_max,lab_name,result_notes').eq('specimen_id', id).limit(1),
  ])
  if (sitesResult.error || excavationResult.error || datingResult.error) throw serviceError(sitesResult.error || excavationResult.error || datingResult.error)
  const { resolveSpecimenSite } = await siteContextModule()
  const resolution = resolveSpecimenSite(specimen, sitesResult.data || [])
  return {
    type: 'SPECIMEN_CONTEXT',
    specimen: mapSpecimenIdentity(specimen),
    siteResolution: {
      status: resolution.status,
      reason: resolution.reason || null,
      conflictingFields: resolution.conflictingFields || [],
      site: resolution.site ? mapSite(resolution.site) : null,
    },
    excavation: excavationResult.data?.[0] ? {
      excavationDate: excavationResult.data[0].excavation_date ?? null,
      excavationPhase: clean(excavationResult.data[0].excavation_phase),
      depthFound: excavationResult.data[0].depth_found ?? null,
      notes: clean(excavationResult.data[0].excavation_notes),
    } : null,
    laboratoryDating: datingResult.data?.[0] ? {
      method: clean(datingResult.data[0].dating_method),
      result: clean(datingResult.data[0].date_result),
      rangeMinBp: datingResult.data[0].date_range_min ?? null,
      rangeMaxBp: datingResult.data[0].date_range_max ?? null,
      laboratory: clean(datingResult.data[0].lab_name),
      notes: clean(datingResult.data[0].result_notes),
    } : null,
    meta: { coordinatesIncluded: false },
  }
}

async function getImage(imageId, client) {
  const id = exactFilter(imageId)
  const { data: images, error } = await client
    .from('bone_images')
    .select('image_id,specimen_id,image_url,file_url,bone_name,side,condition,image_view,view_angle,image_type,notes,image_notes,annotation_text,tags,uploaded_at,created_at,specimen:specimens!bone_images_specimen_id_fkey(specimen_id,skeleton_code,bone_type,side)')
    .eq('image_id', id)
    .limit(2)
  if (error) throw serviceError(error)
  const row = images?.[0]
  if (!row) return notFound('image', id, 'get_image')
  const annotationResult = await client
    .from('image_annotations')
    .select('annotation_id,annotation_type,annotation_description,x_coordinate,y_coordinate,width,height,annotated_at')
    .eq('image_id', id)
    .order('annotated_at', { ascending: true })
    .limit(MAX_ANNOTATIONS)
  if (annotationResult.error) throw serviceError(annotationResult.error)
  const tags = String(row.tags || '').split(',').map((tag) => tag.trim().slice(0, 80)).filter(Boolean).slice(0, MAX_TAGS)
  return {
    type: 'IMAGE_RESULT',
    image: {
      imageId: clean(row.image_id, 120),
      imageUrl: safeUrl(row.image_url || row.file_url),
      specimenId: clean(row.specimen_id, 120),
      skeletonCode: clean(row.specimen?.skeleton_code, 120),
      boneType: clean(row.specimen?.bone_type || row.bone_name),
      side: clean(row.specimen?.side || row.side),
      condition: clean(row.condition),
      imageView: clean(row.image_view || row.view_angle),
      imageType: clean(row.image_type),
      notes: clean(row.notes || row.image_notes || row.annotation_text),
      tags,
      uploadedAt: row.uploaded_at || row.created_at || null,
      annotations: (annotationResult.data || []).slice(0, MAX_ANNOTATIONS).map((annotation) => ({
        annotationId: clean(annotation.annotation_id, 120),
        type: clean(annotation.annotation_type),
        description: clean(annotation.annotation_description),
        x: finite(annotation.x_coordinate),
        y: finite(annotation.y_coordinate),
        width: finite(annotation.width),
        height: finite(annotation.height),
        annotatedAt: annotation.annotated_at || null,
      })),
    },
    meta: { annotationLimit: MAX_ANNOTATIONS, tagLimit: MAX_TAGS },
  }
}

async function getSkeletalAnalysisResult(caseId, client) {
  const id = exactFilter(caseId)
  const { data: rows, error } = await client.from('analyses').select('case_id,basic_info,measurements,predictions,created_at').eq('case_id', id).limit(2)
  if (error) throw serviceError(error)
  const row = rows?.[0]
  if (!row) return notFound('skeletal analysis', id, 'get_skeletal_analysis_result')
  const basicInfo = safeObject(row.basic_info, { allowedKeys: ['caseId', 'location', 'dateFound', 'bonesType', 'analysisDate'] })
  const measurements = safeObject(row.measurements, { maximumKeys: 30 })
  const predictions = safeObject(row.predictions, { allowedKeys: ['gender', 'sex', 'ageRange', 'height', 'stature', 'confidence'] })
  return {
    type: 'SKELETAL_ANALYSIS_RESULT',
    analysis: {
      caseId: clean(row.case_id, 120),
      source: 'stored_skeletal_analysis',
      resultLabel: 'Recorded result produced by the Skeletal Analysis module.',
      createdAt: row.created_at || null,
      basicInfo,
      recordedInputs: measurements,
      storedPredictions: predictions,
    },
  }
}

async function getSpecimenDataQuality(specimenId, client) {
  const id = exactFilter(specimenId)
  const { data: specimens, error: specimenError } = await client
    .from('specimens')
    .select('specimen_id,site_name,district,province,excavation_year,time_period,preservation_state,location_stored,burial_context,notes')
    .eq('specimen_id', id)
    .limit(2)
  if (specimenError) throw serviceError(specimenError)
  const specimen = specimens?.[0]
  if (!specimen) return notFound('specimen', id, 'get_specimen_data_quality')
  const [measurementsResult, logsResult, quality] = await Promise.all([
    client.from('measurements').select('measurement_id').eq('specimen_id', id).limit(1),
    client.from('data_quality_log').select('log_id,field_name,issue_type,status,notes,created_at').eq('specimen_id', id).order('created_at', { ascending: false }).limit(MAX_LOGS),
    dataQualityModule(),
  ])
  if (measurementsResult.error) throw serviceError(measurementsResult.error)
  const storedLogsAvailable = !logsResult.error
  const percentage = quality.calculateSpecimenCompleteness(specimen)
  return {
    type: 'DATA_QUALITY_RESULT',
    specimenId: id,
    currentCompleteness: {
      label: 'Current deterministic completeness check',
      percentage,
      missingTrackedFields: quality.getMissingTrackedFields(specimen),
      hasMeasurements: Boolean(measurementsResult.data?.length),
      status: quality.specimenCompletenessStatus(percentage),
    },
    storedMeasurementAnalysisLogs: (storedLogsAvailable ? logsResult.data || [] : []).slice(0, MAX_LOGS).map((log) => ({
      label: 'Stored measurement-analysis log',
      logId: clean(log.log_id, 120),
      fieldName: clean(log.field_name),
      result: clean(log.issue_type),
      scoreOrStatus: clean(log.status),
      notes: clean(log.notes),
      createdAt: log.created_at || null,
      source: 'stored_data_quality_log',
    })),
    meta: { algorithmsExecuted: false, logLimit: MAX_LOGS, storedLogsAvailable },
  }
}

module.exports = {
  MAX_ANNOTATIONS,
  MAX_LOGS,
  MAX_RESULTS,
  MAX_TAGS,
  SITE_FILTER_KEYS,
  getImage,
  getSite,
  getSkeletalAnalysisResult,
  getSpecimenContext,
  getSpecimenDataQuality,
  searchSites,
}
