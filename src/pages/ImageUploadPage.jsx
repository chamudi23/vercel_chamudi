import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabase'

const BONE_NAMES = [
  'Skull', 'Mandible', 'Humerus', 'Femur', 'Tibia', 'Fibula',
  'Radius', 'Ulna', 'Pelvis', 'Sacrum', 'Ribs', 'Sternum',
  'Clavicle', 'Scapula', 'Vertebrae', 'Patella', 'Calcaneus', 'Other',
]
const SIDES = ['Left', 'Right', 'Axial', 'Unknown']
const IMAGE_VIEWS = ['Anterior', 'Posterior', 'Lateral', 'Superior', 'Inferior', 'Medial']
const CONDITIONS = ['Complete', 'Fragmented', 'Heavily Damaged', 'Partially Complete']
const IMAGE_TYPES = ['Excavation', 'Laboratory', 'Museum', 'Field']

const emptyForm = {
  specimen_id: '',
  bone_name: '',
  side: '',
  image_view: '',
  condition: '',
  region_id: '',
  image_type: '',
  notes: '',
}

export default function ImageUploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [specimens, setSpecimens] = useState([])
  const [regions, setRegions] = useState([])
  const [loadingSpecimens, setLoadingSpecimens] = useState(true)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchSpecimens = async () => {
      setLoadingSpecimens(true)
      const { data, error } = await supabase
        .from('specimens')
        .select('specimen_id, site_name')
        .order('specimen_id')
      if (!error && data) setSpecimens(data)
      setLoadingSpecimens(false)
    }
    const fetchRegions = async () => {
      const { data, error } = await supabase
        .from('skeleton_regions')
        .select('*')
        .order('region_name')
      if (!error && data) setRegions(data)
    }
    fetchSpecimens()
    fetchRegions()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const applyFile = (selected) => {
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
      setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    applyFile(e.dataTransfer.files[0])
  }

  const validate = () => {
    const e = {}
    if (!file) e.file = 'Please select an image file.'
    if (!form.specimen_id) e.specimen_id = 'Specimen is required.'
    if (!form.bone_name) e.bone_name = 'Bone name is required.'
    if (!form.side) e.side = 'Side is required.'
    if (!form.image_view) e.image_view = 'Image view is required.'
    if (!form.condition) e.condition = 'Condition is required.'
    if (!form.image_type) e.image_type = 'Image type is required.'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    setUploading(true)
    setErrors({})

    const safeName = file.name.replace(/\s+/g, '_')
    const fileName = `${form.specimen_id}_${form.bone_name}_${Date.now()}_${safeName}`

    const { error: storageError } = await supabase.storage
      .from('bone-images')
      .upload(fileName, file)

    if (storageError) {
      setErrors({ submit: 'Storage upload failed: ' + storageError.message })
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('bone-images').getPublicUrl(fileName)
    const fileUrl = urlData.publicUrl

    const { error: dbError } = await supabase.from('bone_images').insert([{
      image_id: `IMG-${Date.now()}`,
      specimen_id: form.specimen_id,
      bone_name: form.bone_name,
      side: form.side,
      condition: form.condition,
      skeleton_region: form.region_id || null,
      image_view: form.image_view,
      image_type: form.image_type,
      view_angle: form.image_view,
      notes: form.notes || null,
      file_url: fileUrl,
    }])

    if (dbError) {
      setErrors({ submit: 'Database error: ' + dbError.message })
      setUploading(false)
      return
    }

    setSuccess(true)
    setUploading(false)
    setFile(null)
    setPreview(null)
    setForm(emptyForm)
    setTimeout(() => setSuccess(false), 6000)
  }

  const inputClass = (field) =>
    `w-full bg-white/5 border ${
      errors[field] ? 'border-red-500' : 'border-white/10'
    } rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-purple-500 transition-colors`

  const selectClass = (field) =>
    `w-full bg-slate-800 border ${
      errors[field] ? 'border-red-500' : 'border-white/10'
    } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors`

  const optClass = 'bg-slate-800 text-white'

  const labelClass = 'block text-xs text-white/50 uppercase tracking-wider mb-1.5'

  return (
    <div className="min-h-screen bg-[#0a0814] text-white">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/module')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Module
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">Image Upload</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-xs tracking-[0.2em] uppercase text-purple-400/80">New Image</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Upload Skeletal Image</h1>
          <p className="text-white/40 text-sm mt-2">
            Upload and document a skeletal bone image with full contextual metadata.
          </p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="mb-6 bg-purple-500/20 border border-purple-500/40 rounded-xl px-5 py-4 text-purple-300 text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Image uploaded and record saved successfully!
            </div>
            <Link
              to="/search"
              className="shrink-0 text-purple-300 hover:text-white text-xs font-medium border border-purple-500/40 hover:border-purple-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              View in Gallery →
            </Link>
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">
            {errors.submit}
          </div>
        )}

        <div className="space-y-6">

          {/* Section 1 — Image File */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Image File</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : errors.file
                  ? 'border-red-500/60 hover:border-purple-500'
                  : 'border-white/15 hover:border-purple-500 hover:bg-white/[0.02]'
              }`}
            >
              {preview ? (
                <div className="space-y-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-56 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-white/40 text-xs truncate max-w-xs mx-auto">{file?.name}</p>
                  <p className="text-purple-400 text-xs">Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-white/30">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm font-medium">Drop image here</p>
                    <p className="text-white/30 text-xs mt-1">or click to browse — JPG, PNG, TIFF supported</p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => applyFile(e.target.files[0])}
                className="hidden"
              />
            </div>
            {errors.file && <p className="text-red-400 text-xs mt-2">{errors.file}</p>}
          </div>

          {/* Section 2 — Specimen & Bone */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Specimen & Bone</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label className={labelClass}>Specimen *</label>
                <select
                  name="specimen_id"
                  value={form.specimen_id}
                  onChange={handleChange}
                  disabled={loadingSpecimens || specimens.length === 0}
                  className={selectClass('specimen_id') + ' disabled:opacity-60 disabled:cursor-not-allowed'}
                >
                  {loadingSpecimens ? (
                    <option value="" className={optClass}>Loading specimens…</option>
                  ) : specimens.length === 0 ? (
                    <option value="" className={optClass}>No specimens available — ask Minuri to add some</option>
                  ) : (
                    <>
                      <option value="" className={optClass}>Select specimen</option>
                      {specimens.map(s => (
                        <option key={s.specimen_id} value={s.specimen_id} className={optClass}>
                          {s.specimen_id}{s.site_name ? ` — ${s.site_name}` : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.specimen_id && <p className="text-red-400 text-xs mt-1">{errors.specimen_id}</p>}
              </div>

              <div>
                <label className={labelClass}>Bone Name *</label>
                <select name="bone_name" value={form.bone_name} onChange={handleChange} className={selectClass('bone_name')}>
                  <option value="" className={optClass}>Select bone</option>
                  {BONE_NAMES.map(b => <option key={b} value={b} className={optClass}>{b}</option>)}
                </select>
                {errors.bone_name && <p className="text-red-400 text-xs mt-1">{errors.bone_name}</p>}
              </div>

              <div>
                <label className={labelClass}>Side *</label>
                <select name="side" value={form.side} onChange={handleChange} className={selectClass('side')}>
                  <option value="" className={optClass}>Select side</option>
                  {SIDES.map(s => <option key={s} value={s} className={optClass}>{s}</option>)}
                </select>
                {errors.side && <p className="text-red-400 text-xs mt-1">{errors.side}</p>}
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Skeleton Region</label>
                <select name="region_id" value={form.region_id} onChange={handleChange} className={selectClass('region_id')}>
                  <option value="" className={optClass}>Select region (optional)</option>
                  {regions.map(r => (
                    <option key={r.region_id ?? r.id} value={r.region_id ?? r.id} className={optClass}>
                      {r.region_name}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Section 3 — Image Metadata */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Image Metadata</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <label className={labelClass}>Image View *</label>
                <select name="image_view" value={form.image_view} onChange={handleChange} className={selectClass('image_view')}>
                  <option value="" className={optClass}>Select view</option>
                  {IMAGE_VIEWS.map(v => <option key={v} value={v} className={optClass}>{v}</option>)}
                </select>
                {errors.image_view && <p className="text-red-400 text-xs mt-1">{errors.image_view}</p>}
              </div>

              <div>
                <label className={labelClass}>Condition *</label>
                <select name="condition" value={form.condition} onChange={handleChange} className={selectClass('condition')}>
                  <option value="" className={optClass}>Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c} className={optClass}>{c}</option>)}
                </select>
                {errors.condition && <p className="text-red-400 text-xs mt-1">{errors.condition}</p>}
              </div>

              <div>
                <label className={labelClass}>Image Type *</label>
                <select name="image_type" value={form.image_type} onChange={handleChange} className={selectClass('image_type')}>
                  <option value="" className={optClass}>Select type</option>
                  {IMAGE_TYPES.map(t => <option key={t} value={t} className={optClass}>{t}</option>)}
                </select>
                {errors.image_type && <p className="text-red-400 text-xs mt-1">{errors.image_type}</p>}
              </div>

            </div>
          </div>

          {/* Section 4 — Notes */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Notes</p>
            <label className={labelClass}>Observations</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Taphonomic observations, pathological features, measurement notes, or any relevant context…"
              className={inputClass('notes') + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => navigate('/module')}
              className="px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploading}
              className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:text-purple-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                'Upload Image'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
