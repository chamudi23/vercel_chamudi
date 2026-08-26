const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
);

function createUserSupabaseClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function verifyAccessToken(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data?.user?.id) return { user: null, error: error || new Error("Invalid user token.") };
  return { user: { id: data.user.id }, error: null };
}

async function resolveUserProfile(userId, accessToken) {
  const client = createUserSupabaseClient(accessToken);
  const { data, error } = await client
    .from("profiles")
    .select("user_id,role,status")
    .eq("user_id", userId)
    .maybeSingle();
  return { profile: data || null, client, error };
}

supabase.createUserSupabaseClient = createUserSupabaseClient;
supabase.verifyAccessToken = verifyAccessToken;
supabase.resolveUserProfile = resolveUserProfile;

module.exports = supabase;
