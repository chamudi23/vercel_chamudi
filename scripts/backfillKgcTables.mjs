/**
 * backfillKgcTables.mjs
 * =====================
 * One-off repair for the analyses saved while the normalised tables were
 * not being written.
 *
 * The Skeletal module used to write both the `analyses` JSONB table and the
 * relational kgc_* tables. Commit 74eb0d4 ("Standardize Skeletal module on
 * this session's implementation") removed the supabaseService layer that did
 * the second half, so from that point on `analyses` kept growing while
 * kgc_cases, the kgc_*_measurements tables and kgc_predictions stood still.
 * saveKgcCase() fixes it going forward; this script catches up the cases
 * recorded in between.
 *
 * It reads every row of `analyses` and, for each case with no kgc_cases row,
 * writes the case, its measurements and its prediction. Cases that already
 * have a kgc_cases row are skipped untouched — kgc_predictions is an audit
 * trail, and re-running must not append duplicate prediction rows.
 *
 * ── Credentials ────────────────────────────────────────────────────────
 * `analyses` is behind RLS and the anon key cannot read it, so this needs a
 * service-role key. It is never committed: pass it in the environment.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfillKgcTables.mjs
 *
 * The project URL comes from SUPABASE_URL, or VITE_SUPABASE_URL in
 * .env.local, whichever is set. Add --dry-run to print the plan and write
 * nothing.
 */

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

import {
  MEASUREMENT_TABLES,
  boneTypeOf,
  caseRow,
  describeGap,
  measurementRow,
  predictionRow,
} from '../src/lib/kgcCaseMapping.js'

const DRY_RUN = process.argv.includes('--dry-run')

/* ------------------------------------------------------------------ *
 * Connection
 * ------------------------------------------------------------------ */

function fromEnvFile(key) {
  try {
    const line = readFileSync('.env.local', 'utf8')
      .split('\n')
      .find((l) => l.trim().startsWith(`${key}=`))
    return line ? line.slice(line.indexOf('=') + 1).trim() : null
  } catch {
    return null
  }
}

const URL = process.env.SUPABASE_URL || fromEnvFile('VITE_SUPABASE_URL')
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL) {
  console.error('No project URL. Set SUPABASE_URL, or VITE_SUPABASE_URL in .env.local.')
  process.exit(1)
}
if (!SERVICE_KEY) {
  console.error(
    'No service-role key. `analyses` is behind RLS and the anon key cannot read it.\n' +
      'Run as: SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfillKgcTables.mjs'
  )
  process.exit(1)
}

const db = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

/* ------------------------------------------------------------------ *
 * Investigators — cached, so a run touches each email once
 * ------------------------------------------------------------------ */

const investigatorIds = new Map()

async function resolveInvestigatorId(name, email) {
  if (!email) return null
  if (investigatorIds.has(email)) return investigatorIds.get(email)

  const { data: found } = await db
    .from('kgc_investigators')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let id = found?.id || null
  if (!id) {
    const { data: created, error } = await db
      .from('kgc_investigators')
      .insert({ name: name || email.split('@')[0], email, role: 'analyst' })
      .select('id')
      .single()
    if (error) throw error
    id = created.id
  }
  investigatorIds.set(email, id)
  return id
}

/* ------------------------------------------------------------------ *
 * Backfill
 * ------------------------------------------------------------------ */

const { data: analyses, error: readErr } = await db
  .from('analyses')
  .select('case_id, basic_info, measurements, predictions')
  .order('created_at', { ascending: true })

if (readErr) {
  console.error(`Could not read analyses: ${readErr.message}`)
  process.exit(1)
}

const { data: existing, error: existErr } = await db.from('kgc_cases').select('case_id')
if (existErr) {
  console.error(`Could not read kgc_cases: ${existErr.message}`)
  process.exit(1)
}
const alreadyNormalised = new Set((existing || []).map((r) => r.case_id))

console.log(
  `${analyses.length} analyses, ${alreadyNormalised.size} already in kgc_cases` +
    (DRY_RUN ? ' — DRY RUN, nothing will be written' : '')
)

let written = 0
let skipped = 0
const failures = []

for (const row of analyses) {
  const caseId = row.case_id
  if (alreadyNormalised.has(caseId)) {
    skipped++
    continue
  }

  const basicInfo = row.basic_info || {}
  const measurements = row.measurements || {}
  const gap = describeGap(caseId, basicInfo, measurements)
  if (gap) {
    failures.push(`${caseId}: ${gap}`)
    continue
  }

  const boneType = boneTypeOf(basicInfo, measurements)
  if (DRY_RUN) {
    console.log(`  would write ${caseId} (${boneType}) → ${MEASUREMENT_TABLES[boneType]}`)
    written++
    continue
  }

  try {
    const investigatorId = await resolveInvestigatorId(basicInfo.userName, basicInfo.email)

    const { error: caseErr } = await db
      .from('kgc_cases')
      .upsert(caseRow(caseId, basicInfo, boneType, investigatorId), { onConflict: 'case_id' })
    if (caseErr) throw caseErr

    const { error: measureErr } = await db
      .from(MEASUREMENT_TABLES[boneType])
      .upsert(measurementRow(caseId, boneType, measurements), { onConflict: 'case_id' })
    if (measureErr) throw measureErr

    const { error: predictErr } = await db
      .from('kgc_predictions')
      .insert(predictionRow(caseId, boneType, row.predictions || {}))
    if (predictErr) throw predictErr

    written++
    console.log(`  ${caseId} (${boneType})`)
  } catch (err) {
    failures.push(`${caseId}: ${err?.message || err}`)
  }
}

console.log(`\n${written} written, ${skipped} already present, ${failures.length} failed`)
if (failures.length) {
  console.log('\nNot backfilled:')
  for (const f of failures) console.log(`  ${f}`)
}
