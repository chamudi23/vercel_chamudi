/**
 * supabase.js
 * ============
 * Shared Supabase client for the non-Skeletal OAHRIS modules (specimen
 * records, image library, GIS).
 *
 * This now re-exports the single application client defined in
 * lib/supabaseClients.js rather than creating a second connection of its own.
 *
 * Why: once authentication is enabled, every request must carry the signed-in
 * user's JWT, because Row-Level Security decides what that user may read or
 * write. Two separate client instances against the same project would each
 * hold their own session state and race over the same browser storage key,
 * so one of them would issue anonymous requests and those requests would now
 * be rejected.
 *
 * Every existing `import { supabase } from '../supabase'` keeps working
 * unchanged — no module page needed editing.
 */

export { authClient as supabase, authClient as default } from './lib/supabaseClients'
