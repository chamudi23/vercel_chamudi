import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">

      {/* Hero Section */}
      <div className="text-center py-16 px-8 border-b border-slate-700">
        <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-3">
          SLIIT — IT4010 Research Project 2026
        </p>
        <h1 className="text-4xl font-bold text-slate-100 mb-4">
          Osteoarchaeological Research
          <span className="text-blue-400"> Information System</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
          A centralized platform for managing skeletal specimen records,
          spatial analysis, image documentation, and automated biological
          profile prediction for Sri Lankan osteoarchaeological research.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            React + Vite
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            Supabase PostgreSQL
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-700">
            Tailwind CSS
          </span>
        </div>
      </div>

      {/* 4 Module Cards */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-8 text-center">
          System Modules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Module 1 — Data Management (Minuri) */}
          <Link to="/minuri" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-emerald-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-emerald-900 p-3 rounded-xl">
                <span className="text-2xl">📊</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                IT22159908
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Data Integration & Management
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Centralized specimen record management with data integration,
              validation rules, and consistency checks across multiple
              osteoarchaeological data sources.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Specimen Records
              </span>
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Data Validation
              </span>
              <span className="bg-emerald-900 text-emerald-300 text-xs px-2 py-1 rounded-full">
                Data Quality
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Minuri</span>
              <span className="text-emerald-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

          {/* Module 2 — GIS (Parami) */}
          <Link to="/parami" className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-blue-500 transition-all group block">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-900 p-3 rounded-xl">
                <span className="text-2xl">🗺️</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                IT22889874
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              GIS & Spatial Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              GIS tools to map skeletal find locations and archaeological
              sites. Supports spatial and temporal interpretation of
              osteoarchaeological records across Sri Lanka.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
                Site Mapping
              </span>
              <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
                Spatial Queries
              </span>
              <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">
                Temporal Analysis
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Parami</span>
              <span className="text-blue-400 text-xs group-hover:translate-x-1 transition-transform">Open Module →</span>
            </div>
          </Link>

          {/* Module 3 — Image Module (Ilshan) — ACTIVE */}
          <Link
            to="/module"
            className="bg-slate-800 rounded-2xl p-6 border border-purple-500 hover:border-purple-400 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              
            </div>
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-900 p-3 rounded-xl">
                <span className="text-2xl">🦴</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                IT21824210
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Skeletal Image Documentation
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Skeletal image documentation, annotation, retrieval and
              visualization module. Manage image records with standardized
              metadata connected to a skeletal viewer.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Image Upload
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Metadata
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                SVG Skeleton
              </span>
              <span className="bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded-full">
                Search
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Ilshan</span>
              <span className="text-purple-400 text-xs group-hover:translate-x-1 transition-transform">
                Open Module →
              </span>
            </div>
          </Link>

          {/* Module 4 — Automated Analysis */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-orange-500 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-orange-900 p-3 rounded-xl">
                <span className="text-2xl">🔬</span>
              </div>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded-full">
                IT22299802
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Automated Skeletal Analysis
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Automated skeletal analysis system for biological profile
              prediction and data visualization to support interpretation
              of osteoarchaeological specimen records.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-orange-900 text-orange-300 text-xs px-2 py-1 rounded-full">
                Bio Profile
              </span>
              <span className="bg-orange-900 text-orange-300 text-xs px-2 py-1 rounded-full">
                Prediction
              </span>
              <span className="bg-orange-900 text-orange-300 text-xs px-2 py-1 rounded-full">
                Dashboards
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Member 4</span>
              <span className="text-orange-400 text-xs">Coming Soon →</span>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-t border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-400">4</p>
              <p className="text-slate-400 text-sm mt-1">System Modules</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-400">SK1+</p>
              <p className="text-slate-400 text-sm mt-1">Specimens Indexed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">ISE</p>
              <p className="text-slate-400 text-sm mt-1">SLIIT Degree</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">2026</p>
              <p className="text-slate-400 text-sm mt-1">Research Year</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 py-6 text-center">
        <p className="text-slate-500 text-sm">
          OAHRIS — IT4010 Research Project · SLIIT · 2026
        </p>
        <p className="text-slate-600 text-xs mt-1">
          Group: TIM — Technology Integration and Management
        </p>
      </div>

    </div>
  )
}

export default HomePage