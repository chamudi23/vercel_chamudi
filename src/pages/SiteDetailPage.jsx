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

function InfoRow({ label, value, highlight = false }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-700 last:border-0">
      <span className="text-slate-400 text-sm w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-blue-400' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  )
}

function SiteDetailPage() {
  const { siteId } = useParams()
  const [site, setSite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('sites')
          .select('*')
          .eq('id', siteId)
          .single()
        if (err) throw err
        setSite(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
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
      <Link
        to="/parami"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
      >
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
          {site.risk_level && (
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${riskBg}`}>
              {site.risk_level} Risk
            </span>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Site Information */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Site Information
          </h2>
          <div>
            <InfoRow label="Site Name"        value={site.site_name} highlight />
            <InfoRow label="Site Type"        value={site.site_type} />
            <InfoRow label="Time Period"      value={site.time_period} />
            <InfoRow label="District"         value={site.district} />
            <InfoRow label="Province"         value={site.province} />
            <InfoRow label="Risk Level"       value={site.risk_level} />
            <InfoRow
              label="Protected Status"
              value={site.protected_status ? '✅ Protected Site' : '❌ Not Protected'}
            />
          </div>
        </div>

        {/* Spatial Information */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Spatial Information
          </h2>
          <div>
            <InfoRow label="Latitude"  value={lat.toFixed(6) + '°'} highlight />
            <InfoRow label="Longitude" value={lng.toFixed(6) + '°'} highlight />
            <InfoRow
              label="Coordinates"
              value={`${lat.toFixed(4)}, ${lng.toFixed(4)}`}
            />
            <InfoRow
              label="Google Maps"
              value={`View on Google Maps ↗`}
            />
          </div>

          {/* Google Maps link */}
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Open in Google Maps ↗
          </a>
        </div>
      </div>

      {/* Mini Map */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-slate-200 font-semibold">Site Location</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {site.site_name} — {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
        <MapContainer
          center={[lat, lng]}
          zoom={12}
          style={{ height: '350px', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <CircleMarker
            center={[lat, lng]}
            pathOptions={{
              radius: 12,
              fillColor: riskColour,
              color: '#fff',
              weight: 2,
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <strong>{site.site_name}</strong><br />
              {site.site_type} — {site.time_period}
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      {/* Research Notes */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
        <h2 className="text-slate-200 font-semibold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          Research Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{site.site_type || '—'}</p>
            <p className="text-slate-400 text-xs mt-1">Site Classification</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{site.time_period || '—'}</p>
            <p className="text-slate-400 text-xs mt-1">Historical Period</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: riskColour }}>
              {site.risk_level || '—'}
            </p>
            <p className="text-slate-400 text-xs mt-1">Conservation Risk</p>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex justify-between items-center">
        <Link
          to="/parami"
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ← Back to GIS Map
        </Link>
        <p className="text-slate-600 text-xs">IT22889874 — Parami's GIS Module</p>
      </div>

    </div>
  )
}

export default SiteDetailPage
