export const TRACKED_SPECIMEN_FIELDS = Object.freeze([
  'site_name',
  'district',
  'province',
  'excavation_year',
  'time_period',
  'preservation_state',
  'location_stored',
  'burial_context',
  'notes',
])

export function isTrackedFieldFilled(value) {
  return value !== null && value !== undefined && value !== ''
}

export function getMissingTrackedFields(specimen = {}) {
  return TRACKED_SPECIMEN_FIELDS.filter((field) => !isTrackedFieldFilled(specimen[field]))
}

export function calculateSpecimenCompleteness(specimen = {}) {
  const filled = TRACKED_SPECIMEN_FIELDS.length - getMissingTrackedFields(specimen).length
  return Math.round((filled / TRACKED_SPECIMEN_FIELDS.length) * 100)
}

export function specimenCompletenessStatus(percentage) {
  if (percentage === 100) return 'complete'
  if (percentage < 50) return 'incomplete'
  return 'partial'
}
