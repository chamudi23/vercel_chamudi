import { createClient } from '@supabase/supabase-js'

/**
 * Dedicated Supabase client for the Automated Skeletal Analysis module
 * (IT22299802 — Chamudi).
 *
 * This module keeps ITS data in its own Supabase project
 * (https://jlqnqzlvpljntpnbdaci.supabase.co), where the `analyses` and
 * `course_progress` tables and Google OAuth are configured — separate from
 * the shared app client in src/supabase.js.
 *
 * Override via env if needed:
 *   VITE_SKELETAL_SUPABASE_URL, VITE_SKELETAL_SUPABASE_ANON_KEY
 */
const url = import.meta.env.VITE_SKELETAL_SUPABASE_URL || 'https://jlqnqzlvpljntpnbdaci.supabase.co'
const key =
  import.meta.env.VITE_SKELETAL_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscW5xemx2cGxqbnRwbmJkYWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDE3OTQsImV4cCI6MjA5MzMxNzc5NH0.Ab_eiALqWPd_Ji7KEnacyKgCdKGXgHj_4cm3Azksm3A'

export const supabase = createClient(url, key)
