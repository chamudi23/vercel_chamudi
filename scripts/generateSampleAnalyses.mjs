/**
 * generateSampleAnalyses.mjs
 * ==========================
 * Emits `kgc_seed_sample_analyses.sql` — a demonstration set of saved
 * analyses covering all six ASA bone types and all three key features
 * (Gender Prediction, Age Estimation, Height Calculation).
 *
 * ── Why generated rather than hand-written ──────────────────────────────
 * The `predictions` column is not authored here. Each case declares only its
 * observations, and the REAL `computePredictions()` from KgcStep3Review.jsx
 * produces the biological profile. Seeded reports therefore always agree with
 * what the application computes for the same input — a hand-written seed
 * would silently drift the first time a rule changed.
 *
 * ── Provenance of the values ────────────────────────────────────────────
 * These are SYNTHETIC REFERENCE CASES, not real individuals, and the file
 * says so in its header. They are not drawn from any excavation.
 *
 * Metric values are chosen to sit either side of the sectioning points and
 * within the ranges the project's own methodology already commits to —
 * OAHRIS_Skeletal_Analysis_Methodology.md, after Bass, W. M. (2005) Human
 * Osteology, 5th ed., with the South-Asian adjustments documented there:
 *
 *   femur head diameter   > 43 mm male / < 41 mm female  (§3.3)
 *   stature from femur    2.15 x femur(cm) + 72.57       (§5)
 *   stature from humerus  2.68 x humerus(cm) + 83.19     (§5)
 *
 * Long-bone lengths are kept inside the normal adult human range (femur
 * ~390-500 mm, humerus ~270-350 mm) so that every derived stature lands in a
 * plausible 150-180 cm band. Morphological scores use the closed vocabularies
 * the Step-2 form already defines.
 *
 * Run:  node scripts/generateSampleAnalyses.mjs
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Resolved from the invocation directory rather than import.meta.url: the
// script is bundled through esbuild before running (it imports a .jsx module),
// so the bundle's own location is not the repository.
const ROOT = process.cwd()

/* ------------------------------------------------------------------ *
 * The sample set — observations only. Predictions are computed.
 * ------------------------------------------------------------------ *
 * `feature` records which key feature each case is there to demonstrate,
 * so the coverage table at the end of the SQL can be generated, not claimed.
 */
export const SAMPLE_CASES = [
  /* ---- Skull: sex from brow ridge + mastoid, age from suture ---- */
  {
    id: 'SAMPLE-SKU-01', location: 'Anuradhapura', dateFound: '2024-02-11',
    note: 'Robust male cranium, sutures still open — young adult.',
    feature: ['Gender', 'Age'],
    measurements: {
      bonesType: 'Skull', browRidge: 'prominent', mastoidSize: 'more-30mm',
      jawShape: 'robust', cranialSuture: 'open',
    },
  },
  {
    id: 'SAMPLE-SKU-02', location: 'Mihintale', dateFound: '2024-03-04',
    note: 'Gracile cranium, moderate suture closure — middle adult female.',
    feature: ['Gender', 'Age'],
    measurements: {
      bonesType: 'Skull', browRidge: 'smooth', mastoidSize: 'less-25mm',
      jawShape: 'rounded', cranialSuture: 'moderate-closure',
    },
  },
  {
    id: 'SAMPLE-SKU-03', location: 'Pomparippu', dateFound: '2023-11-19',
    note: 'Obliterated sutures — oldest cranial case in the set.',
    feature: ['Gender', 'Age'],
    measurements: {
      bonesType: 'Skull', browRidge: 'thick', mastoidSize: 'more-30mm',
      jawShape: 'u-shaped', cranialSuture: 'completely-closed',
    },
  },

  /* ---- Pelvis: Bass's most reliable region for sex ---- */
  {
    id: 'SAMPLE-PEL-01', location: 'Ibbankatuwa', dateFound: '2024-01-22',
    note: 'Wide subpubic angle and sciatic notch — female; billowed symphysis.',
    feature: ['Gender', 'Age'],
    measurements: {
      bonesType: 'Pelvis', subpubicAngle: 'wide', sciaticNotch: 'wide',
      pubicSymphysis: 'smooth-flat',
    },
  },
  {
    id: 'SAMPLE-PEL-02', location: 'Bellanbandi Palassa', dateFound: '2023-09-30',
    note: 'Narrow angle and notch — male; eroded symphyseal face.',
    feature: ['Gender', 'Age'],
    measurements: {
      bonesType: 'Pelvis', subpubicAngle: 'narrow', sciaticNotch: 'narrow',
      pubicSymphysis: 'degenerated-eroded',
    },
  },

  /* ---- Lower Limb: the femur drives sex AND stature ---- */
  {
    id: 'SAMPLE-LOW-01', location: 'Anuradhapura', dateFound: '2024-04-08',
    note: 'Large femoral head (> 43 mm) — male; fused plates; tall stature.',
    feature: ['Gender', 'Age', 'Height'],
    measurements: {
      bonesType: 'Lower Limb', femurLength: '458', femurHeadDiameter: '46.2',
      growthPlate: 'fused',
    },
  },
  {
    id: 'SAMPLE-LOW-02', location: 'Kantarodai', dateFound: '2024-05-16',
    note: 'Small femoral head (< 41 mm) — female; shorter stature.',
    feature: ['Gender', 'Age', 'Height'],
    measurements: {
      bonesType: 'Lower Limb', femurLength: '412', femurHeadDiameter: '39.4',
      growthPlate: 'fused',
    },
  },
  {
    id: 'SAMPLE-LOW-03', location: 'Godavaya', dateFound: '2023-12-02',
    note: 'Unfused epiphyses — subadult. Head diameter indeterminate (41-43 mm).',
    feature: ['Gender', 'Age', 'Height'],
    measurements: {
      bonesType: 'Lower Limb', femurLength: '396', femurHeadDiameter: '42.0',
      growthPlate: 'unfused',
    },
  },

  /* ---- Upper Limb: robusticity for sex, humerus for stature ---- */
  {
    id: 'SAMPLE-UPP-01', location: 'Mihintale', dateFound: '2024-06-21',
    note: 'Robust humerus with marked deltoid tuberosity — male.',
    feature: ['Gender', 'Height'],
    measurements: {
      bonesType: 'Upper Limb', humerusLength: '332', boneRobusticity: 'robust',
    },
  },
  {
    id: 'SAMPLE-UPP-02', location: 'Pomparippu', dateFound: '2024-07-03',
    note: 'Gracile humerus, light muscle markings — female.',
    feature: ['Gender', 'Height'],
    measurements: {
      bonesType: 'Upper Limb', humerusLength: '296', boneRobusticity: 'gracile',
    },
  },

  /* ---- Thorax: sternal rib end phases (age only) ---- */
  {
    id: 'SAMPLE-THO-01', location: 'Ibbankatuwa', dateFound: '2024-02-27',
    note: 'Smooth, billowy sternal rib end — young adult.',
    feature: ['Age'],
    measurements: { bonesType: 'Thorax', ribShape: 'smooth', sternumLength: '148' },
  },
  {
    id: 'SAMPLE-THO-02', location: 'Bellanbandi Palassa', dateFound: '2023-10-14',
    note: 'Irregular, porous rib end with sharp margins — older adult.',
    feature: ['Age'],
    measurements: { bonesType: 'Thorax', ribShape: 'irregular', sternumLength: '162' },
  },

  /* ---- Teeth: eruption and wear (age only) ---- */
  {
    id: 'SAMPLE-TEE-01', location: 'Kantarodai', dateFound: '2024-03-19',
    note: 'Deciduous dentition — infant/early child.',
    feature: ['Age'],
    measurements: {
      bonesType: 'Teeth', teethType: 'deciduous', dentalWear: 'none',
      eruptionStage: 'partial',
    },
  },
  {
    id: 'SAMPLE-TEE-02', location: 'Godavaya', dateFound: '2024-04-30',
    note: 'Mixed dentition — child, permanent teeth erupting.',
    feature: ['Age'],
    measurements: {
      bonesType: 'Teeth', teethType: 'mixed', dentalWear: 'mild',
      eruptionStage: 'partial',
    },
  },
  {
    id: 'SAMPLE-TEE-03', location: 'Anuradhapura', dateFound: '2023-08-25',
    note: 'Permanent dentition with severe occlusal wear — older adult.',
    feature: ['Age'],
    measurements: {
      bonesType: 'Teeth', teethType: 'permanent', dentalWear: 'severe',
      eruptionStage: 'complete',
    },
  },
]

/* ------------------------------------------------------------------ *
 * SQL emission
 * ------------------------------------------------------------------ */

/** Single-quote escaping for a Postgres string literal. */
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`
const jsonLit = (o) => `${lit(JSON.stringify(o))}::jsonb`

export function buildSql(computePredictions) {
  const rows = SAMPLE_CASES.map((c) => {
    const basicInfo = {
      caseId: c.id,
      userName: 'OAHRIS Reference Set',
      location: c.location,
      dateFound: c.dateFound,
      bonesType: c.measurements.bonesType,
      analysisDate: c.dateFound,
      notes: c.note,
    }
    // The application's own rules produce the profile — not this script.
    const predictions = computePredictions(c.measurements)
    return { c, basicInfo, predictions }
  })

  const coverage = ['Gender', 'Age', 'Height'].map((f) => {
    const n = rows.filter((r) => r.c.feature.includes(f)).length
    return `--    ${f.padEnd(7)} ${String(n).padStart(2)} case(s)`
  })

  const byType = {}
  for (const r of rows) {
    const t = r.c.measurements.bonesType
    byType[t] = (byType[t] || 0) + 1
  }

  const header = `-- ============================================================================
--  OAHRIS — Automated Skeletal Analysis: SAMPLE ANALYSES
--
--  GENERATED FILE — do not edit by hand.
--    node scripts/generateSampleAnalyses.mjs
--
--  ⚠️  SYNTHETIC DATA. These ${rows.length} cases are demonstration records. They are
--      NOT real individuals and NOT drawn from any excavation. Every case id
--      is prefixed SAMPLE- so they can be told apart from real work at a
--      glance, and removed in one statement (see ROLLBACK at the foot).
--
--  WHAT THIS IS FOR
--  ----------------
--  Exercising all three key features of the module with data that reaches
--  every branch of the prediction rules:
${coverage.join('\n')}
--
--  Bone types covered: ${Object.entries(byType).map(([t, n]) => `${t} (${n})`).join(', ')}
--
--  HOW THE PREDICTIONS WERE PRODUCED
--  ---------------------------------
--  Not by hand. The generator imports the real computePredictions() from
--  src/pages/NewAnalysis/KgcStep3Review.jsx and runs it over each case's
--  measurements, so these rows agree exactly with what the app computes for
--  the same input. Re-run the generator after any rule change.
--
--  MEASUREMENT VALUES
--  ------------------
--  Chosen to sit either side of the sectioning points in this project's own
--  OAHRIS_Skeletal_Analysis_Methodology.md (after Bass 2005, with the
--  documented South-Asian adjustments): femur head > 43 mm male / < 41 mm
--  female, and stature by the Trotter & Gleser formulae Bass reproduces.
--  Long-bone lengths are held inside the normal adult range so every derived
--  stature is plausible.
--
--  SAFE TO RUN TWICE — upserts on case_id.
-- ============================================================================

insert into public.analyses (case_id, basic_info, measurements, predictions) values`

  const values = rows
    .map(
      ({ c, basicInfo, predictions }) =>
        `  -- ${c.measurements.bonesType} · ${c.feature.join(' + ')}\n` +
        `  (${lit(c.id)}, ${jsonLit(basicInfo)}, ${jsonLit(c.measurements)}, ${jsonLit(predictions)})`
    )
    .join(',\n')

  const footer = `
on conflict (case_id) do update
  set basic_info   = excluded.basic_info,
      measurements = excluded.measurements,
      predictions  = excluded.predictions;


-- ----------------------------------------------------------------------------
-- VERIFY — every sample case, and what it demonstrates.
-- ----------------------------------------------------------------------------
select case_id,
       basic_info ->> 'bonesType' as bone_type,
       predictions ->> 'gender'     as gender,
       predictions ->> 'ageRange'   as age_range,
       predictions ->> 'height'     as height,
       predictions ->> 'confidence' as confidence
from public.analyses
where case_id like 'SAMPLE-%'
order by case_id;


-- ----------------------------------------------------------------------------
-- ROLLBACK — removes the sample set and nothing else.
--   delete from public.analyses where case_id like 'SAMPLE-%';
-- ----------------------------------------------------------------------------
`

  return `${header}\n${values}\n${footer}`
}

/* ------------------------------------------------------------------ *
 * CLI
 * ------------------------------------------------------------------ */

const { computePredictions } = await import('../src/pages/NewAnalysis/KgcStep3Review.jsx')
const sql = buildSql(computePredictions)
const out = join(ROOT, 'kgc_seed_sample_analyses.sql')
writeFileSync(out, sql, 'utf8')

console.log(`wrote ${out}`)
console.log(`${SAMPLE_CASES.length} cases`)
for (const c of SAMPLE_CASES) {
  const p = computePredictions(c.measurements)
  console.log(
    `  ${c.id.padEnd(15)} ${c.measurements.bonesType.padEnd(11)} ` +
      `sex=${String(p.gender).padEnd(13)} age=${String(p.ageRange).padEnd(8)} ` +
      `height=${String(p.height).padEnd(9)} conf=${p.confidence}`
  )
}
