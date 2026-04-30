import { useState } from 'react'
import { supabase } from '../supabase'

function ImageUpload({ boneId, onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [imageType, setImageType] = useState('Lab')
  const [viewAngle, setViewAngle] = useState('Anterior')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('❌ Please select an image first')
      return
    }

    setUploading(true)
    setMessage('')

    // Generate unique filename
    const fileName = `${boneId}_${Date.now()}_${file.name}`

    // Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('bone-images')
      .upload(fileName, file)

    if (storageError) {
      setMessage('❌ Upload failed: ' + storageError.message)
      setUploading(false)
      return
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('bone-images')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Save to bone_images table
    const imageId = `IMG-${Math.floor(Math.random() * 9000) + 1000}`

    const { error: dbError } = await supabase
      .from('bone_images')
      .insert([{
        image_id: imageId,
        bone_id: boneId,
        file_url: publicUrl,
        image_type: imageType,
        view_angle: viewAngle,
        notes: notes
      }])

    if (dbError) {
      setMessage('❌ Database error: ' + dbError.message)
    } else {
      setMessage('✅ Image uploaded successfully!')
      setFile(null)
      setPreview(null)
      setNotes('')
      onUploadComplete && onUploadComplete()
    }

    setUploading(false)
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">

      {/* File Input */}
      <div
        className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={() => document.getElementById('fileInput').click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="max-h-40 mx-auto rounded-lg object-contain"
          />
        ) : (
          <div>
            <p className="text-4xl mb-2">🖼️</p>
            <p className="text-slate-400 text-sm">
              Click to select image
            </p>
            <p className="text-slate-500 text-xs mt-1">
              JPG, PNG supported
            </p>
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Image Type */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Image Type
        </label>
        <select
          value={imageType}
          onChange={e => setImageType(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
        >
          <option>Lab</option>
          <option>Excavation</option>
          <option>Close-up</option>
          <option>Measurement</option>
          <option>Conservation</option>
        </select>
      </div>

      {/* View Angle */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">
          View Angle
        </label>
        <select
          value={viewAngle}
          onChange={e => setViewAngle(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
        >
          <option>Anterior</option>
          <option>Posterior</option>
          <option>Lateral</option>
          <option>Medial</option>
          <option>Superior</option>
          <option>Inferior</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Any observations about this image..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {message && (
        <p className="text-center text-sm">{message}</p>
      )}

    </div>
  )
}

export default ImageUpload