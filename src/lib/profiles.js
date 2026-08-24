/**
 * profiles.js
 * ===========
 * Data access for the identity/role model (`public.profiles`).
 *
 * IMPORTANT: nothing in this file is a security control. Row-Level Security
 * in the database decides what any of these calls may see or change:
 *   - a user's SELECT returns only their own profile;
 *   - only an admin's SELECT returns everyone;
 *   - a non-admin cannot change `role` or `status` at all — the
 *     guard_profile_update() trigger raises an exception.
 * The helpers here exist so the UI can render the right thing. Removing them
 * would not grant anybody access.
 *
 * See access_control/01_identity_and_roles.sql.
 */

import { authClient } from './supabaseClients'

export const ROLES = ['admin', 'researcher', 'student']

export const ROLE_LABELS = {
  admin: 'Administrator',
  researcher: 'Researcher',
  student: 'Student',
}

export const ROLE_DESCRIPTIONS = {
  admin: 'Full access, plus user management.',
  researcher: 'Full access; may add and edit catalogue records.',
  student: 'May browse records and use the analysis and learning tools.',
}

/** Fetch the signed-in user's own profile. Returns null when absent. */
export async function getMyProfile(userId) {
  if (!userId) return null

  const { data, error } = await authClient
    .from('profiles')
    .select('user_id, email, full_name, role, status, institution, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    // 42P01 = table missing, i.e. 01_identity_and_roles.sql has not been run.
    if (error.code === '42P01') {
      console.warn(
        '[auth] `profiles` table not found — run access_control/01_identity_and_roles.sql'
      )
      return null
    }
    console.error('[auth] profile load failed:', error.message)
    return null
  }
  return data
}

/**
 * Every profile, for the admin user-management screen.
 * RLS returns only the caller's own row unless they are an admin.
 */
export async function listProfiles() {
  const { data, error } = await authClient
    .from('profiles')
    .select('user_id, email, full_name, role, status, institution, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin] profile list failed:', error.message)
    return { rows: [], error }
  }
  return { rows: data || [], error: null }
}

/** Change a user's role. Rejected by the database unless the caller is admin. */
export async function setUserRole(userId, role) {
  if (!ROLES.includes(role)) return { error: new Error(`Unknown role: ${role}`) }

  const { error } = await authClient
    .from('profiles')
    .update({ role })
    .eq('user_id', userId)

  if (error) console.error('[admin] role change failed:', error.message)
  return { error }
}

/**
 * Suspend or reactivate an account.
 * Suspension takes effect immediately: current_user_role() returns NULL for a
 * suspended user, so every policy that calls it stops matching — the user's
 * existing token keeps working as a token but authorises nothing.
 */
export async function setUserStatus(userId, status) {
  if (!['active', 'suspended'].includes(status)) {
    return { error: new Error(`Unknown status: ${status}`) }
  }

  const { error } = await authClient
    .from('profiles')
    .update({ status })
    .eq('user_id', userId)

  if (error) console.error('[admin] status change failed:', error.message)
  return { error }
}

/** Update the signed-in user's own display fields. */
export async function updateMyProfile(userId, { full_name, institution }) {
  const { error } = await authClient
    .from('profiles')
    .update({ full_name, institution })
    .eq('user_id', userId)

  if (error) console.error('[auth] profile update failed:', error.message)
  return { error }
}

/**
 * Invite a new user.
 *
 * Creating an auth user requires the `service_role` key, which must NEVER
 * reach the browser. The call therefore goes to an Edge Function that holds
 * the key as a server-side secret and re-verifies the caller is an admin from
 * their JWT — the client's claim to be an admin is not trusted.
 *
 * See supabase/functions/admin-users/index.ts
 */
export async function inviteUser({ email, fullName, role, mode = 'invite', password }) {
  const { data, error } = await authClient.functions.invoke('admin-users', {
    body: {
      action: mode === 'password' ? 'create_with_password' : 'invite',
      email,
      full_name: fullName,
      role,
      password,
    },
  })

  if (error) {
    // supabase-js collapses every failure into one of three generic messages
    // and hides the function's own JSON body inside `context`. Unwrap it, or
    // the caller only ever sees "non-2xx status code" and cannot tell a
    // missing SERVICE_ROLE_KEY from a 403.
    const detail = await edgeErrorDetail(error)
    console.error('[admin] invite failed:', detail || error.message)
    return {
      data: null,
      error: Object.assign(new Error(detail || error.message), { name: error.name }),
    }
  }
  if (data?.error) return { data: null, error: new Error(data.error) }
  return { data, error: null }
}

/**
 * Pull the real message out of a functions-js error.
 * `FunctionsHttpError.context` is the unread Response, so the function's
 * `{ error: "..." }` body is still available; the other error kinds carry
 * nothing useful and fall back to their own message.
 */
async function edgeErrorDetail(error) {
  try {
    const body = await error?.context?.json?.()
    if (body?.error) return body.error
  } catch {
    // body absent or not JSON — nothing to add
  }
  return null
}
