/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import {
  CONDITION_OPTIONS,
  IMAGE_TYPE_OPTIONS,
  IMAGE_VIEW_OPTIONS,
  PP1_BONE_OPTIONS,
  REGION_OPTIONS,
  imageNotes,
  normalize,
} from '../utils/pp1ImageModule'

const ALL = 'All'

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
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    bone_name: ALL,
    image_view: ALL,
    image_type: ALL,
    condition: ALL,
    skeleton_region: ALL,
  })

  const loadImages = async () => {
    setLoading(true)
    setError('')

    const { data, error: loadError } = await supabase
      .from('bone_images')
      .select('*')
      .order('uploaded_at', { ascending: false })

    setImages(data || [])
    setError(loadError?.message || '')
    setLoading(false)
  }

  useEffect(() => {
    loadImages()
  }, [])

  const filteredImages = useMemo(() => {
    const q = normalize(search)

    return images.filter((image) => {
      const tags = image.image_retrieval_tags?.map((tag) => tag.tag_name).join(' ') || ''
      const searchable = [
        image.bone_name,
        image.skeleton_code,
        image.condition,
        image.skeleton_region,
        image.image_view,
        image.view_angle,
        image.image_type,
        imageNotes(image),
        tags,
      ].map(normalize).join(' ')

      const matchesSearch = !q || searchable.includes(q)
      const matchesFilters = Object.entries(filters).every(([field, value]) =>
        value === ALL || image[field] === value || (field === 'image_view' && image.view_angle === value),
      )

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
              Live image records from `bone_images`, grouped by plain skeleton code.
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
              placeholder="Search bone, skeleton code, condition, region, notes, or tags"
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

              return (
                <button
                  key={image.image_id}
                  onClick={() => navigate(`/image/${image.image_id}`)}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-black/30">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={image.bone_name || 'Skeletal image'}
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
                      <h2 className="text-lg font-semibold text-white">{image.bone_name || 'Unlabelled bone'}</h2>
                      <p className="mt-1 text-xs text-white/40">
                        {image.skeleton_code || 'No skeleton code'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <DetailLine label="Skeleton" value={image.skeleton_code} />
                      <DetailLine label="Side" value={image.side} />
                      <DetailLine label="Condition" value={image.condition} />
                      <DetailLine label="View" value={image.image_view || image.view_angle} />
                      <DetailLine label="Region" value={image.skeleton_region} />
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
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
