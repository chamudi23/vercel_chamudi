/**
 * access_matrix_test.mjs
 * ======================
 * Proves the permission matrix AT THE API, not through the UI.
 *
 * A click-through cannot demonstrate that access control works, because the
 * interface is not what enforces it. The Supabase anon key is public, so the
 * real question is what the DATABASE returns to each caller. That is what this
 * asserts.
 *
 * USAGE
 *   Set credentials for one account per role, then run:
 *
 *     SUPABASE_URL=https://yiamplfqhyurgxxbpeur.supabase.co \
 *     SUPABASE_ANON_KEY=<anon key> \
 *     ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     RESEARCHER_EMAIL=... RESEARCHER_PASSWORD=... \
 *     STUDENT_EMAIL=... STUDENT_PASSWORD=... \
 *     node access_control/access_matrix_test.mjs
 *
 *   Any role whose credentials are omitted is skipped with a warning; the
 *   anonymous checks always run, because they are the ones that matter most.
 *
 * EXIT CODE
 *   0 = every assertion matched the matrix
 *   1 = at least one did not  → the lockdown is not doing what you think
 */

const URL_BASE = process.env.SUPABASE_URL || 'https://yiamplfqhyurgxxbpeur.supabase.co'
const ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!ANON_KEY) {
  console.error('SUPABASE_ANON_KEY is required.')
  process.exit(2)
}

const REST = `${URL_BASE}/rest/v1`

/* ------------------------------------------------------------------ *
 * The matrix — mirrors ACCESS_CONTROL_PLAN.md section 3
 * ------------------------------------------------------------------ */

const CURATED = [
  'specimens', 'measurements', 'skeletal_inputs', 'excavation_records',
  'laboratory_dating_results', 'sites', 'bone_images',
]

// read/write expectations per role. true = must be allowed, false = must be denied.
const MATRIX = {
  anon:       { read: false, write: false },
  student:    { read: true,  write: false },
  researcher: { read: true,  write: true  },
  admin:      { read: true,  write: true  },
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

let pass = 0
let fail = 0
const failures = []

function record(ok, label, detail) {
  if (ok) {
    pass += 1
    console.log(`  \x1b[32mPASS\x1b[0m  ${label}`)
  } else {
    fail += 1
    failures.push(`${label} — ${detail}`)
    console.log(`  \x1b[31mFAIL\x1b[0m  ${label}   ${detail}`)
  }
}

async function signIn(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`sign-in failed for ${email}: ${res.status} ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  return json.access_token
}

function headers(token) {
  return token
    ? { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { apikey: ANON_KEY, 'Content-Type': 'application/json' }
}

/** Can this caller READ the table? */
async function canRead(table, token) {
  const res = await fetch(`${REST}/${table}?select=*&limit=1`, { headers: headers(token) })
  if (res.status === 401 || res.status === 403) return false
  if (!res.ok) return false
  const rows = await res.json()
  // An empty array is what RLS returns when no policy matches — indistinguishable
  // from a genuinely empty table, so seed at least one row before testing.
  return Array.isArray(rows) && rows.length > 0
}

/**
 * Can this caller WRITE?
 * Uses a deliberately invalid payload so a *permitted* write fails on
 * validation (400/409) rather than actually inserting test data. Denied by
 * RLS is 401/403, which is what we are distinguishing.
 */
async function canWrite(table, token) {
  const res = await fetch(`${REST}/${table}`, {
    method: 'POST',
    headers: { ...headers(token), Prefer: 'return=minimal' },
    body: JSON.stringify({ __access_matrix_probe__: 'x' }),
  })
  // 401/403 → RLS refused. 400/404/409/422 → RLS allowed it; the column is bogus.
  return !(res.status === 401 || res.status === 403)
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

console.log(`\nAccess matrix against ${URL_BASE}\n${'='.repeat(60)}`)

// --- 1. Anonymous: the single most important test ---------------------
console.log('\n[anon] — signed-out visitor (uses the public anon key)')
for (const table of CURATED) {
  const readable = await canRead(table, null)
  record(
    readable === MATRIX.anon.read,
    `anon cannot read ${table}`,
    readable ? 'RETURNED DATA — lockdown not in effect on this table' : ''
  )
}
{
  const writable = await canWrite('specimens', null)
  record(!writable, 'anon cannot write specimens', writable ? 'write was NOT refused' : '')
}

// --- 2. Per-role -------------------------------------------------------
const roles = [
  ['student', process.env.STUDENT_EMAIL, process.env.STUDENT_PASSWORD],
  ['researcher', process.env.RESEARCHER_EMAIL, process.env.RESEARCHER_PASSWORD],
  ['admin', process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD],
]

for (const [role, email, password] of roles) {
  if (!email || !password) {
    console.log(`\n[${role}] — \x1b[33mskipped\x1b[0m (${role.toUpperCase()}_EMAIL / _PASSWORD not set)`)
    continue
  }

  let token
  try {
    token = await signIn(email, password)
  } catch (err) {
    console.log(`\n[${role}] — \x1b[31mcould not sign in\x1b[0m: ${err.message}`)
    fail += 1
    failures.push(`${role} sign-in: ${err.message}`)
    continue
  }

  console.log(`\n[${role}] — ${email}`)
  const expect = MATRIX[role]

  for (const table of CURATED) {
    const readable = await canRead(table, token)
    record(
      readable === expect.read,
      `${role} ${expect.read ? 'can' : 'cannot'} read ${table}`,
      `got ${readable ? 'allowed' : 'denied'}`
    )
  }

  // The decisive one: a student must be refused a write BY THE DATABASE.
  const writable = await canWrite('specimens', token)
  record(
    writable === expect.write,
    `${role} ${expect.write ? 'can' : 'cannot'} write specimens`,
    `got ${writable ? 'allowed' : 'denied'}`
  )

  // Own profile readable; the whole table only for admins.
  const res = await fetch(`${REST}/profiles?select=user_id,role`, { headers: headers(token) })
  const rows = res.ok ? await res.json() : []
  if (role === 'admin') {
    record(rows.length >= 1, 'admin can list profiles', `got ${rows.length} rows`)
  } else {
    record(rows.length <= 1, `${role} sees only their own profile`, `got ${rows.length} rows`)
  }
}

/* ------------------------------------------------------------------ */
console.log(`\n${'='.repeat(60)}`)
console.log(`${pass} passed, ${fail} failed`)

if (fail) {
  console.log('\nFailures:')
  failures.forEach((f) => console.log(`  - ${f}`))
  console.log(
    '\nIf anon still reads data, a permissive "TO anon" policy survived the lockdown.\n' +
    'Postgres OR-combines permissive policies, so one leftover grants access.\n' +
    'Check section 6a of 02_rls_lockdown.sql.'
  )
}

process.exit(fail ? 1 : 0)
