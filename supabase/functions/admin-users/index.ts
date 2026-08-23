/**
 * admin-users — Supabase Edge Function
 * ====================================
 * Creates accounts on behalf of an administrator.
 *
 * WHY THIS EXISTS
 * ---------------
 * Creating an auth user requires the `service_role` key, which bypasses all
 * Row-Level Security. That key must NEVER be shipped to a browser — anyone
 * holding it has unrestricted read/write on the entire database. So the call
 * happens here, server-side, where the key lives as a function secret.
 *
 * THE CALLER IS NOT TRUSTED
 * -------------------------
 * The client does not tell us it is an admin; we verify it. The caller's JWT
 * is resolved to a user, that user's row is read from `profiles`, and the
 * request is rejected unless that row says role='admin' and status='active'.
 * A student who calls this endpoint directly with their own valid token gets
 * a 403.
 *
 * DEPLOY
 * ------
 *   supabase functions deploy admin-users
 *   supabase secrets set SERVICE_ROLE_KEY=<service_role key from the dashboard>
 *
 * SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.
 * See access_control/README.md, manual step M5.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ROLES = ['admin', 'researcher', 'student']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
  const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

  if (!SERVICE_ROLE_KEY) {
    return json({ error: 'SERVICE_ROLE_KEY secret is not configured on this function' }, 500)
  }

  /* -------------------------------------------------------------- */
  /* 1. Who is calling?                                             */
  /* -------------------------------------------------------------- */
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401)
  }

  // A client bound to the CALLER's token — so RLS applies to what it reads.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser()

  if (callerError || !caller) {
    return json({ error: 'Invalid or expired session' }, 401)
  }

  /* -------------------------------------------------------------- */
  /* 2. Is the caller actually an active admin?                      */
  /*    Read with the service key so this cannot be defeated by a    */
  /*    policy quirk, and compare explicitly.                        */
  /* -------------------------------------------------------------- */
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('role, status')
    .eq('user_id', caller.id)
    .maybeSingle()

  if (profileError) {
    return json({ error: `Could not verify caller: ${profileError.message}` }, 500)
  }
  if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.status !== 'active') {
    // Deliberately terse: do not reveal the role model to a prober.
    return json({ error: 'Forbidden' }, 403)
  }

  /* -------------------------------------------------------------- */
  /* 3. Validate the request                                         */
  /* -------------------------------------------------------------- */
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Body must be JSON' }, 400)
  }

  const action = body.action ?? 'invite'
  const email = (body.email ?? '').trim().toLowerCase()
  const fullName = (body.full_name ?? '').trim()
  const role = body.role ?? 'student'
  const password = body.password ?? ''

  if (!email || !email.includes('@')) return json({ error: 'A valid e-mail is required' }, 400)
  if (!ALLOWED_ROLES.includes(role)) return json({ error: `Unknown role: ${role}` }, 400)

  // The role travels in user metadata; handle_new_user() reads it when it
  // creates the profile row, so the account is never briefly over-privileged.
  const metadata = { full_name: fullName, role }

  /* -------------------------------------------------------------- */
  /* 4. Create the account                                           */
  /* -------------------------------------------------------------- */
  /**
   * The handle_new_user() trigger normally creates the profile. Some Supabase
   * projects do not let `postgres` own a trigger on auth.users, in which case
   * the trigger will not exist and a new account would have no role at all —
   * the user would sign in and be told "No role assigned".
   *
   * So write the profile explicitly too. The trigger's insert is
   * ON CONFLICT DO NOTHING, so whichever runs first wins and this is safe
   * either way.
   */
  const ensureProfile = async (userId?: string) => {
    if (!userId) return
    const { error } = await admin.from('profiles').upsert(
      {
        user_id: userId,
        email,
        full_name: fullName || null,
        role,
        status: 'active',
      },
      { onConflict: 'user_id' },
    )
    if (error) console.error('[admin-users] profile upsert failed:', error.message)
  }

  try {
    if (action === 'create_with_password') {
      if (password.length < 8) {
        return json({ error: 'Password must be at least 8 characters' }, 400)
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // no confirmation mail; the admin hands over the password
        user_metadata: metadata,
      })
      if (error) return json({ error: error.message }, 400)
      await ensureProfile(data.user?.id)
      return json({ ok: true, action, user_id: data.user?.id, email })
    }

    if (action === 'invite') {
      /**
       * Land the invitee on the set-password screen, NOT the site root.
       *
       * Without an explicit redirectTo, Supabase sends them to the project's
       * Site URL. The SDK there sees the token in the URL, exchanges it for a
       * session and the invitee ends up signed in having never chosen a
       * password — with no way to sign in again once that session expires.
       *
       * The origin is taken from the request header rather than the body, so
       * a caller cannot point invitation links at a site of their choosing.
       * (Supabase also refuses any redirect not on the project's allow-list.)
       */
      const origin = req.headers.get('origin') ?? ''
      const redirectTo = origin ? `${origin}/reset-password?welcome=1` : undefined

      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: metadata,
        ...(redirectTo ? { redirectTo } : {}),
      })
      if (error) return json({ error: error.message }, 400)
      await ensureProfile(data.user?.id)
      return json({ ok: true, action, user_id: data.user?.id, email })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    return json({ error: `Unexpected failure: ${(err as Error).message}` }, 500)
  }
})
