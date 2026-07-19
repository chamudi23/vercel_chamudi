/**
 * supabase.js
 * ============
 * Shared Supabase client for the OAHRIS app — used by supabaseService.js
 * and the non-Skeletal modules. Configured via environment variables
 * (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, see .env.local).
 *
 * NOTE: The Automated Skeletal Analysis module (IT22299802) uses its own
 * dedicated client — src/lib/skeletalSupabase.js — pointed at its own
 * Supabase project (jlqnqzlvpljntpnbdaci), where its tables and Google
 * auth are configured.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
