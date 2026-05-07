import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet'
import DBSCAN from 'density-clustering'

const RISK_COLOUR = {
  High:   '#f87171',
  Medium: '#fbbf24',
  Low:    '#34d399',
}

const TIME_PERIODS = [
  { label: 'All Periods',       min: -50000, max: 2024  },
  { label: 'Prehistoric',       min: -50000, max: -1000 },
  { label: 'Early Historic',    min: -1000,  max: 0     },
  { label: 'Classical Period',  min: 0,      max: 1200  },
  { label: 'Medieval & Modern', min: 1200,   max: 2024  },
]

function markerOptions(risk_level) {
  const colour = RISK_COLOUR[risk_level] || '#60a5fa'
  return { radius: 7, fillColor: colour, color: '#fff', weight: 1.5, fillOpacity: 0.85 }
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:    'text-blue-400',
    emerald: 'text-emerald-400',
    orange:  'text-orange-400',
    red:     'text-red-400',
    purple:  'text-purple-400',
  }
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  )
}

// Simple period guesser from free-text time_period field
function guessPeriodYear(timePeriod) {
  if (!timePeriod) return null
  const t = timePeriod.toLowerCase()
  if (t.includes('prehistoric') || t.includes('paleolithic') || t.includes('mesolithic')) return -10000
  if (t.includes('iron age') || t.includes('early historic')) return -500
  if (t.includes('anuradhapura')) return 300
  if (t.includes('polonnaruwa')) return 1100
  if (t.includes('medieval') || t.includes('kandyan')) return 1500
  if (t.includes('colonial') || t.includes('modern')) return 1800
  const m = timePeriod.match(/-?\d+/)
  if (m) return parseInt(m[0])
  return null
}

// DBSCAN cluster colours
const CLUSTER_COLOURS = [
  '#a78bfa', '#fb923c', '#38bdf8', '#f472b6',
  '#4ade80', '#facc15', '#f87171', '#34d399',
]

function ParamiModulePage() {
  const [sites,        setSites]        = useState([])
  const [stats,        setStats]        = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [periodIdx,    setPeriodIdx]    = useState(0)
  const [showClusters, setShowClusters] = useState(false)
  const [eps,          setEps]          = useState(0.8)
  const [minPts,       setMinPts]       = useState(2)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('id, site_name, district, province, latitude, longitude, time_period, site_type, risk_level, protected_status')
          .not('latitude', 'is', null)
          .order('site_name', { ascending: true })
        if (err) throw err
        const rows = data || []
        setSites(rows)
        const by_type = rows.reduce((acc, s) => {
          if (s.site_type) acc[s.site_type] = (acc[s.site_type] || 0) + 1
          return acc
        }, {})
        const by_district = rows.reduce((acc, s) => {
          if (s.district) acc[s.district] = (acc[s.district] || 0) + 1
          return acc
        }, {})
        setStats({
          total:     rows.length,
          high_risk: rows.filter(s => s.risk_level === 'High').length,
          protected: rows.filter(s => s.protected_status).length,
          by_type,
          by_district,
        })
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter sites by selected time period
  const filteredSites = useMemo(() => {
    const period = TIME_PERIODS[periodIdx]
    if (periodIdx === 0) return sites
    return sites.filter(s => {
      const year = guessPeriodYear(s.time_period)
      if (year === null) return false
      return year >= period.min && year <= period.max
    })
  }, [sites, periodIdx])

  // Run DBSCAN on filtered sites
  const clusters = useMemo(() => {
    if (!showClusters || filteredSites.length < 2) return []
    const dbscan = new DBSCAN()
    const points = filteredSites.map(s => [
      parseFloat(s.latitude),
      parseFloat(s.longitude),
    ])
    const result = dbscan.run(points, eps, minPts)
    return result
  }, [filteredSites, showClusters, eps, minPts])

  // Map each site index to its cluster id
  const siteClusterMap = useMemo(() => {
    const map = {}
    clusters.forEach((cluster, ci) => {
      cluster.forEach(siteIdx => { map[siteIdx] = ci })
    })
    return map
  }, [clusters])

  const riskBadge = (level) => {
    const map = {
      High:   'bg-red-900 text-red-300',
      Medium: 'bg-yellow-900 text-yellow-300',
      Low:    'bg-emerald-900 text-emerald-300',
    }
    return map[level] || 'bg-slate-700 text-slate-400'
  }

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">
            IT22889874 — Parami's Module
          </p>
          <h2 className="text-2xl font-bold text-slate-100">GIS & Spatial Analysis</h2>
          <p className="text-slate-400 text-sm mt-1">
            Site mapping, temporal layers, and AI spatial pattern detection
          </p>
        </div>
        <Link to="/" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back
        </Link>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 text-red-200 text-sm">
          Failed to load data: {error}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-pulse h-20" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total Sites"      value={stats.total}                        color="blue" />
          <StatCard label="Showing Now"      value={filteredSites.length}               color="emerald" />
          <StatCard label="Clusters Found"   value={clusters.length}                    color="purple" />
          <StatCard label="High Risk"        value={stats.high_risk}                    color="red" />
          <StatCard label="Protected"        value={stats.protected}                    color="orange" />
        </div>
      )}

      {/* ── TEMPORAL SLIDER ── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-200 font-semibold">Temporal Layer Filter</h3>
            <p className="text-slate-500 text-xs mt-0.5">Filter map markers by excavation time period</p>
          </div>
          <span className="text-blue-400 text-sm font-medium bg-blue-900/40 px-3 py-1 rounded-full">
            {filteredSites.length} / {sites.length} sites
          </span>
        </div>

        {/* Period buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TIME_PERIODS.map((p, i) => (
            <button
              key={i}
              onClick={() => setPeriodIdx(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                periodIdx === i
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{
              left:  `${((TIME_PERIODS[periodIdx].min + 50000) / 72024) * 100}%`,
              width: `${((TIME_PERIODS[periodIdx].max - TIME_PERIODS[periodIdx].min) / 72024) * 100}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>50,000 BP</span>
          <span>Present</span>
        </div>
      </div>

      {/* ── DBSCAN CLUSTERING CONTROLS ── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-slate-200 font-semibold">AI Spatial Pattern Detection</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              DBSCAN algorithm — detects burial site clusters automatically
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-400 text-sm">Show clusters</span>
            <div
              onClick={() => setShowClusters(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                showClusters ? 'bg-purple-600' : 'bg-slate-600'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                showClusters ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>

        {showClusters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-400 text-sm">Search radius (ε): {eps.toFixed(1)}°</label>
                <span className="text-slate-500 text-xs">~{Math.round(eps * 111)} km</span>
              </div>
              <input
                type="range" min="0.1" max="3" step="0.1" value={eps}
                onChange={e => setEps(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
              <p className="text-slate-600 text-xs mt-1">How far apart sites can be to be in the same cluster</p>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-slate-400 text-sm">Min points: {minPts}</label>
                <span className="text-slate-500 text-xs">per cluster</span>
              </div>
              <input
                type="range" min="2" max="6" step="1" value={minPts}
                onChange={e => setMinPts(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <p className="text-slate-600 text-xs mt-1">Minimum sites needed to form a cluster</p>
            </div>
          </div>
        )}

        {showClusters && clusters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {clusters.map((cluster, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-slate-700 rounded-lg px-3 py-1.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: CLUSTER_COLOURS[i % CLUSTER_COLOURS.length] }}
                />
                <span className="text-slate-300 text-xs">
                  Cluster {i + 1}: {cluster.length} sites
                </span>
              </div>
            ))}
          </div>
        )}

        {showClusters && clusters.length === 0 && !loading && (
          <p className="text-slate-500 text-sm mt-3">
            No clusters found with current settings. Try increasing ε or reducing min points.
          </p>
        )}
      </div>

      {/* ── MAP ── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-slate-200 font-semibold">
            Site Map
            <span className="text-slate-500 font-normal text-sm ml-2">
              — {TIME_PERIODS[periodIdx].label}
            </span>
          </h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {Object.entries(RISK_COLOUR).map(([level, colour]) => (
              <span key={level} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: colour }} />
                {level}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400" />
              Unknown
            </span>
          </div>
        </div>

        {!loading && (
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={8}
            style={{ height: '520px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Cluster radius circles */}
            {showClusters && clusters.map((cluster, ci) => {
              const colour = CLUSTER_COLOURS[ci % CLUSTER_COLOURS.length]
              const lats = cluster.map(idx => parseFloat(filteredSites[idx].latitude))
              const lngs = cluster.map(idx => parseFloat(filteredSites[idx].longitude))
              const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length
              const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length
              return (
                <Circle
                  key={`cluster-${ci}`}
                  center={[centerLat, centerLng]}
                  radius={eps * 55000}
                  pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.08, weight: 1.5, dashArray: '6 4' }}
                />
              )
            })}

            {/* Site markers */}
            {filteredSites.map((site, idx) => {
              const clusterIdx = siteClusterMap[idx]
              const isInCluster = clusterIdx !== undefined
              const clusterColour = isInCluster ? CLUSTER_COLOURS[clusterIdx % CLUSTER_COLOURS.length] : null
              const opts = showClusters && isInCluster
                ? { radius: 9, fillColor: clusterColour, color: '#fff', weight: 2, fillOpacity: 0.95 }
                : markerOptions(site.risk_level)
              return (
                <CircleMarker
                  key={site.id}
                  center={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                  pathOptions={opts}
                >
                  <Popup>
                    <div style={{ minWidth: '180px' }}>
                      <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>
                        {site.site_name}
                      </p>
                      {showClusters && isInCluster && (
                        <p style={{ fontSize: '11px', marginBottom: '6px', color: clusterColour, fontWeight: 600 }}>
                          Cluster {clusterIdx + 1}
                        </p>
                      )}
                      <table style={{ fontSize: '12px', borderCollapse: 'collapse', width: '100%' }}>
                        <tbody>
                          {[
                            ['District',  site.district],
                            ['Type',      site.site_type],
                            ['Period',    site.time_period],
                            ['Risk',      site.risk_level],
                          ].map(([label, val]) => val ? (
                            <tr key={label}>
                              <td style={{ color: '#6b7280', paddingRight: '8px', paddingBottom: '2px' }}>{label}</td>
                              <td style={{ color: '#111827' }}>{val}</td>
                            </tr>
                          ) : null)}
                        </tbody>
                      </table>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}

        {loading && (
          <div className="h-[520px] flex items-center justify-center text-slate-500 text-sm">
            Loading map...
          </div>
        )}
      </div>

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats && (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wide">By Site Type</h3>
            {Object.entries(stats.by_type).length === 0 ? (
              <p className="text-slate-500 text-sm">No type data available</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.by_type).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm truncate">{type}</span>
                    <span className="text-blue-400 font-semibold text-sm ml-2">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {stats && (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 md:col-span-2">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wide">By District</h3>
            {Object.entries(stats.by_district).length === 0 ? (
              <p className="text-slate-500 text-sm">No district data available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.by_district).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([district, count]) => (
                  <div key={district} className="flex items-center justify-between bg-slate-700 rounded-lg px-3 py-2">
                    <span className="text-slate-300 text-sm truncate">{district}</span>
                    <span className="text-emerald-400 font-semibold text-sm ml-2">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sites table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-slate-200 font-semibold">Mapped Archaeological Sites</h3>
          <span className="text-slate-500 text-sm">{filteredSites.length} sites shown</span>
        </div>
        {loading ? (
          <div className="p-6 text-slate-500 text-sm">Loading sites...</div>
        ) : filteredSites.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No sites match the selected time period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Site Name</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">District</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Type</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Period</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Coordinates</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Risk</th>
                  <th className="text-left px-6 py-3 text-slate-400 font-medium">Cluster</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site, i) => (
                  <tr key={site.id} className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 !== 0 ? 'bg-slate-800/50' : ''}`}>
                    <td className="px-6 py-3 text-slate-200 font-medium">{site.site_name}</td>
                    <td className="px-6 py-3 text-slate-400">{site.district || '—'}</td>
                    <td className="px-6 py-3 text-slate-400">{site.site_type || '—'}</td>
                    <td className="px-6 py-3 text-slate-400 max-w-[160px] truncate">{site.time_period || '—'}</td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {parseFloat(site.latitude).toFixed(4)}, {parseFloat(site.longitude).toFixed(4)}
                    </td>
                    <td className="px-6 py-3">
                      {site.risk_level ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskBadge(site.risk_level)}`}>
                          {site.risk_level}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3">
                      {siteClusterMap[i] !== undefined ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CLUSTER_COLOURS[siteClusterMap[i] % CLUSTER_COLOURS.length] }}>
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: CLUSTER_COLOURS[siteClusterMap[i] % CLUSTER_COLOURS.length] }} />
                          Cluster {siteClusterMap[i] + 1}
                        </span>
                      ) : <span className="text-slate-600 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>



    </div>
  )
}

export default ParamiModulePage
