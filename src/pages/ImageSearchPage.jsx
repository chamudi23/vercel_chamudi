import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function ImageSearchPage() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterAngle, setFilterAngle] = useState('All')
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bone_images')
      .select(`
        *,
        bones (
          bone_name,
          side,
          skeleton_id,
          condition
        )
      `)
      .order('uploaded_at', { ascending: false })

    if (!error) setImages(data)
    setLoading(false)
  }

  const filtered = images.filter(img => {
    const boneName = img.bones?.bone_name?.toLowerCase() || ''
    const skeletonId = img.bones?.skeleton_id?.toLowerCase() || ''
    const notes = img.notes?.toLowerCase() || ''

    const matchSearch =
      search === '' ||
      boneName.includes(search.toLowerCase()) ||
      skeletonId.includes(search.toLowerCase()) ||
      notes.includes(search.toLowerCase())

    const matchType = filterType === 'All' || img.image_type === filterType
    const matchAngle = filterAngle === 'All' || img.view_angle === filterAngle

    return matchSearch && matchType && matchAngle
  })

  return (
    <div className="max-w-7xl mx-auto p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">
            Image Search & Retrieval
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Search skeletal images by bone, skeleton, type or angle
          </p>
        </div>
        <span className="text-slate-400 text-sm">
          {filtered.length} images found
        </span>
      </div>

      {/* Search + Filters */}
      <div className="bg-slate-800 rounded-xl p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by bone name, skeleton ID, notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500 min-w-[250px]"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Types</option>
            <option>Lab</option>
            <option>Excavation</option>
            <option>Close-up</option>
            <option>Measurement</option>
            <option>Conservation</option>
          </select>
          <select
            value={filterAngle}
            onChange={e => setFilterAngle(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Angles</option>
            <option>Anterior</option>
            <option>Posterior</option>
            <option>Lateral</option>
            <option>Medial</option>
            <option>Superior</option>
            <option>Inferior</option>
          </select>
          <button
            onClick={fetchImages}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">
          Loading images...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-slate-400 py-12">
          No images found
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(img => (
            <div
              key={img.image_id}
              onClick={() => setSelectedImage(img)}
              className="bg-slate-800 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <img
                src={img.file_url}
                alt={img.image_type}
                className="w-full h-44 object-cover"
              />
              <div className="p-3">
                <p className="text-slate-100 text-sm font-medium">
                  {img.bones?.bone_name || 'Unknown'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  {img.bones?.skeleton_id} • {img.bones?.side}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full">
                    {img.image_type}
                  </span>
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                    {img.view_angle}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-slate-800 rounded-2xl overflow-hidden max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedImage.file_url}
              alt={selectedImage.image_type}
              className="w-full max-h-96 object-contain bg-slate-900"
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {selectedImage.bones?.bone_name}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Skeleton: {selectedImage.bones?.skeleton_id} •
                    Side: {selectedImage.bones?.side}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-slate-400 hover:text-slate-200 text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Image Type</p>
                  <p className="text-slate-100 text-sm">
                    {selectedImage.image_type}
                  </p>
                </div>
                <div className="bg-slate-700 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">View Angle</p>
                  <p className="text-slate-100 text-sm">
                    {selectedImage.view_angle}
                  </p>
                </div>
              </div>
              {selectedImage.notes && (
                <div className="bg-slate-700 rounded-lg p-3 mt-4">
                  <p className="text-slate-400 text-xs mb-1">Notes</p>
                  <p className="text-slate-300 text-sm">
                    {selectedImage.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default ImageSearchPage