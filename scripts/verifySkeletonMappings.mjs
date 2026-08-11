import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  SKELETON_ORIENTATION_MARKERS,
  SKELETON_SVG_GROUPS,
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
    HUMERUS_LEFT: [47], HUMERUS_RIGHT: [2],
    RADIUS_LEFT: [49], RADIUS_RIGHT: [45],
    ULNA_LEFT: [51], ULNA_RIGHT: [44],
    FEMUR_LEFT: [87], FEMUR_RIGHT: [84],
    TIBIA_LEFT: [205], TIBIA_RIGHT: [201],
    FIBULA_LEFT: [208], FIBULA_RIGHT: [204],
  },
}

assert.deepEqual(SKELETON_ORIENTATION_MARKERS.front, { left: 'R', right: 'L' })
assert.deepEqual(SKELETON_ORIENTATION_MARKERS.back, { left: 'L', right: 'R' })

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

console.log('Verified front/back mappings for Humerus, Radius, Ulna, Femur, Tibia, and Fibula.')
