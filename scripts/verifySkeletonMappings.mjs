import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  CONTROLLED_BONE_CATEGORIES,
  SKELETON_ORIENTATION_MARKERS,
  SKELETON_SCREEN_SIDE_GROUPS,
  SKELETON_SVG_GROUPS,
  screenSideForAnatomicalSide,
  skeletonViewsForMode,
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
    HUMERUS_LEFT: [2], HUMERUS_RIGHT: [47],
    RADIUS_LEFT: [45], RADIUS_RIGHT: [49],
    ULNA_LEFT: [44], ULNA_RIGHT: [51],
    FEMUR_LEFT: [84], FEMUR_RIGHT: [87],
    TIBIA_LEFT: [201], TIBIA_RIGHT: [205],
    FIBULA_LEFT: [204], FIBULA_RIGHT: [208],
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
