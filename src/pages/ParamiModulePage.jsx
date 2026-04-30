import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

const RISK_COLOUR = {
  High:   '#f87171',
  Medium: '#fbbf24',
  Low:    '#34d399',
}

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
  }
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  )
}

function ParamiModulePage() {
  const [sites,   setSites]   = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

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
            Site mapping, spatial queries, and temporal analysis for Sri Lankan osteoarchaeological sites
          </p>
        </div>
        <Link to="/" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-xl p-4 mb-6 text-red-200 text-sm">
          Failed to load data: {error}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 border border-slate-700 animate-pulse h-20" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Mapped Sites"    value={stats.total}                          color="blue" />
          <StatCard label="Site Types"      value={Object.keys(stats.by_type).length}   color="emerald" />
          <StatCard label="High Risk Sites" value={stats.high_risk}                      color="red" />
          <StatCard label="Protected Sites" value={stats.protected}                      color="orange" />
        </div>
      )}

      {/* Breakdown grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {stats && (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h3 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wide">
              By Site Type
            </h3>
            {Object.entries(stats.by_type).length === 0 ? (
              <p className="text-slate-500 text-sm">No type data available</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats.by_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
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
            <h3 className="text-slate-300 font-semibold mb-4 text-sm uppercase tracking-wide">
              By District
            </h3>
            {Object.entries(stats.by_district).length === 0 ? (
              <p className="text-slate-500 text-sm">No district data available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.by_district)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([district, count]) => (
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

      {/* Map */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-slate-200 font-semibold">Site Map</h3>
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
            style={{ height: '500px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {sites.map(site => (
              <CircleMarker
                key={site.id}
                center={[parseFloat(site.latitude), parseFloat(site.longitude)]}
                pathOptions={markerOptions(site.risk_level)}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>
                      {site.site_name}
                    </p>
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
            ))}
          </MapContainer>
        )}

        {loading && (
          <div className="h-[500px] flex items-center justify-center text-slate-500 text-sm">
            Loading map...
          </div>
        )}
      </div>

      {/* Sites table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-slate-200 font-semibold">Mapped Archaeological Sites</h3>
          <span className="text-slate-500 text-sm">{sites.length} sites with coordinates</span>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500 text-sm">Loading sites...</div>
        ) : sites.length === 0 ? (
          <div className="p-6 text-slate-500 text-sm">
            No sites found. Make sure the <code className="text-blue-400">sites</code> table exists in Supabase with latitude/longitude columns.
          </div>
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
                </tr>
              </thead>
              <tbody>
                {sites.map((site, i) => (
                  <tr
                    key={site.id}
                    className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 !== 0 ? 'bg-slate-800/50' : ''}`}
                  >
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API endpoints note */}
      <div className="mt-6 bg-slate-800 rounded-xl p-5 border border-slate-700">
        <h3 className="text-slate-300 font-semibold mb-3 text-sm uppercase tracking-wide">
          Backend GIS API
          <span className="text-slate-500 font-normal normal-case ml-2">
            — run <code className="text-blue-400">node server.js</code> in /backend
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          {[
            '/api/gis/sites/map',
            '/api/gis/sites/temporal',
            '/api/gis/sites/cluster-data',
            '/api/gis/sites/by-district',
            '/api/gis/sites/excavation-phases',
            '/api/gis/spatial-stats',
          ].map(ep => (
            <div key={ep} className="flex items-center gap-2 text-slate-400">
              <span className="text-emerald-400">GET</span>
              <span>{ep}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default ParamiModulePage
