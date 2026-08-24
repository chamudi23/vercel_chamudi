const API_BASE = import.meta.env.VITE_ASSISTANT_API_BASE || '/api/assistant'

export class AssistantApiError extends Error {
  constructor(code, message) { super(message); this.name = 'AssistantApiError'; this.code = code }
}

async function request(path, filters) {
  const params = new URLSearchParams()
  Object.entries(filters || {}).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, value) })
  const url = `${API_BASE}${path}${params.size ? `?${params}` : ''}`
  let response
  try {
    response = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch (error) {
    if (import.meta.env.DEV) console.error('[OAHRIS Assistant] Network request failed.', { url, error })
    throw new AssistantApiError('NETWORK_ERROR', 'The OAHRIS Assistant service could not be reached.')
  }
  const body = await response.json().catch(() => null)
  if (!body) {
    if (import.meta.env.DEV) console.error('[OAHRIS Assistant] Invalid API response.', { url, status: response.status })
    throw new AssistantApiError('INVALID_RESPONSE', 'The OAHRIS Assistant service returned an invalid response.')
  }
  if (!response.ok || !body.success) {
    if (import.meta.env.DEV) console.error('[OAHRIS Assistant] API request failed.', { url, status: response.status, code: body.error?.code || 'RETRIEVAL_FAILED' })
    throw new AssistantApiError(body.error?.code || 'RETRIEVAL_FAILED', body.error?.message || 'The requested OAHRIS records could not be retrieved.')
  }
  return body.data
}

async function post(path, payload) {
  const url = `${API_BASE}${path}`
  let response
  try {
    response = await fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } catch (error) {
    if (import.meta.env.DEV) console.error('[OAHRIS Assistant] Network request failed.', { url, error })
    throw new AssistantApiError('NETWORK_ERROR', 'The OAHRIS Assistant service could not be reached.')
  }
  const body = await response.json().catch(() => null)
  if (!body) throw new AssistantApiError('INVALID_RESPONSE', 'The OAHRIS Assistant service returned an invalid response.')
  if (!response.ok || !body.success) throw new AssistantApiError(body.error?.code || 'ASSISTANT_FAILED', body.error?.message || 'OAHRIS Assistant could not complete the request.')
  return body.data
}

export const assistantClient = {
  searchSpecimens: (filters) => request('/specimens', filters),
  getSpecimen: (specimenId) => request(`/specimens/${encodeURIComponent(specimenId)}`),
  getMeasurements: (specimenId) => request(`/specimens/${encodeURIComponent(specimenId)}/measurements`),
  searchImages: (filters) => request('/images', filters),
  getSkeletonCoverage: (code) => request(`/skeletons/${encodeURIComponent(code)}/coverage`),
  getSystemHelp: (query, currentRoute) => request('/help', { q: query, currentRoute }),
  respond: (message, currentRoute, context) => post('/respond', { message, currentRoute, context }),
}
