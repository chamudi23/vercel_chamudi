export function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

export const CONTROLLED_SIDE_VALUES = ['Left', 'Right', 'Midline', 'Unknown']

export const CONTROLLED_BONE_CATEGORIES = [
  { code: 'CRANIUM', label: 'Cranium', laterality: 'midline', region: 'Cranial' },
  { code: 'MANDIBLE', label: 'Mandible', laterality: 'midline', region: 'Cranial' },
  { code: 'HYOID', label: 'Hyoid', laterality: 'midline', region: 'Cranial' },
  { code: 'CERVICAL_VERTEBRA', label: 'Cervical Vertebra', laterality: 'midline', region: 'Thorax' },
  { code: 'THORACIC_VERTEBRA', label: 'Thoracic Vertebra', laterality: 'midline', region: 'Thorax' },
  { code: 'LUMBAR_VERTEBRA', label: 'Lumbar Vertebra', laterality: 'midline', region: 'Thorax' },
  { code: 'SACRUM', label: 'Sacrum', laterality: 'midline', region: 'Pelvis' },
  { code: 'COCCYX', label: 'Coccyx', laterality: 'midline', region: 'Pelvis' },
  { code: 'STERNUM', label: 'Sternum', laterality: 'midline', region: 'Thorax' },
  { code: 'RIB', label: 'Rib', laterality: 'paired', region: 'Thorax' },
  { code: 'CLAVICLE', label: 'Clavicle', laterality: 'paired', region: 'Upper Limb', uniquePerSide: true },
  { code: 'SCAPULA', label: 'Scapula', laterality: 'paired', region: 'Upper Limb', uniquePerSide: true },
  { code: 'HUMERUS', label: 'Humerus', laterality: 'paired', region: 'Upper Limb', uniquePerSide: true },
  { code: 'RADIUS', label: 'Radius', laterality: 'paired', region: 'Upper Limb', uniquePerSide: true },
  { code: 'ULNA', label: 'Ulna', laterality: 'paired', region: 'Upper Limb', uniquePerSide: true },
  { code: 'CARPAL', label: 'Carpal', laterality: 'paired', region: 'Upper Limb' },
  { code: 'METACARPAL', label: 'Metacarpal', laterality: 'paired', region: 'Upper Limb' },
  { code: 'HAND_PHALANX', label: 'Hand Phalanx', laterality: 'paired', region: 'Upper Limb' },
  { code: 'OS_COXA', label: 'Os Coxa', laterality: 'paired', region: 'Pelvis', uniquePerSide: true },
  { code: 'FEMUR', label: 'Femur', laterality: 'paired', region: 'Lower Limb', uniquePerSide: true },
  { code: 'PATELLA', label: 'Patella', laterality: 'paired', region: 'Lower Limb', uniquePerSide: true },
  { code: 'TIBIA', label: 'Tibia', laterality: 'paired', region: 'Lower Limb', uniquePerSide: true },
  { code: 'FIBULA', label: 'Fibula', laterality: 'paired', region: 'Lower Limb', uniquePerSide: true },
  { code: 'TALUS', label: 'Talus', laterality: 'paired', region: 'Foot', uniquePerSide: true },
  { code: 'CALCANEUS', label: 'Calcaneus', laterality: 'paired', region: 'Foot', uniquePerSide: true },
  { code: 'OTHER_TARSAL', label: 'Other Tarsal', laterality: 'paired', region: 'Foot' },
  { code: 'METATARSAL', label: 'Metatarsal', laterality: 'paired', region: 'Foot' },
  { code: 'FOOT_PHALANX', label: 'Foot Phalanx', laterality: 'paired', region: 'Foot' },
]

export const PP1_BONE_LABELS = CONTROLLED_BONE_CATEGORIES.map((category) => category.label)

// Keep clear legacy choices visible in older pages while the database is migrated gradually.
export const PP1_BONE_OPTIONS = [...PP1_BONE_LABELS, 'Skull', 'Pelvis', 'Vertebra', 'Other']

export const SIDE_OPTIONS = CONTROLLED_SIDE_VALUES

export const CONDITION_OPTIONS = [
  'Complete',
  'Fragmented',
  'Partially Complete',
  'Heavily Damaged',
  'Unknown',
]

export const REGION_OPTIONS = [
  'Cranial',
  'Upper Limb',
  'Thorax',
  'Pelvis',
  'Lower Limb',
  'Foot',
  'Unknown',
]

export const IMAGE_VIEW_OPTIONS = [
  'Anterior',
  'Posterior',
  'Lateral',
  'Superior',
  'Inferior',
  'Medial',
  'Other',
]

export const IMAGE_TYPE_OPTIONS = [
  'Excavation',
  'Laboratory',
  'Museum',
  'Field',
  'Reference',
]

const CATEGORY_BY_CODE = new Map(CONTROLLED_BONE_CATEGORIES.map((category) => [category.code, category]))
const CATEGORY_BY_LABEL = new Map(CONTROLLED_BONE_CATEGORIES.map((category) => [normalize(category.label), category]))

const LEGACY_CATEGORY_ALIASES = new Map([
  ['skull', 'CRANIUM'],
  ['cranium', 'CRANIUM'],
  ['maxilla', 'CRANIUM'],
  ['maxillary bone', 'CRANIUM'],
  ['mandible', 'MANDIBLE'],
  ['molar', 'MANDIBLE'],
  ['molar tooth', 'MANDIBLE'],
  ['premolar', 'MANDIBLE'],
  ['premolar tooth', 'MANDIBLE'],
  ['tooth', 'MANDIBLE'],
  ['teeth', 'MANDIBLE'],
  ['hyoid', 'HYOID'],
  ['cervical vertebra', 'CERVICAL_VERTEBRA'],
  ['cervical vertebrae', 'CERVICAL_VERTEBRA'],
  ['thoracic vertebra', 'THORACIC_VERTEBRA'],
  ['thoracic vertebrae', 'THORACIC_VERTEBRA'],
  ['lumbar vertebra', 'LUMBAR_VERTEBRA'],
  ['lumbar vertebrae', 'LUMBAR_VERTEBRA'],
  ['sacrum', 'SACRUM'],
  ['coccyx', 'COCCYX'],
  ['sternum', 'STERNUM'],
  ['rib', 'RIB'],
  ['ribs', 'RIB'],
  ['clavicle', 'CLAVICLE'],
  ['scapula', 'SCAPULA'],
  ['humerus', 'HUMERUS'],
  ['radius', 'RADIUS'],
  ['ulna', 'ULNA'],
  ['carpal', 'CARPAL'],
  ['carpals', 'CARPAL'],
  ['metacarpal', 'METACARPAL'],
  ['metacarpals', 'METACARPAL'],
  ['phalanx (hand)', 'HAND_PHALANX'],
  ['phalanx proximal (hand)', 'HAND_PHALANX'],
  ['hand phalanx', 'HAND_PHALANX'],
  ['hand phalanges', 'HAND_PHALANX'],
  ['pelvis', 'OS_COXA'],
  ['os coxa', 'OS_COXA'],
  ['femur', 'FEMUR'],
  ['patella', 'PATELLA'],
  ['tibia', 'TIBIA'],
  ['fibula', 'FIBULA'],
  ['talus', 'TALUS'],
  ['astragalus', 'TALUS'],
  ['calcaneus', 'CALCANEUS'],
  ['calcaneum', 'CALCANEUS'],
  ['other tarsal', 'OTHER_TARSAL'],
  ['other tarsals', 'OTHER_TARSAL'],
  ['metatarsal', 'METATARSAL'],
  ['metatarsals', 'METATARSAL'],
  ['phalanx (foot)', 'FOOT_PHALANX'],
  ['phalanx proximal (foot)', 'FOOT_PHALANX'],
  ['foot phalanx', 'FOOT_PHALANX'],
  ['foot phalanges', 'FOOT_PHALANX'],
  ['pedal phalanx', 'FOOT_PHALANX'],
  ['phalanx', 'FOOT_PHALANX'],
])

export function getCategoryByCode(code) {
  return CATEGORY_BY_CODE.get(String(code || '').toUpperCase()) || null
}

export function normalizeBoneCategory(value) {
  const original = normalize(value)
  if (!original) return null

  const withoutClearQualifier = original
    .replace(/\s*\((left|right|proximal end|distal end)\)\s*$/, '')
    .replace(/\s+(1st|2nd|3rd|4th|5th)\s*$/, '')
  const code = LEGACY_CATEGORY_ALIASES.get(original)
    || LEGACY_CATEGORY_ALIASES.get(withoutClearQualifier)
    || CATEGORY_BY_LABEL.get(original)?.code

  return code ? getCategoryByCode(code) : null
}

export function normalizeSide(value) {
  const side = normalize(value)
  if (side === 'left') return 'Left'
  if (side === 'right') return 'Right'
  if (side === 'midline' || side === 'axial') return 'Midline'
  return 'Unknown'
}

export function legacySideFromBoneName(value) {
  const match = normalize(value).match(/\((left|right)\)\s*$/)
  return match ? normalizeSide(match[1]) : 'Unknown'
}

export function categorySideKey(categoryOrCode, side) {
  const category = getCategoryByCode(categoryOrCode) || normalizeBoneCategory(categoryOrCode)
  if (!category) return ''
  const normalizedSide = category.laterality === 'midline' ? 'Midline' : normalizeSide(side)
  return `${category.code}_${normalizedSide.toUpperCase()}`
}

export function parseCategorySideKey(key) {
  const side = CONTROLLED_SIDE_VALUES.find((value) => key?.endsWith(`_${value.toUpperCase()}`))
  if (!side) return null
  const category = getCategoryByCode(key.slice(0, -(side.length + 1)))
  return category ? { category, side } : null
}

export function categorySides(category, includeUnknown = true) {
  if (category.laterality === 'midline') return ['Midline']
  return includeUnknown ? ['Left', 'Right', 'Unknown'] : ['Left', 'Right']
}

export function regionForBoneCategory(value) {
  return normalizeBoneCategory(value)?.region || 'Unknown'
}

export function allowedSidesForCategory(value) {
  const category = normalizeBoneCategory(value)
  return category ? categorySides(category, true) : []
}

export function validateCategorySide(categoryValue, sideValue) {
  const category = normalizeBoneCategory(categoryValue)
  if (!category) return 'Select a valid bone category.'
  const side = normalizeSide(sideValue)
  const allowedSides = categorySides(category, true)
  if (allowedSides.includes(side)) return ''
  return category.laterality === 'midline'
    ? `${category.label} must use Midline.`
    : `${category.label} must use Left, Right, or Unknown.`
}

export function specimenCategoryValues(record) {
  if (String(record?.bone_type || '').trim()) return [record.bone_type]
  return (record?.measurements || [])
    .map((measurement) => measurement.bone_type)
    .filter((value) => String(value || '').trim())
}

export function findDuplicateSpecimen(records, { skeletonCode, boneCategory, side, excludeSpecimenId = '' }) {
  const skeletonKey = normalize(skeletonCode)
  const requestedCategory = normalizeBoneCategory(boneCategory)
  const requestedKey = categorySideKey(boneCategory, side)
  if (!skeletonKey || !requestedCategory?.uniquePerSide || !requestedKey) return null

  return (records || []).find((record) => {
    if (record.specimen_id === excludeSpecimenId || normalize(record.skeleton_code) !== skeletonKey) return false
    return specimenCategoryValues(record).some((value) => {
      const category = normalizeBoneCategory(value)
      const rawSide = String(record.side || '').trim()
      const resolvedSide = rawSide ? normalizeSide(rawSide) : legacySideFromBoneName(value)
      return category && categorySideKey(category.code, resolvedSide) === requestedKey
    })
  }) || null
}

export const EXPECTED_CATEGORY_SIDE_KEYS = CONTROLLED_BONE_CATEGORIES.flatMap((category) => (
  categorySides(category, false).map((side) => categorySideKey(category.code, side))
))

export const BONE_SVG_KEYS = Object.fromEntries(CONTROLLED_BONE_CATEGORIES.map((category) => [
  category.code,
  categorySides(category).map((side) => categorySideKey(category.code, side)),
]))

export const SKELETON_ORIENTATION_MARKERS = {
  front: { left: 'R', right: 'L' },
  back: { left: 'L', right: 'R' },
}

export function screenSideForAnatomicalSide(view, side) {
  const normalizedSide = normalizeSide(side)
  if (normalizedSide !== 'Left' && normalizedSide !== 'Right') return null
  if (view === 'front') return normalizedSide === 'Left' ? 'right' : 'left'
  if (view === 'back') return normalizedSide.toLowerCase()
  return null
}

export function skeletonViewsForMode(mode) {
  if (mode === 'Both') return ['front', 'back']
  const view = normalize(mode)
  return view === 'front' || view === 'back' ? [view] : []
}

export function toggleBoneSelection(currentKey, requestedKey) {
  if (!requestedKey || currentKey === requestedKey) return ''
  return requestedKey
}

// These group indexes refer to unmodified source groups in the two attributed SVG files.
// Only groups that were visually checked against the source drawing are included.
const SKELETON_NONSIDED_SVG_GROUPS = {
  front: {
    CRANIUM_MIDLINE: [128, 129, 130, 131, 132, 133, 135, 137],
    MANDIBLE_MIDLINE: [125],
    HYOID_MIDLINE: [127],
    CERVICAL_VERTEBRA_MIDLINE: [117],
    LUMBAR_VERTEBRA_MIDLINE: [72],
    SACRUM_MIDLINE: [68],
    COCCYX_MIDLINE: [67],
    RIB_UNKNOWN: [82],
    OS_COXA_UNKNOWN: [61],
  },
  back: {
    CRANIUM_MIDLINE: [93],
    // The posterior artwork combines the lower face into one nested group.
    // Using that group keeps mandible/tooth records visible without colouring
    // the entire cranium proxy used above.
    MANDIBLE_MIDLINE: [94],
  },
}

// Paired source groups are recorded by their literal screen position. Anatomical
// laterality is resolved separately because a front-facing skeleton is mirrored.
export const SKELETON_SCREEN_SIDE_GROUPS = {
  front: {
    CLAVICLE: { left: [141], right: [142] },
    SCAPULA: { left: [65], right: [64] },
    HUMERUS: { left: [150], right: [144] },
    RADIUS: { left: [154], right: [147] },
    ULNA: { left: [155], right: [148] },
    CARPAL: { left: [197, 198, 199, 201, 213, 214, 215, 216, 220], right: [177] },
    METACARPAL: { left: [217, 221, 222, 223, 224], right: [167, 168, 175, 188, 189, 191, 193] },
    HAND_PHALANX: { left: [204, 205, 206, 207, 208, 209, 210, 211, 212, 218, 219], right: [157, 158, 159, 160, 162, 165, 170, 171, 172, 173, 174, 190, 194, 195] },
    FEMUR: { left: [55], right: [59] },
    PATELLA: { left: [227], right: [228] },
    TIBIA: { left: [53], right: [226] },
    FIBULA: { left: [52], right: [225] },
    OTHER_TARSAL: { left: [4, 5, 6, 7, 8], right: [30, 31, 32, 33, 34] },
    METATARSAL: { left: [10, 11, 12, 13, 14], right: [36, 37, 38, 39, 40] },
    FOOT_PHALANX: { left: [15], right: [41] },
  },
  back: {
    HUMERUS: { left: [2], right: [47] },
    RADIUS: { left: [45], right: [49] },
    ULNA: { left: [44], right: [51] },
    FEMUR: { left: [84], right: [87] },
    // Patella is intentionally omitted: it is anterior and the posterior SVG
    // has no isolated patella shape. Mapping its parent would colour the femur.
    TIBIA: { left: [201], right: [205] },
    FIBULA: { left: [204], right: [208] },
    OTHER_TARSAL: {
      left: [222, 223, 224, 225, 226, 227],
      right: [210, 211, 212, 213, 214, 215],
    },
    METATARSAL: { left: [229, 230, 231], right: [217, 218, 219] },
    FOOT_PHALANX: { left: [232], right: [220] },
  },
}

function anatomicalSvgGroups(view) {
  const mappings = { ...(SKELETON_NONSIDED_SVG_GROUPS[view] || {}) }
  Object.entries(SKELETON_SCREEN_SIDE_GROUPS[view] || {}).forEach(([categoryCode, screenGroups]) => {
    for (const side of ['Left', 'Right']) {
      const screenSide = screenSideForAnatomicalSide(view, side)
      mappings[`${categoryCode}_${side.toUpperCase()}`] = screenGroups[screenSide]
    }
  })
  return mappings
}

export const SKELETON_SVG_GROUPS = {
  front: anatomicalSvgGroups('front'),
  back: anatomicalSvgGroups('back'),
}

const SKELETON_SVG_STATUS_ALIASES = {
  RIB_UNKNOWN: ['RIB_LEFT', 'RIB_RIGHT'],
  OS_COXA_UNKNOWN: ['OS_COXA_LEFT', 'OS_COXA_RIGHT'],
  OTHER_TARSAL_LEFT: ['TALUS_LEFT', 'CALCANEUS_LEFT', 'TALUS_UNKNOWN', 'CALCANEUS_UNKNOWN'],
  OTHER_TARSAL_RIGHT: ['TALUS_RIGHT', 'CALCANEUS_RIGHT', 'TALUS_UNKNOWN', 'CALCANEUS_UNKNOWN'],
}

export function skeletonStatusKeysForSvgKey(svgKey) {
  const keys = [svgKey, ...(SKELETON_SVG_STATUS_ALIASES[svgKey] || [])]
  const parsed = parseCategorySideKey(svgKey)
  if (parsed && (parsed.side === 'Left' || parsed.side === 'Right')) {
    keys.push(categorySideKey(parsed.category.code, 'Unknown'))
  }
  return [...new Set(keys)]
}

export const SPECIMEN_SELECT = `
  specimen_id,
  skeleton_code,
  site_name,
  district,
  province,
  time_period,
  preservation_state,
  burial_context,
  notes
`

export const IMAGE_SELECT = `
  image_id,
  specimen_id,
  file_url,
  bone_name,
  side,
  condition,
  skeleton_region,
  image_view,
  view_angle,
  image_type,
  notes,
  image_notes,
  uploaded_at,
  created_at,
  specimens (${SPECIMEN_SELECT}),
  image_retrieval_tags (tag_id, tag_name)
`

export function splitTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function imageNotes(image) {
  return image?.notes || image?.image_notes || ''
}

export function specimenLabel(specimen) {
  return [
    specimen?.skeleton_code,
    specimen?.specimen_id,
    specimen?.site_name,
  ].filter(Boolean).join(' - ')
}
