/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BoneImageList from '../components/BoneImageList'
import { supabase } from '../supabase'
import { summarizeImageAttachmentRecords } from '../utils/imageAttachmentProgress'

const FILTERS = [
  { value: 'all', label: 'All Records' },
  { value: 'without', label: 'Without Images' },
  { value: 'with', label: 'With Images' },
]

function normalizedText(value) {
  return String(value || '').trim().toLowerCase()
}

function savedBoneCategory(specimen) {
  return specimen.bone_type || specimen.measurements?.find((measurement) => measurement.bone_type)?.bone_type || ''
}

function SummaryCard({ label, value, note }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 text-[11px] text-white/35">{note}</p>}
    </div>
  )
}

function CoverageCircle({ summary, label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-violet-400/20 bg-violet-400/[0.05] p-4">
      <div
        className="grid h-20 w-20 shrink-0 place-items-center rounded-full p-2"
        style={{ background: `conic-gradient(rgb(139 92 246) ${summary.coverage}%, rgba(255,255,255,0.08) 0)` }}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-lg font-bold text-violet-200">{summary.coverage}%</div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 text-xs text-white/45">{summary.withImages} of {summary.total} specimen records have at least one linked image.</p>
      </div>
    </div>
  )
}

function SummaryGrid({ summary, coverageLabel, skeletonScoped = false }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard label={skeletonScoped ? 'Total records for this skeleton' : 'Total specimen records'} value={summary.total} />
      <SummaryCard label={skeletonScoped ? 'Records with images' : 'Specimen records with images'} value={summary.withImages} />
      <SummaryCard label={skeletonScoped ? 'Records without images' : 'Specimen records without images'} value={summary.withoutImages} />
      <SummaryCard label={skeletonScoped ? 'Total images linked to this skeleton' : 'Total linked images'} value={summary.linkedImages} />
      <CoverageCircle summary={summary} label={coverageLabel} />
    </div>
  )
}

function imageStatus(count) {
  if (count === 0) return 'No images attached'
  if (count === 1) return '1 image attached'
  return `${count} images attached`
}

export default function ImageUploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [records, setRecords] = useState([])
  const [legacyImageCount, setLegacyImageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [skeletonSearch, setSkeletonSearch] = useState('')
  const [selectedSkeleton, setSelectedSkeleton] = useState('')
  const [filter, setFilter] = useState('all')
  const [attachingSpecimenId, setAttachingSpecimenId] = useState('')

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError('')
    const [specimenResult, imageResult] = await Promise.all([
      supabase
        .from('specimens')
        .select('specimen_id, skeleton_code, bone_type, side, preservation_state, measurements(bone_type)')
        .order('skeleton_code', { ascending: true })
        .order('specimen_id', { ascending: true }),
      supabase.from('bone_images').select('image_id, specimen_id, image_url, file_url'),
    ])

    if (specimenResult.error || imageResult.error) {
      setError(specimenResult.error?.message || imageResult.error?.message || 'Could not load image-attachment progress.')
      setLoading(false)
      return
    }

    const imageCounts = new Map()
    let unlinked = 0
    ;(imageResult.data || []).forEach((image) => {
      const hasUploadedFile = Boolean(image.image_url?.trim() || image.file_url?.trim())
      if (!hasUploadedFile) return
      if (!image.specimen_id) {
        unlinked += 1
        return
      }
      imageCounts.set(image.specimen_id, (imageCounts.get(image.specimen_id) || 0) + 1)
    })

    const nextRecords = (specimenResult.data || []).map((specimen) => ({
      ...specimen,
      boneCategory: savedBoneCategory(specimen),
      imageCount: imageCounts.get(specimen.specimen_id) || 0,
    }))
    setRecords(nextRecords)
    setLegacyImageCount(unlinked)
    setLoading(false)

    const requestedSpecimenId = searchParams.get('specimen_id')
    if (requestedSpecimenId) {
      const requested = nextRecords.find((record) => record.specimen_id === requestedSpecimenId)
      if (requested) {
        setSkeletonSearch(requested.skeleton_code || '')
        setSelectedSkeleton(requested.skeleton_code || '')
        setAttachingSpecimenId(requested.specimen_id)
      }
    }
  }, [searchParams])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  const skeletonCodes = useMemo(() => (
    [...new Set(records.map((record) => record.skeleton_code?.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  ), [records])

  const overallSummary = useMemo(() => summarizeImageAttachmentRecords(records), [records])

  const selectedRecords = useMemo(() => (
    records.filter((record) => normalizedText(record.skeleton_code) === normalizedText(selectedSkeleton))
  ), [records, selectedSkeleton])

  const selectedSummary = useMemo(() => summarizeImageAttachmentRecords(selectedRecords), [selectedRecords])

  const visibleRecords = useMemo(() => selectedRecords.filter((record) => {
    if (filter === 'without') return record.imageCount === 0
    if (filter === 'with') return record.imageCount > 0
    return true
  }), [filter, selectedRecords])

  const attachingSpecimen = records.find((record) => record.specimen_id === attachingSpecimenId) || null

  function selectSkeleton(value) {
    setSkeletonSearch(value)
    const exact = skeletonCodes.find((code) => normalizedText(code) === normalizedText(value)) || ''
    setSelectedSkeleton(exact)
    setAttachingSpecimenId('')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/70">Image Documentation</p>
          <h1 className="mt-2 text-3xl font-bold">Upload Image</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/45">Select a saved skeleton and specimen, then attach an image. Bone identity remains owned by the Specimen Record.</p>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <section className="mb-7">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Overall image-attachment progress</h2>
              <p className="mt-1 text-xs text-white/40">Record-level coverage across distinct saved specimen records.</p>
            </div>
            {legacyImageCount > 0 && (
              <p className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                {legacyImageCount} unlinked legacy image{legacyImageCount === 1 ? '' : 's'} preserved in Gallery and excluded from coverage
              </p>
            )}
          </div>
          {loading ? <div className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5" /> : <SummaryGrid summary={overallSummary} coverageLabel="Record image coverage" />}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label htmlFor="skeleton-search" className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Select Skeleton Code</label>
          <input
            id="skeleton-search"
            list="saved-skeleton-codes"
            value={skeletonSearch}
            onChange={(event) => selectSkeleton(event.target.value)}
            placeholder="Search or select a saved Skeleton Code"
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 disabled:opacity-50"
          />
          <datalist id="saved-skeleton-codes">
            {skeletonCodes.map((code) => <option key={code} value={code} />)}
          </datalist>
          {!loading && skeletonCodes.length === 0 && <p className="mt-3 text-sm text-white/40">No specimen records are available yet. Register a specimen before attaching an image.</p>}
          {skeletonSearch && !selectedSkeleton && skeletonCodes.length > 0 && <p className="mt-3 text-xs text-amber-200">Choose an existing Skeleton Code from the suggestions.</p>}
        </section>

        {selectedSkeleton && (
          <>
            <section className="mt-7">
              <div className="mb-3">
                <h2 className="text-lg font-semibold">{selectedSkeleton} image-attachment progress</h2>
                <p className="mt-1 text-xs text-white/40">These counts include specimen records belonging only to the selected skeleton.</p>
              </div>
              <SummaryGrid summary={selectedSummary} coverageLabel="Skeleton record image coverage" skeletonScoped />
            </section>

            <section className="mt-7">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Specimen records</h2>
                  <p className="mt-1 text-xs text-white/40">Records without images are marked with a text status as well as a distinct border.</p>
                </div>
                <div className="flex flex-wrap gap-2" aria-label="Filter specimen records by image status">
                  {FILTERS.map((option) => (
                    <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${filter === option.value ? 'border-violet-400/50 bg-violet-500/20 text-violet-100' : 'border-white/10 text-white/50 hover:bg-white/5'}`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {visibleRecords.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/40">No specimen records match this filter.</div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {visibleRecords.map((record) => (
                    <article key={record.specimen_id} className={`rounded-2xl border p-5 ${record.imageCount === 0 ? 'border-amber-400/30 bg-amber-400/[0.04]' : 'border-white/10 bg-white/[0.03]'}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs text-white/40">{record.specimen_id}</p>
                          <h3 className="mt-1 text-lg font-semibold">{record.boneCategory || '—'}</h3>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${record.imageCount === 0 ? 'border-amber-400/30 bg-amber-400/10 text-amber-200' : 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'}`}>
                          {imageStatus(record.imageCount)}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><dt className="text-[10px] uppercase tracking-wider text-white/30">Side</dt><dd className="mt-1 text-white/70">{record.side || '—'}</dd></div>
                        <div><dt className="text-[10px] uppercase tracking-wider text-white/30">Preservation State</dt><dd className="mt-1 text-white/70">{record.preservation_state || '—'}</dd></div>
                      </dl>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => setAttachingSpecimenId((current) => current === record.specimen_id ? '' : record.specimen_id)} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500">
                          {attachingSpecimenId === record.specimen_id ? 'Close Attachment Form' : 'Attach Image'}
                        </button>
                        {record.imageCount > 0 && <button type="button" onClick={() => navigate(`/specimens/${encodeURIComponent(record.specimen_id)}?section=attachments`)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5">View Images</button>}
                        <button type="button" onClick={() => navigate(`/specimens/${encodeURIComponent(record.specimen_id)}`)} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/5">Open Specimen Record</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {attachingSpecimen && (
              <section className="mt-7 scroll-mt-6 rounded-2xl border border-violet-400/25 bg-white/[0.03] p-5">
                <h2 className="text-lg font-semibold">Attach image to {attachingSpecimen.specimen_id}</h2>
                <p className="mt-1 text-xs text-white/40">Uploading another image updates both record-level summaries without creating another specimen.</p>
                <BoneImageList
                  key={attachingSpecimen.specimen_id}
                  specimenId={attachingSpecimen.specimen_id}
                  specimen={attachingSpecimen}
                  addMode
                  onAttachmentsChange={loadRecords}
                  className="mt-5"
                />
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
