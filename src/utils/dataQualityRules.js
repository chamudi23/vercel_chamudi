import {
  PP1_BONE_LABELS,
  categorySideKey,
  isMeasurementBoneCompatible,
  normalize,
  normalizeBoneCategory,
  validateCategorySide,
} from './pp1ImageModule.js'
import { DISTRICTS, PRESERVATION_STATES, PROVINCES, TIME_PERIODS } from './specimenMetadata.js'

export const QUALITY_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']

// Rule categories group related failures for filtering and explainable scoring.
// Every triggered rule subtracts a fixed severity penalty from its category.
export const QUALITY_CATEGORIES = [
  'Structural / Required Data Quality',
  'Anatomical Consistency',
  'Measurement Quality',
  'Cross-Specimen / Skeleton Consistency',
  'Archaeological Context Consistency',
  'Completeness',
  'Duplicate Detection',
]

export const MEASUREMENT_TYPES = [
  'Maximum Length', 'Minimum Length', 'Maximum Width', 'Minimum Width',
  'Maximum Diameter', 'Minimum Diameter', 'Circumference', 'Height',
  'Depth', 'Thickness', 'Other',
]
export const MEASUREMENT_UNITS = ['mm', 'cm', 'm']

// Site rule catalogue
// These controlled values match the form that writes records to `sites`.
export const SITE_TIME_PERIODS = [
  'Upper Paleolithic', 'Mesolithic', 'Prehistoric', 'Iron Age',
  'Early Historic', 'Classical Period', 'Medieval',
]
export const SITE_TYPES = [
  'Burial Ground', 'Cave Site', 'Ancient City', 'Rock Shelter',
  'Religious Site', 'Rock Fortress', 'Cave Temple', 'Ancient Port',
  'Habitation Site',
]
export const SITE_RISK_LEVELS = ['High', 'Medium', 'Low']
export const SITE_PROTECTED_STATUSES = ['Protected', 'Not Protected', 'Unknown']

const MEASUREMENT_TYPE_SET = new Set(MEASUREMENT_TYPES)
const MEASUREMENT_UNIT_SET = new Set(MEASUREMENT_UNITS)
const SPECIMEN_TIME_PERIOD_SET = new Set([...TIME_PERIODS, ...SITE_TIME_PERIODS])
const INVALID_SEVERITIES = new Set(['CRITICAL', 'HIGH'])
const SEVERITY_PENALTIES = { CRITICAL: 25, HIGH: 15, MEDIUM: 7, LOW: 3, INFO: 1 }
const SKELETON_CONTEXT_FIELDS = [
  ['site_name', 'Site name'], ['district', 'District'], ['province', 'Province'],
  ['excavation_year', 'Excavation year'], ['time_period', 'Time period'],
]
const SITE_CONTEXT_FIELDS = [
  ['district', 'District'], ['province', 'Province'],
  ['excavation_year', 'Excavation year'], ['time_period', 'Time period'],
]
const DIMENSION_FIELDS = [
  ['length_cm', 'Bone length'], ['width_cm', 'Bone width'], ['thickness_cm', 'Bone thickness'],
]
const TRACKED_SPECIMEN_FIELDS = [
  'site_name', 'district', 'province', 'excavation_year', 'time_period',
  'preservation_state', 'location_stored', 'burial_context', 'notes',
]
const TRACKED_SITE_FIELDS = [
  'site_id', 'site_name', 'district', 'province', 'latitude', 'longitude',
  'site_type', 'excavation_year', 'time_period', 'risk_level', 'description',
  'protected_status', 'image_url',
]

function isProvided(value) {
  return value !== null && value !== undefined && String(value).trim() !== ''
}

function displayValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  return isProvided(value) ? String(value) : 'Not recorded'
}

function normalizedDistinct(records, field) {
  return [...new Map(records
    .filter((record) => isProvided(record[field]))
    .map((record) => [normalize(record[field]), record[field]])).values()]
}

function recordStatus(issues) {
  if (issues.some((issue) => issue.status === 'error')) return 'error'
  return issues.length ? 'warning' : 'valid'
}

export function createQualityIssue({
  ruleId, ruleName, category, severity, message, expectedValue = '', actualValue = '',
  recommendation, specimen, site, fields = [], kind = 'invalid',
}) {
  const recordType = site ? 'site' : 'specimen'
  return {
    ruleId,
    ruleName,
    category,
    severity,
    status: kind === 'invalid' && INVALID_SEVERITIES.has(severity) ? 'error' : 'warning',
    kind,
    message,
    expectedValue: displayValue(expectedValue),
    actualValue: displayValue(actualValue),
    recommendation,
    recordType,
    recordId: site?.site_id || site?.id || specimen?.specimen_id || '',
    specimenId: specimen?.specimen_id || '',
    skeletonCode: specimen?.skeleton_code || '',
    siteId: site?.site_id || site?.id || '',
    fields,
    field: fields[0] || ruleName,
  }
}

function calculateCategoryScores(issues) {
  return Object.fromEntries(QUALITY_CATEGORIES.map((category) => {
    const penalty = issues
      .filter((issue) => issue.category === category)
      .reduce((sum, issue) => sum + SEVERITY_PENALTIES[issue.severity], 0)
    return [category, Math.max(0, 100 - penalty)]
  }))
}

function buildRecordCounts(audits) {
  return audits.reduce(
    (counts, audit) => ({ ...counts, [audit.status]: counts[audit.status] + 1 }),
    { valid: 0, warning: 0, error: 0 },
  )
}

// Site record rules
// Checks required identity, controlled classifications, coordinates, dates,
// duplicates, and completeness using fields stored in `sites`.
function auditSites(sites, currentYear) {
  const siteIdCounts = new Map()
  const siteNameCounts = new Map()
  sites.forEach((site) => {
    const id = normalize(site.site_id)
    const name = normalize(site.site_name)
    if (id) siteIdCounts.set(id, (siteIdCounts.get(id) || 0) + 1)
    if (name) siteNameCounts.set(name, (siteNameCounts.get(name) || 0) + 1)
  })

  return sites.map((site) => {
    const issues = []
    const issue = (config) => issues.push(createQualityIssue({ ...config, site }))
    const latitude = Number(site.latitude)
    const longitude = Number(site.longitude)
    const hasLatitude = isProvided(site.latitude)
    const hasLongitude = isProvided(site.longitude)

    if (!isProvided(site.site_id)) issue({ ruleId: 'SITE-STRUCT-001', ruleName: 'Missing site ID', category: 'Structural / Required Data Quality', severity: 'CRITICAL', fields: ['site_id'], message: 'Site ID is missing.', expectedValue: 'A generated SITE_### identifier', actualValue: site.site_id, recommendation: 'Assign the site identifier through the Site form.' })
    if (!isProvided(site.site_name)) issue({ ruleId: 'SITE-STRUCT-002', ruleName: 'Missing site name', category: 'Structural / Required Data Quality', severity: 'HIGH', fields: ['site_name'], message: 'The Sites record has no site name.', expectedValue: 'A non-empty site name', actualValue: site.site_name, recommendation: 'Record the archaeological site name.' })
    if (!SITE_TIME_PERIODS.includes(site.time_period)) issue({ ruleId: 'SITE-STRUCT-003', ruleName: 'Invalid site time period', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['time_period'], message: 'The Sites record has no valid time period.', expectedValue: SITE_TIME_PERIODS, actualValue: site.time_period, recommendation: 'Select the appropriate time period in the Sites record.' })

    if (hasLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) issue({ ruleId: 'SITE-LOCATION-001', ruleName: 'Invalid latitude', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['latitude'], message: 'Latitude must be between -90 and 90.', expectedValue: '-90 to 90', actualValue: site.latitude, recommendation: 'Verify the coordinate and hemisphere sign.' })
    if (hasLongitude && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) issue({ ruleId: 'SITE-LOCATION-002', ruleName: 'Invalid longitude', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['longitude'], message: 'Longitude must be between -180 and 180.', expectedValue: '-180 to 180', actualValue: site.longitude, recommendation: 'Verify the coordinate and hemisphere sign.' })
    if (hasLatitude !== hasLongitude) issue({ ruleId: 'SITE-LOCATION-003', ruleName: 'Incomplete coordinate pair', category: 'Completeness', severity: 'MEDIUM', kind: 'review', fields: ['latitude', 'longitude'], message: 'Only one coordinate in the latitude/longitude pair is recorded.', expectedValue: 'Both coordinates or neither coordinate', actualValue: `Latitude: ${displayValue(site.latitude)}; Longitude: ${displayValue(site.longitude)}`, recommendation: 'Complete the coordinate pair from the source record.' })

    if (isProvided(site.excavation_year)) {
      const year = Number(site.excavation_year)
      if (!Number.isInteger(year) || year < 1800 || year > currentYear) issue({ ruleId: 'SITE-CONTEXT-001', ruleName: 'Invalid site excavation year', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['excavation_year'], message: `The excavation year in Sites must be between 1800 and ${currentYear}.`, expectedValue: `1800–${currentYear}`, actualValue: site.excavation_year, recommendation: 'Verify the year against the site excavation record.' })
    }

    [
      ['district', 'District', DISTRICTS], ['province', 'Province', PROVINCES],
      ['site_type', 'Site type', SITE_TYPES], ['risk_level', 'Risk level', SITE_RISK_LEVELS],
      ['protected_status', 'Protected status', SITE_PROTECTED_STATUSES],
    ].forEach(([field, label, options]) => {
      if (isProvided(site[field]) && !options.includes(site[field])) issue({ ruleId: `SITE-OPTION-${field.toUpperCase()}`, ruleName: `Invalid ${label.toLowerCase()}`, category: 'Structural / Required Data Quality', severity: 'HIGH', fields: [field], message: `${label} is outside the valid Sites options.`, expectedValue: options, actualValue: site[field], recommendation: `Review the ${label.toLowerCase()} in the Sites record.` })
    })

    if ((siteIdCounts.get(normalize(site.site_id)) || 0) > 1) issue({ ruleId: 'SITE-DUPLICATE-001', ruleName: 'Duplicate site ID', category: 'Duplicate Detection', severity: 'CRITICAL', fields: ['site_id'], message: 'The generated site ID occurs more than once.', expectedValue: 'One site per site ID', actualValue: `${siteIdCounts.get(normalize(site.site_id))} records`, recommendation: 'Resolve the duplicate identifier without deleting legitimate site data.' })
    if ((siteNameCounts.get(normalize(site.site_name)) || 0) > 1) issue({ ruleId: 'SITE-DUPLICATE-002', ruleName: 'Possible duplicate site name', category: 'Duplicate Detection', severity: 'MEDIUM', kind: 'review', fields: ['site_name'], message: 'Multiple site records use the same normalized site name.', expectedValue: 'A deliberate unique record or documented aliases', actualValue: `${siteNameCounts.get(normalize(site.site_name))} records named ${site.site_name}`, recommendation: 'Confirm whether these are duplicates, aliases, or distinct archaeological contexts.' })

    const missing = TRACKED_SITE_FIELDS.filter((field) => !isProvided(site[field]))
    if (missing.length) issue({ ruleId: 'SITE-COMPLETE-001', ruleName: 'Incomplete site details', category: 'Completeness', severity: missing.length >= 7 ? 'MEDIUM' : 'LOW', kind: 'review', fields: missing, message: `${missing.length} field${missing.length === 1 ? ' is' : 's are'} missing from this Sites record.`, expectedValue: 'Available location, classification, context, risk, description, and image details', actualValue: missing, recommendation: 'Complete fields supported by the site documentation; genuinely unknown values may remain empty.' })

    return { site, status: recordStatus(issues), issues }
  })
}

export function auditDataQuality({ specimens = [], measurements = [], sites = [], currentYear = new Date().getFullYear() }) {
  const specimenById = new Map(specimens.map((specimen) => [specimen.specimen_id, specimen]))
  const measurementsBySpecimen = new Map()
  measurements.forEach((row) => measurementsBySpecimen.set(row.specimen_id, [...(measurementsBySpecimen.get(row.specimen_id) || []), row]))

  const idCounts = new Map()
  const skeletonGroups = new Map()
  const duplicateBoneKeys = new Map()
  specimens.forEach((specimen) => {
    idCounts.set(specimen.specimen_id, (idCounts.get(specimen.specimen_id) || 0) + 1)
    const skeletonKey = normalize(specimen.skeleton_code)
    if (skeletonKey) skeletonGroups.set(skeletonKey, [...(skeletonGroups.get(skeletonKey) || []), specimen])
    const category = normalizeBoneCategory(specimen.bone_type)
    if (category?.uniquePerSide && skeletonKey) {
      const key = `${skeletonKey}|${categorySideKey(category.code, specimen.side)}`
      duplicateBoneKeys.set(key, (duplicateBoneKeys.get(key) || 0) + 1)
    }
  })

  const siteAudits = auditSites(sites, currentYear)
  const sitesByName = new Map()
  sites.forEach((site) => {
    const key = normalize(site.site_name)
    if (key) sitesByName.set(key, [...(sitesByName.get(key) || []), site])
  })

  // Specimen structural and anatomical rules
  // Checks required identifiers, controlled options, laterality, measurements,
  // duplicates, and consistency between records sharing a skeleton code.
  const specimenAudits = specimens.map((specimen) => {
    const issues = []
    const issue = (config) => issues.push(createQualityIssue({ ...config, specimen }))
    const category = normalizeBoneCategory(specimen.bone_type)

    if (!isProvided(specimen.specimen_id)) issue({ ruleId: 'STRUCT-001', ruleName: 'Missing specimen ID', category: 'Structural / Required Data Quality', severity: 'CRITICAL', fields: ['specimen_id'], message: 'Specimen ID is required.', expectedValue: 'A unique specimen identifier', actualValue: specimen.specimen_id, recommendation: 'Assign a unique specimen ID.' })
    if (!isProvided(specimen.skeleton_code)) issue({ ruleId: 'STRUCT-002', ruleName: 'Missing skeleton code', category: 'Structural / Required Data Quality', severity: 'HIGH', fields: ['skeleton_code'], message: 'Skeleton code is required for cross-specimen checks.', expectedValue: 'A skeleton code', actualValue: specimen.skeleton_code, recommendation: 'Link the specimen to its archaeological skeleton.' })
    if (!isProvided(specimen.bone_type)) issue({ ruleId: 'STRUCT-003', ruleName: 'Missing bone category', category: 'Structural / Required Data Quality', severity: 'HIGH', fields: ['bone_type'], message: 'Bone category is required.', expectedValue: 'A controlled bone category', actualValue: specimen.bone_type, recommendation: 'Select the bone category or Other when appropriate.' })
    else if (!PP1_BONE_LABELS.includes(specimen.bone_type)) issue({ ruleId: 'ANATOMY-001', ruleName: 'Invalid bone category', category: 'Anatomical Consistency', severity: 'HIGH', fields: ['bone_type'], message: `Bone category "${specimen.bone_type}" is outside the controlled catalogue.`, expectedValue: 'A controlled bone category', actualValue: specimen.bone_type, recommendation: 'Select the matching canonical bone category.' })

    if (isProvided(specimen.bone_type)) {
      const sideError = validateCategorySide(specimen.bone_type, specimen.side)
      if (sideError) issue({ ruleId: 'SIDE-001', ruleName: 'Bone laterality inconsistency', category: 'Anatomical Consistency', severity: 'HIGH', fields: ['bone_type', 'side'], message: sideError, expectedValue: category?.laterality === 'midline' ? 'Midline' : 'Left, Right, or Unknown', actualValue: specimen.side, recommendation: 'Correct the side to match the anatomical category.' })
    }

    [
      ['district', 'District', DISTRICTS], ['province', 'Province', PROVINCES],
      ['preservation_state', 'Preservation state', PRESERVATION_STATES],
    ].forEach(([field, label, options]) => {
      if (isProvided(specimen[field]) && !options.includes(specimen[field])) issue({ ruleId: `STRUCT-OPTION-${field.toUpperCase()}`, ruleName: `Invalid ${label.toLowerCase()}`, category: 'Structural / Required Data Quality', severity: 'HIGH', fields: [field], message: `${label} is outside the controlled options.`, expectedValue: options, actualValue: specimen[field], recommendation: `Select a valid ${label.toLowerCase()}.` })
    })
    if (isProvided(specimen.time_period) && !SPECIMEN_TIME_PERIOD_SET.has(specimen.time_period)) issue({ ruleId: 'STRUCT-OPTION-TIME_PERIOD', ruleName: 'Invalid time period', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['time_period'], message: 'Specimen time period is outside the supported specimen and Sites options.', expectedValue: [...SPECIMEN_TIME_PERIOD_SET], actualValue: specimen.time_period, recommendation: 'Review the period against the matching record in Sites.' })

    if (isProvided(specimen.excavation_year)) {
      const year = Number(specimen.excavation_year)
      if (!Number.isInteger(year) || year <= 0 || year > currentYear) issue({ ruleId: 'CONTEXT-001', ruleName: 'Invalid excavation year', category: 'Archaeological Context Consistency', severity: 'HIGH', fields: ['excavation_year'], message: 'Excavation year must be a positive whole year that is not in the future.', expectedValue: `1–${currentYear}`, actualValue: specimen.excavation_year, recommendation: 'Verify the excavation year.' })
      else if (year < 1800) issue({ ruleId: 'CONTEXT-002', ruleName: 'Early excavation year', category: 'Archaeological Context Consistency', severity: 'LOW', kind: 'review', fields: ['excavation_year'], message: 'Excavation year is earlier than the existing 1800 review threshold.', expectedValue: `1800–${currentYear} (QA review range)`, actualValue: year, recommendation: 'Verify and retain the year if supported by documentation.' })
    }

    DIMENSION_FIELDS.forEach(([field, label]) => {
      if (!isProvided(specimen[field])) return
      const value = Number(specimen[field])
      if (!Number.isFinite(value) || value <= 0) issue({ ruleId: 'MEASURE-001', ruleName: `Invalid ${label.toLowerCase()}`, category: 'Measurement Quality', severity: 'HIGH', fields: [field], message: `${label} must be greater than zero.`, expectedValue: 'A positive number in cm', actualValue: specimen[field], recommendation: 'Correct the value or remove it if no measurement was taken.' })
      else if (value > 300) issue({ ruleId: 'MEASURE-002', ruleName: `Extreme ${label.toLowerCase()}`, category: 'Measurement Quality', severity: 'MEDIUM', kind: 'review', fields: [field], message: `${label} exceeds the existing conservative 300 cm threshold.`, expectedValue: 'At most 300 cm (QA heuristic)', actualValue: `${value} cm`, recommendation: 'Verify the decimal placement and source unit.' })
    })
    if (isProvided(specimen.height_estimate) && (!Number.isFinite(Number(specimen.height_estimate)) || Number(specimen.height_estimate) <= 0)) issue({ ruleId: 'MEASURE-012', ruleName: 'Invalid height estimate', category: 'Measurement Quality', severity: 'HIGH', fields: ['height_estimate'], message: 'Height estimate must be greater than zero.', expectedValue: 'A positive number in cm', actualValue: specimen.height_estimate, recommendation: 'Correct or remove the invalid height estimate.' })

    if ((idCounts.get(specimen.specimen_id) || 0) > 1) issue({ ruleId: 'DUPLICATE-001', ruleName: 'Duplicate specimen ID', category: 'Duplicate Detection', severity: 'CRITICAL', fields: ['specimen_id'], message: 'The same specimen ID occurs more than once.', expectedValue: 'One record per specimen ID', actualValue: `${idCounts.get(specimen.specimen_id)} records`, recommendation: 'Resolve duplicate identifiers without deleting legitimate records.' })
    if (category?.uniquePerSide) {
      const key = `${normalize(specimen.skeleton_code)}|${categorySideKey(category.code, specimen.side)}`
      if ((duplicateBoneKeys.get(key) || 0) > 1) issue({ ruleId: 'DUPLICATE-002', ruleName: 'Possible duplicate bone and side', category: 'Duplicate Detection', severity: 'HIGH', fields: ['skeleton_code', 'bone_type', 'side'], message: `${specimen.side} ${category.label} occurs more than once for this skeleton.`, expectedValue: 'One record for this unique bone/side combination', actualValue: `${duplicateBoneKeys.get(key)} matching records`, recommendation: 'Confirm whether this is a duplicate; fragment-capable categories remain exempt.' })
    }

    const skeletonPeers = skeletonGroups.get(normalize(specimen.skeleton_code)) || []
    SKELETON_CONTEXT_FIELDS.forEach(([field, label]) => {
      const distinct = normalizedDistinct(skeletonPeers, field)
      if (distinct.length > 1) issue({ ruleId: `SKELETON-${field.toUpperCase()}`, ruleName: `Skeleton ${label.toLowerCase()} conflict`, category: 'Cross-Specimen / Skeleton Consistency', severity: 'HIGH', kind: 'review', fields: ['skeleton_code', field], message: `Specimens sharing skeleton ${specimen.skeleton_code} have different ${label.toLowerCase()} values.`, expectedValue: 'One consistent non-empty value per skeleton', actualValue: distinct, recommendation: 'Reconcile the skeleton context only from source documentation.' })
    })

    // Specimen-to-site consistency rules
    // A specimen is matched to `sites` by normalized site name. Non-empty
    // district, province, excavation year, and period values must then agree.
    const siteMatches = sitesByName.get(normalize(specimen.site_name)) || []
    if (isProvided(specimen.site_name) && siteMatches.length === 0) issue({ ruleId: 'SITE-LINK-001', ruleName: 'Specimen site not found', category: 'Archaeological Context Consistency', severity: 'MEDIUM', kind: 'review', fields: ['site_name'], message: 'Specimen site name does not match any record in Sites.', expectedValue: 'A matching site name in Sites', actualValue: specimen.site_name, recommendation: 'Confirm the specimen site name or create the missing Sites record.' })
    if (siteMatches.length > 1) issue({ ruleId: 'SITE-LINK-002', ruleName: 'Ambiguous specimen site', category: 'Archaeological Context Consistency', severity: 'MEDIUM', kind: 'review', fields: ['site_name'], message: 'More than one record in Sites has this site name.', expectedValue: 'One unambiguous Sites record', actualValue: `${siteMatches.length} matching Sites records`, recommendation: 'Resolve duplicate site names before relying on copied context.' })
    if (siteMatches.length === 1) {
      const canonicalSite = siteMatches[0]
      SITE_CONTEXT_FIELDS.forEach(([field, label]) => {
        if (isProvided(specimen[field]) && isProvided(canonicalSite[field]) && normalize(specimen[field]) !== normalize(canonicalSite[field])) issue({ ruleId: `SITE-CONTEXT-${field.toUpperCase()}`, ruleName: `Specimen/site ${label.toLowerCase()} conflict`, category: 'Archaeological Context Consistency', severity: 'HIGH', kind: 'review', fields: ['site_name', field], message: `Specimen ${label.toLowerCase()} differs from the matching record in Sites.`, expectedValue: canonicalSite[field], actualValue: specimen[field], recommendation: 'Verify the matching Sites record and update the specimen only from source documentation.' })
      })
    }

    const specimenMeasurements = measurementsBySpecimen.get(specimen.specimen_id) || []
    const missingTrackedFields = TRACKED_SPECIMEN_FIELDS.filter((field) => !isProvided(specimen[field]))
    if (missingTrackedFields.length) issue({ ruleId: 'COMPLETE-000', ruleName: 'Missing tracked specimen fields', category: 'Completeness', severity: 'LOW', kind: 'review', fields: missingTrackedFields, message: `${missingTrackedFields.length} tracked specimen field${missingTrackedFields.length === 1 ? ' is' : 's are'} missing.`, expectedValue: 'Available contextual metadata', actualValue: missingTrackedFields, recommendation: 'Complete supported metadata while preserving genuinely unknown values.' })
    if (!specimenMeasurements.length) issue({ ruleId: 'COMPLETE-001', ruleName: 'No measurements', category: 'Completeness', severity: 'LOW', kind: 'review', fields: ['measurements'], message: 'No measurements are recorded for this specimen.', expectedValue: 'At least one relevant measurement when preservation permits', actualValue: 'None', recommendation: 'Add an available measurement or document why measurement was not possible.' })

    // Measurement rules
    // Values must be positive, units/types must use controlled options, and the
    // measurement bone must agree with its parent specimen.
    specimenMeasurements.forEach((measurement) => {
      const label = measurement.measurement_type || 'Measurement'
      const value = Number(measurement.value)
      if (!isProvided(measurement.bone_type) || !normalizeBoneCategory(measurement.bone_type)) issue({ ruleId: 'MEASURE-003', ruleName: 'Missing or invalid measurement bone', category: 'Measurement Quality', severity: 'HIGH', fields: ['measurements.bone_type'], message: `${label} has a missing or invalid bone category.`, expectedValue: specimen.bone_type || 'A controlled bone category', actualValue: measurement.bone_type, recommendation: 'Associate the measurement with its anatomical bone.' })
      else if (category && normalizeBoneCategory(measurement.bone_type)?.code !== category.code) issue({ ruleId: 'ANATOMY-002', ruleName: 'Measurement/specimen bone mismatch', category: 'Anatomical Consistency', severity: 'HIGH', fields: ['bone_type', 'measurements.bone_type'], message: `${label} is assigned to a different bone than its specimen.`, expectedValue: specimen.bone_type, actualValue: measurement.bone_type, recommendation: 'Verify the specimen link and measurement bone category.' })
      if (!isMeasurementBoneCompatible(measurement.bone_type, measurement.measurement_type)) issue({ ruleId: 'ANATOMY-003', ruleName: 'Anatomically incompatible measurement type', category: 'Anatomical Consistency', severity: 'HIGH', fields: ['measurements.bone_type', 'measurements.measurement_type'], message: 'The bone-qualified measurement type is incompatible with the selected bone.', expectedValue: `A ${measurement.bone_type}-compatible measurement`, actualValue: label, recommendation: 'Correct the measurement type or bone association.' })
      if (!MEASUREMENT_TYPE_SET.has(measurement.measurement_type)) issue({ ruleId: 'MEASURE-004', ruleName: 'Invalid measurement type', category: 'Measurement Quality', severity: 'HIGH', fields: ['measurements.measurement_type'], message: 'Measurement type is missing or outside the form options.', expectedValue: MEASUREMENT_TYPES, actualValue: measurement.measurement_type, recommendation: 'Select an existing measurement type.' })
      if (isProvided(measurement.value) && !isProvided(measurement.unit)) issue({ ruleId: 'MEASURE-005', ruleName: 'Missing measurement unit', category: 'Measurement Quality', severity: 'HIGH', fields: ['measurements.value', 'measurements.unit'], message: 'A numeric measurement has no unit.', expectedValue: MEASUREMENT_UNITS, actualValue: `${measurement.value} (no unit)`, recommendation: 'Record the source unit; values are not converted automatically.' })
      else if (isProvided(measurement.unit) && !MEASUREMENT_UNIT_SET.has(measurement.unit)) issue({ ruleId: 'MEASURE-006', ruleName: 'Invalid measurement unit', category: 'Measurement Quality', severity: 'HIGH', fields: ['measurements.unit'], message: 'Measurement unit is outside the supported options.', expectedValue: MEASUREMENT_UNITS, actualValue: measurement.unit, recommendation: 'Select the correct source unit.' })
      if (!Number.isFinite(value) || value <= 0) issue({ ruleId: 'MEASURE-007', ruleName: 'Non-positive measurement', category: 'Measurement Quality', severity: 'HIGH', fields: ['measurements.value'], message: 'An anatomical measurement must be greater than zero.', expectedValue: 'A positive numeric value', actualValue: measurement.value, recommendation: 'Correct or remove the measurement.' })
      else {
        const centimetres = measurement.unit === 'mm' ? value / 10 : measurement.unit === 'm' ? value * 100 : value
        if (Number.isFinite(centimetres) && centimetres > 300) issue({ ruleId: 'MEASURE-008', ruleName: 'Extreme measurement', category: 'Measurement Quality', severity: 'MEDIUM', kind: 'review', fields: ['measurements.value', 'measurements.unit'], message: 'Measurement exceeds the existing conservative 300 cm threshold.', expectedValue: 'At most 300 cm (QA heuristic)', actualValue: `${value} ${measurement.unit || ''}`.trim(), recommendation: 'Verify the value, decimal placement, and unit.' })
      }
    })

    return { specimen, status: recordStatus(issues), issues }
  })

  // Cross-table reference rules
  // This reports unlinked measurements but never changes rows or constraints.
  const orphanIssues = measurements
    .filter((row) => !specimenById.has(row.specimen_id))
    .map((row) => createQualityIssue({ ruleId: 'STRUCT-REF-001', ruleName: 'Orphan measurement', category: 'Structural / Required Data Quality', severity: 'CRITICAL', fields: ['measurements.specimen_id'], message: 'Measurement references a specimen not returned by the specimen query.', expectedValue: 'An existing specimens.specimen_id', actualValue: row.specimen_id, recommendation: 'Review the relationship and source import; no row was changed.', specimen: { specimen_id: row.specimen_id } }))

  const allIssues = [
    ...specimenAudits.flatMap((audit) => audit.issues),
    ...siteAudits.flatMap((audit) => audit.issues),
    ...orphanIssues,
  ]
  const severityCounts = Object.fromEntries(QUALITY_SEVERITIES.map((severity) => [severity, allIssues.filter((issue) => issue.severity === severity).length]))
  const ruleCounts = [...allIssues.reduce((counts, issue) => counts.set(issue.ruleId, (counts.get(issue.ruleId) || 0) + 1), new Map()).entries()]
    .map(([ruleId, count]) => ({ ruleId, count, issue: allIssues.find((entry) => entry.ruleId === ruleId) }))
    .sort((left, right) => right.count - left.count)

  return {
    audits: specimenAudits,
    specimenAudits,
    siteAudits,
    allIssues,
    orphanIssues,
    qualityCounts: buildRecordCounts(specimenAudits),
    siteQualityCounts: buildRecordCounts(siteAudits),
    severityCounts,
    categoryScores: calculateCategoryScores(allIssues),
    ruleCounts,
  }
}
