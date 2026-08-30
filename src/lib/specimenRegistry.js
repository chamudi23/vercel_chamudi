/**
 * specimenRegistry.js
 * ===================
 * READ-ONLY bridge from the **Automated Skeletal Analysis System** (ASA,
 * Module 3.1 — IT22299802) to the **Centralized Specimen Record Management**
 * system (CSRM, the shared OAHRIS specimen catalogue).
 *
 * ── Integration contract ────────────────────────────────────────────────
 *  1. CSRM is treated as an EXTERNAL, IMMUTABLE system of record.
 *     • No CSRM source file is imported, edited or re-exported.
 *     • No CSRM table, column, view, index, trigger or policy is created
 *       or altered by this module.
 *     • Every statement issued from here is a `SELECT` (PostgREST GET).
 *       There is no insert / update / upsert / delete / rpc in this file.
 *  2. ASA keeps its own schema untouched as well: nothing read from CSRM is
 *     written back into the `analyses` table, and no ASA attribute, form
 *     field or prediction rule is changed. Similar cases are a *derived,
 *     ephemeral read* rendered at view time only.
 *  3. Coupling is by DATA CONTRACT (table + column names), not by code.
 *     If CSRM renames a column, only the CSRM_COLUMNS map below changes.
 *
 * ── Tables consumed (all read-only) ─────────────────────────────────────
 *   specimens        — catalogue master record (specimen_id PK, bone_type,
 *                      site_name, district, province, time_period,
 *                      preservation_state, excavation_year, side,
 *                      sex_estimate, age_estimate, created_at, …)
 *   measurements     — metric observations per specimen
 *                      (specimen_id FK, bone_type, measurement_type,
 *                       value, unit, notes)
 *   skeletal_inputs  — morphological (non-metric) observations per specimen
 *                      (specimen_id FK, skull_brow_ridge, jaw_shape,
 *                       cranial_suture_status, subpubic_angle, … )
 *
 * The CSRM project is the SHARED OAHRIS Supabase project. A dedicated
 * read-only client is created here (rather than importing src/supabase.js)
 * so that a mis-configured shared client can never break the ASA module —
 * the similar-cases panel degrades to an empty state instead.
 */

import { createClient } from '@supabase/supabase-js'

/* ------------------------------------------------------------------ *
 * 1. Connection — shared OAHRIS project (CSRM owns the schema)
 * ------------------------------------------------------------------ */

const CSRM_URL =
  import.meta.env.VITE_CSRM_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://yiamplfqhyurgxxbpeur.supabase.co'

const CSRM_ANON_KEY =
  import.meta.env.VITE_CSRM_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpYW1wbGZxaHl1cmd4eGJwZXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTcyMDEsImV4cCI6MjA5MTQzMzIwMX0.kdeAKefc9PZyjg5PwnJ9nt0kydjFthv_yHvfqhlziLU'

let _client = null
let _clientFailed = false

/** Lazily built read-only CSRM client. Returns null if unconfigured. */
function csrm() {
  if (_client || _clientFailed) return _client
  try {
    _client = createClient(CSRM_URL, CSRM_ANON_KEY)
  } catch (err) {
    console.error('[csrm] client unavailable:', err?.message || err)
    _clientFailed = true
  }
  return _client
}

/* ------------------------------------------------------------------ *
 * 2. Data contract — the only place CSRM names appear
 * ------------------------------------------------------------------ */

export const CSRM_TABLES = {
  specimens: 'specimens',
  measurements: 'measurements',
  skeletalInputs: 'skeletal_inputs',
}

/**
 * Columns without which a candidate cannot be scored or rendered at all.
 * If one of these ever disappears from CSRM the panel genuinely cannot work.
 */
const SPECIMEN_REQUIRED_COLUMNS = [
  'specimen_id', 'skeleton_code', 'bone_type', 'side', 'site_name',
  'district', 'province', 'excavation_year', 'time_period',
  'preservation_state', 'location_stored', 'sex_estimate', 'age_estimate',
  'height_estimate', 'created_at',
]

/**
 * Columns that only enrich the record popup — no scoring channel reads them.
 * CSRM owns this schema and has dropped a column here before (`burial_context`
 * vanished when the catalogue table was rebuilt on 30 Aug 2026), which failed
 * the whole SELECT with PostgREST 42703 and blanked the panel. Anything listed
 * here is now dropped and retried instead of taking the panel down with it.
 */
const SPECIMEN_OPTIONAL_COLUMNS = ['burial_context']

/** Optional columns this session has proven absent — never requested again. */
const _absentColumns = new Set()

/** PostgREST: undefined_column. The one error we can recover from. */
const UNDEFINED_COLUMN = '42703'

/** The optional columns still believed to exist. */
function liveOptionalColumns() {
  return SPECIMEN_OPTIONAL_COLUMNS.filter((c) => !_absentColumns.has(c))
}

function specimenSelect() {
  return [...SPECIMEN_REQUIRED_COLUMNS, ...liveOptionalColumns()].join(', ')
}

/**
 * Name the column PostgREST complained about, so only that one is dropped.
 * Message shape: `column specimens.burial_context does not exist`.
 */
function missingColumnFrom(error) {
  if (error?.code !== UNDEFINED_COLUMN) return null
  const match = /column\s+\S*?\.?(\w+)\s+does not exist/i.exec(error.message || '')
  const name = match?.[1]
  return name && SPECIMEN_OPTIONAL_COLUMNS.includes(name) ? name : null
}

export const CSRM_COLUMNS = {
  get specimens() {
    return specimenSelect()
  },
  measurements: 'measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes',
  skeletalInputs: '*',
}

/** Hard ceiling on rows pulled per candidate query (keeps the panel light). */
const CANDIDATE_LIMIT = 300

/* ------------------------------------------------------------------ *
 * 3. Read helpers — SELECT only
 * ------------------------------------------------------------------ */

/**
 * Candidate specimens whose `bone_type` matches any of the supplied
 * anatomical tokens (case-insensitive contains).
 *
 * @param {string[]} tokens  e.g. ['skull', 'mandible', 'maxilla']
 * @returns {Promise<{ rows: object[], error: Error|null }>}
 */
export async function fetchSpecimensByBoneTokens(tokens) {
  const db = csrm()
  if (!db) return { rows: [], error: new Error('Specimen registry is not configured.') }
  if (!tokens?.length) return { rows: [], error: null }

  // PostgREST `or=(a.ilike.*x*,b.ilike.*y*)` — a single round trip, no N+1.
  const orFilter = tokens.map((t) => `bone_type.ilike.*${t}*`).join(',')

  // One attempt per optional column, plus the required-only attempt: a column
  // CSRM has dropped costs one extra round trip on the first read of the
  // session and none afterwards, because `_absentColumns` remembers it.
  for (let attempt = 0; attempt <= SPECIMEN_OPTIONAL_COLUMNS.length; attempt++) {
    const { data, error } = await db
      .from(CSRM_TABLES.specimens)
      .select(specimenSelect())
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(CANDIDATE_LIMIT)

    if (!error) return { rows: data || [], error: null }

    const missing = missingColumnFrom(error)
    if (!missing) {
      console.error('[csrm] specimens read failed:', error.message)
      return { rows: [], error }
    }

    // CSRM no longer publishes this column. Drop it and read again — a record
    // detail field is worth losing, the whole Similar Cases panel is not.
    _absentColumns.add(missing)
    console.warn(
      `[csrm] specimens.${missing} is not in the catalogue schema; ` +
        'continuing without it. That field will be blank in the record popup.'
    )
  }

  return { rows: [], error: null }
}

/** Metric observations for the given specimen ids. */
export async function fetchMeasurementsFor(specimenIds) {
  const db = csrm()
  if (!db || !specimenIds?.length) return { rows: [], error: null }

  const { data, error } = await db
    .from(CSRM_TABLES.measurements)
    .select(CSRM_COLUMNS.measurements)
    .in('specimen_id', specimenIds)

  if (error) {
    console.error('[csrm] measurements read failed:', error.message)
    return { rows: [], error: null } // non-fatal: matching degrades, panel still renders
  }
  return { rows: data || [], error: null }
}

/** Morphological (non-metric) observations for the given specimen ids. */
export async function fetchSkeletalInputsFor(specimenIds) {
  const db = csrm()
  if (!db || !specimenIds?.length) return { rows: [], error: null }

  const { data, error } = await db
    .from(CSRM_TABLES.skeletalInputs)
    .select(CSRM_COLUMNS.skeletalInputs)
    .in('specimen_id', specimenIds)

  if (error) {
    console.error('[csrm] skeletal_inputs read failed:', error.message)
    return { rows: [], error: null } // non-fatal
  }
  return { rows: data || [], error: null }
}

/** Group an array of rows into a Map keyed by specimen_id. */
export function groupBySpecimen(rows) {
  const map = new Map()
  for (const r of rows || []) {
    const key = r.specimen_id
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(r)
  }
  return map
}
