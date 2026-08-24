import {
  CONTROLLED_BONE_CATEGORIES,
  EXPECTED_CATEGORY_SIDE_KEYS,
  categorySideKey,
  legacySideFromBoneName,
  normalizeBoneCategory,
  normalizeSide,
  parseCategorySideKey,
  resolveBoneCategory,
} from '../utils/pp1ImageModule.js'

function isFragmented(value) { return String(value || '').toLowerCase().includes('fragment') }
function hasUploadedImage(image) { return Boolean(String(image?.image_url || '').trim() || String(image?.file_url || '').trim()) }

function classifyRecordValue({ legacyValues, unmappedValues }, value, source, specimenId = '') {
  const cleanValue = String(value || '').trim()
  if (!cleanValue) return
  const resolution = resolveBoneCategory(cleanValue)
  const item = { value: cleanValue, source, specimenId, kind: resolution.kind }
  if (['legacy-subtype', 'legacy-removed', 'ambiguous-legacy'].includes(resolution.kind)) legacyValues.push(item)
  else if (!resolution.category) unmappedValues.push(item)
}

// Shared by the viewer and the read-only assistant so both report the same controlled catalogue coverage.
export function calculateCoverage(specimens, measurements, images) {
  const measurementsBySpecimen = new Map()
  measurements.forEach((row) => measurementsBySpecimen.set(row.specimen_id, [...(measurementsBySpecimen.get(row.specimen_id) || []), row]))
  const imagesBySpecimen = new Map()
  images.forEach((row) => imagesBySpecimen.set(row.specimen_id, [...(imagesBySpecimen.get(row.specimen_id) || []), row]))
  const groups = new Map(); const unmappedValues = []; const legacyValues = []
  specimens.forEach((specimen) => {
    const sourceRows = specimen.bone_type ? [{ value: specimen.bone_type, source: 'Specimen record' }]
      : (measurementsBySpecimen.get(specimen.specimen_id) || []).filter((row) => row.bone_type).map((row) => ({ value: row.bone_type, source: 'Measurement record' }))
    sourceRows.forEach((row) => classifyRecordValue({ legacyValues, unmappedValues }, row.value, row.source, specimen.specimen_id))
    const mappedRows = sourceRows.map((row) => ({ ...row, category: normalizeBoneCategory(row.value) })).filter((row) => row.category)
    const mappedCodes = new Set(mappedRows.map((row) => row.category.code))
    mappedRows.forEach((row) => {
      const rawSide = String(specimen.side || '').trim()
      const side = rawSide ? normalizeSide(rawSide) : (row.category.laterality === 'midline' ? 'Midline' : legacySideFromBoneName(row.value))
      const key = categorySideKey(row.category.code, side)
      const groupSide = parseCategorySideKey(key)?.side || side
      const matchingImages = (imagesBySpecimen.get(specimen.specimen_id) || []).filter((image) => hasUploadedImage(image) && (mappedCodes.size === 1 || normalizeBoneCategory(image.bone_name)?.code === row.category.code))
      const existing = groups.get(key) || { key, category: row.category, side: groupSide, status: 'present_no_image', specimenIds: new Set(), images: new Map(), sourceValues: new Set(), conditionValues: new Set(), fragmented: false }
      existing.specimenIds.add(specimen.specimen_id); existing.sourceValues.add(row.value)
      if (specimen.preservation_state) existing.conditionValues.add(specimen.preservation_state)
      matchingImages.forEach((image) => { existing.images.set(image.image_id, image); if (image.condition) existing.conditionValues.add(image.condition) })
      existing.fragmented ||= isFragmented(specimen.preservation_state) || matchingImages.some((image) => isFragmented(image.condition))
      if (existing.images.size) existing.status = 'documented'
      groups.set(key, existing)
    })
  })
  images.forEach((image) => classifyRecordValue({ legacyValues, unmappedValues }, image.bone_name, 'Image record', image.specimen_id))
  const statusData = Object.fromEntries(EXPECTED_CATEGORY_SIDE_KEYS.map((key) => [key, { key, status: 'unknown', specimenIds: [], images: [], sourceValues: [] }]))
  groups.forEach((group, key) => { statusData[key] = { ...group, specimenIds: [...group.specimenIds].sort(), images: [...group.images.values()], sourceValues: [...group.sourceValues].sort(), conditionValues: [...group.conditionValues].sort() } })
  const records = Object.values(statusData); const documentedCount = records.filter((row) => row.status === 'documented').length; const presentNoImageCount = records.filter((row) => row.status === 'present_no_image').length; const knownCount = documentedCount + presentNoImageCount
  const knownCategoryCount = new Set(records.filter((row) => row.status !== 'unknown').map((row) => parseCategorySideKey(row.key)?.category.code).filter(Boolean)).size
  const catalogueCategoryCount = CONTROLLED_BONE_CATEGORIES.length
  return { statusData, documentedCount, presentNoImageCount, knownCount, knownCategoryCount, catalogueCategoryCount, recordedCategoryCoveragePercent: catalogueCategoryCount ? Math.round((knownCategoryCount / catalogueCategoryCount) * 100) : 0, imageDocumentationPercent: knownCount ? Math.round((documentedCount / knownCount) * 100) : 0, legacyValues, unmappedValues }
}
