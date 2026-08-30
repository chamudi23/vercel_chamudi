import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import KNN from 'ml-knn'

// ── Rule-based similarity ───────────────────────────────────────────────────
// Hard-coded domain rule (not machine learning): two bones are "similar" if
// they're the same bone type, from the same time period, and their length
// difference is within the tolerance. Used as a simple baseline to compare
// against the KNN results.
function areSimilar(a, b, lengthTolerance = 3.0) {
  return (
    a.bone_type   === b.bone_type &&
    a.time_period === b.time_period &&
    Math.abs(a.length_cm - b.length_cm) <= lengthTolerance
  )
}

// ── Measurement extraction ──────────────────────────────────────────────────
// `specimens` doesn't store length/width itself — each is a separate row in
// `measurements` (one row per measurement_type; the form blocks duplicate
// types per specimen, so at most one row per type per specimen). This turns
// those rows into the flat length_cm/width_cm the rest of this page's
// matching logic is written against. "Maximum X" is preferred (the standard
// osteometric measure); "Minimum X" is used only when no maximum was
// recorded for that specimen.
function toCm(value, unit) {
  if (unit === 'mm') return value / 10
  if (unit === 'm')  return value * 100
  return value
}

function pickMeasurement(rows, primaryType, fallbackType) {
  const row = rows.find(r => r.measurement_type === primaryType) ||
              rows.find(r => r.measurement_type === fallbackType)
  return row ? toCm(row.value, row.unit) : null
}

// ── Possible-same-individual rule ───────────────────────────────────────────
// Different intent from areSimilar(): that one groups the SAME bone type
// across DIFFERENT individuals (typology). This groups DIFFERENT bone types
// that could belong to the SAME individual — same excavation site, same time
// period, and (see individualGroups below) currently filed under different
// skeleton_codes. No sex/age estimate is used here — this page matches purely
// on measurements, site and time period.
//
// This is a simple equality match on (site, period) — not transitive
// grouping like Rule-Based's Union-Find. It doesn't need to be: exact tuple
// equality is already transitive by itself. (An earlier version of this ran
// Union-Find with a size check on same-bone-type pairs, but that let two
// mismatched same-type bones — e.g. two very differently-sized Mandibles —
// end up in one group anyway, "bridged" through a third bone with no
// length/width recorded to check against either one. Grouping by the exact
// tuple directly avoids that leak; measurementConflict() below flags groups
// where measurements argue against the same-individual hypothesis instead.)
//
// Compares every measurement_type the two specimens have in common (not just
// length/width — Maximum Diameter, Thickness, Circumference, whatever was
// actually recorded), so a same-bone-type pair is checked against the full
// set of metrics on file for it, not a fixed pair of fields.
function measurementConflict(a, b) {
  if (a.bone_type !== b.bone_type) return false // nothing to compare
  const rowsA = a.measurementRows || []
  const rowsB = b.measurementRows || []
  const tolerance = 0.15
  return rowsA.some(ra => {
    const rb = rowsB.find(r => r.measurement_type === ra.measurement_type)
    if (!rb) return false
    const va = toCm(ra.value, ra.unit)
    const vb = toCm(rb.value, rb.unit)
    if (!va || !vb) return false
    return Math.abs(va - vb) / Math.max(va, vb) > tolerance
  })
}

// ── Cross-site paired-bone rule ─────────────────────────────────────────────
// Narrower than the site-bucketing above, and deliberately so: this drops the
// "same site" requirement entirely (e.g. a right hand bone at Sigiriya and a
// left hand bone at Pothana), which removes the strongest real evidence tying
// two bones together. To compensate, it demands much stronger evidence in
// its place — a genuine Left/Right pair of the SAME bone type, same period,
// AND both specimens must actually have length/width recorded and be
// size-consistent (within 15%). Sex estimate is deliberately NOT part of this
// match — hand/limb bones aren't a reliable basis for sex estimation the way
// the pelvis or skull are, so requiring it to match here would lean on a
// number that's often unreliable for exactly this kind of specimen. Unlike
// sizeConflict() above, which only flags a conflict as a warning, size
// consistency is a hard requirement here: a pair with no measurements to
// check isn't shown at all, since without a shared site, size match is the
// only real evidence this rule has to go on.
function isPairedAcrossSites(a, b) {
  if (a.bone_type !== b.bone_type) return false
  const isOppositeSides =
    (a.side === 'Left' && b.side === 'Right') || (a.side === 'Right' && b.side === 'Left')
  if (!isOppositeSides) return false
  if (a.time_period !== b.time_period) return false
  if (!a.length_cm || !b.length_cm || !a.width_cm || !b.width_cm) return false

  const tolerance = 0.15
  const lengthDiff = Math.abs(a.length_cm - b.length_cm) / Math.max(a.length_cm, b.length_cm)
  const widthDiff  = Math.abs(a.width_cm  - b.width_cm)  / Math.max(a.width_cm,  b.width_cm)
  return lengthDiff <= tolerance && widthDiff <= tolerance
}

// Turns the same length/width comparison into a 0-100 confidence score for
// display, instead of just the pass/fail from isPairedAcrossSites() above.
// 100% would mean identical length and width; the score drops in proportion
// to how far apart the two measurements are, averaged across both dimensions.
function matchConfidence(a, b) {
  const lengthDiff = Math.abs(a.length_cm - b.length_cm) / Math.max(a.length_cm, b.length_cm)
  const widthDiff  = Math.abs(a.width_cm  - b.width_cm)  / Math.max(a.width_cm,  b.width_cm)
  return Math.max(0, 100 - ((lengthDiff + widthDiff) / 2) * 100)
}

// ── Union-Find (Disjoint Set) helpers ───────────────────────────────────────
// Used for rule-based grouping so similarity is transitive (A~B, B~C => A,B,C
// grouped together) instead of only being compared against a single seed item.
function findRoot(parent, i) {
  while (parent[i] !== i) {
    parent[i] = parent[parent[i]] // path compression
    i = parent[i]
  }
  return i
}

function unionNodes(parent, i, j) {
  const ri = findRoot(parent, i)
  const rj = findRoot(parent, j)
  if (ri !== rj) parent[ri] = rj
}

// ── Euclidean Distance ──────────────────────────────────────────────────────
function euclideanDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2)
  )
}

// ── Encode bone type to number ──────────────────────────────────────────────
// KNN/distance calculations need numeric features, so text fields
// (bone type, time period) are mapped to arbitrary numeric ids here.
function encodeBoneType(bone_type) {
  const map = { 'Femur': 1, 'Humerus': 2, 'Tibia': 3, 'Radius': 4, 'Fibula': 5, 'Ulna': 6 }
  return map[bone_type] || 0
}

// ── Encode time period to number ────────────────────────────────────────────
function encodeTimePeriod(period) {
  const map = {
    'Upper Paleolithic': 1, 'Mesolithic': 2, 'Prehistoric': 3,
    'Iron Age': 4, 'Early Historic': 5, 'Classical Period': 6, 'Medieval': 7
  }
  return map[period] || 0
}

// ── Get similarity label ────────────────────────────────────────────────────
function getSimilarityLabel(distance) {
  if (distance < 1.0)  return { label: 'Excellent Match', color: 'text-emerald-400', bg: 'bg-emerald-900/40', border: 'border-emerald-700', emoji: '🟢' }
  if (distance < 2.0)  return { label: 'Very Good Match', color: 'text-blue-400',    bg: 'bg-blue-900/40',    border: 'border-blue-700',    emoji: '🔵' }
  if (distance < 3.5)  return { label: 'Good Match',      color: 'text-yellow-400',  bg: 'bg-yellow-900/40',  border: 'border-yellow-700',  emoji: '🟡' }
  return                      { label: 'Weak Match',       color: 'text-red-400',     bg: 'bg-red-900/40',     border: 'border-red-700',     emoji: '🔴' }
}

// ── Constants ───────────────────────────────────────────────────────────────
const CLUSTER_COLOURS = [
  { bg: 'bg-purple-900/40',  border: 'border-purple-700', text: 'text-purple-300',  dot: '#a78bfa' },
  { bg: 'bg-blue-900/40',    border: 'border-blue-700',   text: 'text-blue-300',    dot: '#38bdf8' },
  { bg: 'bg-emerald-900/40', border: 'border-emerald-700',text: 'text-emerald-300', dot: '#4ade80' },
  { bg: 'bg-orange-900/40',  border: 'border-orange-700', text: 'text-orange-300',  dot: '#fb923c' },
  { bg: 'bg-pink-900/40',    border: 'border-pink-700',   text: 'text-pink-300',    dot: '#f472b6' },
  { bg: 'bg-yellow-900/40',  border: 'border-yellow-700', text: 'text-yellow-300',  dot: '#facc15' },
]

const PRESERVATION_BADGE = {
  Good:     'bg-emerald-900 text-emerald-300',
  Moderate: 'bg-yellow-900 text-yellow-300',
  Poor:     'bg-red-900 text-red-300',
}

const K_OPTIONS = [3, 5, 7, 10]

// ── Main Component ───────────────────────────────────────────────────────────
function SimilarFindingsPage() {
  const [findings,       setFindings]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [activeTab,      setActiveTab]      = useState('rule')
  const [boneFilter,     setBoneFilter]     = useState('All')
  const [periodFilter,   setPeriodFilter]   = useState('All')
  const [tolerance,      setTolerance]      = useState(3.0)
  const [selectedGroup,  setSelectedGroup]  = useState(null)

  // KNN states
  const [knnK,           setKnnK]           = useState(5)
  const [selectedSpec,   setSelectedSpec]   = useState(null)
  const [knnResults,     setKnnResults]     = useState([])
  const [knnModel,       setKnnModel]       = useState(null)
  const [knnTrained,     setKnnTrained]     = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: specimenData, error: specErr } = await supabase
          .from('specimens')
          .select('*')
          .order('bone_type', { ascending: true })
        if (specErr) throw specErr

        const { data: measurementData, error: measErr } = await supabase
          .from('measurements')
          .select('specimen_id, measurement_type, value, unit')
        if (measErr) throw measErr

        const rowsBySpecimen = new Map()
        ;(measurementData || []).forEach(m => {
          if (!rowsBySpecimen.has(m.specimen_id)) rowsBySpecimen.set(m.specimen_id, [])
          rowsBySpecimen.get(m.specimen_id).push(m)
        })

        const enriched = (specimenData || []).map(s => {
          const rows = rowsBySpecimen.get(s.specimen_id) || []
          return {
            ...s,
            length_cm: pickMeasurement(rows, 'Maximum Length', 'Minimum Length'),
            width_cm:  pickMeasurement(rows, 'Maximum Width',  'Minimum Width'),
            measurementRows: rows,
          }
        })

        setFindings(enriched)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reset the expanded-row state whenever the tab changes, so a stale
  // selection from one tab doesn't silently match a key in another.
  const switchTab = (tabId) => {
    setActiveTab(tabId)
    setSelectedGroup(null)
    // A bone type only present on midline specimens (e.g. "Skull") isn't a
    // valid filter on this tab — see boneTypes above. Reset rather than leave
    // the dropdown pointing at an option that no longer exists in its list.
    if (tabId === 'individual' && boneFilter !== 'All') {
      const stillValid = findings.some(f => f.side !== 'Midline' && f.bone_type === boneFilter)
      if (!stillValid) setBoneFilter('All')
    }
  }

  // Filtered findings — respects the Bone Type / Time Period filters above,
  // so every tab (Rule-Based, KNN) works off the same narrowed set
  const filtered = useMemo(() => findings.filter(f =>
    (boneFilter  === 'All' || f.bone_type   === boneFilter) &&
    (periodFilter === 'All' || f.time_period === periodFilter)
  ), [findings, boneFilter, periodFilter])

  // Valid findings for ML (must have measurements) — built from the
  // filtered list so KNN only trains on / lists specimens matching the
  // selected Bone Type / Time Period filters
  const validFindings = useMemo(() =>
    filtered.filter(f => f.length_cm && f.width_cm && f.bone_type),
    [filtered]
  )

  // ── Train KNN Model ────────────────────────────────────────────────────────
  // Builds a 4-feature vector per specimen (length, width, encoded bone
  // type, encoded time period) and trains the ml-knn model on those vectors.
  // Labels are just array indexes, used later to look the specimen back up.
  const trainKNN = () => {
    if (validFindings.length < 5) return

    try {
      // Feature vectors: [length_cm, width_cm, bone_type_encoded, time_period_encoded]
      const trainingData = validFindings.map(f => [
        parseFloat(f.length_cm),
        parseFloat(f.width_cm || 0),
        encodeBoneType(f.bone_type),
        encodeTimePeriod(f.time_period),
      ])

      // Labels = specimen index (we use index as label to retrieve specimen later)
      const labels = validFindings.map((_, i) => i)

      const model = new KNN(trainingData, labels, { k: knnK })
      setKnnModel({ model, trainingData, labels })
      setKnnTrained(true)
    } catch (e) {
      console.error('KNN training error:', e)
    }
  }

  // Auto-train whenever there's enough data or the requested K changes, so
  // end users always see live results instead of a manual "train" step.
  useEffect(() => {
    if (validFindings.length >= 5) {
      trainKNN()
    } else {
      setKnnTrained(false)
      setKnnModel(null)
    }
  }, [validFindings, knnK])

  // Re-run the query automatically against the freshly retrained model.
  useEffect(() => {
    if (knnModel && selectedSpec) {
      runKNN(selectedSpec)
    }
  }, [knnModel])

  // ── Run KNN Prediction ─────────────────────────────────────────────────────
  // Given a reference specimen, computes Euclidean distance to every other
  // trained specimen in 4D feature space, sorts ascending, and keeps the
  // closest K (excluding itself) as the "most similar" results.
  const runKNN = (specimen) => {
    if (!knnModel) return
    setSelectedSpec(specimen)

    const queryVector = [
      parseFloat(specimen.length_cm),
      parseFloat(specimen.width_cm || 0),
      encodeBoneType(specimen.bone_type),
      encodeTimePeriod(specimen.time_period),
    ]

    // Get K nearest neighbors manually with distances
    const distances = knnModel.trainingData.map((point, i) => ({
      index: i,
      specimen: validFindings[i],
      distance: euclideanDistance(queryVector, point),
    }))

    // Sort by distance, exclude self
    const sorted = distances
      .filter(d => d.specimen.specimen_id !== specimen.specimen_id)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, knnK)

    setKnnResults(sorted)
  }

  // Unique filter values. Shared across all 4 tabs, but the Bone Type list
  // itself is tab-aware: on Possible Same Individual, midline-sided bones
  // (Skull, Mandible, Sternum, ...) are never part of a group (see
  // individualGroups below), so offering them as a filter option there would
  // just be a dead end — every other tab still lists every bone type that
  // exists, midline included.
  const boneTypes = useMemo(() => {
    const source = activeTab === 'individual' ? findings.filter(f => f.side !== 'Midline') : findings
    return ['All', ...new Set(source.map(f => f.bone_type).filter(Boolean))]
  }, [findings, activeTab])
  const timePeriods = useMemo(() => ['All', ...new Set(findings.map(f => f.time_period).filter(Boolean))], [findings])

  // Rule-based groups (Union-Find so similarity is transitive: if A~B and
  // B~C, all three land in one group even if A and C aren't directly within
  // tolerance of each other. This also removes the old dependency on array
  // order — previously every candidate was only ever compared to the first
  // "seed" item of a group, so B~C matches could be missed or a specimen's
  // group depended on the order Supabase happened to return rows in.)
  const ruleGroups = useMemo(() => {
    const n = filtered.length
    const parent = Array.from({ length: n }, (_, i) => i)

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (areSimilar(filtered[i], filtered[j], tolerance)) {
          unionNodes(parent, i, j)
        }
      }
    }

    const buckets = new Map()
    for (let i = 0; i < n; i++) {
      const root = findRoot(parent, i)
      if (!buckets.has(root)) buckets.set(root, [])
      buckets.get(root).push(filtered[i])
    }

    return [...buckets.values()]
      .filter(group => group.length > 1)
      .sort((a, b) => b.length - a.length)
  }, [filtered, tolerance])

  // Possible-same-individual groups: bucket specimens by the exact
  // (site, period) tuple — deliberately allowing DIFFERENT bone types into
  // one group, since the whole point is spotting e.g. a pelvis and a hand
  // bone that could be from the same person, not just repeats of one bone
  // type. Midline-sided bones (Skull, Mandible, Sternum, ...) are excluded
  // HERE ONLY — a skeleton only ever has one of each, so they don't carry the
  // same paired-bone evidence Left/Right specimens do for this particular
  // comparison, but they still belong in Rule-Based, KNN and All Findings, so
  // the exclusion is scoped to this tab rather than applied to
  // `filtered`/`findings` itself. Each group is then checked for a
  // same-bone-type measurement conflict (measurementConflict(), across every
  // shared measurement_type, not just length/width) and flagged rather than
  // hidden, so evidence against the same-individual hypothesis is visible
  // instead of silently producing a false "worth investigating" group.
  //
  // A group is only kept if it mixes specimens the catalogue currently treats
  // as DIFFERENT skeletons (distinct skeleton_code) — that's the actual
  // hypothesis being raised: "these two catalogued-separate skeletons might
  // really be one person." A group where every specimen already shares one
  // skeleton_code is already a documented, known individual (e.g. its own
  // Left and Right femur) — nothing to investigate, so it's dropped.
  const individualGroups = useMemo(() => {
    const buckets = new Map()
    filtered.forEach(f => {
      if (f.side === 'Midline') return
      const key = `${f.site_name}|${f.time_period}`
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(f)
    })

    return [...buckets.values()]
      .filter(specimens => specimens.length > 1)
      .filter(specimens => new Set(specimens.map(f => f.skeleton_code)).size > 1)
      .map(specimens => ({
        specimens,
        hasSizeConflict: specimens.some((a, i) =>
          specimens.some((b, j) => i < j && measurementConflict(a, b))
        ),
      }))
      .sort((a, b) => b.specimens.length - a.specimens.length)
  }, [filtered])

  // Cross-site paired bones: every pair of specimens satisfying
  // isPairedAcrossSites() above. Not transitive/grouped like individualGroups
  // — each is its own standalone pair, since "site" isn't shared here to tie
  // more than two specimens together.
  const crossSitePairs = useMemo(() => {
    const pairs = []
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        if (isPairedAcrossSites(filtered[i], filtered[j])) {
          pairs.push({ a: filtered[i], b: filtered[j], confidence: matchConfidence(filtered[i], filtered[j]) })
        }
      }
    }
    return pairs.sort((x, y) => y.confidence - x.confidence)
  }, [filtered])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-700 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">
            Spatial Analysis
          </p>
          <h2 className="text-2xl font-bold text-slate-100">Similar Bone Findings Analysis</h2>
          <p className="text-slate-400 text-sm mt-1">
            Cross-site skeletal similarity detection using Rule-Based and KNN Machine Learning
          </p>
        </div>
        <Link to="/parami" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to GIS Map
        </Link>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 text-red-200 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Findings',    value: findings.length,      color: 'text-blue-400' },
          { label: 'Sites Covered',     value: new Set(findings.map(f => f.site_name)).size, color: 'text-emerald-400' },
          { label: 'Rule-Based Groups', value: ruleGroups.length,    color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h3 className="text-slate-200 font-semibold mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Bone Type</label>
            <select value={boneFilter} onChange={e => setBoneFilter(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              {boneTypes.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Time Period</label>
            <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              {timePeriods.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {[
          { id: 'rule',       label: '📋 Rule-Based' },
          { id: 'individual', label: '🧍 Possible Same Individual' },
          { id: 'knn',        label: '🧠 KNN Machine Learning' },
          { id: 'all',        label: '📊 All Findings' },
        ].map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Rule-Based Tab ── */}
      {activeTab === 'rule' && (
        <div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">Length Tolerance: ±{tolerance.toFixed(1)} cm</label>
              <span className="text-slate-500 text-xs">Bones within this range are considered similar</span>
            </div>
            <input type="range" min="1" max="8" step="0.5" value={tolerance}
              onChange={e => setTolerance(parseFloat(e.target.value))}
              className="w-full accent-purple-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>±1 cm (Strict)</span><span>±8 cm (Loose)</span>
            </div>
            <div className="mt-3 bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
              📋 <strong className="text-slate-300">Rule:</strong> Same bone type + Same time period + Length difference ≤ ±{tolerance.toFixed(1)}cm → Similar group
            </div>
          </div>

          {ruleGroups.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🦴</p>
              <p className="text-slate-400">No similar groups found. Try increasing the tolerance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ruleGroups.map((group, gi) => {
                const colour = CLUSTER_COLOURS[gi % CLUSTER_COLOURS.length]
                const avgLen = (group.reduce((s, f) => s + f.length_cm, 0) / group.length).toFixed(1)
                const sites  = [...new Set(group.map(f => f.site_name))]
                return (
                  <div key={gi} className={`rounded-xl border ${colour.border} ${colour.bg} overflow-hidden`}>
                    <div className="px-6 py-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedGroup(selectedGroup === gi ? null : gi)}>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ background: colour.dot }} />
                        <div>
                          <p className={`font-semibold ${colour.text}`}>
                            Group {gi + 1} — {group[0].bone_type} · {group[0].time_period}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {group.length} findings · avg {avgLen}cm · {sites.length} sites
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {sites.map(s => <span key={s} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                        <span className="text-slate-500">{selectedGroup === gi ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {selectedGroup === gi && (
                      <div className="border-t border-slate-700 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              {['Site', 'Bone', 'Side', 'Period', 'Length', 'Width', 'Preservation', 'Year'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.map((f, fi) => (
                              <tr key={fi} className={`border-b border-slate-700 hover:bg-slate-700/50 ${fi % 2 !== 0 ? 'bg-slate-800/30' : ''}`}>
                                <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{f.site_name}</td>
                                <td className="px-4 py-3 text-slate-400">{f.bone_type}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>{f.side}</span></td>
                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                                <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>{f.preservation_state}</span></td>
                                <td className="px-4 py-3 text-slate-500">{f.excavation_year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-6 py-3 bg-slate-900/40 text-xs text-slate-400">
                          💡 <strong className="text-slate-300">Insight:</strong> {group.length} {group[0].bone_type} bones from {sites.length} sites show similar measurements in {group[0].time_period} period.
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Possible Same Individual Tab ── */}
      {activeTab === 'individual' && (
        <div>
          {individualGroups.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🧍</p>
              <p className="text-slate-400">No candidate groups found. Needs 2+ non-midline specimens, currently filed under different skeleton codes, sharing the same site and time period.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {individualGroups.map(({ specimens, hasSizeConflict }, gi) => {
                const colour = hasSizeConflict
                  ? { bg: 'bg-red-900/20', border: 'border-red-800', text: 'text-red-300', dot: '#f87171' }
                  : CLUSTER_COLOURS[gi % CLUSTER_COLOURS.length]
                const boneTypesInGroup = [...new Set(specimens.map(f => f.bone_type))]
                const key = `ind${gi}`
                return (
                  <div key={key} className={`rounded-xl border ${colour.border} ${colour.bg} overflow-hidden`}>
                    <div className="px-6 py-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedGroup(selectedGroup === key ? null : key)}>
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ background: colour.dot }} />
                        <div>
                          <p className={`font-semibold ${colour.text}`}>
                            Group {gi + 1} — {specimens[0].site_name} · {specimens[0].time_period}
                            {hasSizeConflict && <span className="ml-2 text-xs font-normal">⚠️ measurement conflict</span>}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {specimens.length} bones · {boneTypesInGroup.length} different bone type{boneTypesInGroup.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {boneTypesInGroup.slice(0, 4).map(b => <span key={b} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{b}</span>)}
                        </div>
                        <span className="text-slate-500">{selectedGroup === key ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    {selectedGroup === key && (
                      <div className="border-t border-slate-700 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700">
                              {['Bone', 'Side', 'Preservation', 'Length', 'Width', 'Specimen ID'].map(h => (
                                <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {specimens.map((f, fi) => (
                              <tr key={fi} className={`border-b border-slate-700 hover:bg-slate-700/50 ${fi % 2 !== 0 ? 'bg-slate-800/30' : ''}`}>
                                <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{f.bone_type}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>{f.side}</span></td>
                                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>{f.preservation_state}</span></td>
                                <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm ? `${f.length_cm} cm` : '—'}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm ? `${f.width_cm} cm` : '—'}</td>
                                <td className="px-4 py-3 text-slate-500">{f.specimen_id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className={`px-6 py-3 text-xs ${hasSizeConflict ? 'bg-red-900/20 text-red-300' : 'bg-slate-900/40 text-slate-400'}`}>
                          {hasSizeConflict ? (
                            <>⚠️ <strong>Conflict:</strong> this group contains same-type bones with measurements too different to be from one individual — it likely represents more than one person despite matching site/period. Treat as unreliable.</>
                          ) : (
                            <>💡 <strong className="text-slate-300">Insight:</strong> {specimens.length} bones ({boneTypesInGroup.join(', ')}) from {specimens[0].site_name} share the same time period, currently filed under different skeleton codes — worth investigating whether they came from the same individual.</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Cross-site paired bones — no shared site required, but needs
              stronger evidence in its place: a genuine Left/Right pair of
              the same bone type, size-consistent, same period and sex. */}
          <div className="mt-8">
            <h3 className="text-slate-200 font-semibold mb-1 flex items-center gap-2">
              🔗 Cross-Site Paired Bones
            </h3>
            <p className="text-slate-500 text-xs mb-4">
              Left/Right pairs of the same bone type, size-consistent, same time period — regardless of which site each was found at. Sex estimate isn&apos;t used here, since it isn&apos;t reliably determined from limb/hand bones.
            </p>

            {crossSitePairs.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
                <p className="text-slate-400 text-sm">No cross-site paired matches found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {crossSitePairs.map(({ a, b, confidence }, pi) => (
                  <div key={pi} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-slate-200 text-sm font-medium">
                        {a.bone_type} — {a.site_name} ({a.side}) ↔ {b.site_name} ({b.side})
                      </p>
                      <div className="text-right">
                        <span className="text-emerald-400 text-sm font-semibold font-mono">{confidence.toFixed(2)}%</span>
                        <span className="text-slate-500 text-xs ml-2">{a.time_period}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {[a, b].map((f, fi) => (
                        <div key={fi} className="bg-slate-700 rounded-lg p-3">
                          <p className="text-slate-300 text-xs font-medium">{f.specimen_id} · {f.side}</p>
                          <p className="text-slate-500 text-xs mt-1">{f.site_name}</p>
                          <p className="text-emerald-400 text-xs font-mono mt-1">{f.length_cm} cm × {f.width_cm} cm</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-500 text-xs mt-3 bg-slate-900/40 rounded-lg px-3 py-2">
                      💡 <strong className="text-slate-400">Why {confidence.toFixed(2)}%:</strong> 100% minus the average percentage difference between the two specimens&apos; length and width. A Left/Right bone pair from the same person should be nearly identical in size — the closer the measurements, the higher the score.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KNN Machine Learning Tab ── */}
      {activeTab === 'knn' && (
        <div>

          {/* KNN Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h3 className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
              🧠 K-Nearest Neighbors (KNN) Machine Learning
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              KNN finds the most similar bone specimens based on Euclidean distance in multi-dimensional measurement space (length, width, bone type, time period).
            </p>

            {/* Training features info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Feature 1', value: 'Length (cm)', color: 'text-blue-400' },
                { label: 'Feature 2', value: 'Width (cm)',  color: 'text-emerald-400' },
                { label: 'Feature 3', value: 'Bone Type',  color: 'text-purple-400' },
                { label: 'Feature 4', value: 'Time Period', color: 'text-orange-400' },
              ].map(f => (
                <div key={f.label} className="bg-slate-700 rounded-lg p-3 text-center">
                  <p className={`font-semibold text-sm ${f.color}`}>{f.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{f.label}</p>
                </div>
              ))}
            </div>

            {/* K selector */}
            <div className="mb-4">
              <label className="text-slate-400 text-sm mb-2 block">
                K Neighbors: <span className="text-blue-400 font-semibold">{knnK}</span>
                <span className="text-slate-500 text-xs ml-2">— how many similar specimens to find</span>
              </label>
              <div className="flex gap-2">
                {K_OPTIONS.map(k => (
                  <button key={k} onClick={() => setKnnK(k)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      knnK === k
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}>
                    K = {k}
                  </button>
                ))}
              </div>
            </div>

            {validFindings.length < 5 && (
              <p className="text-red-400 text-xs mt-2">⚠️ Need at least 5 specimens with measurements to run analysis.</p>
            )}
          </div>

          {/* Specimen selector */}
          {knnTrained && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
              <h3 className="text-slate-200 font-semibold mb-3">
                Select Reference Specimen
                <span className="text-slate-500 font-normal text-sm ml-2">— KNN finds {knnK} most similar bones</span>
              </h3>
              <select
                onChange={e => {
                  const spec = validFindings.find(f => f.specimen_id === e.target.value)
                  if (spec) runKNN(spec)
                }}
                className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
              >
                <option value="">— Select a specimen to find similar bones —</option>
                {validFindings.map(f => (
                  <option key={f.specimen_id} value={f.specimen_id}>
                    {f.specimen_id} | {f.site_name} | {f.bone_type} | {f.length_cm}cm | {f.time_period}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* KNN Results */}
          {selectedSpec && knnResults.length > 0 && (
            <div>
              {/* Reference specimen */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-5 mb-4">
                <p className="text-blue-300 text-xs font-semibold uppercase tracking-wide mb-2">📍 Reference Specimen</p>
                <div className="flex flex-wrap gap-4">
                  <div><p className="text-slate-400 text-xs">Specimen ID</p><p className="text-slate-200 font-semibold">{selectedSpec.specimen_id}</p></div>
                  <div><p className="text-slate-400 text-xs">Site</p><p className="text-slate-200 font-semibold">{selectedSpec.site_name}</p></div>
                  <div><p className="text-slate-400 text-xs">Bone Type</p><p className="text-slate-200 font-semibold">{selectedSpec.bone_type}</p></div>
                  <div><p className="text-slate-400 text-xs">Length</p><p className="text-emerald-400 font-semibold font-mono">{selectedSpec.length_cm} cm</p></div>
                  <div><p className="text-slate-400 text-xs">Width</p><p className="text-slate-400 font-mono">{selectedSpec.width_cm} cm</p></div>
                  <div><p className="text-slate-400 text-xs">Period</p><p className="text-slate-200">{selectedSpec.time_period}</p></div>
                </div>
              </div>

              {/* Results header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-slate-700" />
                <p className="text-slate-400 text-sm">🧠 KNN Found {knnResults.length} Similar Specimens</p>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              {/* Result cards */}
              <div className="space-y-3">
                {knnResults.map((result, ri) => {
                  const sim = getSimilarityLabel(result.distance)
                  const f = result.specimen
                  return (
                    <div key={ri} className={`rounded-xl border ${sim.border} ${sim.bg} p-5`}>
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                            #{ri + 1}
                          </div>
                          <div>
                            <p className="text-slate-200 font-semibold">{f.specimen_id}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{f.site_name} · {f.bone_type} · {f.time_period}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-bold text-lg ${sim.color}`}>{sim.emoji} {sim.label}</p>
                            <p className="text-slate-500 text-xs">Distance: {result.distance.toFixed(3)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Measurement comparison */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                          { label: 'Length',       val: `${f.length_cm} cm`,       ref: `${selectedSpec.length_cm} cm`, color: 'text-emerald-400' },
                          { label: 'Width',        val: `${f.width_cm} cm`,        ref: `${selectedSpec.width_cm} cm`,  color: 'text-slate-400' },
                          { label: 'Preservation', val: f.preservation_state,      ref: selectedSpec.preservation_state, color: 'text-slate-400' },
                          { label: 'Side',         val: f.side,                    ref: selectedSpec.side,              color: 'text-slate-400' },
                          { label: 'District',     val: f.district,                ref: selectedSpec.district,          color: 'text-slate-400' },
                        ].map(item => (
                          <div key={item.label} className="bg-slate-800/60 rounded-lg p-2.5">
                            <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                            <p className={`text-sm font-medium ${item.color}`}>{item.val || '—'}</p>
                            {item.val !== item.ref && (
                              <p className="text-slate-600 text-xs mt-0.5">ref: {item.ref || '—'}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Archaeological insight */}
                      <div className="mt-3 text-xs text-slate-500 bg-slate-900/40 rounded-lg px-4 py-2">
                        💡 <strong className="text-slate-400">KNN Insight:</strong> {f.bone_type} from {f.site_name} ({f.time_period}) is the #{ri + 1} nearest neighbor to the reference specimen with Euclidean distance {result.distance.toFixed(3)} in 4D measurement space.
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary */}
              <div className="mt-6 bg-slate-800 rounded-xl border border-slate-700 p-5">
                <h4 className="text-slate-200 font-semibold mb-3">📊 KNN Analysis Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Neighbors Found', value: knnResults.length, color: 'text-blue-400' },
                    { label: 'Unique Sites',     value: new Set(knnResults.map(r => r.specimen.site_name)).size, color: 'text-emerald-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-700 rounded-lg p-3 text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-400 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {knnTrained && !selectedSpec && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🦴</p>
              <p className="text-slate-400 font-medium">Select a specimen above to find similar bones</p>
              <p className="text-slate-500 text-sm mt-1">KNN will find the {knnK} most similar specimens from all sites</p>
            </div>
          )}

          {!knnTrained && validFindings.length >= 5 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🧠</p>
              <p className="text-slate-400 font-medium">Analyzing specimens...</p>
              <p className="text-slate-500 text-sm mt-1">The model trains automatically</p>
            </div>
          )}
        </div>
      )}

      {/* ── All Findings Tab ── */}
      {activeTab === 'all' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-slate-200 font-semibold">All Bone Findings</h3>
            <span className="text-slate-500 text-sm">{filtered.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Site', 'Bone', 'Side', 'Period', 'Length', 'Width', 'Preservation', 'Year'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.specimen_id} className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 !== 0 ? 'bg-slate-800/50' : ''}`}>
                    <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{f.site_name}</td>
                    <td className="px-4 py-3 text-slate-400">{f.bone_type}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>{f.side}</span></td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>{f.preservation_state}</span></td>
                    <td className="px-4 py-3 text-slate-500">{f.excavation_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default SimilarFindingsPage
