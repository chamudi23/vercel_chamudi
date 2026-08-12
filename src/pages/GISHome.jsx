import { Link } from 'react-router-dom'

function GISHome() {
  return (
    <div className="min-h-screen bg-slate-900">

      {/* Hero Section */}
      <div className="text-center py-12 px-8 border-b border-slate-700">
        <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-3">
          IT22889874 — Parami K K J
        </p>
        <h1 className="text-4xl font-bold text-slate-100 mb-4">
          GIS & Spatial
          <span className="text-blue-400"> Analysis Module</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
          Site mapping, temporal layers, and AI spatial pattern detection
          for osteoarchaeological research across Sri Lanka.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            Leaflet.js GIS
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            DBSCAN AI
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            Temporal Layers
          </span>
        </div>
      </div>

      {/* 4 Module Cards */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-8 text-center">
          GIS Module Sections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1 — Site Mapping & Analysis */}
          <Link to="/parami" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-teal-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-teal-900 p-3 rounded-xl">
                <span className="text-2xl">🗺️</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                Core Module
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Site Mapping & Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Interactive GIS map of Sri Lanka archaeological sites with
              temporal layer filtering, excavation phase timeline, and
              DBSCAN AI spatial pattern detection.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full">
                Site Mapping
              </span>
              <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full">
                Temporal Layers
              </span>
              <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full">
                DBSCAN AI
              </span>
              <span className="bg-teal-900 text-teal-300 text-xs px-2 py-1 rounded-full">
                Cluster Detection
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Spatial · Temporal · AI</span>
              <span className="text-teal-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

          {/* Card 2 — Similar Findings */}
          <Link to="/parami/similar-findings" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-purple-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-900 p-3 rounded-xl">
                <span className="text-2xl">🔍</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                AI Matching
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Similar Findings
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Discover archaeologically similar sites based on skeletal
              characteristics, burial type, time period, and geographic
              proximity using intelligent matching.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Site Comparison
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Pattern Match
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Skeletal Data
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Proximity Search
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Pattern · Comparison · Match</span>
              <span className="text-purple-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

          {/* Card 3 — Add Specimen */}
          <Link to="/parami/add-specimen" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-amber-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-amber-900 p-3 rounded-xl">
                <span className="text-2xl">🦴</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                Data Entry
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Add Specimen
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Record new skeletal specimens with biological profile, bone
              measurements, dental data, and morphometric analysis linked
              to excavation sites.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-amber-900 text-amber-300 text-xs px-2 py-1 rounded-full">
                Skeletal Record
              </span>
              <span className="bg-amber-900 text-amber-300 text-xs px-2 py-1 rounded-full">
                Bio Profile
              </span>
              <span className="bg-amber-900 text-amber-300 text-xs px-2 py-1 rounded-full">
                Measurements
              </span>
              <span className="bg-amber-900 text-amber-300 text-xs px-2 py-1 rounded-full">
                Dental Data
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Record · Document · Link</span>
              <span className="text-amber-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

          {/* Card 4 — Add New Site */}
          <Link to="/parami/add-site" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-emerald-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-emerald-900 p-3 rounded-xl">
                <span className="text-2xl">📍</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                Site Registry
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Add New Site
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Register a new archaeological excavation site with GPS
              coordinates, site classification, risk assessment, and
              upload site photographs to the GIS database.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                GPS Coordinates
              </span>
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Site Type
              </span>
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Risk Level
              </span>
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Photo Upload
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Register · Locate · Document</span>
              <span className="text-emerald-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-t border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-teal-400">23</p>
              <p className="text-slate-400 text-sm mt-1">Total Sites</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-400">DBSCAN</p>
              <p className="text-slate-400 text-sm mt-1">AI Algorithm</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">4</p>
              <p className="text-slate-400 text-sm mt-1">Excavation Phases</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">50K BP</p>
              <p className="text-slate-400 text-sm mt-1">Time Coverage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 py-6 text-center">
        <p className="text-slate-500 text-sm">
          OAHRIS — GIS & Spatial Analysis Module · IT22889874 · Parami K K J
        </p>
        <Link to="/" className="text-slate-600 text-xs mt-1 hover:text-slate-400 transition-colors inline-block">
          ← Back to Main Home
        </Link>
      </div>

    </div>
  )
}

export default GISHome
