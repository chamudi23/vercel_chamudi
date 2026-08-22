/**
 * similarCases.js
 * ===============
 * Matching engine that turns Centralized Specimen Record Management (CSRM)
 * catalogue rows into the **Similar Cases** shown by the Automated Skeletal
 * Analysis System (ASA) on Step 3 (Prediction Results) and on the report.
 *
 * Nothing here mutates either system. It is a pure, derived read:
 *   CSRM.specimens + CSRM.measurements + CSRM.skeletal_inputs
 *        -- mapped through the tables below -->  ASA "Similar Cases"
 *
 * -- Why a mapping layer is needed -------------------------------------
 * The two systems describe bone at different granularities and with
 * different vocabularies, and neither may be changed:
 *
 *   ASA analysis type   ->  Skull / Pelvis / Upper Limb / Lower Limb /
 *                           Thorax / Teeth        (6 analysis groups)
 *   CSRM `bone_type`    ->  Skull, Mandible, Maxilla, Molar, Premolar,
 *                           Humerus, Patella, Calcaneus, Talus, Metatarsal,
 *                           Phalanx, ...          (element-level anatomy)
 *
 * ANALYSIS_BONE_MAP resolves that mismatch: each ASA analysis type declares
 * the CSRM elements that belong to it (`primary`) and the ones that only
 * partly belong to it (`secondary` - e.g. an unqualified "Phalanx" could be
 * hand or foot, a "Skeleton Assemblage" contains everything).
 *
 * -- Scoring -----------------------------------------------------------
 * Five independent evidence channels, each producing 0..1. A channel that
 * has no data for a given pair is DROPPED and its weight redistributed, so
 * a sparsely-recorded specimen is never unfairly penalised:
 *
 *   match % = SUM(weight_i * score_i) / SUM(weight_i)   over available channels
 *
 *   | channel      | w    | source                                          |
 *   | boneGroup    | 0.40 | specimens.bone_type      <-> ASA analysis type  |
 *   | features     | 0.25 | skeletal_inputs.*        <-> ASA Step-2 choices |
 *   | metrics      | 0.15 | measurements.value       <-> ASA Step-2 numbers |
 *   | provenance   | 0.10 | specimens.district/site  <-> basicInfo.location |
 *   | profile      | 0.10 | specimens.sex/age_estimate <-> ASA predictions  |
 */

import {
  fetchSpecimensByBoneTokens,
  fetchMeasurementsFor,
  fetchSkeletalInputsFor,
  groupBySpecimen,
} from './specimenRegistry'

/* ================================================================== *
 * 1. Anatomy map - ASA analysis type -> CSRM `bone_type` vocabulary
 * ================================================================== */

export const ANALYSIS_BONE_MAP = {
  Skull: {
    primary: ['skull', 'cranium', 'crania', 'calvaria', 'frontal', 'parietal',
              'occipital', 'temporal', 'mandible', 'maxilla', 'zygomatic'],
    secondary: ['skeleton assemblage'],
  },
  Pelvis: {
    primary: ['pelvis', 'pelvic', 'ilium', 'ischium', 'pubis', 'innominate',
              'coxal', 'sacrum'],
    secondary: ['skeleton assemblage'],
  },
  'Upper Limb': {
    primary: ['humerus', 'radius', 'ulna', 'scapula', 'clavicle',
              'metacarpal', 'carpal'],
    secondary: ['phalanx', 'skeleton assemblage'],
  },
  'Lower Limb': {
    primary: ['femur', 'tibia', 'fibula', 'patella', 'calcaneus', 'calcaneum',
              'talus', 'astragalus', 'metatarsal', 'tarsal'],
    secondary: ['phalanx', 'skeleton assemblage'],
  },
  Thorax: {
    primary: ['rib', 'sternum', 'costal', 'vertebra', 'thoracic'],
    secondary: ['skeleton assemblage'],
  },
  Teeth: {
    primary: ['molar', 'premolar', 'incisor', 'canine', 'tooth', 'teeth',
              'dentition', 'dental'],
    secondary: ['mandible', 'maxilla', 'skeleton assemblage'],
  },
}

/* ================================================================== *
 * 2. Feature map - ASA Step-2 field -> CSRM `skeletal_inputs` column
 * ================================================================== *
 * `asa`    : the exact (closed) ASA option vocabulary -> ordinal level.
 * `levels` : keyword aliases used to place a FREE-TEXT CSRM value on the
 *            same ordinal scale, so the two vocabularies can be compared
 *            without either side changing.
 * kind 'ordinal'  -> partial credit for adjacent levels
 * kind 'nominal'  -> exact category match only
 * kind 'numeric'  -> relative-distance credit
 */

export const FEATURE_MAP = {
  Skull: [
    {
      asaKey: 'browRidge', column: 'skull_brow_ridge', kind: 'ordinal',
      asa: { smooth: 0, 'less-developed': 1, moderate: 2, prominent: 3, thick: 4 },
      levels: [
        ['smooth', 'absent', 'flat', 'minimal'],
        ['less developed', 'slight', 'weak', 'gracile', 'small'],
        ['moderate', 'medium', 'average', 'intermediate'],
        ['prominent', 'pronounced', 'marked', 'strong', 'developed'],
        ['thick', 'very prominent', 'heavy', 'massive', 'robust'],
      ],
    },
    {
      asaKey: 'mastoidSize', column: 'mastoid_process_size', kind: 'ordinal',
      asa: { 'less-25mm': 0, '25-30mm': 1, 'more-30mm': 2 },
      levels: [
        ['small', 'less than 25', 'under 25', 'below 25', '25mm', 'gracile'],
        ['medium', 'moderate', 'average', '25 30', '25 to 30'],
        ['large', 'more than 30', 'greater than 30', 'over 30', '30mm', 'robust'],
      ],
    },
    {
      asaKey: 'jawShape', column: 'jaw_shape', kind: 'nominal',
      asa: { 'u-shaped': 'u', 'v-shaped': 'v', robust: 'robust', rounded: 'rounded' },
      levels: [['u shaped', 'u shape', 'parabolic'], ['v shaped', 'v shape'],
               ['robust', 'square', 'squared'], ['rounded', 'round']],
      names: ['u', 'v', 'robust', 'rounded'],
    },
    {
      asaKey: 'cranialSuture', column: 'cranial_suture_status', kind: 'ordinal',
      asa: {
        open: 0, 'partially-open': 1, 'moderate-closure': 2,
        'mostly-closed': 3, 'completely-closed': 4,
      },
      levels: [
        ['open', 'unfused', 'patent'],
        ['partially open', 'partly open', 'beginning', 'minimal closure'],
        ['moderate', 'moderately closed', 'partial closure', 'half'],
        ['mostly closed', 'nearly closed', 'advanced', 'significant closure'],
        ['completely closed', 'fully closed', 'obliterated', 'fused'],
      ],
    },
  ],

  Pelvis: [
    {
      asaKey: 'subpubicAngle', column: 'subpubic_angle', kind: 'ordinal',
      asa: { narrow: 0, wide: 1 },
      levels: [['narrow', 'acute', 'less than 90', 'under 90', 'v shaped'],
               ['wide', 'broad', 'obtuse', 'greater than 90', 'more than 90', 'u shaped']],
    },
    {
      asaKey: 'sciaticNotch', column: 'sciatic_notch_width', kind: 'ordinal',
      asa: { narrow: 0, wide: 1 },
      levels: [['narrow', 'deep', 'acute'], ['wide', 'broad', 'shallow', 'open']],
    },
    {
      asaKey: 'pubicSymphysis', column: 'pubic_symphysis_stage', kind: 'ordinal',
      asa: {
        'smooth-flat': 0, 'moderate-flat-ridges': 1,
        'rough-granular': 2, 'degenerated-eroded': 3,
      },
      levels: [
        ['smooth', 'flat', 'billow', 'phase 1'],
        ['moderate', 'flat ridges', 'phase 2', 'phase 3'],
        ['rough', 'granular', 'phase 4', 'phase 5'],
        ['degenerated', 'eroded', 'erosion', 'phase 6', 'breakdown'],
      ],
    },
  ],

  'Upper Limb': [
    { asaKey: 'humerusLength', column: 'humerus_length', kind: 'numeric', tolerance: 0.20 },
    {
      asaKey: 'boneRobusticity', column: 'upper_limb_robusticity', kind: 'ordinal',
      asa: { gracile: 0, robust: 1 },
      levels: [['gracile', 'slender', 'light', 'weak', 'small'],
               ['robust', 'heavy', 'strong', 'marked', 'large']],
    },
  ],

  'Lower Limb': [
    { asaKey: 'femurLength', column: 'femur_length', kind: 'numeric', tolerance: 0.20 },
    { asaKey: 'femurHeadDiameter', column: 'femur_head_diameter', kind: 'numeric', tolerance: 0.20 },
    {
      asaKey: 'growthPlate', column: 'growth_plate', kind: 'ordinal',
      asa: { unfused: 0, 'partially-fused': 1, fused: 2 },
      levels: [['unfused', 'not fused', 'open'],
               ['partially fused', 'partly fused', 'fusing', 'partial'],
               ['fused', 'closed', 'complete', 'united']],
    },
  ],

  Thorax: [
    {
      asaKey: 'ribShape', column: 'rib_shape', kind: 'ordinal',
      asa: { smooth: 0, scalloped: 1, irregular: 2 },
      levels: [['smooth', 'flat', 'even'],
               ['scalloped', 'wavy', 'crenulated', 'u shaped'],
               ['irregular', 'porous', 'sharp', 'eroded', 'ragged']],
    },
    { asaKey: 'sternumLength', column: 'sternum_length', kind: 'numeric', tolerance: 0.20 },
  ],

  Teeth: [
    {
      asaKey: 'teethType', column: 'teeth_type', kind: 'nominal',
      asa: { deciduous: 'deciduous', permanent: 'permanent', mixed: 'mixed' },
      levels: [['deciduous', 'baby', 'milk', 'primary'],
               ['permanent', 'adult', 'secondary'],
               ['mixed', 'transitional']],
      names: ['deciduous', 'permanent', 'mixed'],
    },
    {
      asaKey: 'dentalWear', column: 'dental_wear', kind: 'ordinal',
      asa: { none: 0, mild: 1, moderate: 2, severe: 3 },
      levels: [['none', 'no wear', 'unworn', 'absent'],
               ['mild', 'slight', 'light', 'minimal'],
               ['moderate', 'medium', 'average'],
               ['severe', 'heavy', 'advanced', 'extreme', 'marked']],
    },
    {
      asaKey: 'eruptionStage', column: 'tooth_eruption_stage', kind: 'ordinal',
      asa: { early: 0, partial: 1, complete: 2 },
      levels: [['early', 'unerupted', 'crypt', 'initial'],
               ['partial', 'partially erupted', 'erupting', 'in progress'],
               ['complete', 'fully erupted', 'erupted', 'full']],
    },
  ],
}

/* ================================================================== *
 * 3. Metric map - ASA numeric field -> CSRM `measurements` rows
 * ================================================================== *
 * `types`        like-for-like measurement types, best match first.
 * `partialTypes` types recorded on FRAGMENTARY material. CSRM records a
 *                great deal of "Maximum Preserved Length", which is a lower
 *                bound on the true bone length, not the bone length. It is
 *                therefore NOT comparable with an ASA complete-bone figure:
 *                such a row is skipped so the specimen loses the metric
 *                channel instead of being scored 0 for being fragmentary.
 */

export const METRIC_MAP = {
  femurLength: {
    bones: ['femur'],
    types: ['maximum length', 'max length', 'length'],
    partialTypes: ['preserved length', 'fragment length'],
    tolerance: 0.20,
  },
  femurHeadDiameter: {
    bones: ['femur'],
    types: ['head diameter', 'maximum diameter', 'minimum diameter', 'diameter'],
    partialTypes: [],
    tolerance: 0.20,
  },
  humerusLength: {
    bones: ['humerus'],
    types: ['maximum length', 'max length', 'length'],
    partialTypes: ['preserved length', 'fragment length'],
    tolerance: 0.20,
  },
  sternumLength: {
    bones: ['sternum'],
    types: ['maximum length', 'maximum height', 'max length', 'length'],
    partialTypes: ['preserved length', 'fragment length'],
    tolerance: 0.20,
  },
}

/** CSRM stores a free `unit` column; ASA always works in millimetres. */
const UNIT_TO_MM = {
  mm: 1, millimetre: 1, millimeter: 1,
  cm: 10, centimetre: 10, centimeter: 10,
  m: 1000, metre: 1000, meter: 1000,
}

/* ================================================================== *
 * 4. Channel weights
 * ================================================================== */

export const CHANNEL_WEIGHTS = {
  boneGroup: 0.40,
  features: 0.25,
  metrics: 0.15,
  provenance: 0.10,
  profile: 0.10,
}

const BONE_GROUP_SCORE = { primary: 1, secondary: 0.55 }

/** A candidate below this match % is not shown at all. */
export const MIN_MATCH = 35
/** How many similar cases the panel shows. */
export const MAX_RESULTS = 5

/* ================================================================== *
 * 5. Value normalisation helpers
 * ================================================================== */

function norm(v) {
  if (v === null || v === undefined) return ''
  return String(v).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

/** Place a free-text CSRM value on a feature's ordinal/nominal scale. */
function levelOf(value, levels) {
  const v = norm(value)
  if (!v) return null
  for (let i = 0; i < levels.length; i++) {
    if (levels[i].some((alias) => v.includes(alias))) return i
  }
  return null
}

/** Place a (closed-vocabulary) ASA value on the same scale. */
function asaLevelOf(value, feature) {
  if (value === null || value === undefined || value === '') return null
  if (feature.asa && Object.prototype.hasOwnProperty.call(feature.asa, value)) {
    const mapped = feature.asa[value]
    if (feature.kind === 'nominal') return feature.names.indexOf(mapped)
    return mapped
  }
  return levelOf(value, feature.levels || [])
}

/** Relative-distance credit: identical => 1, `tolerance` away => 0. */
function closeness(a, b, tolerance = 0.20) {
  if (a === null || b === null) return null
  const base = Math.abs(a) || 1
  const rel = Math.abs(a - b) / base
  return Math.max(0, Math.min(1, 1 - rel / tolerance))
}

function toMillimetres(value, unit) {
  const n = num(value)
  if (n === null) return null
  const factor = UNIT_TO_MM[norm(unit).replace(/\s+/g, '')]
  return factor ? n * factor : null // unknown unit (e.g. "count") => not comparable
}

/** Parse an age band ("18 - 25", "40+", "< 18", "Adult") into [min, max]. */
function ageBand(text) {
  const raw = text === null || text === undefined ? '' : String(text)
  const t = norm(raw)
  if (!t || t === 'unknown') return null
  if (t.includes('adult')) return [18, 80]
  if (t.includes('juvenile') || t.includes('child') || t.includes('sub adult')) return [0, 18]
  const nums = (t.match(/\d+(\.\d+)?/g) || []).map(Number)
  if (nums.length >= 2) return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])]
  if (nums.length === 1) {
    if (raw.includes('<') || /\b(less|under|below)\b/.test(t)) return [0, nums[0]]
    if (raw.includes('+') || /\b(over|above|plus)\b/.test(t)) return [nums[0], 80]
    return [Math.max(0, nums[0] - 5), nums[0] + 5]
  }
  return null
}

function bandOverlap(a, b) {
  if (!a || !b) return null
  const lo = Math.max(a[0], b[0])
  const hi = Math.min(a[1], b[1])
  const overlap = Math.max(0, hi - lo)
  const shortest = Math.max(1, Math.min(a[1] - a[0], b[1] - b[0]))
  return Math.max(0, Math.min(1, overlap / shortest))
}

/* ================================================================== *
 * 6. Channel scorers
 * ================================================================== */

function scoreBoneGroup(specimenBoneType, analysisType) {
  const map = ANALYSIS_BONE_MAP[analysisType]
  if (!map) return null
  const bt = norm(specimenBoneType)
  if (!bt) return null
  if (map.primary.some((t) => bt.includes(t))) return { score: BONE_GROUP_SCORE.primary, tier: 'primary' }
  if (map.secondary.some((t) => bt.includes(t))) return { score: BONE_GROUP_SCORE.secondary, tier: 'secondary' }
  return null
}

function scoreFeatures(asaMeasurements, inputRows, analysisType) {
  const features = FEATURE_MAP[analysisType] || []
  if (!features.length || !inputRows || !inputRows.length) return null

  // A specimen may carry more than one skeletal_inputs row; take the best.
  let best = null
  for (const row of inputRows) {
    let total = 0
    let compared = 0
    const matched = []

    for (const f of features) {
      const asaVal = asaMeasurements[f.asaKey]
      const csrmVal = row[f.column]
      if (asaVal === undefined || asaVal === null || asaVal === '') continue
      if (csrmVal === undefined || csrmVal === null || csrmVal === '') continue

      let s = null
      if (f.kind === 'numeric') {
        s = closeness(num(asaVal), num(csrmVal), f.tolerance)
      } else {
        const la = asaLevelOf(asaVal, f)
        const lb = levelOf(csrmVal, f.levels)
        if (la === null || la < 0 || lb === null || lb < 0) continue
        s = f.kind === 'nominal'
          ? (la === lb ? 1 : 0)
          : 1 - Math.abs(la - lb) / Math.max(1, f.levels.length - 1)
      }
      if (s === null) continue
      total += s
      compared += 1
      if (s >= 0.75) matched.push(f.asaKey)
    }

    if (!compared) continue
    const score = total / compared
    if (!best || score > best.score) best = { score, compared, matched }
  }
  return best
}

function scoreMetrics(asaMeasurements, measurementRows) {
  if (!measurementRows || !measurementRows.length) return null
  let total = 0
  let compared = 0
  const matched = []

  for (const [asaKey, spec] of Object.entries(METRIC_MAP)) {
    const asaVal = num(asaMeasurements[asaKey])
    if (asaVal === null) continue

    // Best-matching CSRM measurement row for this ASA field.
    let bestRow = null
    for (const row of measurementRows) {
      const bone = norm(row.bone_type)
      const type = norm(row.measurement_type)
      if (!spec.bones.some((b) => bone.includes(b))) continue
      // Fragmentary measurements are a lower bound, not a comparable value.
      if ((spec.partialTypes || []).some((t) => type.includes(t))) continue
      const typeRank = spec.types.findIndex((t) => type.includes(t))
      if (typeRank === -1) continue
      const mm = toMillimetres(row.value, row.unit)
      if (mm === null) continue
      if (!bestRow || typeRank < bestRow.typeRank) bestRow = { typeRank, mm }
    }
    if (!bestRow) continue

    const s = closeness(asaVal, bestRow.mm, spec.tolerance)
    if (s === null) continue
    total += s
    compared += 1
    if (s >= 0.75) matched.push(asaKey)
  }

  if (!compared) return null
  return { score: total / compared, compared, matched }
}

function scoreProvenance(location, specimen) {
  const loc = norm(location)
  if (!loc) return null
  const district = norm(specimen.district)
  const site = norm(specimen.site_name)
  const province = norm(specimen.province)
  if (!district && !site && !province) return null

  const hit = (a, b) => Boolean(a) && Boolean(b) && (a.includes(b) || b.includes(a))
  if (hit(district, loc)) return { score: 1, label: specimen.district }
  if (hit(site, loc)) return { score: 0.9, label: specimen.site_name }
  if (hit(province, loc)) return { score: 0.6, label: specimen.province }
  return { score: 0, label: null }
}

function scoreProfile(predictions, specimen) {
  const parts = []

  const predSex = norm(predictions && predictions.gender)
  const specSex = norm(specimen.sex_estimate)
  if (predSex && specSex && predSex !== 'indeterminate' && specSex !== 'unknown') {
    parts.push(predSex === specSex ? 1 : 0)
  }

  const predAge = ageBand(predictions && predictions.ageRange)
  const specAge = ageBand(specimen.age_estimate)
  const overlap = bandOverlap(predAge, specAge)
  if (overlap !== null) parts.push(overlap)

  if (!parts.length) return null
  return { score: parts.reduce((a, b) => a + b, 0) / parts.length, compared: parts.length }
}

/* ================================================================== *
 * 7. Public API
 * ================================================================== */

/**
 * Score one CSRM specimen against the current ASA analysis.
 * Returns null when the specimen is not in the analysis's bone group.
 */
export function scoreSpecimen({
  specimen,
  measurementRows,
  inputRows,
  analysisType,
  asaMeasurements,
  basicInfo,
  predictions,
}) {
  const bone = scoreBoneGroup(specimen.bone_type, analysisType)
  if (!bone) return null

  const channels = [{ key: 'boneGroup', weight: CHANNEL_WEIGHTS.boneGroup, score: bone.score }]
  const reasons = [
    bone.tier === 'primary'
      ? `${specimen.bone_type} is a ${analysisType} element`
      : `${specimen.bone_type} may include ${analysisType} elements`,
  ]

  const features = scoreFeatures(asaMeasurements, inputRows, analysisType)
  if (features) {
    channels.push({ key: 'features', weight: CHANNEL_WEIGHTS.features, score: features.score })
    reasons.push(
      `${features.matched.length}/${features.compared} morphological feature${features.compared === 1 ? '' : 's'} agree`
    )
  }

  const metrics = scoreMetrics(asaMeasurements, measurementRows)
  if (metrics) {
    channels.push({ key: 'metrics', weight: CHANNEL_WEIGHTS.metrics, score: metrics.score })
    reasons.push(
      `${metrics.compared} metric measurement${metrics.compared === 1 ? '' : 's'} compared`
    )
  }

  const provenance = scoreProvenance(basicInfo && basicInfo.location, specimen)
  if (provenance) {
    channels.push({ key: 'provenance', weight: CHANNEL_WEIGHTS.provenance, score: provenance.score })
    if (provenance.score > 0) reasons.push(`same area - ${provenance.label}`)
  }

  const profile = scoreProfile(predictions, specimen)
  if (profile) {
    channels.push({ key: 'profile', weight: CHANNEL_WEIGHTS.profile, score: profile.score })
    if (profile.score >= 0.6) reasons.push('recorded biological profile agrees')
  }

  const wSum = channels.reduce((a, c) => a + c.weight, 0)
  const wScore = channels.reduce((a, c) => a + c.weight * c.score, 0)
  const match = wSum ? Math.round((wScore / wSum) * 100) : 0

  return {
    match,
    tier: bone.tier,
    reasons,
    /** How many evidence channels backed this score — used to break ties. */
    evidence: channels.length,
    channels: Object.fromEntries(channels.map((c) => [c.key, Math.round(c.score * 100)])),
    // Presentation fields consumed by the Similar Cases table
    caseId: specimen.specimen_id,
    skeletonCode: specimen.skeleton_code || null,
    bonesType: specimen.bone_type || '—',
    side: specimen.side || null,
    location: specimen.site_name || specimen.district || specimen.province || '—',
    district: specimen.district || null,
    foundDate: specimen.excavation_year
      ? String(specimen.excavation_year)
      : specimen.created_at
        ? String(specimen.created_at).slice(0, 10)
        : '—',
    timePeriod: specimen.time_period || null,
    preservation: specimen.preservation_state || null,
    sexEstimate: specimen.sex_estimate || null,
    ageEstimate: specimen.age_estimate || null,
  }
}

/**
 * Find the CSRM specimens most similar to the analysis in progress.
 *
 * @param {object}  analysis
 * @param {object}  analysis.basicInfo     ASA Step-1 values (location, ...)
 * @param {object}  analysis.measurements  ASA Step-2 values ({ bonesType, ... })
 * @param {object}  analysis.predictions   ASA Step-3 output (gender, ageRange)
 * @param {number} [analysis.limit]        max rows to return
 * @returns {Promise<{cases: object[], error: Error|null, scanned: number, analysisType: string}>}
 */
export async function findSimilarCases({
  basicInfo = {},
  measurements = {},
  predictions = {},
  limit = MAX_RESULTS,
} = {}) {
  const analysisType = measurements.bonesType || basicInfo.bonesType || 'Skull'
  const map = ANALYSIS_BONE_MAP[analysisType]

  if (!map) return { cases: [], error: null, scanned: 0, analysisType }

  const tokens = [...map.primary, ...map.secondary]
  const { rows: specimens, error } = await fetchSpecimensByBoneTokens(tokens)
  if (error) return { cases: [], error, scanned: 0, analysisType }
  if (!specimens.length) return { cases: [], error: null, scanned: 0, analysisType }

  const ids = specimens.map((s) => s.specimen_id).filter(Boolean)
  const [{ rows: measRows }, { rows: inputRows }] = await Promise.all([
    fetchMeasurementsFor(ids),
    fetchSkeletalInputsFor(ids),
  ])
  const measBySpecimen = groupBySpecimen(measRows)
  const inputsBySpecimen = groupBySpecimen(inputRows)

  // `bonesType` selects the analysis type; the rest are the observations.
  const asaMeasurements = { ...measurements }
  delete asaMeasurements.bonesType

  const scored = specimens
    .map((specimen) =>
      scoreSpecimen({
        specimen,
        measurementRows: measBySpecimen.get(specimen.specimen_id) || [],
        inputRows: inputsBySpecimen.get(specimen.specimen_id) || [],
        analysisType,
        asaMeasurements,
        basicInfo,
        predictions,
      })
    )
    .filter(Boolean)
    .filter((c) => c.match >= MIN_MATCH)
    // Equal scores: prefer the better-evidenced record, then the primary-tier
    // element over a "may include" one, then the most recent excavation.
    .sort(
      (a, b) =>
        b.match - a.match ||
        b.evidence - a.evidence ||
        (a.tier === b.tier ? 0 : a.tier === 'primary' ? -1 : 1) ||
        String(b.foundDate).localeCompare(String(a.foundDate)) ||
        String(a.caseId).localeCompare(String(b.caseId))
    )

  return {
    cases: scored.slice(0, limit),
    error: null,
    scanned: specimens.length,
    analysisType,
  }
}
