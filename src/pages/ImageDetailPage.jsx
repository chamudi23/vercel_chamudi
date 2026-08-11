/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Save, X } from 'lucide-react'
import { supabase } from '../supabase'
import { CONDITION_OPTIONS, IMAGE_TYPE_OPTIONS, IMAGE_VIEW_OPTIONS, PP1_BONE_LABELS, REGION_OPTIONS, SIDE_OPTIONS, imageNotes } from '../utils/pp1ImageModule'

const editableDefaults = {
  skeleton_code: '',
  bone_name: '',
  side: '',
  condition: '',
  skeleton_region: '',
  image_view: '',
  image_type: '',
  notes: '',
  tags: '',
  annotation_text: '',
}

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-white/10 py-2 last:border-b-0">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</p>
      <p className="mt-1 text-sm text-white/80">{value || '-'}</p>
    </div>
  )
}

function RelatedImage({ image, onOpen }) {
  const imageSrc = image.image_url || image.file_url

  return (
    <button onClick={onOpen} className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left transition hover:border-violet-500/40">
      <div className="aspect-square overflow-hidden bg-black/30">
        {imageSrc ? (
          <img src={imageSrc} alt={image.bone_name || 'Related skeletal image'} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/35">No image</div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium text-white/80">{image.bone_name || '-'}</p>
        <p className="truncate text-[11px] text-white/35">{image.skeleton_code || '-'}</p>
      </div>
    </button>
  )
}

function Field({ label, children }) {
  return (
    <label className="block border-b border-white/10 py-2 last:border-b-0">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-white/30">{label}</span>
      {children}
    </label>
  )
}

export default function ImageDetailPage() {
  const { imageId } = useParams()
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [tags, setTags] = useState([])
  const [related, setRelated] = useState([])
  const [annotationText, setAnnotationText] = useState('')
  const [editForm, setEditForm] = useState(editableDefaults)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingAnnotation, setSavingAnnotation] = useState(false)
  const [savingDetails, setSavingDetails] = useState(false)
  const [message, setMessage] = useState(null)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    const { data: imageData, error: imageError } = await supabase
      .from('bone_images')
      .select('*')
      .eq('image_id', imageId)
      .maybeSingle()

    if (imageError || !imageData) {
      setImage(null)
      setMessage({ type: 'error', text: imageError?.message || 'Image record not found.' })
      setLoading(false)
      return
    }

    setImage(imageData)
    setTags(String(imageData.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean))
    setEditForm({
      skeleton_code: imageData.skeleton_code || '',
      bone_name: imageData.bone_name || '',
      side: imageData.side || '',
      condition: imageData.condition || '',
      skeleton_region: imageData.skeleton_region || '',
      image_view: imageData.image_view || imageData.view_angle || '',
      image_type: imageData.image_type || '',
      notes: imageData.notes || imageData.image_notes || '',
      tags: imageData.tags || '',
      annotation_text: imageData.annotation_text || '',
    })

    const [annotationRes, sameSkeletonRes, sameBoneRes] = await Promise.all([
      supabase
        .from('image_annotations')
        .select('annotation_id, annotation_type, annotation_description, x_coordinate, y_coordinate, width, height, annotated_at')
        .eq('image_id', imageId)
        .order('annotated_at', { ascending: true }),
      supabase
        .from('bone_images')
        .select('image_id, skeleton_code, image_url, file_url, bone_name, side')
        .eq('skeleton_code', imageData.skeleton_code || '')
        .neq('image_id', imageId)
        .limit(6),
      supabase
        .from('bone_images')
        .select('image_id, skeleton_code, image_url, file_url, bone_name, side')
        .ilike('bone_name', `%${imageData.bone_name || ''}%`)
        .neq('image_id', imageId)
        .limit(6),
    ])

    const merged = [...(sameSkeletonRes.data || []), ...(sameBoneRes.data || [])]
    const uniqueRelated = Array.from(new Map(merged.map((item) => [item.image_id, item])).values()).slice(0, 8)

    setAnnotations(annotationRes.data || [])
    setRelated(uniqueRelated)
    setLoading(false)
  }, [imageId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const metadataRows = useMemo(() => ([
    ['Image ID', image?.image_id],
    ['Skeleton Code', image?.skeleton_code],
    ['Bone Name', image?.bone_name],
    ['Side', image?.side],
    ['Condition Visible', image?.condition],
    ['Skeleton Region', image?.skeleton_region],
    ['Image View', image?.image_view || image?.view_angle],
    ['Image Type', image?.image_type],
    ['Notes', imageNotes(image)],
    ['Tags', image?.tags],
    ['Annotation Text', image?.annotation_text],
    ['Uploaded At', image?.uploaded_at],
  ]), [image])

  const setEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  const handleCancelEdit = () => {
    setEditForm({
      skeleton_code: image?.skeleton_code || '',
      bone_name: image?.bone_name || '',
      side: image?.side || '',
      condition: image?.condition || '',
      skeleton_region: image?.skeleton_region || '',
      image_view: image?.image_view || image?.view_angle || '',
      image_type: image?.image_type || '',
      notes: imageNotes(image),
      tags: image?.tags || '',
      annotation_text: image?.annotation_text || '',
    })
    setIsEditing(false)
    setMessage(null)
  }

  const handleSaveDetails = async () => {
    setSavingDetails(true)
    setMessage(null)

    const payload = {
      skeleton_code: editForm.skeleton_code.trim(),
      bone_name: editForm.bone_name.trim(),
      side: editForm.side || null,
      condition: editForm.condition || null,
      skeleton_region: editForm.skeleton_region || null,
      image_view: editForm.image_view || null,
      image_type: editForm.image_type || null,
      notes: editForm.notes.trim() || null,
      tags: editForm.tags.trim() || null,
      annotation_text: editForm.annotation_text.trim() || null,
    }

    const { data, error } = await supabase
      .from('bone_images')
      .update(payload)
      .eq('image_id', imageId)
      .select('*')
      .maybeSingle()

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setImage(data)
      setTags(String(data?.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean))
      setIsEditing(false)
      setMessage({ type: 'success', text: 'Image details updated.' })
      await loadDetail()
    }

    setSavingDetails(false)
  }

  const handleAddAnnotation = async () => {
    if (!annotationText.trim()) return
    setSavingAnnotation(true)
    setMessage(null)

    // PP1 fallback: this stores a simple note without drawing coordinates.
    const { error } = await supabase.from('image_annotations').insert({
      annotation_id: `ANN-${Date.now()}`,
      image_id: imageId,
      annotation_type: 'Text Note',
      annotation_description: annotationText.trim(),
      x_coordinate: null,
      y_coordinate: null,
      width: null,
      height: null,
      annotated_at: new Date().toISOString(),
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setAnnotationText('')
      setMessage({ type: 'success', text: 'Annotation saved.' })
      await loadDetail()
    }

    setSavingAnnotation(false)
  }

  const imageSrc = image?.image_url || image?.file_url
  const inputClass = 'w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-violet-500'
  const selectClass = `${inputClass} cursor-pointer`

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-white/50">
          Loading image detail...
        </div>
      </main>
    )
  }

  if (!image) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/25 bg-red-500/10 p-8">
          <p className="text-red-200">{message?.text || 'Image record not found.'}</p>
          <Link to="/gallery" className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:underline">Back to gallery</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/gallery" className="text-sm text-violet-300 hover:underline">Back to gallery</Link>
            <h1 className="mt-2 text-3xl font-bold">{image.bone_name || 'Skeletal Image Detail'}</h1>
            <p className="mt-1 text-sm text-white/40">
              {image.skeleton_code || 'No skeleton code'} - {image.image_id}
            </p>
          </div>
          <Link to="/upload" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10">
            Upload another image
          </Link>
        </div>

        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/25 bg-red-500/10 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {imageSrc ? (
                <img src={imageSrc} alt={image.bone_name || 'Skeletal specimen'} className="max-h-[70vh] w-full object-contain" />
              ) : (
                <div className="flex min-h-[360px] items-center justify-center text-sm text-white/35">
                  No image URL saved for this record.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">Annotations</h2>
              <div className="mt-4 space-y-3">
                {annotations.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/35">
                    No annotations saved for this image yet.
                  </p>
                ) : (
                  annotations.map((annotation) => (
                    <div key={annotation.annotation_id} className="rounded-xl border border-white/10 bg-slate-900 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300/80">
                        {annotation.annotation_type || 'Annotation'}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{annotation.annotation_description || '-'}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5">
                <textarea
                  value={annotationText}
                  onChange={(event) => setAnnotationText(event.target.value)}
                  rows={3}
                  placeholder="Add a simple PP1 text annotation"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-violet-500"
                />
                <button
                  onClick={handleAddAnnotation}
                  disabled={savingAnnotation || !annotationText.trim()}
                  className="mt-3 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-600/40"
                >
                  {savingAnnotation ? 'Saving...' : 'Save Annotation'}
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Image Metadata</h2>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={savingDetails}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Save image details"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={savingDetails}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/65 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Cancel editing"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:border-violet-400/35 hover:bg-violet-400/10"
                    aria-label="Edit image details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <Field label="Skeleton Code">
                    <input value={editForm.skeleton_code} onChange={(event) => setEditField('skeleton_code', event.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Bone Name">
                    <select value={editForm.bone_name} onChange={(event) => setEditField('bone_name', event.target.value)} className={selectClass}>
                      <option value="">Select bone...</option>
                      {PP1_BONE_LABELS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Side">
                    <select value={editForm.side} onChange={(event) => setEditField('side', event.target.value)} className={selectClass}>
                      <option value="">Select side...</option>
                      {SIDE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Condition Visible">
                    <select value={editForm.condition} onChange={(event) => setEditField('condition', event.target.value)} className={selectClass}>
                      <option value="">Select condition...</option>
                      {CONDITION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Skeleton Region">
                    <select value={editForm.skeleton_region} onChange={(event) => setEditField('skeleton_region', event.target.value)} className={selectClass}>
                      <option value="">Select region...</option>
                      {REGION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Image View">
                    <select value={editForm.image_view} onChange={(event) => setEditField('image_view', event.target.value)} className={selectClass}>
                      <option value="">Select view...</option>
                      {IMAGE_VIEW_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Image Type">
                    <select value={editForm.image_type} onChange={(event) => setEditField('image_type', event.target.value)} className={selectClass}>
                      <option value="">Select type...</option>
                      {IMAGE_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Notes">
                    <textarea value={editForm.notes} onChange={(event) => setEditField('notes', event.target.value)} rows={3} className={inputClass} />
                  </Field>
                  <Field label="Tags">
                    <input value={editForm.tags} onChange={(event) => setEditField('tags', event.target.value)} className={inputClass} placeholder="skull, SK1, lab" />
                  </Field>
                  <Field label="Annotation Text">
                    <textarea value={editForm.annotation_text} onChange={(event) => setEditField('annotation_text', event.target.value)} rows={3} className={inputClass} />
                  </Field>
                </div>
              ) : (
                <div className="mt-3">
                  {metadataRows.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">Retrieval Tags</h2>
              {tags.length === 0 ? (
                <p className="mt-3 text-sm text-white/35">No tags stored.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">Related Images</h2>
              <p className="mt-1 text-xs text-white/35">Same skeleton code or same bone name.</p>
              {related.length === 0 ? (
                <p className="mt-3 text-sm text-white/35">No related images found.</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {related.map((item) => (
                    <RelatedImage key={item.image_id} image={item} onOpen={() => navigate(`/image/${item.image_id}`)} />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
