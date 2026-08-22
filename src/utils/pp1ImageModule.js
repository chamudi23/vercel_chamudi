export function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

export const CONTROLLED_SIDE_VALUES = ['Left', 'Right', 'Midline', 'Unknown']

export const CONTROLLED_BONE_CATEGORIES = [
  { code: 'SKULL', label: 'Skull', section: 'Skull', laterality: 'midline', region: 'Cranial', mapSupport: 'full-body-regional' },
  { code: 'MANDIBLE', label: 'Mandible', section: 'Skull', laterality: 'midline', region: 'Cranial', mapSupport: 'full-body-direct', mapViews: ['front'] },
  { code: 'MAXILLA', label: 'Maxilla', section: 'Skull', laterality: 'paired', region: 'Cranial', mapSupport: 'cranial-detail' },
  { code: 'INCISOR', label: 'Incisor', section: 'Teeth', laterality: 'paired', region: 'Cranial', mapSupport: 'cranial-detail' },
  { code: 'CANINE', label: 'Canine', section: 'Teeth', laterality: 'paired', region: 'Cranial', mapSupport: 'cranial-detail' },
  { code: 'PREMOLAR', label: 'Premolar', section: 'Teeth', laterality: 'paired', region: 'Cranial', mapSupport: 'cranial-detail' },
  { code: 'MOLAR', label: 'Molar', section: 'Teeth', laterality: 'paired', region: 'Cranial', mapSupport: 'cranial-detail' },
  { code: 'CLAVICLE', label: 'Clavicle', section: 'Upper Limb', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-direct', mapViews: ['front'], uniquePerSide: true },
  { code: 'SCAPULA', label: 'Scapula', section: 'Upper Limb', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-direct', mapViews: ['front', 'back'], uniquePerSide: true },
  { code: 'HUMERUS', label: 'Humerus', section: 'Upper Limb', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'RADIUS', label: 'Radius', section: 'Upper Limb', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'ULNA', label: 'Ulna', section: 'Upper Limb', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'VERTEBRA', label: 'Vertebra', section: 'Vertebral Column', laterality: 'midline', region: 'Thorax', mapSupport: 'none' },
  { code: 'SACRUM', label: 'Sacrum', section: 'Vertebral Column', laterality: 'midline', region: 'Pelvis', mapSupport: 'full-body-direct', mapViews: ['front'] },
  { code: 'COCCYX', label: 'Coccyx', section: 'Vertebral Column', laterality: 'midline', region: 'Pelvis', mapSupport: 'full-body-direct', mapViews: ['front'] },
  { code: 'RIB', label: 'Rib', section: 'Thorax', laterality: 'paired', region: 'Thorax', mapSupport: 'full-body-regional', mapViews: ['front'] },
  { code: 'STERNUM', label: 'Sternum', section: 'Thorax', laterality: 'midline', region: 'Thorax', mapSupport: 'none' },
  { code: 'PELVIS', label: 'Pelvis', section: 'Pelvis', laterality: 'paired', region: 'Pelvis', mapSupport: 'full-body-regional', mapViews: ['front'], uniquePerSide: true },
  { code: 'PUBIS', label: 'Pubis', section: 'Pelvis', laterality: 'paired', region: 'Pelvis', mapSupport: 'pelvic-detail' },
  { code: 'FEMUR', label: 'Femur', section: 'Lower Limb', laterality: 'paired', region: 'Lower Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'PATELLA', label: 'Patella', section: 'Lower Limb', laterality: 'paired', region: 'Lower Limb', mapSupport: 'full-body-direct', mapViews: ['front'], uniquePerSide: true },
  { code: 'TIBIA', label: 'Tibia', section: 'Lower Limb', laterality: 'paired', region: 'Lower Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'FIBULA', label: 'Fibula', section: 'Lower Limb', laterality: 'paired', region: 'Lower Limb', mapSupport: 'full-body-direct', uniquePerSide: true },
  { code: 'METACARPAL', label: 'Metacarpal', section: 'Hands and Feet', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-regional', mapViews: ['front'] },
  { code: 'METATARSAL', label: 'Metatarsal', section: 'Hands and Feet', laterality: 'paired', region: 'Foot', mapSupport: 'full-body-regional' },
  { code: 'HAND_PHALANX', label: 'Phalanx (Hand)', section: 'Hands and Feet', laterality: 'paired', region: 'Upper Limb', mapSupport: 'full-body-regional', mapViews: ['front'] },
  { code: 'FOOT_PHALANX', label: 'Phalanx (Foot)', section: 'Hands and Feet', laterality: 'paired', region: 'Foot', mapSupport: 'full-body-regional' },
  { code: 'OTHER', label: 'Other', section: 'Unidentified', laterality: 'none', region: 'Unknown', mapSupport: 'none' },
]

export const CONTROLLED_BONE_SECTIONS = [
  'Skull',
  'Teeth',
  'Upper Limb',
  'Vertebral Column',
  'Thorax',
  'Pelvis',
  'Lower Limb',
  'Hands and Feet',
  'Unidentified',
]

export const PP1_BONE_LABELS = CONTROLLED_BONE_CATEGORIES.map((category) => category.label)

export const LEGACY_BONE_CATEGORIES = [
  { code: 'CERVICAL_VERTEBRA', label: 'Cervical Vertebra', canonicalCode: 'VERTEBRA', kind: 'legacy-subtype' },
  { code: 'THORACIC_VERTEBRA', label: 'Thoracic Vertebra', canonicalCode: 'VERTEBRA', kind: 'legacy-subtype' },
  { code: 'LUMBAR_VERTEBRA', label: 'Lumbar Vertebra', canonicalCode: 'VERTEBRA', kind: 'legacy-subtype' },
  { code: 'HYOID', label: 'Hyoid', kind: 'legacy-removed' },
  { code: 'CARPAL', label: 'Carpal', kind: 'legacy-removed' },
  { code: 'TALUS', label: 'Talus', kind: 'legacy-removed' },
  { code: 'CALCANEUS', label: 'Calcaneus', kind: 'legacy-removed' },
  { code: 'OTHER_TARSAL', label: 'Other Tarsal', kind: 'legacy-removed' },
  { code: 'TOOTH', label: 'Tooth', kind: 'ambiguous-legacy' },
  { code: 'TEETH', label: 'Teeth', kind: 'ambiguous-legacy' },
  { code: 'PHALANX', label: 'Phalanx', kind: 'ambiguous-legacy' },
]

// Search screens can still find saved legacy records, while data-entry screens use
// PP1_BONE_LABELS and therefore expose only the canonical catalogue.
export const PP1_BONE_OPTIONS = [...new Set([
  ...PP1_BONE_LABELS,
  'Cranium',
  'Hand Phalanx',
  'Foot Phalanx',
  'Os Coxa',
  ...LEGACY_BONE_CATEGORIES.map((category) => category.label),
])]

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

const LEGACY_CATEGORY_BY_LABEL = new Map(LEGACY_BONE_CATEGORIES.map((category) => [normalize(category.label), category]))

const SAFE_CATEGORY_ALIASES = new Map([
  ['skull', 'SKULL'],
  ['cranium', 'SKULL'],
  ['maxilla', 'MAXILLA'],
  ['maxillary bone', 'MAXILLA'],
  ['mandible', 'MANDIBLE'],
  ['incisor', 'INCISOR'],
  ['incisor tooth', 'INCISOR'],
  ['canine', 'CANINE'],
  ['canine tooth', 'CANINE'],
  ['molar', 'MOLAR'],
  ['molar tooth', 'MOLAR'],
  ['premolar', 'PREMOLAR'],
  ['premolar tooth', 'PREMOLAR'],
  ['vertebra', 'VERTEBRA'],
  ['vertebrae', 'VERTEBRA'],
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
  ['metacarpal', 'METACARPAL'],
  ['metacarpals', 'METACARPAL'],
  ['phalanx (hand)', 'HAND_PHALANX'],
  ['phalanx proximal (hand)', 'HAND_PHALANX'],
  ['hand phalanx', 'HAND_PHALANX'],
  ['hand phalanges', 'HAND_PHALANX'],
  ['pelvis', 'PELVIS'],
  ['os coxa', 'PELVIS'],
  ['pubis', 'PUBIS'],
  ['femur', 'FEMUR'],
  ['patella', 'PATELLA'],
  ['tibia', 'TIBIA'],
  ['fibula', 'FIBULA'],
  ['metatarsal', 'METATARSAL'],
  ['metatarsals', 'METATARSAL'],
  ['phalanx (foot)', 'FOOT_PHALANX'],
  ['phalanx proximal (foot)', 'FOOT_PHALANX'],
  ['foot phalanx', 'FOOT_PHALANX'],
  ['foot phalanges', 'FOOT_PHALANX'],
  ['pedal phalanx', 'FOOT_PHALANX'],
  ['other', 'OTHER'],
])

const LEGACY_CATEGORY_ALIASES = new Map([
  ['cervical vertebra', 'Cervical Vertebra'],
  ['cervical vertebrae', 'Cervical Vertebra'],
  ['thoracic vertebra', 'Thoracic Vertebra'],
  ['thoracic vertebrae', 'Thoracic Vertebra'],
  ['lumbar vertebra', 'Lumbar Vertebra'],
  ['lumbar vertebrae', 'Lumbar Vertebra'],
  ['hyoid', 'Hyoid'],
  ['carpal', 'Carpal'],
  ['carpals', 'Carpal'],
  ['talus', 'Talus'],
  ['astragalus', 'Talus'],
  ['calcaneus', 'Calcaneus'],
  ['calcaneum', 'Calcaneus'],
  ['other tarsal', 'Other Tarsal'],
  ['other tarsals', 'Other Tarsal'],
  ['tooth', 'Tooth'],
  ['teeth', 'Teeth'],
  ['phalanx', 'Phalanx'],
])

export function getCategoryByCode(code) {
  return CATEGORY_BY_CODE.get(String(code || '').toUpperCase()) || null
}

export function resolveBoneCategory(value) {
  const rawValue = String(value || '').trim()
  const original = normalize(value)
  if (!original) return { kind: 'empty', rawValue, category: null, legacyCategory: null }

  const withoutClearQualifier = original
    .replace(/\s*\((left|right|upper|lower|proximal end|distal end)\)\s*$/, '')
    .replace(/\s+(1st|2nd|3rd|4th|5th)\s*$/, '')

  const canonical = CATEGORY_BY_LABEL.get(original)
  if (canonical) return { kind: 'canonical', rawValue, category: canonical, legacyCategory: null }

  const safeCode = SAFE_CATEGORY_ALIASES.get(original) || SAFE_CATEGORY_ALIASES.get(withoutClearQualifier)
  if (safeCode) {
    return { kind: 'safe-alias', rawValue, category: getCategoryByCode(safeCode), legacyCategory: null }
  }

  const legacyLabel = LEGACY_CATEGORY_ALIASES.get(original) || LEGACY_CATEGORY_ALIASES.get(withoutClearQualifier)
  const legacyCategory = legacyLabel ? LEGACY_CATEGORY_BY_LABEL.get(normalize(legacyLabel)) : null
  if (legacyCategory) {
    return {
      kind: legacyCategory.kind,
      rawValue,
      category: legacyCategory.canonicalCode ? getCategoryByCode(legacyCategory.canonicalCode) : null,
      legacyCategory,
    }
  }

  return { kind: 'unknown', rawValue, category: null, legacyCategory: null }
}

export function normalizeBoneCategory(value) {
  return resolveBoneCategory(value).category
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
  const normalizedSide = category.laterality === 'midline'
    ? 'Midline'
    : category.laterality === 'none'
      ? 'Unknown'
      : normalizeSide(side)
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
  if (category.laterality === 'none') return ['Unknown']
  return includeUnknown ? ['Left', 'Right', 'Unknown'] : ['Left', 'Right']
}

export function supportsFullBodyMap(categoryOrCode) {
  const category = getCategoryByCode(categoryOrCode) || normalizeBoneCategory(categoryOrCode)
  return Boolean(category?.mapSupport?.startsWith('full-body-'))
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
    // Group 137 is a dental row and is deliberately excluded from the skull region.
    SKULL_MIDLINE: [128, 129, 130, 131, 132, 133, 135],
    MANDIBLE_MIDLINE: [125],
    SACRUM_MIDLINE: [68],
    COCCYX_MIDLINE: [67],
    RIB_UNKNOWN: [82],
    PELVIS_UNKNOWN: [61],
  },
  back: {
    // Group 93 contains lower-face group 94. Its remaining child groups provide
    // a posterior skull region without retaining the unsafe mandible proxy.
    SKULL_MIDLINE: [98, 99, 100, 102],
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
    METACARPAL: { left: [217, 221, 222, 223, 224], right: [167, 168, 175, 188, 189, 191, 193] },
    HAND_PHALANX: { left: [204, 205, 206, 207, 208, 209, 210, 211, 212, 218, 219], right: [157, 158, 159, 160, 162, 165, 170, 171, 172, 173, 174, 190, 194, 195] },
    FEMUR: { left: [55], right: [59] },
    PATELLA: { left: [227], right: [228] },
    TIBIA: { left: [53], right: [226] },
    FIBULA: { left: [52], right: [225] },
    METATARSAL: { left: [10, 11, 12, 13, 14], right: [36, 37, 38, 39, 40] },
    FOOT_PHALANX: { left: [15], right: [41] },
  },
  back: {
    SCAPULA: { left: [136], right: [137] },
    HUMERUS: { left: [2], right: [47] },
    RADIUS: { left: [45], right: [49] },
    ULNA: { left: [44], right: [51] },
    FEMUR: { left: [84], right: [87] },
    // Patella is intentionally omitted: it is anterior and the posterior SVG
    // has no isolated patella shape. Mapping its parent would colour the femur.
    TIBIA: { left: [201], right: [205] },
    FIBULA: { left: [204], right: [208] },
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
  PELVIS_UNKNOWN: ['PELVIS_LEFT', 'PELVIS_RIGHT'],
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
