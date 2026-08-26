const supabase = require('../config/supabase')

const ALLOWED_ROLES = new Set(['admin', 'researcher', 'student'])
const ACTIVE_STATUSES = new Set(['active', 'approved'])

function authError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } })
}

function bearerToken(header) {
  if (typeof header !== 'string') return ''
  const match = header.match(/^Bearer\s+([^\s]+)$/i)
  return match?.[1] || ''
}

function normalizeTrustedProfile(profile, userId) {
  const role = typeof profile?.role === 'string' ? profile.role.trim().toLowerCase() : ''
  const status = typeof profile?.status === 'string' ? profile.status.trim().toLowerCase() : ''
  if (profile?.user_id !== userId || !ALLOWED_ROLES.has(role) || !ACTIVE_STATUSES.has(status)) return null
  return { id: userId, role }
}

function createRequireAuth({ verifyAccessToken = supabase.verifyAccessToken, resolveUserProfile = supabase.resolveUserProfile } = {}) {
  return async function requireAuth(req, res, next) {
    const token = bearerToken(req.headers.authorization)
    if (!token) return authError(res, 401, 'AUTH_REQUIRED', 'Please sign in to use OAHRIS Assistant.')

    try {
      const verified = await verifyAccessToken(token)
      if (verified?.error || !verified?.user?.id) {
        return authError(res, 401, 'AUTH_SESSION_INVALID', 'Your OAHRIS session has expired. Please sign in again.')
      }

      const resolved = await resolveUserProfile(verified.user.id, token)
      if (resolved?.error) return authError(res, 403, 'ACCESS_DENIED', 'You do not have access to this OAHRIS information.')
      const user = normalizeTrustedProfile(resolved?.profile, verified.user.id)
      if (!user || !resolved?.client) return authError(res, 403, 'ACCESS_DENIED', 'You do not have access to this OAHRIS information.')

      req.user = user
      req.supabase = resolved.client
      next()
    } catch (_) {
      return authError(res, 401, 'AUTH_SESSION_INVALID', 'Your OAHRIS session has expired. Please sign in again.')
    }
  }
}

module.exports = { ALLOWED_ROLES, ACTIVE_STATUSES, bearerToken, createRequireAuth, normalizeTrustedProfile, requireAuth: createRequireAuth() }
