/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  EMPTY_ATTACHMENT_METADATA,
  attachmentMetadataFromImage,
  attachmentMetadataPayload,
  validateAttachmentMetadata,
} from './SpecimenAttachmentForm'
import SpecimenAttachmentForm from './SpecimenAttachmentForm'

const labelClass = 'mb-1 block text-[10px] uppercase tracking-wider text-white/35'

function storagePathFromUrl(url) {
  if (!url) return ''
  const marker = '/storage/v1/object/public/bone-images/'
  const markerIndex = url.indexOf(marker)
  if (markerIndex < 0) return ''
  return decodeURIComponent(url.slice(markerIndex + marker.length).split('?')[0])
}

export default function BoneImageList({ specimenId, specimen: specimenProp = null, editing = false, addMode = false, editImageId = '', onFinishSelectedEdit, onAttachmentsChange, className = '' }) {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(null)
  const [busyId, setBusyId] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [showUpload, setShowUpload] = useState(addMode)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadForm, setUploadForm] = useState(EMPTY_ATTACHMENT_METADATA)
  const [linkedSpecimen, setLinkedSpecimen] = useState(specimenProp)

  const loadImages = useCallback(async () => {
    if (!specimenId) {
      setImages([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    const { data, error: loadError } = await supabase
      .from('bone_images')
      .select('*')
      .eq('specimen_id', specimenId)
      .order('uploaded_at', { ascending: false })

    const loadedImages = data || []
    setImages(loadedImages)
    setDrafts(Object.fromEntries(loadedImages.map((image) => [image.image_id, attachmentMetadataFromImage(image)])))
    const metadataOnlyImage = loadedImages.find((image) => !image.image_url && !image.file_url)
    if (addMode && metadataOnlyImage) setUploadForm(attachmentMetadataFromImage(metadataOnlyImage))
    setError(loadError?.message || '')
    setLoading(false)
  }, [addMode, specimenId])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  useEffect(() => {
    setLinkedSpecimen(specimenProp)
  }, [specimenProp])

  useEffect(() => {
    if (specimenProp || !specimenId) return
    let active = true
    supabase
      .from('specimens')
      .select('specimen_id, skeleton_code, bone_type, side, preservation_state')
      .eq('specimen_id', specimenId)
      .maybeSingle()
      .then(({ data, error: specimenError }) => {
        if (!active) return
        setLinkedSpecimen(data || null)
        if (specimenError) setError(specimenError.message)
      })
    return () => { active = false }
  }, [specimenId, specimenProp])

  useEffect(() => {
    if (addMode) setShowUpload(true)
  }, [addMode, specimenId])

  function setDraftField(imageId, field, value) {
    setDrafts((current) => ({
      ...current,
      [imageId]: { ...current[imageId], [field]: value },
    }))
  }

  async function saveMetadata(imageId) {
    const draft = drafts[imageId]
    if (!draft) return
    const validationError = validateAttachmentMetadata(draft)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }
    setBusyId(imageId)
    setMessage(null)
    const payload = attachmentMetadataPayload(draft)
    const { error: updateError } = await supabase.from('bone_images').update(payload).eq('image_id', imageId)
    setBusyId('')
    if (updateError) {
      setMessage({ type: 'error', text: updateError.message })
      return
    }
    setMessage({ type: 'success', text: 'Attachment metadata updated.' })
    await loadImages()
    onAttachmentsChange?.()
    if (!editing && imageId === editImageId) onFinishSelectedEdit?.()
  }

  async function replaceFile(image, file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Select an image file to replace this attachment.' })
      return
    }

    setBusyId(image.image_id)
    setMessage(null)
    const safeName = file.name.replace(/[^\w.-]+/g, '_')
    const newPath = `skeletons/${specimenId}/${image.image_id}_${Date.now()}_${safeName}`
    const oldPath = storagePathFromUrl(image.image_url || image.file_url)
    const { error: uploadError } = await supabase.storage.from('bone-images').upload(newPath, file, { upsert: false })
    if (uploadError) {
      setBusyId('')
      setMessage({ type: 'error', text: uploadError.message })
      return
    }

    const { data: publicUrlData } = supabase.storage.from('bone-images').getPublicUrl(newPath)
    const publicUrl = publicUrlData.publicUrl
    const { error: updateError } = await supabase
      .from('bone_images')
      .update({ image_url: publicUrl, file_url: publicUrl, uploaded_at: new Date().toISOString() })
      .eq('image_id', image.image_id)

    if (updateError) {
      await supabase.storage.from('bone-images').remove([newPath])
      setBusyId('')
      setMessage({ type: 'error', text: updateError.message })
      return
    }

    if (oldPath && oldPath !== newPath) await supabase.storage.from('bone-images').remove([oldPath])
    setBusyId('')
    setMessage({ type: 'success', text: 'Attachment file replaced.' })
    await loadImages()
    onAttachmentsChange?.()
  }

  async function deleteAttachment(image) {
    setBusyId(image.image_id)
    setMessage(null)
    const { error: deleteError } = await supabase.from('bone_images').delete().eq('image_id', image.image_id)
    if (deleteError) {
      setBusyId('')
      setMessage({ type: 'error', text: deleteError.message })
      return
    }

    const oldPath = storagePathFromUrl(image.image_url || image.file_url)
    const storageResult = oldPath ? await supabase.storage.from('bone-images').remove([oldPath]) : { error: null }
    setBusyId('')
    setDeleteId('')
    setMessage({
      type: storageResult.error ? 'error' : 'success',
      text: storageResult.error
        ? `Attachment record deleted, but storage cleanup failed: ${storageResult.error.message}`
        : 'Attachment deleted.',
    })
    await loadImages()
    onAttachmentsChange?.()
    if (!editing && image.image_id === editImageId) onFinishSelectedEdit?.()
  }

  function cancelSelectedEdit(image) {
    setDrafts((current) => ({ ...current, [image.image_id]: attachmentMetadataFromImage(image) }))
    setDeleteId('')
    setMessage(null)
    onFinishSelectedEdit?.()
  }

  async function uploadAttachment(event) {
    event.preventDefault()
    if (!uploadFile) {
      setMessage({ type: 'error', text: 'Select an image file.' })
      return
    }
    if (!uploadFile.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Select a valid image file.' })
      return
    }
    if (!specimenId || !linkedSpecimen) {
      setMessage({ type: 'error', text: 'A saved specimen record is required before attaching an image.' })
      return
    }
    const validationError = validateAttachmentMetadata(uploadForm)
    if (validationError) {
      setMessage({ type: 'error', text: validationError })
      return
    }

    setBusyId('upload')
    setMessage(null)
    const metadataOnlyImage = images.find((image) => !image.image_url && !image.file_url)
    const imageId = metadataOnlyImage?.image_id || `IMG-${Date.now()}`
    const safeName = uploadFile.name.replace(/[^\w.-]+/g, '_')
    const storagePath = `skeletons/${specimenId}/${imageId}_${safeName}`
    const { error: uploadError } = await supabase.storage.from('bone-images').upload(storagePath, uploadFile, { upsert: false })
    if (uploadError) {
      setBusyId('')
      setMessage({ type: 'error', text: uploadError.message })
      return
    }

    const { data: publicUrlData } = supabase.storage.from('bone-images').getPublicUrl(storagePath)
    const publicUrl = publicUrlData.publicUrl
    const payload = {
      image_id: imageId,
      specimen_id: specimenId,
      ...attachmentMetadataPayload(uploadForm),
      image_url: publicUrl,
      file_url: publicUrl,
      uploaded_at: new Date().toISOString(),
    }
    const { error: saveError } = metadataOnlyImage
      ? await supabase.from('bone_images').update(payload).eq('image_id', metadataOnlyImage.image_id)
      : await supabase.from('bone_images').insert(payload)
    if (saveError) {
      await supabase.storage.from('bone-images').remove([storagePath])
      setBusyId('')
      setMessage({ type: 'error', text: saveError.message })
      return
    }

    setBusyId('')
    setUploadFile(null)
    setUploadForm(EMPTY_ATTACHMENT_METADATA)
    setShowUpload(false)
    setMessage({ type: 'success', text: 'Image attached to this specimen.' })
    await loadImages()
    onAttachmentsChange?.()
  }

  if (loading) {
    return <div className={`h-32 animate-pulse rounded-xl border border-white/10 bg-white/5 ${className}`} />
  }

  const linkedBoneCategory = linkedSpecimen?.boneCategory || linkedSpecimen?.bone_type || ''

  return (
    <div className={className}>
      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-xs ${message.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
          {message.text}
        </div>
      )}

      {error && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">Failed to load attached images: {error}</div>}

      {editImageId && !images.some((image) => image.image_id === editImageId) && (
        <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs text-amber-200">The selected image is not attached to this specimen.</div>
      )}

      {(editing || addMode) && (
        <div className="mb-5">
          <button type="button" onClick={() => setShowUpload((current) => !current)} className="rounded-xl border border-emerald-500/30 bg-emerald-600/20 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-600/30">
            {showUpload ? 'Cancel Attachment' : 'Attach Image'}
          </button>
          {showUpload && (
            <form onSubmit={uploadAttachment} className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <label className={labelClass}>Image File *</label>
              <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} className="mb-4 block w-full text-xs text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/70" />
              <SpecimenAttachmentForm specimen={linkedSpecimen} value={uploadForm} onChange={(field, value) => setUploadForm((current) => ({ ...current, [field]: value }))} />
              <button type="submit" disabled={busyId === 'upload'} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:bg-emerald-900">
                {busyId === 'upload' ? 'Uploading...' : 'Upload Attachment'}
              </button>
            </form>
          )}
        </div>
      )}

      {images.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-white/30">No images are attached to this specimen yet.</div>
      ) : (
        <div className={editing ? 'space-y-4' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'}>
          {images.map((image) => {
            const imageSrc = image.image_url || image.file_url
            const imageView = image.image_view || image.view_angle
            const imageEditing = editing || image.image_id === editImageId
            if (!imageEditing) {
              return (
                <button key={image.image_id} type="button" onClick={() => navigate(`/image/${image.image_id}`)} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-left transition hover:border-emerald-500/40">
                  {imageSrc ? <img src={imageSrc} alt={[linkedBoneCategory, linkedSpecimen?.side, imageView].filter(Boolean).join(' - ') || 'Attached skeletal image'} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-white/30">Image preview unavailable</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3"><p className="truncate text-xs font-medium text-white">{linkedBoneCategory || 'Skeletal image'}</p><p className="mt-0.5 truncate text-[10px] text-white/55">{[linkedSpecimen?.side, imageView, image.image_type].filter(Boolean).join(' · ') || image.image_id}</p></div>
                </button>
              )
            }

            const draft = drafts[image.image_id] || attachmentMetadataFromImage(image)
            return (
              <div key={image.image_id} className={`grid gap-4 rounded-xl border bg-white/[0.02] p-4 md:grid-cols-[180px_1fr] ${editImageId === image.image_id ? 'col-span-full border-emerald-400/60 ring-2 ring-emerald-400/20' : 'border-white/10'}`}>
                <div>
                  <div className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    {imageSrc ? <img src={imageSrc} alt={linkedBoneCategory || 'Attached skeletal image'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-white/30">No preview</div>}
                  </div>
                  <p className="mt-2 truncate font-mono text-[10px] text-white/30">{image.image_id}</p>
                  <label className="mt-3 block cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-center text-xs text-white/60 transition hover:bg-white/10">
                    {busyId === image.image_id ? 'Working...' : 'Replace File'}
                    <input type="file" accept="image/*" disabled={busyId === image.image_id} onChange={(event) => replaceFile(image, event.target.files?.[0])} className="hidden" />
                  </label>
                </div>
                <div>
                  {editImageId === image.image_id && <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">Editing selected attachment</p>}
                  <SpecimenAttachmentForm specimen={linkedSpecimen} value={draft} onChange={(field, value) => setDraftField(image.image_id, field, value)} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => saveMetadata(image.image_id)} disabled={busyId === image.image_id} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:bg-emerald-900">{editImageId === image.image_id ? 'Save' : 'Save Metadata'}</button>
                    {!editing && editImageId === image.image_id && <button type="button" onClick={() => cancelSelectedEdit(image)} disabled={busyId === image.image_id} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:bg-white/5">Cancel</button>}
                    {deleteId === image.image_id ? (
                      <><button type="button" onClick={() => deleteAttachment(image)} disabled={busyId === image.image_id} className="rounded-lg bg-red-600 px-4 py-2 text-xs text-white disabled:bg-red-900">Confirm Delete</button><button type="button" onClick={() => setDeleteId('')} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50">Cancel</button></>
                    ) : (
                      <button type="button" onClick={() => setDeleteId(image.image_id)} className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-300">Delete Attachment</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
