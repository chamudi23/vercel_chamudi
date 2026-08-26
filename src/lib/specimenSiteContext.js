const SITE_METADATA_FIELDS = ['district', 'province', 'time_period']

export function normalizeSiteName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function normalize(value) { return normalizeSiteName(value) }

function coordinate(value, minimum, maximum) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null
}

function specimenId(specimen) {
  return String(specimen?.specimen_id || '').trim()
}

function withoutCoordinates(site) {
  if (!site) return null
  const metadata = { ...site }
  delete metadata.latitude
  delete metadata.longitude
  return metadata
}

/**
 * Resolve one specimen against the canonical sites catalogue without guessing.
 * Site names are compared case-insensitively after harmless outer/repeated
 * whitespace normalization; no aliases, partial matches, or fuzzy matching
 * are applied.
 */
export function resolveSpecimenSite(specimen, sites = []) {
  const id = specimenId(specimen)
  const requestedName = String(specimen?.site_name || '').trim()

  if (!requestedName) {
    return { status: 'missing', reason: 'no_site', specimenId: id, specimen, site: null }
  }

  const requestedKey = normalize(requestedName)
  const matches = (sites || []).filter((site) => normalize(site?.site_name) === requestedKey)

  if (matches.length === 0) {
    return { status: 'missing', reason: 'unmatched', specimenId: id, specimen, site: null }
  }

  if (matches.length > 1) {
    return { status: 'ambiguous', reason: 'duplicate_site_name', specimenId: id, specimen, site: null }
  }

  const matchedSite = matches[0]
  const conflictingFields = SITE_METADATA_FIELDS.filter((field) => {
    const specimenValue = normalize(specimen?.[field])
    const siteValue = normalize(matchedSite?.[field])
    return specimenValue && siteValue && specimenValue !== siteValue
  })

  if (conflictingFields.length > 0) {
    return {
      status: 'conflict',
      reason: 'metadata_mismatch',
      specimenId: id,
      specimen,
      site: withoutCoordinates(matchedSite),
      siteId: matchedSite.id,
      conflictingFields,
    }
  }

  const latitude = coordinate(matchedSite.latitude, -90, 90)
  const longitude = coordinate(matchedSite.longitude, -180, 180)
  const site = { ...matchedSite, latitude, longitude }

  if (latitude === null || longitude === null) {
    return {
      status: 'no_coordinates',
      reason: 'invalid_or_missing_coordinates',
      specimenId: id,
      specimen,
      site,
      siteId: matchedSite.id,
    }
  }

  return { status: 'resolved', specimenId: id, specimen, site, siteId: matchedSite.id }
}

/**
 * Resolve all specimens linked to one selected category-side group. Results
 * collapse to one context only when every specimen has the same safe outcome.
 */
export function resolveSpecimenSiteContext(specimens = [], sites = []) {
  const uniqueSpecimens = [...new Map((specimens || [])
    .filter(Boolean)
    .map((specimen) => [specimenId(specimen), specimen])).values()]

  if (uniqueSpecimens.length === 0) {
    return { status: 'missing', reason: 'no_specimen', specimenIds: [], contexts: [] }
  }

  const contexts = uniqueSpecimens.map((specimen) => resolveSpecimenSite(specimen, sites))
  const specimenIds = contexts.map((context) => context.specimenId).filter(Boolean)

  if (contexts.length === 1) return { ...contexts[0], specimenIds, contexts }

  const siteIds = new Set(contexts.map((context) => context.siteId).filter(Boolean))
  const allSafelyResolved = contexts.every((context) => (
    context.status === 'resolved' || context.status === 'no_coordinates'
  ))

  if (allSafelyResolved && siteIds.size === 1) {
    const context = contexts[0]
    return { ...context, specimenIds, contexts }
  }

  const first = contexts[0]
  const allSameFallback = contexts.every((context) => (
    context.status === first.status
    && context.reason === first.reason
    && context.siteId === first.siteId
  ))

  if (allSameFallback) return { ...first, specimenIds, contexts }

  return { status: 'multiple', reason: 'multiple_contexts', specimenIds, contexts }
}
