import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'

// ── Simple K-Means implementation ──────────────────────────────────────────
function kMeans(data, k, iterations = 50) {
  if (data.length < k) k = data.length
  if (k === 0) return { clusters: [], assignments: [] }

  // Initialize centroids randomly
  let centroids = [...data].sort(() => Math.random() - 0.5).slice(0, k)

  let assignments = new Array(data.length).fill(0)

  for (let iter = 0; iter < iterations; iter++) {
    // Assign each point to nearest centroid
    assignments = data.map(point => {
      let minDist = Infinity
      let nearest = 0
      centroids.forEach((c, ci) => {
        const dist = Math.sqrt(
          Math.pow(point.length_cm - c.length_cm, 2) +
          Math.pow(point.width_cm - c.width_cm, 2)
        )
        if (dist < minDist) { minDist = dist; nearest = ci }
      })
      return nearest
    })

    // Recalculate centroids
    const newCentroids = centroids.map((_, ci) => {
      const clusterPoints = data.filter((_, i) => assignments[i] === ci)
      if (clusterPoints.length === 0) return centroids[ci]
      return {
        length_cm: clusterPoints.reduce((s, p) => s + p.length_cm, 0) / clusterPoints.length,
        width_cm:  clusterPoints.reduce((s, p) => s + p.width_cm, 0)  / clusterPoints.length,
      }
    })
    centroids = newCentroids
  }

  // Build clusters
  const clusters = centroids.map((centroid, ci) => ({
    id: ci,
    centroid,
    points: data.filter((_, i) => assignments[i] === ci),
  }))

  return { clusters, assignments }
}

// ── Rule-based similarity check ─────────────────────────────────────────────
function areSimilar(a, b, lengthTolerance = 3.0) {
  return (
    a.bone_type    === b.bone_type &&
    a.time_period  === b.time_period &&
    Math.abs(a.length_cm - b.length_cm) <= lengthTolerance
  )
}

// ── Colours ──────────────────────────────────────────────────────────────────
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

// ── Main Component ───────────────────────────────────────────────────────────
function SimilarFindingsPage() {
  const [findings,      setFindings]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [activeTab,     setActiveTab]     = useState('rule')
  const [boneFilter,    setBoneFilter]    = useState('All')
  const [periodFilter,  setPeriodFilter]  = useState('All')
  const [tolerance,     setTolerance]     = useState(3.0)
  const [kValue,        setKValue]        = useState(4)
  const [selectedGroup, setSelectedGroup] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('bone_findings')
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

  // Unique filter values
  const boneTypes   = useMemo(() => ['All', ...new Set(findings.map(f => f.bone_type).filter(Boolean))], [findings])
  const timePeriods = useMemo(() => ['All', ...new Set(findings.map(f => f.time_period).filter(Boolean))], [findings])

  // Filtered findings
  const filtered = useMemo(() => findings.filter(f =>
    (boneFilter  === 'All' || f.bone_type   === boneFilter) &&
    (periodFilter === 'All' || f.time_period === periodFilter)
  ), [findings, boneFilter, periodFilter])

  // ── Rule-based groups ──────────────────────────────────────────────────────
  const ruleGroups = useMemo(() => {
    const groups = []
    const assigned = new Set()

    filtered.forEach((a, i) => {
      if (assigned.has(i)) return
      const group = [a]
      assigned.add(i)

      filtered.forEach((b, j) => {
        if (i === j || assigned.has(j)) return
        if (areSimilar(a, b, tolerance)) {
          group.push(b)
          assigned.add(j)
        }
      })

      if (group.length > 1) groups.push(group)
    })

    return groups.sort((a, b) => b.length - a.length)
  }, [filtered, tolerance])

  // ── K-Means groups ─────────────────────────────────────────────────────────
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
            IT22889874 — Parami's Module
          </p>
          <h2 className="text-2xl font-bold text-slate-100">Similar Bone Findings Analysis</h2>
          <p className="text-slate-400 text-sm mt-1">
            Cross-site skeletal similarity detection using Rule-Based analysis and K-Means AI clustering
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Findings',     value: findings.length,      color: 'text-blue-400' },
          { label: 'Sites Covered',      value: new Set(findings.map(f => f.site_name)).size, color: 'text-emerald-400' },
          { label: 'Rule-Based Groups',  value: ruleGroups.length,    color: 'text-purple-400' },
          { label: 'K-Means Clusters',   value: kMeansResult.clusters.filter(c => c.points.length > 0).length, color: 'text-orange-400' },
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
            <select
              value={boneFilter}
              onChange={e => setBoneFilter(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {boneTypes.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">Time Period</label>
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
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
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {[
          { id: 'rule',   label: '📋 Rule-Based Similarity' },
          { id: 'kmeans', label: '🤖 K-Means AI Clustering' },
          { id: 'all',    label: '📊 All Findings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Rule-Based Tab ── */}
      {activeTab === 'rule' && (
        <div>
          {/* Tolerance control */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">
                Length Tolerance: ±{tolerance.toFixed(1)} cm
              </label>
              <span className="text-slate-500 text-xs">
                Bones within this range are considered similar
              </span>
            </div>
            <input
              type="range" min="1" max="8" step="0.5" value={tolerance}
              onChange={e => setTolerance(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>±1 cm (Strict)</span>
              <span>±8 cm (Loose)</span>
            </div>
            <div className="mt-3 bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
              📋 <strong className="text-slate-300">Rule:</strong> Same bone type + Same time period + Length difference ≤ ±{tolerance.toFixed(1)}cm → Similar group
            </div>
          </div>

          {ruleGroups.length === 0 ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🦴</p>
              <p className="text-slate-400">No similar groups found with current settings.</p>
              <p className="text-slate-500 text-sm mt-1">Try increasing the tolerance or removing filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ruleGroups.map((group, gi) => {
                const colour = CLUSTER_COLOURS[gi % CLUSTER_COLOURS.length]
                const avgLen = (group.reduce((s, f) => s + f.length_cm, 0) / group.length).toFixed(1)
                const sites  = [...new Set(group.map(f => f.site_name))]
                return (
                  <div key={gi} className={`rounded-xl border ${colour.border} ${colour.bg} overflow-hidden`}>
                    {/* Group header */}
                    <div
                      className="px-6 py-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedGroup(selectedGroup === gi ? null : gi)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colour.dot }} />
                        <div>
                          <p className={`font-semibold ${colour.text}`}>
                            Group {gi + 1} — {group[0].bone_type} · {group[0].time_period}
                          </p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {group.length} findings · avg length {avgLen} cm · {sites.length} sites
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-wrap gap-1">
                          {sites.map(s => (
                            <span key={s} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                        <span className="text-slate-500 text-sm">{selectedGroup === gi ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {/* Expanded findings */}
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
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                                    {f.side}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                                <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                                <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>
                                    {f.preservation_state}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{f.age_estimate}</td>
                                <td className="px-4 py-3 text-slate-400">{f.sex_estimate}</td>
                                <td className="px-4 py-3 text-slate-500">{f.excavation_year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* Insight */}
                        <div className="px-6 py-3 bg-slate-900/40 text-xs text-slate-400">
                          💡 <strong className="text-slate-300">Insight:</strong> {group.length} {group[0].bone_type} bones from {sites.length} different sites show similar measurements in the {group[0].time_period} period — suggesting {sites.length > 1 ? 'shared physical characteristics across sites' : 'consistent findings within the site'}.
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
          {/* K control */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 text-sm font-medium">
                Number of Clusters (K): {kValue}
              </label>
            </div>
            <input
              type="range" min="2" max="8" step="1" value={kValue}
              onChange={e => setKValue(parseInt(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>2 clusters</span>
              <span>8 clusters</span>
            </div>
            <div className="mt-3 bg-slate-700 rounded-lg p-3 text-xs text-slate-400">
              🤖 <strong className="text-slate-300">K-Means AI:</strong> Groups bone findings by measurement similarity (length + width). Algorithm iteratively assigns findings to nearest centroid until stable clusters form.
            </div>
          </div>

          <div className="space-y-4">
            {kMeansResult.clusters.filter(c => c.points.length > 0).map((cluster, ci) => {
              const colour   = CLUSTER_COLOURS[ci % CLUSTER_COLOURS.length]
              const sites    = [...new Set(cluster.points.map(p => p.site_name))]
              const avgLen   = cluster.centroid.length_cm.toFixed(1)
              const avgWidth = cluster.centroid.width_cm.toFixed(1)
              const periods  = [...new Set(cluster.points.map(p => p.time_period))]
              const bones    = [...new Set(cluster.points.map(p => p.bone_type))]
              return (
                <div key={ci} className={`rounded-xl border ${colour.border} ${colour.bg} overflow-hidden`}>
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedGroup(selectedGroup === `k${ci}` ? null : `k${ci}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colour.dot }} />
                      <div>
                        <p className={`font-semibold ${colour.text}`}>
                          Cluster {ci + 1} — Centroid: {avgLen}cm × {avgWidth}cm
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {cluster.points.length} findings · {sites.length} sites · {bones.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-wrap gap-1">
                        {periods.map(p => (
                          <span key={p} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                      <span className="text-slate-500 text-sm">{selectedGroup === `k${ci}` ? '▲' : '▼'}</span>
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
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                                  {f.side}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                              <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                              <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>
                                  {f.preservation_state}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{f.age_estimate}</td>
                              <td className="px-4 py-3 text-slate-400">{f.sex_estimate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-6 py-3 bg-slate-900/40 text-xs text-slate-400">
                        🤖 <strong className="text-slate-300">AI Insight:</strong> K-Means identified {cluster.points.length} findings with similar measurements (centroid: {avgLen}cm × {avgWidth}cm) across {sites.length} site{sites.length > 1 ? 's' : ''} — {sites.join(', ')}.
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
                  <tr key={f.id} className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 !== 0 ? 'bg-slate-800/50' : ''}`}>
                    <td className="px-4 py-3 text-slate-200 font-medium whitespace-nowrap">{f.site_name}</td>
                    <td className="px-4 py-3 text-slate-400">{f.bone_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.side === 'Left' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                        {f.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{f.time_period}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">{f.length_cm} cm</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{f.width_cm} cm</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRESERVATION_BADGE[f.preservation_state] || 'bg-slate-700 text-slate-400'}`}>
                        {f.preservation_state}
                      </span>
                    </td>
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
