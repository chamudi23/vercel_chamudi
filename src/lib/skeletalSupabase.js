/**
 * skeletalSupabase.js
 * ===================
 * Client for the Automated Skeletal Analysis module's own tables
 * (`analyses`, `course_progress`).
 *
 * This now re-exports `skeletalClient` from supabaseClients.js, which resolves
 * to either:
 *   - the legacy Skeletal project (default), or
 *   - the shared project, once VITE_SKELETAL_CONSOLIDATED=true and
 *     access_control/03_consolidate_skeletal.sql has been run.
 *
 * Authentication is NOT handled here any more. There is one identity provider
 * for the whole application (`authClient`), because a JWT issued by one
 * Supabase project is rejected by another. Anything auth-related must go
 * through context/AuthContext.jsx.
 *
 * Every existing `import { supabase } from '../lib/skeletalSupabase'` keeps
 * working unchanged.
 */

export { skeletalClient as supabase, skeletalClient as default } from './supabaseClients'
export { SKELETAL_CONSOLIDATED } from './supabaseClients'
