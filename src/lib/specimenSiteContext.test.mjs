import test from 'node:test'
import assert from 'node:assert/strict'

import { resolveSpecimenSite, resolveSpecimenSiteContext } from './specimenSiteContext.js'

const site = {
  id: 'site-1',
  site_name: 'Potana Cave',
  district: 'Matale',
  province: 'Central',
  time_period: 'Prehistoric',
  latitude: '7.91',
  longitude: 80.71,
}

const specimen = (id, overrides = {}) => ({
  specimen_id: id,
  site_name: 'Potana Cave',
  district: 'Matale',
  province: 'Central',
  time_period: 'Prehistoric',
  ...overrides,
})

test('A: resolves one specimen with one unique valid site', () => {
  const result = resolveSpecimenSite(specimen('SPEC-001'), [site])
  assert.equal(result.status, 'resolved')
  assert.equal(result.site.latitude, 7.91)
})

test('B: collapses multiple specimens at the same canonical site', () => {
  const result = resolveSpecimenSiteContext([specimen('SPEC-001'), specimen('SPEC-002')], [site])
  assert.equal(result.status, 'resolved')
  assert.deepEqual(result.specimenIds, ['SPEC-001', 'SPEC-002'])
})

test('C: requires selection when specimens resolve to different sites', () => {
  const otherSite = { ...site, id: 'site-2', site_name: 'Other Site', latitude: 8.1 }
  const result = resolveSpecimenSiteContext([
    specimen('SPEC-001'),
    specimen('SPEC-002', { site_name: 'Other Site' }),
  ], [site, otherSite])
  assert.equal(result.status, 'multiple')
})

test('D: does not fuzzy-match an unmatched legacy site name', () => {
  const result = resolveSpecimenSite(specimen('SPEC-001', { site_name: 'Potana' }), [site])
  assert.deepEqual([result.status, result.reason], ['missing', 'unmatched'])
})

test('E: rejects duplicate canonical site names as ambiguous', () => {
  const result = resolveSpecimenSite(specimen('SPEC-001'), [site, { ...site, id: 'site-2' }])
  assert.equal(result.status, 'ambiguous')
})

test('F: reports a specimen without a site separately from an unmatched site', () => {
  const result = resolveSpecimenSite(specimen('SPEC-001', { site_name: '' }), [site])
  assert.deepEqual([result.status, result.reason], ['missing', 'no_site'])
})

test('G: rejects missing, non-finite, and out-of-range coordinates', () => {
  for (const invalidSite of [
    { ...site, latitude: null },
    { ...site, longitude: 'not-a-number' },
    { ...site, latitude: 91 },
  ]) {
    assert.equal(resolveSpecimenSite(specimen('SPEC-001'), [invalidSite]).status, 'no_coordinates')
  }
})

test('H/I: site resolution depends on linked specimens, not image presence', () => {
  const withoutImageState = resolveSpecimenSiteContext([specimen('SPEC-001')], [site])
  const withImageState = resolveSpecimenSiteContext([specimen('SPEC-001')], [site])
  assert.equal(withoutImageState.status, 'resolved')
  assert.deepEqual(withImageState, withoutImageState)
})

test('J: suppresses coordinates when specimen metadata conflicts', () => {
  const result = resolveSpecimenSite(specimen('SPEC-001', { district: 'Kandy' }), [site])
  assert.equal(result.status, 'conflict')
  assert.deepEqual(result.conflictingFields, ['district'])
  assert.equal('latitude' in result.site, false)
  assert.equal('longitude' in result.site, false)
})

