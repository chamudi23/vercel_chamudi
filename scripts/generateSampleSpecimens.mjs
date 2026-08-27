/**
 * generateSampleSpecimens.mjs
 * ===========================
 * Emits `csrm_seed_50_specimens.sql` — 50 catalogue specimens with their
 * morphological observations and metric measurements, for exercising the
 * Automated Skeletal Analysis module end to end.
 *
 * ── On provenance, stated plainly ───────────────────────────────────────
 * These are SYNTHETIC REFERENCE SPECIMENS. They are not real individuals and
 * were not excavated. No public dataset of Sri Lankan osteoarchaeological
 * remains exists in structured form, and the closest global sets (the Goldman
 * Osteometric Data Set; the San Pablo Convent femoral series) are unreachable
 * or unsuitable — Goldman's host refuses connections and carries no
 * morphological scores at all, and San Pablo is Spanish juveniles aged 2-16.
 *
 * Labelling foreign individuals as Anuradhapura or Mihintale finds would
 * fabricate provenance inside a research catalogue, which is worse than
 * clearly-marked reference data. So the *structure* is real and the
 * *individuals* are not:
 *
 *   - Sites, districts, provinces and periods are genuine Sri Lankan
 *     archaeology, and correctly paired: Pomparippu and Ibbankatuwa are Iron
 *     Age megalithic burial sites, Bellanbandi Palassa and Fa Hien Cave are
 *     Mesolithic/Late Pleistocene, Anuradhapura and Tissamaharama are Early
 *     Historic.
 *   - Measurements follow the regression relationships in this project's own
 *     methodology paper (Bass 2005; Trotter & Gleser as reproduced there),
 *     inverted so that a recorded stature yields the bone length that would
 *     have produced it.
 *   - Sectioning points are the project's own: femur head > 43 mm male,
 *     < 41 mm female, 41-43 indeterminate.
 *
 * ── Internal consistency is the point ───────────────────────────────────
 * Morphology is DERIVED from each specimen's sex and age band rather than
 * typed in, so a female specimen is gracile throughout and an older one shows
 * advanced suture closure and dental wear. Without that, running ASA over
 * these records would test nothing: the estimate would disagree with the
 * catalogue for reasons that are artefacts of the fixture.
 *
 * Six specimens are deliberately AMBIGUOUS — indeterminate sex, conflicting
 * indicators, or a femur head inside the 41-43 mm overlap. A fixture where
 * every case resolves cleanly would flatter the model rather than test it.
 *
 * Deterministic: a seeded generator, so re-running produces identical SQL.
 *
 * Run:  node scripts/generateSampleSpecimens.mjs
 */

import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { computePredictions } from '../src/pages/NewAnalysis/KgcStep3Review.jsx'

const ROOT = process.cwd()
const COUNT = 50
const FIRST_ID = 927

// Identifier prefixes for this reference set. CHASA marks it as belonging to
// the Automated Skeletal Analysis fixture rather than the excavated
// catalogue, so a real record is never mistaken for one of these.
const SPEC_PREFIX = 'CHASA-'
const INPUT_PREFIX = 'CH-'

/* ------------------------------------------------------------------ *
 * Deterministic pseudo-randomness
 * ------------------------------------------------------------------ */
let seed = 20260824
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const between = (lo, hi, dp = 1) => Number((lo + rnd() * (hi - lo)).toFixed(dp))
const int = (lo, hi) => Math.floor(lo + rnd() * (hi - lo + 1))

/* ------------------------------------------------------------------ *
 * Real Sri Lankan archaeology — site, district, province, period
 * ------------------------------------------------------------------ */
const SITES = [
  { site: 'Anuradhapura Citadel', district: 'Anuradhapura', province: 'North Central', period: 'Early Historic' },
  { site: 'Mihintale',            district: 'Anuradhapura', province: 'North Central', period: 'Early Historic' },
  { site: 'Pomparippu',           district: 'Puttalam',     province: 'North Western', period: 'Iron Age' },
  { site: 'Ibbankatuwa',          district: 'Matale',       province: 'Central',       period: 'Iron Age' },
  { site: 'Bellanbandi Palassa',  district: 'Ratnapura',    province: 'Sabaragamuwa',  period: 'Mesolithic' },
  { site: 'Fa Hien Cave',         district: 'Kalutara',     province: 'Western',       period: 'Upper Paleolithic' },
  { site: 'Batadomba Lena',       district: 'Ratnapura',    province: 'Sabaragamuwa',  period: 'Upper Paleolithic' },
  { site: 'Kantarodai',           district: 'Jaffna',       province: 'Northern',      period: 'Early Historic' },
  { site: 'Godavaya',             district: 'Hambantota',   province: 'Southern',      period: 'Early Historic' },
  { site: 'Tissamaharama',        district: 'Hambantota',   province: 'Southern',      period: 'Early Historic' },
  { site: 'Polonnaruwa',          district: 'Polonnaruwa',  province: 'North Central', period: 'Early Historic' },
  { site: 'Sigiriya',             district: 'Matale',       province: 'Central',       period: 'Early Historic' },
]

const BURIAL = {
  'Iron Age': ['Megalithic cist burial', 'Urn burial, secondary interment', 'Megalithic slab-lined grave'],
  'Early Historic': ['Primary extended inhumation', 'Monastic cemetery context', 'Habitation deposit, disturbed'],
  Mesolithic: ['Flexed primary burial, cave floor', 'Occupation layer, scattered'],
  'Upper Paleolithic': ['Cave deposit, stratified', 'Rock-shelter occupation layer'],
}

const STORES = [
  'OAHRIS Research Store — Cabinet A11', 'OAHRIS Research Store — Cabinet B04',
  'OAHRIS Research Store — Cabinet C07', 'OAHRIS Research Store — Cabinet D02',
  'Department of Archaeology, Colombo — Bay 3', 'Field laboratory, temporary holding',
]

/* Elements grouped so every ASA analysis type has candidates to match. */
const GROUPS = [
  { group: 'Skull',       n: 12, elements: ['Skull', 'Cranium', 'Mandible', 'Maxilla', 'Frontal'] },
  { group: 'Lower Limb',  n: 11, elements: ['Femur', 'Tibia', 'Fibula', 'Patella', 'Calcaneus'] },
  { group: 'Upper Limb',  n: 9,  elements: ['Humerus', 'Radius', 'Ulna', 'Scapula', 'Clavicle'] },
  { group: 'Pelvis',      n: 8,  elements: ['Pelvis', 'Ilium', 'Sacrum', 'Innominate'] },
  { group: 'Thorax',      n: 5,  elements: ['Rib', 'Sternum', 'Vertebra'] },
  { group: 'Teeth',       n: 5,  elements: ['Molar', 'Premolar', 'Incisor', 'Canine'] },
]

const AGE_BANDS = [
  { label: '18-25', mid: 21, suture: 'Open',              symph: 'Smooth, billowing face', plate: 'Partially fused', rib: 'Smooth',    wear: 'Mild' },
  { label: '25-35', mid: 30, suture: 'Partially open',    symph: 'Flat with ridges',       plate: 'Fused',           rib: 'Smooth',    wear: 'Mild' },
  { label: '35-45', mid: 40, suture: 'Moderately closed', symph: 'Rough, granular',        plate: 'Fused',           rib: 'Scalloped', wear: 'Moderate' },
  { label: '45-55', mid: 50, suture: 'Mostly closed',     symph: 'Rough, granular',        plate: 'Fused',           rib: 'Scalloped', wear: 'Moderate' },
  { label: '55+',   mid: 62, suture: 'Completely closed', symph: 'Degenerated, eroded',    plate: 'Fused',           rib: 'Irregular, porous', wear: 'Severe' },
  { label: '12-18', mid: 15, suture: 'Open',              symph: 'Smooth, billowing face', plate: 'Unfused',         rib: 'Smooth',    wear: 'None' },
]

/* ------------------------------------------------------------------ *
 * Derive a coherent individual
 * ------------------------------------------------------------------ */
function individual(i) {
  // Six deliberately ambiguous cases, spaced through the set.
  const ambiguous = i % 8 === 3 && i < 48
  const sex = ambiguous ? 'Unknown' : pick(['Male', 'Female'])
  const age = pick(AGE_BANDS)

  // Stature first, then the bone lengths that would have produced it —
  // the methodology's regressions run backwards.
  const stature =
    sex === 'Male' ? between(160, 175) : sex === 'Female' ? between(148, 162) : between(155, 168)

  const femurMm = Math.round(((stature - 72.57) / 2.15) * 10)
  const humerusMm = Math.round(((stature - 83.19) / 2.68) * 10)

  const femurHead =
    sex === 'Male' ? between(43.5, 48) : sex === 'Female' ? between(37, 40.5) : between(41.2, 42.8)

  const robust = sex === 'Male' ? 'Robust' : sex === 'Female' ? 'Gracile' : 'Moderate'

  return { sex, age, stature, femurMm, humerusMm, femurHead, robust, ambiguous }
}

/** Morphology for the bone group, consistent with sex and age. */
function morphology(group, p) {
  const m = {}
  if (group === 'Skull') {
    m.skull_brow_ridge = p.sex === 'Male' ? pick(['Prominent', 'Thick'])
      : p.sex === 'Female' ? pick(['Smooth', 'Less developed']) : 'Moderate'
    m.mastoid_process_size = p.sex === 'Male' ? 'Large, greater than 30mm'
      : p.sex === 'Female' ? 'Small, less than 25mm' : 'Medium, 25 to 30mm'
    m.jaw_shape = p.sex === 'Male' ? pick(['Robust', 'V-shaped']) : pick(['U-shaped', 'Rounded'])
    m.cranial_suture_status = p.age.suture
    m.skull_size = p.sex === 'Male' ? 'Large' : p.sex === 'Female' ? 'Small' : 'Medium'
    m.orbital_shape = p.sex === 'Male' ? 'Square, blunt margin' : 'Rounded, sharp margin'
  }
  if (group === 'Pelvis') {
    // NUMERIC column: the angle in degrees, not a description. 90 degrees is
    // the sectioning point, so a female pelvis sits above it and a male below.
    m.subpubic_angle = p.sex === 'Female' ? between(92, 104)
      : p.sex === 'Male' ? between(62, 78) : between(86, 89)
    m.sciatic_notch_width = p.sex === 'Female' ? 'Wide and shallow'
      : p.sex === 'Male' ? 'Narrow and deep' : 'Intermediate'
    m.pelvic_inlet_shape = p.sex === 'Female' ? 'Circular, broad' : 'Heart-shaped'
    m.pubic_symphysis_stage = p.age.symph
    m.pelvis_size = p.sex === 'Male' ? 'Large' : 'Small'
  }
  if (group === 'Upper Limb') {
    m.humerus_length = p.humerusMm
    m.humerus_head_diameter = Number(((p.sex === 'Male' ? 46 : 41) + rnd() * 3).toFixed(1))
    m.upper_limb_robusticity = p.robust
    m.clavicle_robusticity = p.robust
  }
  if (group === 'Lower Limb') {
    m.femur_length = p.femurMm
    m.femur_head_diameter = p.femurHead
    m.tibia_length = Math.round(p.femurMm * 0.81)
    m.lower_limb_robusticity = p.robust
    m.growth_plate = p.age.plate
  }
  if (group === 'Thorax') {
    m.rib_shape = p.age.rib
    m.sternum_length = int(140, 175)
    m.thoracic_size = p.sex === 'Male' ? 'Large' : 'Small'
  }
  if (group === 'Teeth') {
    m.teeth_type = p.age.label === '12-18' ? 'Mixed dentition' : 'Permanent'
    m.dental_wear = p.age.wear
    m.tooth_eruption_stage = p.age.label === '12-18' ? 'Partially erupted' : 'Fully erupted'
  }
  return m
}

/**
 * The same individual expressed in ASA's Step-2 vocabulary.
 *
 * CSRM records morphology as free text ("Large, greater than 30mm"); the ASA
 * form offers closed dropdowns ("> 30mm"). Anyone typing these records into
 * the analysis wizard needs the second, so it is emitted separately rather
 * than left for them to translate — which is exactly where a manual test
 * would otherwise pick up errors that look like model errors.
 *
 * Fields the form does not offer are left blank on purpose. ASA treats a
 * blank as "not observed", drops that evidence channel and redistributes its
 * weight, which is the correct behaviour to exercise.
 */
function asaFields(group, p) {
  const f = {}
  if (group === 'Skull') {
    f.browRidge = p.sex === 'Male' ? 'Prominent' : p.sex === 'Female' ? 'Smooth' : 'Moderate'
    f.mastoidSize = p.sex === 'Male' ? '> 30mm' : p.sex === 'Female' ? '< 25mm' : '25 - 30mm'
    f.jawShape = p.sex === 'Male' ? 'Robust' : p.sex === 'Female' ? 'U Shaped' : 'Rounded'
    f.cranialSuture = {
      Open: 'Open', 'Partially open': 'Partially Open', 'Moderately closed': 'Moderate Closure',
      'Mostly closed': 'Mostly Closed', 'Completely closed': 'Completely Closed',
    }[p.age.suture]
  }
  if (group === 'Pelvis') {
    f.subpubicAngle = p.sex === 'Female' ? 'Wide' : p.sex === 'Male' ? 'Narrow' : ''
    f.sciaticNotch = p.sex === 'Female' ? 'Wide' : p.sex === 'Male' ? 'Narrow' : ''
    f.pubicSymphysis = {
      'Smooth, billowing face': 'Smooth / Flat', 'Flat with ridges': 'Moderate / Flat Ridges',
      'Rough, granular': 'Rough / Granular', 'Degenerated, eroded': 'Degenerated / Eroded',
    }[p.age.symph]
  }
  if (group === 'Upper Limb') {
    f.humerusLength = p.humerusMm
    // ASA offers only Gracile or Robust. An indeterminate individual has
    // neither, so the field stays empty rather than being forced.
    f.boneRobusticity = p.robust === 'Moderate' ? '' : p.robust
  }
  if (group === 'Lower Limb') {
    f.femurLength = p.femurMm
    f.femurHeadDiameter = p.femurHead
    f.growthPlate = { Unfused: 'Unfused', 'Partially fused': 'Partially Fused', Fused: 'Fused' }[p.age.plate]
  }
  if (group === 'Thorax') {
    f.ribShape = { Smooth: 'Smooth', Scalloped: 'Scalloped Edges', 'Irregular, porous': 'Irregular / Porous' }[p.age.rib]
    f.sternumLength = int(140, 175)
  }
  if (group === 'Teeth') {
    f.teethType = p.age.label === '12-18' ? 'Mixed' : 'Permanent'
    f.dentalWear = p.age.wear
    f.eruptionStage = p.age.label === '12-18' ? 'Partial' : 'Complete'
  }
  return f
}

/** Metric rows for the measurements table, matching the element. */
function metrics(specimenId, element, group, p) {
  const rows = []
  // measurement_id is NOT NULL with no default, and a single bone can carry
  // several measurements (a femur has both a length and a head diameter), so
  // the catalogue's M-<specimen> convention needs a suffix to stay unique.
  const add = (type, value, unit, notes) =>
    rows.push({
      measurement_id: `M-${specimenId}-${rows.length + 1}`,
      specimen_id: specimenId, bone_type: element, measurement_type: type, value, unit, notes,
    })

  if (group === 'Lower Limb' && element === 'Femur') {
    add('Maximum Length', p.femurMm, 'mm', 'Osteometric board, complete bone')
    add('Head Diameter', p.femurHead, 'mm', 'Vertical head diameter, sliding caliper')
  } else if (group === 'Upper Limb' && element === 'Humerus') {
    add('Maximum Length', p.humerusMm, 'mm', 'Osteometric board, complete bone')
    add('Head Diameter', Number((p.sex === 'Male' ? 46.5 : 41.5) + rnd() * 2).toFixed(1), 'mm', 'Vertical head diameter')
  } else if (element === 'Tibia') {
    add('Maximum Length', Math.round(p.femurMm * 0.81), 'mm', 'Osteometric board')
  } else if (element === 'Sternum') {
    add('Maximum Length', int(140, 175), 'mm', 'Manubrium to xiphoid junction')
  } else {
    // Fragmentary material: a preserved length is a lower bound, not the
    // bone's length. ASA drops these from metric scoring by design.
    add('Maximum Preserved Length', between(40, 130), 'mm',
        'Between most distant preserved landmarks; fragmentary, not a complete-bone value')
  }
  return rows
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */
const specimens = []
const inputs = []
const measurements = []
const asaRows = []

let n = 0
for (const g of GROUPS) {
  for (let k = 0; k < g.n; k++) {
    const idNum = FIRST_ID + n
    const specimenId = `${SPEC_PREFIX}${idNum}`
    const skeletonCode = `SK-${String(idNum).padStart(3, '0')}`
    const element = pick(g.elements)
    const loc = pick(SITES)
    const p = individual(n)

    const midline = ['Skull', 'Cranium', 'Sacrum', 'Sternum', 'Vertebra', 'Frontal', 'Mandible', 'Maxilla', 'Pelvis']
    const side = midline.includes(element) ? 'Not Applicable' : pick(['Left', 'Right'])

    specimens.push({
      specimen_id: specimenId,
      skeleton_code: skeletonCode,
      bone_type: element,
      side,
      site_name: loc.site,
      district: loc.district,
      province: loc.province,
      excavation_year: int(2012, 2024),
      time_period: loc.period,
      preservation_state: pick(['Excellent', 'Good', 'Good', 'Moderate', 'Moderate', 'Fair', 'Fragmentary']),
      location_stored: pick(STORES),
      burial_context: pick(BURIAL[loc.period]),
      sex_estimate: p.sex,
      age_estimate: p.age.label,
      height_estimate: ['Lower Limb', 'Upper Limb'].includes(g.group) ? p.stature : null,
      notes: p.ambiguous
        ? 'Indicators conflict; sex left indeterminate pending further assessment.'
        : `${p.robust} ${element.toLowerCase()}; consistent with the recorded profile.`,
    })

    const morph = morphology(g.group, p)
    if (Object.keys(morph).length) {
      inputs.push({ input_id: `${INPUT_PREFIX}${idNum}`, specimen_id: specimenId, ...morph })
    }
    measurements.push(...metrics(specimenId, element, g.group, p))

    // The same record in ASA's own vocabulary, for manual entry.
    asaRows.push({
      no: n + 1,
      specimen_id: specimenId,
      skeleton_code: skeletonCode,
      element,
      asa_bones_type: g.group,
      location: loc.site,
      district: loc.district,
      date_found: `${int(2012, 2024)}-0${int(1, 9)}-1${int(0, 9)}`,
      ...asaFields(g.group, p),
      expected_sex: p.sex,
      expected_age: p.age.label,
      expected_height_cm: ['Lower Limb', 'Upper Limb'].includes(g.group) ? p.stature : '',
      note: p.ambiguous ? 'AMBIGUOUS - indicators conflict' : '',
    })
    n += 1
  }
}

/* ------------------------------------------------------------------ *
 * Emit
 * ------------------------------------------------------------------ */
const lit = (v) =>
  v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`
const num = (v) => (v === null || v === undefined ? 'null' : String(v))

const specCols = ['specimen_id','skeleton_code','bone_type','side','site_name','district','province',
  'excavation_year','time_period','preservation_state','location_stored','burial_context',
  'sex_estimate','age_estimate','height_estimate','notes']

const specValues = specimens.map((s) =>
  '  (' + specCols.map((c) => (c === 'excavation_year' || c === 'height_estimate' ? num(s[c]) : lit(s[c]))).join(', ') + ')'
).join(',\n')

/**
 * skeletal_inputs is NOT all text. These seven columns are numeric in CSRM —
 * subpubic_angle holds degrees, the lengths and diameters hold millimetres —
 * so they must be emitted unquoted. Quoting them is what produced
 * "invalid input syntax for type numeric".
 */
const NUMERIC_INPUT_COLS = new Set([
  'subpubic_angle', 'humerus_length', 'humerus_head_diameter',
  'femur_length', 'tibia_length', 'femur_head_diameter', 'sternum_length',
])

const inputCols = [...new Set(inputs.flatMap((r) => Object.keys(r)))]
const inputValues = inputs.map((r) =>
  '  (' + inputCols.map((c) => {
    const v = r[c]
    if (v === null || v === undefined) return 'null'
    return NUMERIC_INPUT_COLS.has(c) ? num(v) : lit(v)
  }).join(', ') + ')'
).join(',\n')

const measValues = measurements.map((m) =>
  `  (${lit(m.measurement_id)}, ${lit(m.specimen_id)}, ${lit(m.bone_type)}, ${lit(m.measurement_type)}, ${num(m.value)}, ${lit(m.unit)}, ${lit(m.notes)})`
).join(',\n')

const byGroup = GROUPS.map((g) => `${g.group} (${g.n})`).join(', ')
const sexes = specimens.reduce((a, s) => ((a[s.sex_estimate] = (a[s.sex_estimate] || 0) + 1), a), {})

const sql = `-- ============================================================================
--  OAHRIS — CSRM: 50 reference specimens with morphology and measurements
--
--  GENERATED FILE — do not edit by hand.
--    node scripts/generateSampleSpecimens.mjs
--
--  RUN ON: the shared project (yiamplfqhyurgxxbpeur).
--
--  SYNTHETIC DATA. These ${specimens.length} specimens are reference records for testing.
--  They are NOT real individuals and were NOT excavated. Ids run
--  ${specimens[0].specimen_id}..${specimens[specimens.length-1].specimen_id}, continuing from the catalogue's existing maximum,
--  and every one is removable in a single statement (see ROLLBACK).
--
--  WHY SYNTHETIC
--  -------------
--  No structured public dataset of Sri Lankan osteoarchaeological remains
--  exists. The nearest global sets are unusable here: the Goldman Osteometric
--  Data Set carries no morphological scores and its host refuses connections,
--  and the open San Pablo Convent series is Spanish juveniles aged 2-16.
--  Labelling foreign individuals as Anuradhapura or Mihintale finds would
--  fabricate provenance inside a research catalogue. So the structure is real
--  and the individuals are not.
--
--  WHAT IS REAL
--  ------------
--    - Sites, districts, provinces and periods are genuine Sri Lankan
--      archaeology, correctly paired: Pomparippu and Ibbankatuwa Iron Age
--      megalithic burials, Bellanbandi Palassa and Fa Hien Cave
--      Mesolithic/Late Pleistocene, Anuradhapura and Tissamaharama Early
--      Historic.
--    - Bone lengths are derived by inverting the stature regressions in
--      OAHRIS_Skeletal_Analysis_Methodology.md (Bass 2005; Trotter & Gleser),
--      so a recorded stature yields the length that would have produced it.
--    - Femur-head sectioning points are this project's own: > 43 mm male,
--      < 41 mm female, 41-43 indeterminate.
--
--  INTERNALLY CONSISTENT
--  ---------------------
--  Morphology is derived from each specimen's sex and age band, not typed in,
--  so a female specimen is gracile throughout and an older one shows advanced
--  suture closure and dental wear. Six specimens are deliberately ambiguous —
--  indeterminate sex or a femur head inside the 41-43 mm overlap — because a
--  fixture where every case resolves cleanly would flatter the model rather
--  than test it.
--
--  COVERAGE
--  --------
--    Analysis groups : ${byGroup}
--    Sex estimates   : ${Object.entries(sexes).map(([k, v]) => `${k} ${v}`).join(', ')}
--    Morphology rows : ${inputs.length}   (the catalogue had 7 before this)
--    Measurement rows: ${measurements.length}
--
--  The morphology rows matter most: ASA weights its feature channel at 25%,
--  and with skeletal_inputs nearly empty that channel was being dropped for
--  almost every comparison.
--
--  SAFE TO RUN TWICE — upserts on primary key.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Specimens
-- ----------------------------------------------------------------------------
insert into public.specimens
  (${specCols.join(', ')})
values
${specValues}
on conflict (specimen_id) do update set
  bone_type = excluded.bone_type, side = excluded.side,
  site_name = excluded.site_name, district = excluded.district,
  province = excluded.province, excavation_year = excluded.excavation_year,
  time_period = excluded.time_period, preservation_state = excluded.preservation_state,
  location_stored = excluded.location_stored, burial_context = excluded.burial_context,
  sex_estimate = excluded.sex_estimate, age_estimate = excluded.age_estimate,
  height_estimate = excluded.height_estimate, notes = excluded.notes;


-- ----------------------------------------------------------------------------
-- 2. Morphological observations — what ASA's feature channel compares against
-- ----------------------------------------------------------------------------
insert into public.skeletal_inputs
  (${inputCols.join(', ')})
values
${inputValues}
on conflict (input_id) do nothing;


-- ----------------------------------------------------------------------------
-- 3. Metric measurements
--    Fragmentary elements carry "Maximum Preserved Length", which is a lower
--    bound rather than the bone's length; ASA excludes those from metric
--    scoring by design, so the specimen loses the channel instead of scoring
--    zero for being incomplete.
-- ----------------------------------------------------------------------------
insert into public.measurements
  (measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes)
values
${measValues}
on conflict (measurement_id) do nothing;


-- ----------------------------------------------------------------------------
-- VERIFY
-- ----------------------------------------------------------------------------
select
  (select count(*) from public.specimens       where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}') as specimens,
  (select count(*) from public.skeletal_inputs where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}') as morphology,
  (select count(*) from public.measurements    where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}') as measurements;


-- ----------------------------------------------------------------------------
-- ROLLBACK — removes exactly what this file inserted, nothing else.
--   delete from public.measurements    where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}';
--   delete from public.skeletal_inputs where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}';
--   delete from public.specimens       where specimen_id between '${specimens[0].specimen_id}' and '${specimens[specimens.length-1].specimen_id}';
-- ----------------------------------------------------------------------------
`

const out = join(ROOT, 'csrm_seed_50_specimens.sql')
writeFileSync(out, sql, 'utf8')

/* ------------------------------------------------------------------ *
 * CSV for manual entry into the ASA wizard
 * ------------------------------------------------------------------ */
const CSV_COLS = [
  'no', 'specimen_id', 'skeleton_code', 'element', 'asa_bones_type',
  'location', 'district', 'date_found',
  // Step 2, grouped by the bone type that uses them
  'browRidge', 'mastoidSize', 'jawShape', 'cranialSuture',
  'subpubicAngle', 'sciaticNotch', 'pubicSymphysis',
  'femurLength', 'femurHeadDiameter', 'growthPlate',
  'humerusLength', 'boneRobusticity',
  'ribShape', 'sternumLength',
  'teethType', 'dentalWear', 'eruptionStage',
  // What the catalogue records for this specimen
  'expected_sex', 'expected_age', 'expected_height_cm',
  // What ASA should return for the fields above — the target to check against
  'asa_predicts_sex', 'asa_predicts_age', 'asa_predicts_height', 'asa_confidence',
  'asa_limits', 'note',
]

/**
 * What ASA itself should return for each row.
 *
 * Computed by the real computePredictions(), so the CSV carries a correct
 * target to check a manual entry against — not just what the catalogue
 * records. The two differ in places, and those differences are the model's
 * structural limits rather than mistakes:
 *
 *   - Thorax and Teeth have NO sex indicator, so ASA always returns
 *     Indeterminate however the catalogue sexed the individual.
 *   - Lower Limb's only age indicator is the growth plate, so a fused one
 *     yields "25+" and cannot resolve 45-55.
 *   - Upper Limb has no age indicator at all.
 *
 * `asa_limits` names that up front, so a manual test is not spent chasing
 * disagreements that are working as designed.
 */
const TO_OPTION = {
  browRidge: { Smooth: 'smooth', 'Less Developed': 'less-developed', Moderate: 'moderate', Prominent: 'prominent', Thick: 'thick' },
  mastoidSize: { '< 25mm': 'less-25mm', '25 - 30mm': '25-30mm', '> 30mm': 'more-30mm' },
  jawShape: { 'U Shaped': 'u-shaped', 'V Shaped': 'v-shaped', Robust: 'robust', Rounded: 'rounded' },
  cranialSuture: { Open: 'open', 'Partially Open': 'partially-open', 'Moderate Closure': 'moderate-closure', 'Mostly Closed': 'mostly-closed', 'Completely Closed': 'completely-closed' },
  subpubicAngle: { Narrow: 'narrow', Wide: 'wide' },
  sciaticNotch: { Narrow: 'narrow', Wide: 'wide' },
  pubicSymphysis: { 'Smooth / Flat': 'smooth-flat', 'Moderate / Flat Ridges': 'moderate-flat-ridges', 'Rough / Granular': 'rough-granular', 'Degenerated / Eroded': 'degenerated-eroded' },
  growthPlate: { Unfused: 'unfused', 'Partially Fused': 'partially-fused', Fused: 'fused' },
  boneRobusticity: { Gracile: 'gracile', Robust: 'robust' },
  ribShape: { Smooth: 'smooth', 'Scalloped Edges': 'scalloped', 'Irregular / Porous': 'irregular' },
  teethType: { 'Deciduous (Baby)': 'deciduous', Permanent: 'permanent', Mixed: 'mixed' },
  dentalWear: { None: 'none', Mild: 'mild', Moderate: 'moderate', Severe: 'severe' },
  eruptionStage: { Early: 'early', Partial: 'partial', Complete: 'complete' },
}
const NUMERIC = ['femurLength', 'femurHeadDiameter', 'humerusLength', 'sternumLength']

const LIMITS = {
  Skull: '', Pelvis: '',
  'Lower Limb': 'age from growth plate only — cannot resolve above 25+',
  'Upper Limb': 'no age indicator',
  Thorax: 'no sex indicator',
  Teeth: 'no sex indicator',
}

for (const r of asaRows) {
  const m = { bonesType: r.asa_bones_type }
  for (const k of Object.keys(TO_OPTION)) if (r[k]) m[k] = TO_OPTION[k][r[k]]
  for (const k of NUMERIC) if (r[k]) m[k] = r[k]
  const p = computePredictions(m)
  r.asa_predicts_sex = p.gender
  r.asa_predicts_age = p.ageRange
  r.asa_predicts_height = p.height
  r.asa_confidence = p.confidence
  r.asa_limits = LIMITS[r.asa_bones_type]
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = [
  CSV_COLS.join(','),
  ...asaRows.map((r) => CSV_COLS.map((c) => csvCell(r[c])).join(',')),
].join('\n') + '\n'

const csvOut = join(ROOT, 'asa_manual_entry_50_cases.csv')
writeFileSync(csvOut, csv, 'utf8')

console.log(`wrote ${csvOut}`)
console.log(`wrote ${out}`)
console.log(`specimens ${specimens.length} | morphology ${inputs.length} | measurements ${measurements.length}`)
console.log('sex:', sexes)
console.log('groups:', byGroup)
