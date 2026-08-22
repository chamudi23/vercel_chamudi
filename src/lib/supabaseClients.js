/**
 * supabaseClients.js
 * ==================
 * The single place Supabase connections are defined.
 *
 * ── Identity ────────────────────────────────────────────────────────────
 * `authClient` is the ONE identity provider for the whole application. It
 * points at the shared OAHRIS project, where the `profiles` table and the
 * role model live (see access_control/01_identity_and_roles.sql).
 *
 * A Supabase JWT is signed with its own project's secret and is rejected by
 * any other project. That is why there can only be one identity provider,
 * and why the Skeletal module's data has to end up in the same project for a
 * single login to secure all four modules.
 *
 * ── The consolidation flag ──────────────────────────────────────────────
 * `VITE_SKELETAL_CONSOLIDATED` controls where the Skeletal module reads and
 * writes its own tables (`analyses`, `course_progress`):
 *
 *   unset / false  → the legacy Skeletal project (today's behaviour).
 *                    Login, route gating and the other three modules all work
 *                    normally, but Learning Path progress cannot be saved,
 *                    because the signed-in user does not exist in that
 *                    project's auth.users. useCourseProgress reports this
 *                    rather than failing silently.
 *
 *   true           → the shared project. Requires
 *                    access_control/03_consolidate_skeletal.sql to have been
 *                    run and the data moved. This is the intended end state.
 *
 * Defaulting to false means checking this code out changes nothing until the
 * database migration has actually happened — code never cuts over ahead of
 * data.
 */

import { createClient } from '@supabase/supabase-js'

/* ------------------------------------------------------------------ *
 * Shared OAHRIS project — identity + CSRM + GIS + Images
 * ------------------------------------------------------------------ */

/*
 * The built-in fallbacks below are `anon` keys. They are safe in a client by
 * design — Row-Level Security, not key secrecy, is what protects the data —
 * and they are already committed to this repository, so a fallback leaks
 * nothing new. They exist so a checkout runs without a .env file.
 *
 * Both keys should still be ROTATED as part of the lockdown (README step M8):
 * until then they grant the wide-open access that exists today, and they are
 * in git history permanently.
 */

const SHARED_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://yiamplfqhyurgxxbpeur.supabase.co'

const SHARED_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYW1wbGZxaHl1cmd4eGJwZXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTcyMDEsImV4cCI6MjA5MTQzMzIwMX0.kdeAKefc9PZyjg5PwnJ9nt0kydjFthv_yHvfqhlziLU'

/* ------------------------------------------------------------------ *
 * Legacy Skeletal project — used only until consolidation
 * ------------------------------------------------------------------ */

const SKELETAL_URL =
  import.meta.env.VITE_SKELETAL_SUPABASE_URL || 'https://jlqnqzlvpljntpnbdaci.supabase.co'

const SKELETAL_ANON_KEY =
  import.meta.env.VITE_SKELETAL_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscW5xemx2cGxqbnRwbmJkYWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDE3OTQsImV4cCI6MjA5MzMxNzc5NH0.Ab_eiALqWPd_Ji7KEnacyKgCdKGXgHj_4cm3Azksm3A'

/** Has the Skeletal data been moved into the shared project? */
export const SKELETAL_CONSOLIDATED =
  String(import.meta.env.VITE_SKELETAL_CONSOLIDATED || '').toLowerCase() === 'true'

/**
 * The identity provider and the client for all shared-project data.
 * Every module's reads and writes are governed by this session's JWT.
 */
export const authClient = createClient(SHARED_URL, SHARED_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

/** Alias — same connection, named for intent at the call site. */
export const dataClient = authClient

/**
 * Client for the Skeletal module's own tables.
 * Once consolidated this IS `authClient`, so those tables come under the same
 * session and the same RLS as everything else.
 */
export const skeletalClient = SKELETAL_CONSOLIDATED
  ? authClient
  : createClient(SKELETAL_URL, SKELETAL_ANON_KEY, {
      auth: {
        // The legacy project must not compete for the session: identity comes
        // from the shared project alone. Without this, two clients race to
        // write the same storage key and sign-in becomes unreliable.
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })

export default authClient
