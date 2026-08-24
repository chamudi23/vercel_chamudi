const MAX_RESULTS = 20
const CANDIDATE_PAGE_SIZE = 500
const SPECIMEN_FILTER_KEYS = ['specimenId', 'skeletonCode', 'boneType', 'side', 'site', 'district', 'timePeriod', 'preservationStatus']
const IMAGE_FILTER_KEYS = ['specimenId', 'skeletonCode', 'boneType', 'side', 'condition', 'imageView', 'imageType']

function asLimit(value) { const number = Number.parseInt(value, 10); return Number.isInteger(number) && number > 0 ? Math.min(number, MAX_RESULTS) : MAX_RESULTS }
function text(value) { return String(value || '').trim() }
function hasMeaningfulFilter(filters, keys) { return keys.some((key) => text(filters[key])) }
function requireFilter(filters, keys, message) { if (!hasMeaningfulFilter(filters, keys)) throw Object.assign(new Error(message), { code: 'FILTER_REQUIRED' }) }
async function collectPagedSpecimenIds(query) {
  const ids = []; let offset = 0
  while (true) {
    const { data, error } = await query.range(offset, offset + CANDIDATE_PAGE_SIZE - 1)
    if (error) throw error
    ids.push(...(data || []).map((row) => row.specimen_id))
    if (!data || data.length < CANDIDATE_PAGE_SIZE) return ids
    offset += CANDIDATE_PAGE_SIZE
  }
}

module.exports = { MAX_RESULTS, CANDIDATE_PAGE_SIZE, SPECIMEN_FILTER_KEYS, IMAGE_FILTER_KEYS, asLimit, text, hasMeaningfulFilter, requireFilter, collectPagedSpecimenIds }
