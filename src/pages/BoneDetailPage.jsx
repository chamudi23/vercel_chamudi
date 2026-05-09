import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import ImageUpload from '../components/ImageUpload'

function BoneDetailPage() {
  const { boneId } = useParams()
  const navigate = useNavigate()
  const [bone, setBone] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBone()
    fetchImages()
  }, [boneId])

  const fetchBone = async () => {
    const { data, error } = await supabase
      .from('bones')
      .select('*')
      .eq('bone_id', boneId)
      .single()

    if (!error) setBone(data)
    setLoading(false)
  }

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('bone_images')
      .select('*')
      .eq('bone_id', boneId)
      .order('uploaded_at', { ascending: false })

    if (!error) setImages(data)
  }

  if (loading) return (
    <div className="text-center text-slate-400 py-12">
      Loading...
    </div>
  )

  if (!bone) return (
    <div className="text-center text-slate-400 py-12">
      Bone record not found.
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-8">

      {/* Back Button */}
      <button
        onClick={() => navigate('/bones')}
        className="text-slate-400 hover:text-blue-400 text-sm mb-6 flex items-center gap-2 transition-colors"
      >
        ← Back to Bone Records
      </button>

      {/* Bone Info Card */}
      <div className="bg-slate-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              {bone.side} {bone.bone_name}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Skeleton: {bone.skeleton_id} • ID: {bone.bone_id}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            bone.condition === 'Good' ? 'bg-green-900 text-green-300' :
            bone.condition === 'Fair' ? 'bg-yellow-900 text-yellow-300' :
            bone.condition === 'Poor' ? 'bg-red-900 text-red-300' :
            'bg-slate-700 text-slate-300'
          }`}>
            {bone.condition}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Preservation</p>
            <p className="text-slate-100 text-sm font-medium">
              {bone.preservation || 'N/A'}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Fragmented</p>
            <p className={`text-sm font-medium ${
              bone.is_fragmented ? 'text-orange-400' : 'text-green-400'
            }`}>
              {bone.is_fragmented ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Context No.</p>
            <p className="text-slate-100 text-sm font-medium">
              {bone.context_number || 'N/A'}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Species</p>
            <p className="text-slate-100 text-sm font-medium">
              {bone.species || 'Human'}
            </p>
          </div>
        </div>

        {bone.notes && (
          <div className="mt-4 bg-slate-700 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-1">Notes</p>
            <p className="text-slate-300 text-sm">{bone.notes}</p>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — Upload */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            Upload Image
          </h3>
          <ImageUpload
            boneId={boneId}
            onUploadComplete={fetchImages}
          />
        </div>

        {/* Right — Image Gallery */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            Images ({images.length})
          </h3>

          {images.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400">
              No images uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {images.map(img => (
                <div key={img.image_id}
                  className="bg-slate-800 rounded-xl overflow-hidden">
                  <img
                    src={img.file_url}
                    alt={img.image_type}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-slate-300 text-xs font-medium">
                      {img.image_type}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {img.view_angle}
                    </p>
                    {img.notes && (
                      <p className="text-slate-500 text-xs mt-1">
                        {img.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default BoneDetailPage