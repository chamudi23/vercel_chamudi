import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import KNN from 'ml-knn'

// ── Simple K-Means implementation ──────────────────────────────────────────
function kMeans(data, k, iterations = 50) {
  if (data.length < k) k = data.length
  if (k === 0) return { clusters: [], assignments: [] }
  let centroids = [...data].sort(() => Math.random() - 0.5).slice(0, k)
  let assignments = new Array(data.length).fill(0)
  for (let iter = 0; iter < iterations; iter++) {
    assignments = data.map(point => {
      let minDist = Infinity, nearest = 0
      centroids.forEach((c, ci) => {
        const dist = Math.sqrt(
          Math.pow(point.length_cm - c.length_cm, 2) +
          Math.pow(point.width_cm - c.width_cm, 2)
        )
        if (dist < minDist) { minDist = dist; nearest = ci }
      })
      return nearest
    })
    const newCentroids = centroids.map((_, ci) => {
      const pts = data.filter((_, i) => assignments[i] === ci)
      if (pts.length === 0) return centroids[ci]
      return {
        length_cm: pts.reduce((s, p) => s + p.length_cm, 0) / pts.length,
        width_cm:  pts.reduce((s, p) => s + p.width_cm, 0)  / pts.length,
      }
    })
    centroids = newCentroids
  }
  return {
    clusters: centroids.map((centroid, ci) => ({
      id: ci, centroid,
      points: data.filter((_, i) => assignments[i] === ci),
    })),
    assignments,
  }
}

// ── Rule-based similarity ───────────────────────────────────────────────────
function areSimilar(a, b, lengthTolerance = 3.0) {
  return (
    a.bone_type   === b.bone_type &&
    a.time_period === b.time_period &&
    Math.abs(a.length_cm - b.length_cm) <= lengthTolerance
  )
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
  const [kValue,         setKValue]         = useState(4)
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
        const { data, error: err } = await supabase
          .from('specimens')
          .select('*')
          .order('bone_type', { ascending: true })
        if (err) throw err
        setFindings(data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reset the expanded-row state whenever the tab changes, since 'rule' uses
  // a numeric index and 'kmeans' uses a `k${ci}` string — without this a
  // stale selection from one tab can silently match a key in another.
  const switchTab = (tabId) => {
    setActiveTab(tabId)
    setSelectedGroup(null)
  }

  // Valid findings for ML (must have measurements)
  const validFindings = useMemo(() =>
    findings.filter(f => f.length_cm && f.width_cm && f.bone_type),
    [findings]
  )

  // ── Train KNN Model ────────────────────────────────────────────────────────
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

  // Unique filter values
  const boneTypes   = useMemo(() => ['All', ...new Set(findings.map(f => f.bone_type).filter(Boolean))], [findings])
  const timePeriods = useMemo(() => ['All', ...new Set(findings.map(f => f.time_period).filter(Boolean))], [findings])

  // Filtered findings
  const filtered = useMemo(() => findings.filter(f =>
    (boneFilter  === 'All' || f.bone_type   === boneFilter) &&
    (periodFilter === 'All' || f.time_period === periodFilter)
  ), [findings, boneFilter, periodFilter])

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

  // K-Means
  const kMeansResult = useMemo(() => {
    const valid = filtered.filter(f => f.length_cm && f.width_cm)
    if (valid.length < 2) return { clusters: [] }
    return kMeans(valid, Math.min(kValue, valid.length))
  }, [filtered, kValue])

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
            Cross-site skeletal similarity detection using Rule-Based, K-Means, and KNN Machine Learning
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">
              Showing: <span className="text-blue-400">{filtered.length}</span> findings
            </label>
            <div className="bg-slate-700 rounded-lg px-3 py-2 text-slate-400 text-sm">
              from {new Set(filtered.map(f => f.site_name)).size} sites
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
        {[
          { id: 'rule',   label: '📋 Rule-Based' },
          { id: 'kmeans', label: '🤖 K-Means' },
          { id: 'knn',    label: '🧠 KNN Machine Learning' },
          { id: 'all',    label: '📊 All Findings' },
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
                              {['Site', 'Bone', 'Side', 'Period', 'Length', 'Width', 'Preservation', 'Age', 'Sex', 'Year'].map(h => (
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
                                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{f.age_estimate}</td>
                                <td className="px-4 py-3 text-slate-400">{f.sex_estimate}</td>
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

      {/* ── K-Means Tab ── */}
      {activeTab === 'kmeans' && (
        <div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">Number of Clusters (K): {kValue}</label>
            </div>
            <input type="range" min="2" max="8" step="1" value={kValue}
              onChange={e => setKValue(parseInt(e.target.value))}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>2 clusters</span><span>8 clusters</span>
            </div>
            <div className="mt-3 bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
              🤖 <strong className="text-slate-300">K-Means:</strong> Groups bone findings by measurement similarity (length + width). Iteratively assigns to nearest centroid.
            </div>
          </div>
          <div className="space-y-4">
            {kMeansResult.clusters.filter(c => c.points.length > 0).map((cluster, ci) => {
              const colour = CLUSTER_COLOURS[ci % CLUSTER_COLOURS.length]
              const sites  = [...new Set(cluster.points.map(p => p.site_name))]
              const avgLen = cluster.centroid.length_cm.toFixed(1)
              const avgW   = cluster.centroid.width_cm.toFixed(1)
              const periods= [...new Set(cluster.points.map(p => p.time_period))]
              const bones  = [...new Set(cluster.points.map(p => p.bone_type))]
              return (
                <div key={ci} className={`rounded-xl border ${colour.border} ${colour.bg} overflow-hidden`}>
                  <div className="px-6 py-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedGroup(selectedGroup === `k${ci}` ? null : `k${ci}`)}>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ background: colour.dot }} />
                      <div>
                        <p className={`font-semibold ${colour.text}`}>Cluster {ci + 1} — {avgLen}cm × {avgW}cm</p>
                        <p className="text-slate-400 text-xs mt-0.5">{cluster.points.length} findings · {sites.length} sites · {bones.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1">
                        {periods.map(p => <span key={p} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{p}</span>)}
                      </div>
                      <span className="text-slate-500">{selectedGroup === `k${ci}` ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {selectedGroup === `k${ci}` && (
                    <div className="border-t border-slate-700 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            {['Site', 'Bone', 'Side', 'Period', 'Length', 'Width', 'Preservation', 'Age', 'Sex'].map(h => (
                              <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cluster.points.map((f, fi) => (
                            <tr key={fi} className={`border-b border-slate-700 hover:bg-slate-700/50 ${fi % 2 !== 0 ? 'bg-slate-800/30' : ''}`}>
                              <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{f.site_name}</td>
                              <td className="px-4 py-3 text-slate-400">{f.bone_type}</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>{f.side}</span></td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                              <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                              <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>{f.preservation_state}</span></td>
                              <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{f.age_estimate}</td>
                              <td className="px-4 py-3 text-slate-400">{f.sex_estimate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-6 py-3 bg-slate-900/40 text-xs text-slate-400">
                        🤖 <strong className="text-slate-300">AI Insight:</strong> K-Means identified {cluster.points.length} findings (avg: {avgLen}cm × {avgW}cm) across {sites.length} sites — {sites.join(', ')}.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
                  {['Site', 'Bone', 'Side', 'Period', 'Length', 'Width', 'Preservation', 'Age', 'Sex', 'Year'].map(h => (
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
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{f.age_estimate}</td>
                    <td className="px-4 py-3 text-slate-400">{f.sex_estimate}</td>
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
