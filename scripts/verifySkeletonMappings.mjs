import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CONTROLLED_BONE_CATEGORIES,
  CONTROLLED_BONE_SECTIONS,
  CUSTOM_SKELETON_REGIONS,
  EXPECTED_CATEGORY_SIDE_KEYS,
  SKELETON_ORIENTATION_MARKERS,
  SKELETON_SCREEN_SIDE_GROUPS,
  SKELETON_SVG_GROUPS,
  categorySides,
  categorySideKey,
  getCategoryByCode,
  normalizeBoneCategory,
  resolveBoneCategory,
  screenSideForAnatomicalSide,
  skeletonStatusKeysForSvgKey,
  skeletonViewsForMode,
  supportsFullBodyMap,
  toggleBoneSelection,
} from '../src/utils/pp1ImageModule.js'

const expectedMappings = {
  front: {
    SKULL_MIDLINE: [128, 129, 130, 131, 132, 133, 135],
    MANDIBLE_MIDLINE: [125],
    TEETH_UNKNOWN: [137],
    VERTEBRAL_COLUMN_MIDLINE: [117, 70],
    SACRUM_MIDLINE: [68],
    COCCYX_MIDLINE: [67],
    RIB_UNKNOWN: [82],
    PELVIS_UNKNOWN: [61],
    HUMERUS_LEFT: [144], HUMERUS_RIGHT: [150],
    RADIUS_LEFT: [147], RADIUS_RIGHT: [154],
    ULNA_LEFT: [148], ULNA_RIGHT: [155],
    FEMUR_LEFT: [59], FEMUR_RIGHT: [55],
    TIBIA_LEFT: [226], TIBIA_RIGHT: [53],
    FIBULA_LEFT: [225], FIBULA_RIGHT: [52],
  },
  back: {
    SKULL_MIDLINE: [98, 99, 100, 102],
    VERTEBRAL_COLUMN_MIDLINE: [147],
    HUMERUS_LEFT: [2], HUMERUS_RIGHT: [47],
    RADIUS_LEFT: [45], RADIUS_RIGHT: [49],
    ULNA_LEFT: [44], ULNA_RIGHT: [51],
    FEMUR_LEFT: [84], FEMUR_RIGHT: [87],
    TIBIA_LEFT: [201], TIBIA_RIGHT: [205],
    FIBULA_LEFT: [204], FIBULA_RIGHT: [208],
    METATARSAL_LEFT: [229, 230, 231], METATARSAL_RIGHT: [217, 218, 219],
    FOOT_PHALANX_LEFT: [232], FOOT_PHALANX_RIGHT: [220],
  },
}

const unsupportedCanonicalCodes = [
  'MAXILLA',
  'OTHER',
]

assert.equal(CONTROLLED_BONE_CATEGORIES.length, 28)
assert.equal(new Set(CONTROLLED_BONE_CATEGORIES.map((category) => category.code)).size, 28)
assert.equal(new Set(CONTROLLED_BONE_CATEGORIES.map((category) => category.label)).size, 28)
assert.deepEqual([...new Set(CONTROLLED_BONE_CATEGORIES.map((category) => category.section))], CONTROLLED_BONE_SECTIONS)

assert.equal(normalizeBoneCategory('Cranium')?.code, 'SKULL')
assert.equal(normalizeBoneCategory('Skull')?.code, 'SKULL')
assert.equal(normalizeBoneCategory('Hand Phalanx')?.code, 'HAND_PHALANX')
assert.equal(normalizeBoneCategory('Foot Phalanx')?.code, 'FOOT_PHALANX')
assert.equal(normalizeBoneCategory('Os Coxa')?.code, 'PELVIS')
assert.equal(normalizeBoneCategory('Pelvis')?.code, 'PELVIS')
assert.equal(normalizeBoneCategory('Maxilla')?.code, 'MAXILLA')
assert.equal(normalizeBoneCategory('Maxilla (Left)')?.code, 'MAXILLA')
assert.equal(normalizeBoneCategory('Molar')?.code, 'MOLAR')
assert.equal(normalizeBoneCategory('Molar 1st (Upper)')?.code, 'MOLAR')
assert.equal(normalizeBoneCategory('Premolar')?.code, 'PREMOLAR')
assert.equal(normalizeBoneCategory('Incisor')?.code, 'INCISOR')
assert.equal(normalizeBoneCategory('Canine')?.code, 'CANINE')
assert.equal(normalizeBoneCategory('Tooth'), null)
assert.equal(normalizeBoneCategory('Teeth'), null)
assert.equal(resolveBoneCategory('Tooth').kind, 'ambiguous-legacy')
assert.equal(resolveBoneCategory('Teeth').kind, 'ambiguous-legacy')
assert.equal(resolveBoneCategory('Phalanx').kind, 'ambiguous-legacy')

for (const value of ['Cervical Vertebra', 'Thoracic Vertebra', 'Lumbar Vertebra']) {
  const resolution = resolveBoneCategory(value)
  assert.equal(resolution.kind, 'legacy-subtype')
  assert.equal(resolution.category?.code, 'VERTEBRA')
  assert.equal(resolution.rawValue, value)
}

for (const value of ['Hyoid', 'Carpal', 'Talus', 'Calcaneus', 'Other Tarsal']) {
  const resolution = resolveBoneCategory(value)
  assert.equal(resolution.kind, 'legacy-removed')
  assert.equal(resolution.category, null)
  assert.equal(resolution.rawValue, value)
}

assert.deepEqual(categorySides(getCategoryByCode('OTHER')), ['Unknown'])
assert.equal(categorySideKey('Other', 'Left'), 'OTHER_UNKNOWN')
assert.ok(EXPECTED_CATEGORY_SIDE_KEYS.includes('OTHER_UNKNOWN'))

for (const code of unsupportedCanonicalCodes) {
  const category = getCategoryByCode(code)
  assert.ok(category, `${code} must remain a valid canonical category`)
  assert.equal(supportsFullBodyMap(code), false, `${code} must be explicitly unsupported by the full-body map`)
  for (const side of categorySides(category, false)) {
    assert.ok(EXPECTED_CATEGORY_SIDE_KEYS.includes(categorySideKey(code, side)), `${code} must remain in coverage keys`)
  }
}

assert.deepEqual(SKELETON_ORIENTATION_MARKERS.front, { left: 'R', right: 'L' })
assert.deepEqual(SKELETON_ORIENTATION_MARKERS.back, { left: 'L', right: 'R' })
assert.equal(screenSideForAnatomicalSide('front', 'Left'), 'right')
assert.equal(screenSideForAnatomicalSide('front', 'Right'), 'left')
assert.equal(screenSideForAnatomicalSide('back', 'Left'), 'left')
assert.equal(screenSideForAnatomicalSide('back', 'Right'), 'right')
assert.equal(screenSideForAnatomicalSide('front', 'Midline'), null)
assert.equal(screenSideForAnatomicalSide('back', 'Unknown'), null)
assert.deepEqual(skeletonViewsForMode('Both'), ['front', 'back'])
assert.equal(categorySideKey('Mandible', 'Left'), 'MANDIBLE_MIDLINE')
assert.equal(categorySideKey('Cranium', 'Right'), 'SKULL_MIDLINE')
assert.equal(categorySideKey('Sternum', 'Left'), 'STERNUM_MIDLINE')
assert.equal(supportsFullBodyMap('STERNUM'), true, 'Sternum must be available on the front map')
assert.equal(CUSTOM_SKELETON_REGIONS.front.STERNUM_MIDLINE?.type, 'path')
assert.ok(CUSTOM_SKELETON_REGIONS.front.STERNUM_MIDLINE?.d, 'Sternum must define a front SVG overlay path')
assert.equal(CUSTOM_SKELETON_REGIONS.back.STERNUM_MIDLINE, undefined, 'Sternum must not have a posterior overlay')
assert.equal(categorySideKey('Pubis', 'Left'), 'PUBIS_LEFT')
assert.equal(categorySideKey('Pubis', 'Right'), 'PUBIS_RIGHT')
assert.equal(supportsFullBodyMap('PUBIS'), true, 'Pubis must be available on both full-body views')
for (const view of ['front', 'back']) {
  for (const side of ['Left', 'Right']) {
    const key = `PUBIS_${side.toUpperCase()}`
    assert.ok(EXPECTED_CATEGORY_SIDE_KEYS.includes(key), `${key} must remain a distinct status key`)
    assert.equal(CUSTOM_SKELETON_REGIONS[view][key]?.type, 'path', `${view} ${key} must use its custom SVG overlay`)
    assert.ok(CUSTOM_SKELETON_REGIONS[view][key]?.d, `${view} ${key} must define SVG path coordinates`)
    assert.equal(SKELETON_SVG_GROUPS[view][key], undefined, `${view} ${key} must not use an unsafe pelvic source group`)
  }
}
assert.notEqual(CUSTOM_SKELETON_REGIONS.front.PUBIS_LEFT.d, CUSTOM_SKELETON_REGIONS.front.PUBIS_RIGHT.d, 'front Pubis sides must remain visually distinct')
assert.notEqual(CUSTOM_SKELETON_REGIONS.back.PUBIS_LEFT.d, CUSTOM_SKELETON_REGIONS.back.PUBIS_RIGHT.d, 'back Pubis sides must remain visually distinct')
assert.equal(skeletonStatusKeysForSvgKey('PELVIS_UNKNOWN').includes('PUBIS_LEFT'), false, 'Pubis Left must not alias to the shared pelvis region')
assert.equal(skeletonStatusKeysForSvgKey('PELVIS_UNKNOWN').includes('PUBIS_RIGHT'), false, 'Pubis Right must not alias to the shared pelvis region')
assert.deepEqual(SKELETON_SVG_GROUPS.front.PELVIS_UNKNOWN, [61], 'existing shared Pelvis mapping must remain unchanged')
for (const code of ['INCISOR', 'CANINE', 'PREMOLAR', 'MOLAR']) {
  assert.equal(supportsFullBodyMap(code), true, `${code} must support the shared front teeth region`)
  assert.ok(EXPECTED_CATEGORY_SIDE_KEYS.includes(`${code}_LEFT`), `${code} Left must remain a distinct status key`)
  assert.ok(EXPECTED_CATEGORY_SIDE_KEYS.includes(`${code}_RIGHT`), `${code} Right must remain a distinct status key`)
}
assert.deepEqual(SKELETON_SVG_GROUPS.front.TEETH_UNKNOWN, [137])
assert.equal(SKELETON_SVG_GROUPS.back.TEETH_UNKNOWN, undefined, 'teeth must not have a posterior proxy')
for (const key of [
  'INCISOR_LEFT', 'INCISOR_RIGHT', 'INCISOR_UNKNOWN',
  'CANINE_LEFT', 'CANINE_RIGHT', 'CANINE_UNKNOWN',
  'PREMOLAR_LEFT', 'PREMOLAR_RIGHT', 'PREMOLAR_UNKNOWN',
  'MOLAR_LEFT', 'MOLAR_RIGHT', 'MOLAR_UNKNOWN',
]) {
  assert.ok(skeletonStatusKeysForSvgKey('TEETH_UNKNOWN').includes(key), `${key} must alias to the shared teeth visual region`)
}
assert.equal(supportsFullBodyMap('VERTEBRA'), true, 'Vertebra must be available on the full-body map')
assert.deepEqual(SKELETON_SVG_GROUPS.front.VERTEBRAL_COLUMN_MIDLINE, [117, 70])
assert.deepEqual(SKELETON_SVG_GROUPS.back.VERTEBRAL_COLUMN_MIDLINE, [147])
assert.ok(skeletonStatusKeysForSvgKey('VERTEBRAL_COLUMN_MIDLINE').includes('VERTEBRA_MIDLINE'))
assert.ok(skeletonStatusKeysForSvgKey('RIB_UNKNOWN').includes('RIB_LEFT'))
assert.ok(skeletonStatusKeysForSvgKey('PELVIS_UNKNOWN').includes('PELVIS_RIGHT'))

for (const category of ['SKULL_MIDLINE', 'METATARSAL_LEFT', 'METATARSAL_RIGHT', 'FOOT_PHALANX_LEFT', 'FOOT_PHALANX_RIGHT']) {
  assert.ok(SKELETON_SVG_GROUPS.back[category]?.length, `${category} must be visible in the back view`)
}
assert.equal(SKELETON_SVG_GROUPS.back.MANDIBLE_MIDLINE, undefined, 'posterior lower-face proxy must not be used for Mandible')
assert.equal(SKELETON_SVG_GROUPS.back.PATELLA_LEFT, undefined, 'posterior SVG must not colour the femur as a patella proxy')
assert.equal(SKELETON_SVG_GROUPS.back.PATELLA_RIGHT, undefined, 'posterior SVG must not colour the femur as a patella proxy')
assert.equal(SKELETON_SVG_GROUPS.front.STERNUM_MIDLINE, undefined, 'Sternum must not use an unsafe source SVG group')
assert.equal(SKELETON_SVG_GROUPS.back.STERNUM_MIDLINE, undefined, 'posterior SVG must not use a sternum proxy')
assert.equal(SKELETON_SVG_GROUPS.front.HYOID_MIDLINE, undefined, 'suspect anterior Hyoid group must not be used')
for (const view of ['front', 'back']) {
  for (const prefix of ['TALUS_', 'CALCANEUS_', 'OTHER_TARSAL_', 'CARPAL_', 'STERNUM_', 'PUBIS_', 'OTHER_']) {
    assert.equal(Object.keys(SKELETON_SVG_GROUPS[view]).some((key) => key.startsWith(prefix)), false, `${view} must not map ${prefix}`)
  }
}
assert.equal(toggleBoneSelection('', 'PATELLA_LEFT'), 'PATELLA_LEFT')
assert.equal(toggleBoneSelection('PATELLA_LEFT', 'PATELLA_LEFT'), '')
assert.equal(toggleBoneSelection('PATELLA_LEFT', ''), '')

for (const view of ['front', 'back']) {
  for (const side of ['Left', 'Right']) {
    const screenSide = screenSideForAnatomicalSide(view, side)
    assert.equal(SKELETON_ORIENTATION_MARKERS[view][screenSide], side[0], `${view} ${side} must highlight beside its visible ${side[0]} marker`)
  }
}

for (const view of ['front', 'back']) {
  for (const category of CONTROLLED_BONE_CATEGORIES.filter((item) => item.laterality === 'paired')) {
    const screenGroups = SKELETON_SCREEN_SIDE_GROUPS[view][category.code]
    const leftGroups = SKELETON_SVG_GROUPS[view][`${category.code}_LEFT`]
    const rightGroups = SKELETON_SVG_GROUPS[view][`${category.code}_RIGHT`]
    assert.equal(Boolean(leftGroups), Boolean(rightGroups), `${view} ${category.label} must map both anatomical sides or neither`)
    if (!screenGroups) continue
    assert.deepEqual(leftGroups, screenGroups[screenSideForAnatomicalSide(view, 'Left')], `${view} ${category.label} Left uses the wrong screen side`)
    assert.deepEqual(rightGroups, screenGroups[screenSideForAnatomicalSide(view, 'Right')], `${view} ${category.label} Right uses the wrong screen side`)
    assert.equal(SKELETON_SVG_GROUPS[view][`${category.code}_UNKNOWN`], undefined, `${view} ${category.label} Unknown must not map to one side`)
  }
}

for (const [view, mappings] of Object.entries(expectedMappings)) {
  const source = await readFile(`public/assets/skeleton/human-skeleton-${view}.svg`, 'utf8')
  const groupCount = [...source.matchAll(/<g(?:\s|>)/g)].length

  for (const [key, indexes] of Object.entries(SKELETON_SVG_GROUPS[view])) {
    if (key === 'TEETH_UNKNOWN' || key === 'VERTEBRAL_COLUMN_MIDLINE') {
      assert.deepEqual(indexes, expectedMappings[view][key], `${key} must remain mapped to its verified SVG groups`)
      continue
    }
    const parsedCode = key.slice(0, key.lastIndexOf('_'))
    const mappedCategory = getCategoryByCode(parsedCode)
    assert.ok(mappedCategory, `${view} ${key} must reference a canonical category`)
    assert.equal(supportsFullBodyMap(mappedCategory.code), true, `${view} ${key} must be declared full-body supported`)
    indexes.forEach((index) => {
      assert.ok(index >= 0 && index < groupCount, `${view} ${key} points outside the source SVG`)
    })

    if (key.endsWith('_LEFT')) {
      const rightKey = key.replace(/_LEFT$/, '_RIGHT')
      assert.ok(SKELETON_SVG_GROUPS[view][rightKey], `${view} ${key} has no matching right-side mapping`)
    }
    if (key.endsWith('_RIGHT')) {
      const leftKey = key.replace(/_RIGHT$/, '_LEFT')
      assert.ok(SKELETON_SVG_GROUPS[view][leftKey], `${view} ${key} has no matching left-side mapping`)
    }
  }

  for (const [key, expectedIndexes] of Object.entries(mappings)) {
    assert.deepEqual(SKELETON_SVG_GROUPS[view][key], expectedIndexes, `${view} ${key} mapping changed`)
  }
}

console.log('Verified 28 canonical categories, legacy compatibility, and safe front/back mappings including shared teeth and vertebra regions.')
