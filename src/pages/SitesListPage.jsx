import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { DBSCAN } from 'density-clustering'

// Same defaults as the Site Map's "AI Clusters" panel, so the Cluster
// column here matches what you'd see there without needing the sliders.
const CLUSTER_EPS     = 0.3
const CLUSTER_MIN_PTS = 2

const CLUSTER_COLOURS = [
  '#a78bfa', '#fb923c', '#38bdf8', '#f472b6',
  '#4ade80', '#facc15', '#f87171', '#34d399',
]

function riskBadge(level) {
  const map = {
    High:   'bg-red-900 text-red-300',
    Medium: 'bg-yellow-900 text-yellow-300',
    Low:    'bg-emerald-900 text-emerald-300',
  }
  return map[level] || 'bg-slate-700 text-slate-400'
}

function SitesListPage() {
  const navigate = useNavigate()
  const [sites,      setSites]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('id, site_name, district, province, latitude, longitude, time_period, site_type, risk_level, protected_status')
          .not('latitude', 'is', null)
          .order('site_name', { ascending: true })
        if (err) throw err
        setSites(data || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return sites
    const q = searchTerm.toLowerCase()
    return sites.filter(s =>
      (s.site_name && s.site_name.toLowerCase().includes(q)) ||
      (s.district && s.district.toLowerCase().includes(q)) ||
      (s.site_type && s.site_type.toLowerCase().includes(q)) ||
      (s.time_period && s.time_period.toLowerCase().includes(q))
    )
  }, [sites, searchTerm])

  const siteClusterMap = useMemo(() => {
    if (filteredSites.length < 2) return {}
    const dbscan = new DBSCAN()
    const points = filteredSites.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)])
    const clusters = dbscan.run(points, CLUSTER_EPS, CLUSTER_MIN_PTS)
    const map = {}
    clusters.forEach((cluster, ci) => {
      cluster.forEach(siteIdx => { map[siteIdx] = ci })
    })
    return map
  }, [filteredSites])

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Mapped Archaeological Sites</h2>
          <p className="text-slate-400 text-sm mt-1">
            Full list of excavation sites with coordinates on record
          </p>
        </div>
        <Link to="/parami" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to Site Map
        </Link>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 text-red-200 text-sm">
          Failed to load data: {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by name, district, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-4 py-2 w-64 focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
          <span className="text-slate-500 text-sm">{filteredSites.length} sites</span>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500 text-sm">Loading sites...</div>
        ) : filteredSites.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">No sites match your search.</div>
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
                    <td className="px-6 py-3 text-slate-200 font-medium">
                      <button
                        onClick={() => navigate(`/parami/site/${site.id}`)}
                        className="hover:text-blue-400 transition-colors text-left underline underline-offset-2 decoration-slate-600 hover:decoration-blue-400"
                      >
                        {site.site_name}
                      </button>
                    </td>
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

export default SitesListPage
