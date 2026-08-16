import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CONTROLLED_BONE_CATEGORIES,
  SKELETON_ORIENTATION_MARKERS,
  SKELETON_SCREEN_SIDE_GROUPS,
  SKELETON_SVG_GROUPS,
  categorySideKey,
  normalizeBoneCategory,
  screenSideForAnatomicalSide,
  skeletonStatusKeysForSvgKey,
  skeletonViewsForMode,
  toggleBoneSelection,
} from '../src/utils/pp1ImageModule.js'

const expectedMappings = {
  front: {
    HUMERUS_LEFT: [144], HUMERUS_RIGHT: [150],
    RADIUS_LEFT: [147], RADIUS_RIGHT: [154],
    ULNA_LEFT: [148], ULNA_RIGHT: [155],
    FEMUR_LEFT: [59], FEMUR_RIGHT: [55],
    TIBIA_LEFT: [226], TIBIA_RIGHT: [53],
    FIBULA_LEFT: [225], FIBULA_RIGHT: [52],
  },
  back: {
    MANDIBLE_MIDLINE: [94],
    HUMERUS_LEFT: [2], HUMERUS_RIGHT: [47],
    RADIUS_LEFT: [45], RADIUS_RIGHT: [49],
    ULNA_LEFT: [44], ULNA_RIGHT: [51],
    FEMUR_LEFT: [84], FEMUR_RIGHT: [87],
    TIBIA_LEFT: [201], TIBIA_RIGHT: [205],
    FIBULA_LEFT: [204], FIBULA_RIGHT: [208],
    OTHER_TARSAL_LEFT: [222, 223, 224, 225, 226, 227],
    OTHER_TARSAL_RIGHT: [210, 211, 212, 213, 214, 215],
    METATARSAL_LEFT: [229, 230, 231], METATARSAL_RIGHT: [217, 218, 219],
    FOOT_PHALANX_LEFT: [232], FOOT_PHALANX_RIGHT: [220],
  },
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
assert.equal(categorySideKey('Cranium', 'Right'), 'CRANIUM_MIDLINE')
assert.equal(normalizeBoneCategory('Maxilla')?.code, 'CRANIUM')
assert.equal(normalizeBoneCategory('Molar')?.code, 'MANDIBLE')
assert.equal(normalizeBoneCategory('Premolar')?.code, 'MANDIBLE')
assert.equal(normalizeBoneCategory('Phalanx')?.code, 'FOOT_PHALANX')
assert.ok(skeletonStatusKeysForSvgKey('OTHER_TARSAL_RIGHT').includes('TALUS_RIGHT'))
assert.ok(skeletonStatusKeysForSvgKey('OTHER_TARSAL_RIGHT').includes('CALCANEUS_RIGHT'))
assert.ok(skeletonStatusKeysForSvgKey('RIB_UNKNOWN').includes('RIB_LEFT'))
assert.ok(skeletonStatusKeysForSvgKey('OS_COXA_UNKNOWN').includes('OS_COXA_RIGHT'))

for (const category of ['MANDIBLE_MIDLINE', 'OTHER_TARSAL_LEFT', 'OTHER_TARSAL_RIGHT', 'METATARSAL_LEFT', 'METATARSAL_RIGHT', 'FOOT_PHALANX_LEFT', 'FOOT_PHALANX_RIGHT']) {
  assert.ok(SKELETON_SVG_GROUPS.back[category]?.length, `${category} must be visible in the back view`)
}
assert.equal(SKELETON_SVG_GROUPS.back.PATELLA_LEFT, undefined, 'posterior SVG must not colour the femur as a patella proxy')
assert.equal(SKELETON_SVG_GROUPS.back.PATELLA_RIGHT, undefined, 'posterior SVG must not colour the femur as a patella proxy')
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

console.log('Verified anatomical front/back and both-view mappings for every mapped paired category.')
