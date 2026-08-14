/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2, X } from 'lucide-react'
import { supabase } from '../supabase'
import {
  CONDITION_OPTIONS,
  IMAGE_TYPE_OPTIONS,
  IMAGE_VIEW_OPTIONS,
  PP1_BONE_OPTIONS,
  REGION_OPTIONS,
  imageNotes,
  normalize,
  regionForBoneCategory,
} from '../utils/pp1ImageModule'

const ALL = 'All'

function skeletonIdFor(image) {
  if (!image.specimen_id) return { label: 'Unlinked legacy image', value: '' }
  if (!image.specimen?.skeleton_code?.trim()) return { label: 'Skeleton ID not assigned', value: '' }
  return { label: image.specimen.skeleton_code.trim(), value: image.specimen.skeleton_code.trim() }
}

function boneCategoryFor(image) {
  return image.specimen_id
    ? (image.specimen?.bone_type || image.specimen?.measurements?.find((measurement) => measurement.bone_type)?.bone_type || '')
    : (image.bone_name || '')
}

function sideFor(image) {
  return image.specimen_id ? (image.specimen?.side || '') : (image.side || '')
}

function regionFor(image) {
  return image.specimen_id ? regionForBoneCategory(boneCategoryFor(image)) : (image.skeleton_region || '')
}

function DetailLine({ label, value }) {
  if (!value) return null
  return (
    <p className="text-xs text-white/45">
      <span className="text-white/25">{label}:</span> {value}
    </p>
  )
}

export default function ImageSearchPage() {
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkingImage, setLinkingImage] = useState(null)
  const [specimens, setSpecimens] = useState([])
  const [selectedSpecimenId, setSelectedSpecimenId] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    bone_name: ALL,
    image_view: ALL,
    image_type: ALL,
    condition: ALL,
    skeleton_region: ALL,
  })

  const loadImages = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('bone_images')
      .select('*, specimen:specimens!bone_images_specimen_id_fkey(specimen_id, skeleton_code, bone_type, side, measurements(bone_type)), image_retrieval_tags(tag_id, tag_name)')
      .order('uploaded_at', { ascending: false })

    setImages(data || [])
    setError(loadError?.message || '')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  const filteredImages = useMemo(() => {
    const q = normalize(search)

    return images.filter((image) => {
      const tags = image.image_retrieval_tags?.map((tag) => tag.tag_name).join(' ') || ''
      const searchable = [
        boneCategoryFor(image),
        sideFor(image),
        skeletonIdFor(image).value,
        image.condition,
        regionFor(image),
        image.image_view,
        image.view_angle,
        image.image_type,
        imageNotes(image),
        tags,
      ].map(normalize).join(' ')

      const matchesSearch = !q || searchable.includes(q)
      const matchesFilters = Object.entries(filters).every(([field, value]) => {
        if (value === ALL) return true
        if (field === 'bone_name') return boneCategoryFor(image) === value
        if (field === 'skeleton_region') return regionFor(image) === value
        return image[field] === value || (field === 'image_view' && image.view_angle === value)
      })

      return matchesSearch && matchesFilters
    })
  }, [filters, images, search])

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilters({
      bone_name: ALL,
      image_view: ALL,
      image_type: ALL,
      condition: ALL,
      skeleton_region: ALL,
    })
  }

  const openLinkToSpecimen = async (image) => {
    setLinkingImage(image)
    setSelectedSpecimenId('')
    setLinkError('')
    const { data, error: specimenError } = await supabase
      .from('specimens')
      .select('specimen_id, skeleton_code')
      .order('specimen_id', { ascending: true })
    setSpecimens(data || [])
    setLinkError(specimenError?.message || '')
  }

  const linkToSpecimen = async () => {
    if (!linkingImage || !selectedSpecimenId) return
    setLinking(true)
    setLinkError('')
    const { error: updateError } = await supabase
      .from('bone_images')
      .update({ specimen_id: selectedSpecimenId })
      .eq('image_id', linkingImage.image_id)
    setLinking(false)
    if (updateError) {
      setLinkError(updateError.message)
      return
    }
    setLinkingImage(null)
    await loadImages()
  }

  const inputClass = 'rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-violet-500'
  const selectClass = `${inputClass} cursor-pointer`

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/70">Image Retrieval</p>
            <h1 className="mt-2 text-3xl font-bold">Image Gallery</h1>
            <p className="mt-2 text-sm text-white/45">
              Live image records linked to their specimen and authoritative Skeleton ID.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/35">{filteredImages.length} of {images.length} images</span>
            <button onClick={loadImages} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10">
              Refresh
            </button>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,0.8fr)_auto]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bone, Skeleton ID, condition, region, notes, or tags"
              className={inputClass}
            />
            <select value={filters.bone_name} onChange={(event) => setFilter('bone_name', event.target.value)} className={selectClass}>
              <option>{ALL}</option>
              {PP1_BONE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={filters.image_view} onChange={(event) => setFilter('image_view', event.target.value)} className={selectClass}>
              <option>{ALL}</option>
              {IMAGE_VIEW_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={filters.image_type} onChange={(event) => setFilter('image_type', event.target.value)} className={selectClass}>
              <option>{ALL}</option>
              {IMAGE_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={filters.condition} onChange={(event) => setFilter('condition', event.target.value)} className={selectClass}>
              <option>{ALL}</option>
              {CONDITION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <select value={filters.skeleton_region} onChange={(event) => setFilter('skeleton_region', event.target.value)} className={selectClass}>
              <option>{ALL}</option>
              {REGION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            <button type="button" onClick={clearFilters} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/60 transition hover:text-white">
              Clear
            </button>
          </div>
        </section>

        {error && <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-white/40">
            No image records match the current search and filters.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image) => {
              const tags = image.image_retrieval_tags || []
              const imageSrc = image.image_url || image.file_url
              const skeletonId = skeletonIdFor(image)

              return (
                <article
                  key={image.image_id}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                >
                  <button type="button" onClick={() => navigate(`/image/${image.image_id}`)} className="block w-full cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500/50">
                  <div className="aspect-[4/3] overflow-hidden bg-black/30">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={boneCategoryFor(image) || 'Skeletal image'}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
                        No image URL
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{boneCategoryFor(image) || 'Unlabelled bone'}</h2>
                      <p className={`mt-1 text-xs ${image.specimen_id ? 'text-white/40' : 'text-amber-300/75'}`}>
                        {skeletonId.label}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <DetailLine label="Skeleton ID" value={skeletonId.value} />
                      <DetailLine label="Specimen" value={image.specimen_id} />
                      <DetailLine label="Side" value={sideFor(image)} />
                      <DetailLine label="Condition" value={image.condition} />
                      <DetailLine label="View" value={image.image_view || image.view_angle} />
                      <DetailLine label="Region" value={regionFor(image)} />
                      <DetailLine label="Type" value={image.image_type} />
                    </div>

                    {imageNotes(image) && <p className="line-clamp-2 text-sm text-white/55">{imageNotes(image)}</p>}

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag.tag_id || tag.tag_name} className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] text-violet-200">
                            {tag.tag_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  </button>
                  {!image.specimen_id && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openLinkToSpecimen(image)
                      }}
                      className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-slate-950/85 px-3 py-2 text-xs text-amber-200 shadow-lg backdrop-blur transition hover:bg-amber-400/15"
                      aria-label={`Link attachment ${image.image_id} to specimen`}
                    >
                      <Link2 className="h-4 w-4" /> Link to specimen
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {linkingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5" onClick={() => !linking && setLinkingImage(null)}>
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Link image to specimen</h2>
                  <p className="mt-1 text-sm text-white/40">Choose an existing specimen for {linkingImage.image_id}. Its Skeleton ID will remain managed by the specimen.</p>
                </div>
                <button type="button" onClick={() => setLinkingImage(null)} disabled={linking} className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close link dialog"><X className="h-4 w-4" /></button>
              </div>
              <label className="mt-5 block text-xs uppercase tracking-wider text-white/40">Existing specimen</label>
              <select value={selectedSpecimenId} onChange={(event) => setSelectedSpecimenId(event.target.value)} className={`${selectClass} mt-2 w-full`}>
                <option value="">Select a specimen</option>
                {specimens.map((specimen) => <option key={specimen.specimen_id} value={specimen.specimen_id}>{specimen.specimen_id} — {specimen.skeleton_code || 'Skeleton ID not assigned'}</option>)}
              </select>
              {linkError && <p className="mt-3 text-sm text-red-300">{linkError}</p>}
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setLinkingImage(null)} disabled={linking} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60">Cancel</button>
                <button type="button" onClick={linkToSpecimen} disabled={linking || !selectedSpecimenId} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{linking ? 'Linking...' : 'Link to specimen'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
