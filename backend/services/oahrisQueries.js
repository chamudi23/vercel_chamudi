const path = require('path')
const { pathToFileURL } = require('url')
const supabase = require('../config/supabase')
const { MAX_RESULTS, SPECIMEN_FILTER_KEYS, IMAGE_FILTER_KEYS, asLimit, text, requireFilter, collectPagedSpecimenIds } = require('./assistantQueryPolicy')

let pp1ModulePromise
let coverageModulePromise
const pp1 = () => (pp1ModulePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../src/utils/pp1ImageModule.js')).href))
const coverage = () => (coverageModulePromise ||= import(pathToFileURL(path.resolve(__dirname, '../../src/lib/skeletonCoverage.js')).href))

function serviceError(error) { const safe = new Error('The OAHRIS records could not be retrieved.'); safe.code = 'RETRIEVAL_FAILED'; safe.cause = error; return safe }
function notFound(resource, identifier) { return { type: 'NOT_FOUND', resource, identifier } }
function mapSpecimen(row) { return { specimenId: row.specimen_id, skeletonCode: row.skeleton_code, boneType: row.bone_type, side: row.side, site: row.site_name, district: row.district, province: row.province, timePeriod: row.time_period, preservationStatus: row.preservation_state, locationStored: row.location_stored, burialContext: row.burial_context, notes: row.notes, recordedAgeEstimate: row.age_estimate, recordedSexEstimate: row.sex_estimate, recordedHeightEstimate: row.height_estimate, estimateSource: 'stored_specimen_record', createdAt: row.created_at } }

async function normalizedFilters(filters = {}) {
  const module = await pp1(); const result = { ...filters, limit: asLimit(filters.limit) }
  if (filters.boneType) { const category = module.normalizeBoneCategory(filters.boneType); if (!category) throw Object.assign(new Error('Unsupported bone type.'), { code: 'INVALID_FILTER' }); result.boneType = category.label }
  if (filters.side) { const side = module.normalizeSide(filters.side); if (side === 'Unknown' && text(filters.side).toLowerCase() !== 'unknown') throw Object.assign(new Error('Unsupported side.'), { code: 'INVALID_FILTER' }); result.side = side }
  for (const [key, options] of Object.entries({ condition: module.CONDITION_OPTIONS, imageView: module.IMAGE_VIEW_OPTIONS, imageType: module.IMAGE_TYPE_OPTIONS })) {
    if (filters[key] && !options.includes(text(filters[key]))) throw Object.assign(new Error(`Unsupported ${key}.`), { code: 'INVALID_FILTER' })
  }
  return result
}
async function searchSpecimens(filters = {}, client = supabase) {
  const f = await normalizedFilters(filters); requireFilter(f, SPECIMEN_FILTER_KEYS, 'At least one specimen search filter is required.'); let query = client.from('specimens').select('specimen_id,skeleton_code,bone_type,side,site_name,district,province,time_period,preservation_state,location_stored,burial_context,notes,age_estimate,sex_estimate,height_estimate,created_at')
  if (f.specimenId) query = query.eq('specimen_id', text(f.specimenId)); if (f.skeletonCode) query = query.eq('skeleton_code', text(f.skeletonCode)); if (f.boneType) query = query.eq('bone_type', f.boneType); if (f.side) query = query.eq('side', f.side); if (f.site) query = query.eq('site_name', text(f.site)); if (f.district) query = query.eq('district', text(f.district)); if (f.timePeriod) query = query.eq('time_period', text(f.timePeriod)); if (f.preservationStatus) query = query.eq('preservation_state', text(f.preservationStatus))
  const { data, error } = await query.order('created_at', { ascending: false }).limit(f.limit); if (error) throw serviceError(error)
  return { type: 'SPECIMEN_RESULTS', records: (data || []).map(mapSpecimen), meta: { limit: f.limit } }
}
async function getSpecimen(specimenId, client = supabase) { const result = await searchSpecimens({ specimenId, limit: 1 }, client); return result.records[0] ? result : notFound('specimen', specimenId) }
async function getMeasurements(specimenId, client = supabase) { const specimen = await getSpecimen(specimenId, client); if (specimen.type === 'NOT_FOUND') return specimen; const { data, error } = await client.from('measurements').select('measurement_id,specimen_id,bone_type,measurement_type,value,unit,notes').eq('specimen_id', text(specimenId)).limit(MAX_RESULTS); if (error) throw serviceError(error); return { type: 'MEASUREMENT_RESULTS', specimen: specimen.records[0], records: (data || []).map((row) => ({ measurementId: row.measurement_id, specimenId: row.specimen_id, boneType: row.bone_type, measurementType: row.measurement_type, value: row.value, unit: row.unit, notes: row.notes })) } }
async function resolveSpecimenIdsForImageFilters(filters, client = supabase) {
  let query = client.from('specimens').select('specimen_id')
  if (filters.skeletonCode) query = query.eq('skeleton_code', text(filters.skeletonCode))
  if (filters.boneType) query = query.eq('bone_type', filters.boneType)
  if (filters.side) query = query.eq('side', filters.side)
  try { return await collectPagedSpecimenIds(query) } catch (error) { throw serviceError(error) }
}
async function searchImages(filters = {}, client = supabase) {
  const f = await normalizedFilters(filters); requireFilter(f, IMAGE_FILTER_KEYS, 'At least one image search filter is required.'); let specimenIds = null
  if (f.skeletonCode || f.boneType || f.side) { specimenIds = await resolveSpecimenIdsForImageFilters(f, client); if (!specimenIds.length) return { type: 'IMAGE_RESULTS', records: [], meta: { limit: f.limit } } }
  let query = client.from('bone_images').select('image_id,specimen_id,image_url,file_url,bone_name,side,condition,image_view,view_angle,image_type,notes,image_notes,annotation_text,uploaded_at,created_at,specimen:specimens!bone_images_specimen_id_fkey(specimen_id,skeleton_code,bone_type,side)')
  if (f.specimenId) query = query.eq('specimen_id', text(f.specimenId)); if (specimenIds) query = query.in('specimen_id', specimenIds); if (f.condition) query = query.eq('condition', text(f.condition)); if (f.imageView) query = query.eq('image_view', text(f.imageView)); if (f.imageType) query = query.eq('image_type', text(f.imageType))
  const { data, error } = await query.order('uploaded_at', { ascending: false }).limit(f.limit); if (error) throw serviceError(error)
  return { type: 'IMAGE_RESULTS', records: (data || []).map((row) => ({ imageId: row.image_id, specimenId: row.specimen_id, imageUrl: row.image_url || row.file_url, boneType: row.specimen?.bone_type || row.bone_name, side: row.specimen?.side || row.side, skeletonCode: row.specimen?.skeleton_code || null, condition: row.condition, imageView: row.image_view || row.view_angle, imageType: row.image_type, notes: row.notes || row.image_notes || row.annotation_text || '', legacyMetadata: !row.specimen })), meta: { limit: f.limit } }
}
async function getSkeletonCoverage(skeletonCode, client = supabase) {
  const { data: specimens, error: specimenError } = await client.from('specimens').select('specimen_id,skeleton_code,bone_type,side,preservation_state').eq('skeleton_code', text(skeletonCode)).limit(500); if (specimenError) throw serviceError(specimenError); if (!(specimens || []).length) return notFound('skeleton', skeletonCode)
  const ids = specimens.map((row) => row.specimen_id); const [measurementsResult, imagesResult, module] = await Promise.all([client.from('measurements').select('measurement_id,specimen_id,bone_type').in('specimen_id', ids).limit(1000), client.from('bone_images').select('image_id,specimen_id,image_url,file_url,bone_name,condition').in('specimen_id', ids).limit(1000), coverage()]); if (measurementsResult.error || imagesResult.error) throw serviceError(measurementsResult.error || imagesResult.error)
  const calculated = module.calculateCoverage(specimens, measurementsResult.data || [], imagesResult.data || []); const groups = Object.values(calculated.statusData).filter((row) => row.status !== 'unknown').map((row) => ({ key: row.key, category: row.category?.label || null, side: row.side, status: row.status, specimenIds: row.specimenIds, imageIds: row.images.map((image) => image.image_id), sourceValues: row.sourceValues, conditionValues: row.conditionValues || [], fragmented: Boolean(row.fragmented) }))
  return { type: 'COVERAGE_RESULT', skeletonCode: specimens[0].skeleton_code, recordedCategories: calculated.knownCategoryCount, totalControlledCategories: calculated.catalogueCategoryCount, categoryCoveragePercentage: calculated.recordedCategoryCoveragePercent, documentedGroups: calculated.documentedCount, recordedGroups: calculated.knownCount, imageDocumentationPercentage: calculated.imageDocumentationPercent, groups }
}
module.exports = { searchSpecimens, getSpecimen, searchImages, getMeasurements, getSkeletonCoverage, resolveSpecimenIdsForImageFilters, MAX_RESULTS }
