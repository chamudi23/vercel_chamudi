export function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

export const CONTROLLED_SIDE_VALUES = ['Left', 'Right', 'Midline', 'Unknown']

export const CONTROLLED_BONE_CATEGORIES = [
  { code: 'CRANIUM', label: 'Cranium', laterality: 'midline' },
  { code: 'MANDIBLE', label: 'Mandible', laterality: 'midline' },
  { code: 'HYOID', label: 'Hyoid', laterality: 'midline' },
  { code: 'CERVICAL_VERTEBRA', label: 'Cervical Vertebra', laterality: 'midline' },
  { code: 'THORACIC_VERTEBRA', label: 'Thoracic Vertebra', laterality: 'midline' },
  { code: 'LUMBAR_VERTEBRA', label: 'Lumbar Vertebra', laterality: 'midline' },
  { code: 'SACRUM', label: 'Sacrum', laterality: 'midline' },
  { code: 'COCCYX', label: 'Coccyx', laterality: 'midline' },
  { code: 'STERNUM', label: 'Sternum', laterality: 'midline' },
  { code: 'RIB', label: 'Rib', laterality: 'paired' },
  { code: 'CLAVICLE', label: 'Clavicle', laterality: 'paired' },
  { code: 'SCAPULA', label: 'Scapula', laterality: 'paired' },
  { code: 'HUMERUS', label: 'Humerus', laterality: 'paired' },
  { code: 'RADIUS', label: 'Radius', laterality: 'paired' },
  { code: 'ULNA', label: 'Ulna', laterality: 'paired' },
  { code: 'CARPAL', label: 'Carpal', laterality: 'paired' },
  { code: 'METACARPAL', label: 'Metacarpal', laterality: 'paired' },
  { code: 'HAND_PHALANX', label: 'Hand Phalanx', laterality: 'paired' },
  { code: 'OS_COXA', label: 'Os Coxa', laterality: 'paired' },
  { code: 'FEMUR', label: 'Femur', laterality: 'paired' },
  { code: 'PATELLA', label: 'Patella', laterality: 'paired' },
  { code: 'TIBIA', label: 'Tibia', laterality: 'paired' },
  { code: 'FIBULA', label: 'Fibula', laterality: 'paired' },
  { code: 'TALUS', label: 'Talus', laterality: 'paired' },
  { code: 'CALCANEUS', label: 'Calcaneus', laterality: 'paired' },
  { code: 'OTHER_TARSAL', label: 'Other Tarsal', laterality: 'paired' },
  { code: 'METATARSAL', label: 'Metatarsal', laterality: 'paired' },
  { code: 'FOOT_PHALANX', label: 'Foot Phalanx', laterality: 'paired' },
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
  ['mandible', 'MANDIBLE'],
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
  const normalizedSide = normalizeSide(side)
  const controlledSide = category.laterality === 'midline'
    ? 'Midline'
    : normalizedSide === 'Midline' ? 'Unknown' : normalizedSide
  return `${category.code}_${controlledSide.toUpperCase()}`
}

export function parseCategorySideKey(key) {
  const side = CONTROLLED_SIDE_VALUES.find((value) => key?.endsWith(`_${value.toUpperCase()}`))
  if (!side) return null
  const category = getCategoryByCode(key.slice(0, -(side.length + 1)))
  return category ? { category, side } : null
}

export function categorySides(category, includeUnknown = true) {
  const sides = category.laterality === 'midline' ? ['Midline'] : ['Left', 'Right']
  return includeUnknown ? [...sides, 'Unknown'] : sides
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

// These group indexes refer to unmodified source groups in the two attributed SVG files.
// Only groups that were visually checked against the source drawing are included.
export const SKELETON_SVG_GROUPS = {
  front: {
    CRANIUM_MIDLINE: [128, 129, 130, 131, 132, 133, 135, 137],
    MANDIBLE_MIDLINE: [125],
    HYOID_MIDLINE: [127],
    CERVICAL_VERTEBRA_MIDLINE: [117],
    LUMBAR_VERTEBRA_MIDLINE: [72],
    SACRUM_MIDLINE: [68],
    COCCYX_MIDLINE: [67],
    RIB_UNKNOWN: [82],
    CLAVICLE_LEFT: [142],
    CLAVICLE_RIGHT: [141],
    SCAPULA_LEFT: [64],
    SCAPULA_RIGHT: [65],
    HUMERUS_LEFT: [144],
    HUMERUS_RIGHT: [150],
    RADIUS_LEFT: [147],
    RADIUS_RIGHT: [154],
    ULNA_LEFT: [148],
    ULNA_RIGHT: [155],
    CARPAL_LEFT: [177],
    CARPAL_RIGHT: [197, 198, 199, 201, 213, 214, 215, 216, 220],
    METACARPAL_LEFT: [167, 168, 175, 188, 189, 191, 193],
    METACARPAL_RIGHT: [217, 221, 222, 223, 224],
    HAND_PHALANX_LEFT: [157, 158, 159, 160, 162, 165, 170, 171, 172, 173, 174, 190, 194, 195],
    HAND_PHALANX_RIGHT: [204, 205, 206, 207, 208, 209, 210, 211, 212, 218, 219],
    OS_COXA_UNKNOWN: [61],
    FEMUR_LEFT: [59],
    FEMUR_RIGHT: [55],
    PATELLA_LEFT: [228],
    PATELLA_RIGHT: [227],
    TIBIA_LEFT: [226],
    TIBIA_RIGHT: [53],
    FIBULA_LEFT: [225],
    FIBULA_RIGHT: [52],
    OTHER_TARSAL_LEFT: [30, 31, 32, 33, 34],
    OTHER_TARSAL_RIGHT: [4, 5, 6, 7, 8],
    METATARSAL_LEFT: [36, 37, 38, 39, 40],
    METATARSAL_RIGHT: [10, 11, 12, 13, 14],
    FOOT_PHALANX_LEFT: [41],
    FOOT_PHALANX_RIGHT: [15],
  },
  back: {
    CRANIUM_MIDLINE: [93],
    HUMERUS_LEFT: [47],
    HUMERUS_RIGHT: [2],
    RADIUS_LEFT: [49],
    RADIUS_RIGHT: [45],
    ULNA_LEFT: [51],
    ULNA_RIGHT: [44],
    FEMUR_LEFT: [87],
    FEMUR_RIGHT: [84],
    TIBIA_LEFT: [205],
    TIBIA_RIGHT: [201],
    FIBULA_LEFT: [208],
    FIBULA_RIGHT: [204],
  },
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
