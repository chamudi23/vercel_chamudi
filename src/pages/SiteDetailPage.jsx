import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

const RISK_COLOUR = {
  High:   '#f87171',
  Medium: '#fbbf24',
  Low:    '#34d399',
}

const RISK_BG = {
  High:   'bg-red-900 text-red-300 border-red-700',
  Medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  Low:    'bg-emerald-900 text-emerald-300 border-emerald-700',
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-700 last:border-0">
      <span className="text-slate-400 text-sm w-40 flex-shrink-0">{label}</span>
      <span className="text-slate-200 text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function SiteDetailPage() {
  const { siteId } = useParams()
  const [site,      setSite]      = useState(null)
  const [specimens, setSpecimens] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [specLoad,  setSpecLoad]  = useState(true)
  const [error,     setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('info')

  useEffect(() => {
    async function loadSite() {
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('*')
          .eq('id', siteId)
          .single()
        if (err) throw err
        setSite(data)

        // Load specimens by site_name
        if (data?.site_name) {
          const { data: specs, error: specErr } = await supabase
            .from('specimens')
            .select('*')
            .eq('site_name', data.site_name)
            .order('skeleton_code', { ascending: true })
          if (!specErr) setSpecimens(specs || [])
        }
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
        setSpecLoad(false)
      }
    }
    loadSite()
  }, [siteId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/3" />
          <div className="h-4 bg-slate-700 rounded w-1/2" />
          <div className="h-64 bg-slate-700 rounded" />
        </div>
      </div>
    )
  }

  if (error || !site) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-900 border border-red-700 rounded-xl p-6 text-red-200">
          <p className="font-semibold mb-2">Site not found</p>
          <p className="text-sm">{error}</p>
          <Link to="/parami" className="mt-4 inline-block text-blue-400 hover:text-blue-300 text-sm">
            ← Back to GIS Module
          </Link>
        </div>
      </div>
    )
  }

  const lat = parseFloat(site.latitude)
  const lng = parseFloat(site.longitude)
  const riskColour = RISK_COLOUR[site.risk_level] || '#60a5fa'
  const riskBg = RISK_BG[site.risk_level] || 'bg-slate-700 text-slate-300 border-slate-600'

  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Back button */}
      <Link to="/parami" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors">
        ← Back to GIS Map
      </Link>

      {/* Header */}
      <div className="mb-8">
        <p className="text-blue-400 text-xs font-medium uppercase tracking-widest mb-2">
          IT22889874 — Site Detail View
        </p>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{site.site_name}</h1>
            <p className="text-slate-400 mt-1">
              {site.district && `${site.district}, `}{site.province}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {specimens.length > 0 && (
              <span className="bg-purple-900 text-purple-300 border border-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                {specimens.length} Specimens
              </span>
            )}
            {site.risk_level && (
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${riskBg}`}>
                {site.risk_level} Risk
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        {[
          { id: 'info', label: '📍 Site Info' },
          { id: 'map', label: '🗺️ Location Map' },
          { id: 'specimens', label: `🦴 Specimens (${specimens.length})` },
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

      {/* Tab: Site Info */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Site Information
              </h2>
              <InfoRow label="Site Name"     value={site.site_name} />
              <InfoRow label="Site Type"     value={site.site_type} />
              <InfoRow label="Time Period"   value={site.time_period} />
              <InfoRow label="District"      value={site.district} />
              <InfoRow label="Province"      value={site.province} />
              <InfoRow label="Risk Level"    value={site.risk_level} />
              <InfoRow
                label="Protected"
                value={
                  site.protected_status === 'Protected' || site.protected_status === 'true' || site.is_protected === true
                    ? '✅ Protected Site'
                    : '❌ Not Protected'
                }
              />
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Spatial Information
              </h2>
              <InfoRow label="Latitude"    value={lat.toFixed(6) + '°'} />
              <InfoRow label="Longitude"   value={lng.toFixed(6) + '°'} />
              <InfoRow label="Coordinates" value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`} />
              <div className="mt-4">
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Open in Google Maps ↗
                </a>
              </div>
            </div>
          </div>

          {/* Research Notes */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
              Research Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Classification', value: site.site_type || '—', color: 'text-blue-400' },
                { label: 'Period',         value: site.time_period || '—', color: 'text-emerald-400' },
                { label: 'Risk Level',     value: site.risk_level || '—', color: 'text-red-400' },
                { label: 'Specimens',      value: specimens.length > 0 ? `${specimens.length} records` : 'None found', color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="bg-slate-700 rounded-lg p-4 text-center">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-slate-400 text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>
            {site.description && (
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">{site.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Map */}
      {activeTab === 'map' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-slate-200 font-semibold">Site Location</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {site.site_name} — {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          </div>
          <MapContainer center={[lat, lng]} zoom={12} style={{ height: '400px', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <CircleMarker
              center={[lat, lng]}
              pathOptions={{ radius: 12, fillColor: riskColour, color: '#fff', weight: 2, fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{site.site_name}</strong><br />
                {site.site_type} — {site.time_period}
              </Popup>
            </CircleMarker>
          </MapContainer>
        </div>
      )}

      {/* Tab: Specimens */}
      {activeTab === 'specimens' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-slate-200 font-semibold">Skeletal Specimens</h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Specimens found at {site.site_name}
              </p>
            </div>
            <span className="text-purple-400 text-sm font-medium bg-purple-900/40 px-3 py-1 rounded-full">
              {specimens.length} records
            </span>
          </div>

          {specLoad ? (
            <div className="p-6 text-slate-500 text-sm">Loading specimens...</div>
          ) : specimens.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 text-4xl mb-3">🦴</p>
              <p className="text-slate-400 font-medium">No specimens found</p>
              <p className="text-slate-500 text-sm mt-1">
                No skeletal records linked to "{site.site_name}"
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Specimen ID</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Skeleton Code</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Time Period</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Excavation Year</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Location Stored</th>
                    <th className="text-left px-6 py-3 text-slate-400 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {specimens.map((spec, i) => (
                    <tr key={spec.specimen_id || i} className={`border-b border-slate-700 hover:bg-slate-700 transition-colors ${i % 2 !== 0 ? 'bg-slate-800/50' : ''}`}>
                      <td className="px-6 py-3 text-blue-400 font-mono text-xs">{spec.specimen_id || '—'}</td>
                      <td className="px-6 py-3 text-slate-200 font-medium">{spec.skeleton_code || '—'}</td>
                      <td className="px-6 py-3 text-slate-400">{spec.time_period || '—'}</td>
                      <td className="px-6 py-3 text-slate-400">{spec.excavation_year || '—'}</td>
                      <td className="px-6 py-3 text-slate-400">{spec.location_stored || '—'}</td>
                      <td className="px-6 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={spec.notes}>
                        {spec.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-6">
        <Link to="/parami" className="text-slate-400 hover:text-slate-200 text-sm transition-colors">
          ← Back to GIS Map
        </Link>
        <p className="text-slate-600 text-xs">IT22889874 — Parami's GIS Module</p>
      </div>

    </div>
  )
}

export default SiteDetailPage
