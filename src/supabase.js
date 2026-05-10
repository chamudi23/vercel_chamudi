/**
 * supabase.js
 * ============
 * Initializes the Supabase client for the OAHRIS Skeletal Analysis module.
 * 
 * Uses environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
 * to connect to the Supabase PostgreSQL database hosted at:
 * https://yiamplfqhyurgxxbpeur.supabase.co
 * 
 * All database queries throughout the app use this singleton client.
 * @see supabaseService.js for all database operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)