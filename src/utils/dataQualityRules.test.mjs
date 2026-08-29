import test from 'node:test'
import assert from 'node:assert/strict'
import { auditDataQuality } from './dataQualityRules.js'

function specimen(overrides = {}) {
  return {
    specimen_id: 'SPEC-001',
    skeleton_code: 'SK-001',
    bone_type: 'Femur',
    side: 'Left',
    site_name: 'Site A',
    ...overrides,
  }
}

function site(overrides = {}) {
  return {
    id: 1,
    site_id: 'SITE_001',
    site_name: 'Site A',
    time_period: 'Iron Age',
    ...overrides,
  }
}

test('the audit accepts specimen, measurement, and site data without skeletal inputs', () => {
  const result = auditDataQuality({ specimens: [specimen()], sites: [site()] })
  assert.equal(result.specimenAudits.length, 1)
  assert.equal(result.siteAudits.length, 1)
  assert.equal(result.allIssues.some((issue) => issue.fields.some((field) => field.includes('skeletal_inputs'))), false)
})

test('measurement values must be positive and retain a supported unit', () => {
  const result = auditDataQuality({
    specimens: [specimen()],
    sites: [site()],
    measurements: [{ specimen_id: 'SPEC-001', bone_type: 'Femur', measurement_type: 'Maximum Length', value: -2, unit: 'mm' }],
  })
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'MEASURE-007' && issue.status === 'error'))
})

test('same-skeleton context conflicts and unique bone-side duplicates are detected', () => {
  const result = auditDataQuality({
    specimens: [
      specimen({ specimen_id: 'SPEC-001', district: 'Kandy' }),
      specimen({ specimen_id: 'SPEC-002', district: 'Colombo' }),
    ],
    sites: [site()],
  })
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'SKELETON-DISTRICT'))
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'DUPLICATE-002'))
})

test('fragment-capable categories are exempt from bone-side duplicate checks', () => {
  const result = auditDataQuality({
    specimens: [
      specimen({ specimen_id: 'SPEC-001', bone_type: 'Rib' }),
      specimen({ specimen_id: 'SPEC-002', bone_type: 'Rib' }),
    ],
    sites: [site()],
  })
  assert.equal(result.allIssues.some((issue) => issue.ruleId === 'DUPLICATE-002'), false)
})

test('Sites coordinate and excavation-year rules are enforced', () => {
  const result = auditDataQuality({
    sites: [site({ latitude: 100, longitude: 80, excavation_year: 1700 })],
    currentYear: 2026,
  })
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'SITE-LOCATION-001'))
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'SITE-CONTEXT-001'))
})

test('specimen context is compared with the matching Sites record', () => {
  const result = auditDataQuality({
    specimens: [specimen({ district: 'Colombo', time_period: 'Medieval' })],
    sites: [site({ district: 'Kandy', time_period: 'Iron Age' })],
  })
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'SITE-CONTEXT-DISTRICT'))
  assert.ok(result.allIssues.some((issue) => issue.ruleId === 'SITE-CONTEXT-TIME_PERIOD'))
  assert.match(result.allIssues.find((issue) => issue.ruleId === 'SITE-CONTEXT-DISTRICT').message, /matching record in Sites/)
})

test('duplicate canonical site names are review warnings', () => {
  const result = auditDataQuality({
    sites: [site(), site({ id: 2, site_id: 'SITE_002', site_name: ' site a ' })],
  })
  const issue = result.allIssues.find((entry) => entry.ruleId === 'SITE-DUPLICATE-002')
  assert.equal(issue.status, 'warning')
  assert.equal(issue.severity, 'MEDIUM')
})
