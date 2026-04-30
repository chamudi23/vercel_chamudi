import { Link } from 'react-router-dom'

function IlshanModulePage() {
  return (
    <div className="max-w-4xl mx-auto p-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-purple-400 text-xs font-medium uppercase tracking-widest mb-2">
          IT21824210 — Ilshan's Module
        </p>
        <h2 className="text-2xl font-bold text-slate-100">
          Skeletal Image Documentation
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Image documentation, annotation, retrieval and visualization
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-6">

        <Link to="/bones"
          className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500 group">
          <div className="text-3xl mb-3">🦴</div>
          <h3 className="text-lg font-semibold text-slate-100">
            Bone Records
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Add and manage skeletal bone records with metadata
          </p>
          <p className="text-purple-400 text-xs mt-3 group-hover:translate-x-1 transition-transform">
            Open →
          </p>
        </Link>

        <Link to="/search"
          className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500 group">
          <div className="text-3xl mb-3">🔍</div>
          <h3 className="text-lg font-semibold text-slate-100">
            Image Search
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Search and retrieve skeletal images by bone, type or angle
          </p>
          <p className="text-purple-400 text-xs mt-3 group-hover:translate-x-1 transition-transform">
            Open →
          </p>
        </Link>

        <Link to="/skeleton"
          className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500 group">
          <div className="text-3xl mb-3">💀</div>
          <h3 className="text-lg font-semibold text-slate-100">
            Skeleton Viewer
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Click bones on skeleton diagram to view linked images
          </p>
          <p className="text-purple-400 text-xs mt-3 group-hover:translate-x-1 transition-transform">
            Open →
          </p>
        </Link>

        <Link to="/bones"
          className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border border-slate-700 hover:border-purple-500 group">
          <div className="text-3xl mb-3">🖼️</div>
          <h3 className="text-lg font-semibold text-slate-100">
            Image Gallery
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Browse all uploaded images with metadata and annotations
          </p>
          <p className="text-purple-400 text-xs mt-3 group-hover:translate-x-1 transition-transform">
            Open →
          </p>
        </Link>

      </div>
    </div>
  )
}

export default IlshanModulePage