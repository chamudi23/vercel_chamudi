/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { supabase } from '../supabase'
import { imageNotes, regionForBoneCategory } from '../utils/pp1ImageModule'

function skeletonIdFor(image) {
  if (!image?.specimen_id) return 'Unlinked legacy image'
  return image.specimen?.skeleton_code?.trim() || 'Skeleton ID not assigned'
}

function boneCategoryFor(image) {
  return image?.specimen_id
    ? (image.specimen?.bone_type || image.specimen?.measurements?.find((measurement) => measurement.bone_type)?.bone_type || '')
    : (image?.bone_name || '')
}

function sideFor(image) {
  return image?.specimen_id ? (image.specimen?.side || '') : (image?.side || '')
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
          <img src={imageSrc} alt={boneCategoryFor(image) || 'Related skeletal image'} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-white/35">No image</div>
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium text-white/80">{boneCategoryFor(image) || '-'}</p>
        <p className="truncate text-[11px] text-white/35">{skeletonIdFor(image)}</p>
      </div>
    </button>
  )
}

export default function ImageDetailPage() {
  const { imageId } = useParams()
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [tags, setTags] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setMessage(null)

    const { data: imageData, error: imageError } = await supabase
      .from('bone_images')
      .select('*, specimen:specimens!bone_images_specimen_id_fkey(specimen_id, skeleton_code, bone_type, side, measurements(bone_type))')
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
    const [annotationRes, sameSkeletonRes, sameBoneRes] = await Promise.all([
      supabase
        .from('image_annotations')
        .select('annotation_id, annotation_type, annotation_description, x_coordinate, y_coordinate, width, height, annotated_at')
        .eq('image_id', imageId)
        .order('annotated_at', { ascending: true }),
      supabase
        .from('bone_images')
        .select('image_id, specimen_id, image_url, file_url, bone_name, side, specimen:specimens!bone_images_specimen_id_fkey(specimen_id, skeleton_code, bone_type, side, measurements(bone_type))')
        .eq('specimen_id', imageData.specimen_id || '')
        .neq('image_id', imageId)
        .limit(6),
      supabase
        .from('bone_images')
        .select('image_id, specimen_id, image_url, file_url, bone_name, side, specimen:specimens!bone_images_specimen_id_fkey(specimen_id, skeleton_code, bone_type, side, measurements(bone_type))')
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
    ['Skeleton ID', skeletonIdFor(image)],
    ['Specimen ID', image?.specimen_id],
    ['Bone Category', boneCategoryFor(image)],
    ['Side', sideFor(image)],
    ['Condition Visible', image?.condition],
    ['Skeleton Region', image?.specimen_id ? regionForBoneCategory(boneCategoryFor(image)) : image?.skeleton_region],
    ['Image View', image?.image_view || image?.view_angle],
    ['Image Type', image?.image_type],
    ['Notes', imageNotes(image)],
    ['Tags', image?.tags],
    ['Annotation Text', image?.annotation_text],
    ['Uploaded At', image?.uploaded_at],
  ]), [image])

  const imageSrc = image?.image_url || image?.file_url

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
            <h1 className="mt-2 text-3xl font-bold">{boneCategoryFor(image) || 'Skeletal Image Detail'}</h1>
            <p className="mt-1 text-sm text-white/40">
              {skeletonIdFor(image)} - {image.image_id}
            </p>
          </div>
          {image.specimen_id && image.specimen?.specimen_id ? (
            <button
              type="button"
              onClick={() => navigate(`/specimens/${encodeURIComponent(image.specimen_id)}?section=attachments&editImage=${encodeURIComponent(image.image_id)}&from=gallery`)}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
              aria-label={`Edit image ${image.image_id} in specimen workspace`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Image
            </button>
          ) : (
            <p className="max-w-sm rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
              This image must be linked to a specimen before it can be edited.
            </p>
          )}
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
                <img src={imageSrc} alt={boneCategoryFor(image) || 'Skeletal specimen'} className="max-h-[70vh] w-full object-contain" />
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

            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-semibold">Image Metadata</h2>
              <p className="mt-1 text-xs text-white/35">This is a read-only viewer. Use Edit Image to update this attachment in its specimen workspace.</p>
              <div className="mt-3">
                {metadataRows.map(([label, value]) => <InfoRow key={label} label={label} value={value} />)}
              </div>
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
              <p className="mt-1 text-xs text-white/35">Same specimen or same bone name.</p>
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
