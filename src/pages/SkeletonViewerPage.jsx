/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SkeletonViewer from '../components/SkeletonViewer'
import { supabase } from '../supabase'
import {
  CONTROLLED_BONE_CATEGORIES,
  EXPECTED_CATEGORY_SIDE_KEYS,
  categorySideKey,
  imageNotes,
  legacySideFromBoneName,
  normalizeBoneCategory,
  normalizeSide,
  parseCategorySideKey,
} from '../utils/pp1ImageModule'

const IMAGE_COLUMNS = 'image_id, specimen_id, skeleton_code, image_url, file_url, bone_name, side, condition, skeleton_region, image_view, image_type, notes, image_notes'

const STATUS_LABELS = {
  documented: 'Documented',
  present_no_image: 'Present, no image',
  unknown: 'Not assessed',
}

function isFragmented(value) {
  return String(value || '').toLowerCase().includes('fragment')
}

function addUnmappedValue(target, value, source, specimenId = '') {
  const cleanValue = String(value || '').trim()
  if (!cleanValue || normalizeBoneCategory(cleanValue)) return
  target.push({ value: cleanValue, source, specimenId })
}

function calculateCoverage(specimens, measurements, images) {
  const measurementsBySpecimen = new Map()
  measurements.forEach((measurement) => {
    const rows = measurementsBySpecimen.get(measurement.specimen_id) || []
    rows.push(measurement)
    measurementsBySpecimen.set(measurement.specimen_id, rows)
  })

  const imagesBySpecimen = new Map()
  images.forEach((image) => {
    const rows = imagesBySpecimen.get(image.specimen_id) || []
    rows.push(image)
    imagesBySpecimen.set(image.specimen_id, rows)
  })

  const groups = new Map()
  const unmappedValues = []

  specimens.forEach((specimen) => {
    const specimenMeasurements = measurementsBySpecimen.get(specimen.specimen_id) || []
    const sourceRows = specimen.bone_type
      ? [{ value: specimen.bone_type, source: 'specimens.bone_type' }]
      : specimenMeasurements
        .filter((measurement) => measurement.bone_type)
        .map((measurement) => ({ value: measurement.bone_type, source: 'measurements.bone_type' }))

    sourceRows.forEach((sourceRow) => addUnmappedValue(
      unmappedValues,
      sourceRow.value,
      sourceRow.source,
      specimen.specimen_id,
    ))

    const mappedRows = sourceRows
      .map((sourceRow) => ({ ...sourceRow, category: normalizeBoneCategory(sourceRow.value) }))
      .filter((sourceRow) => sourceRow.category)
    const mappedCategoryCodes = new Set(mappedRows.map((sourceRow) => sourceRow.category.code))

    mappedRows.forEach((sourceRow) => {
      const rawSpecimenSide = String(specimen.side || '').trim()
      const specimenSide = rawSpecimenSide ? normalizeSide(rawSpecimenSide) : ''
      const sourceSide = legacySideFromBoneName(sourceRow.value)
      const side = specimenSide || (sourceRow.category.laterality === 'midline' ? 'Midline' : sourceSide)
      const key = categorySideKey(sourceRow.category.code, side)
      const groupedSide = parseCategorySideKey(key)?.side || side
      const specimenImages = imagesBySpecimen.get(specimen.specimen_id) || []
      const matchingImages = specimenImages.filter((image) => {
        if (mappedCategoryCodes.size === 1) return true
        const imageCategory = normalizeBoneCategory(image.bone_name)
        return imageCategory?.code === sourceRow.category.code
      })

      const existing = groups.get(key) || {
        key,
        category: sourceRow.category,
        side: groupedSide,
        status: 'present_no_image',
        specimenIds: new Set(),
        images: new Map(),
        sourceValues: new Set(),
        conditionValues: new Set(),
        fragmented: false,
      }

      existing.specimenIds.add(specimen.specimen_id)
      existing.sourceValues.add(sourceRow.value)
      if (specimen.preservation_state) existing.conditionValues.add(specimen.preservation_state)
      matchingImages.forEach((image) => {
        existing.images.set(image.image_id, image)
        if (image.condition) existing.conditionValues.add(image.condition)
      })
      existing.fragmented = existing.fragmented
        || isFragmented(specimen.preservation_state)
        || matchingImages.some((image) => isFragmented(image.condition))
      if (existing.images.size > 0) existing.status = 'documented'
      groups.set(key, existing)
    })
  })

  images.forEach((image) => addUnmappedValue(
    unmappedValues,
    image.bone_name,
    'bone_images.bone_name',
    image.specimen_id,
  ))

  const statusData = Object.fromEntries(EXPECTED_CATEGORY_SIDE_KEYS.map((key) => [
    key,
    { key, status: 'unknown', specimenIds: [], images: [], sourceValues: [] },
  ]))

  groups.forEach((group, key) => {
    statusData[key] = {
      ...group,
      specimenIds: [...group.specimenIds].sort(),
      images: [...group.images.values()],
      sourceValues: [...group.sourceValues].sort(),
      conditionValues: [...group.conditionValues].sort(),
    }
  })

  const records = Object.values(statusData)
  const documentedCount = records.filter((record) => record.status === 'documented').length
  const presentNoImageCount = records.filter((record) => record.status === 'present_no_image').length
  const knownCount = documentedCount + presentNoImageCount
  const knownCategoryCount = new Set(records
    .filter((record) => record.status !== 'unknown')
    .map((record) => parseCategorySideKey(record.key)?.category.code)
    .filter(Boolean)).size
  const supportedCategoryCount = CONTROLLED_BONE_CATEGORIES.length
  const recordedCategoryCoveragePercent = supportedCategoryCount > 0 ? Math.round((knownCategoryCount / supportedCategoryCount) * 100) : 0
  const imageDocumentationPercent = knownCount > 0 ? Math.round((documentedCount / knownCount) * 100) : 0

  return {
    statusData,
    documentedCount,
    presentNoImageCount,
    knownCount,
    knownCategoryCount,
    supportedCategoryCount,
    recordedCategoryCoveragePercent,
    imageDocumentationPercent,
    unmappedValues,
  }
}

function SummaryCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'border-white/10 bg-slate-950 text-white',
    green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-300/25 bg-amber-300/10 text-amber-100',
    cyan: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-50',
  }

  return (
    <div className={`min-w-0 rounded-md border p-3 ${tones[tone]}`}>
      <p className="text-xs opacity-55">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}

function CoverageGauge({ label, percent, fraction, explanation, tone = 'cyan' }) {
  const accent = tone === 'green' ? '#34d399' : '#67e8f9'
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0))

  return (
    <div className="flex min-w-0 flex-col items-center rounded-md border border-white/10 bg-slate-950/70 p-4 text-center sm:flex-row sm:text-left">
      <div
        className="relative h-28 w-28 shrink-0 rounded-full p-2"
        style={{ background: `conic-gradient(${accent} ${safePercent * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
        role="progressbar"
        aria-label={`${label}: ${safePercent}%`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safePercent}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
          <span className="text-2xl font-bold text-white">{safePercent}%</span>
        </div>
      </div>
      <div className="mt-3 min-w-0 sm:ml-5 sm:mt-0">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <p className="mt-1 text-sm font-medium" style={{ color: accent }}>{fraction}</p>
        <p className="mt-2 text-xs leading-5 text-white/45">{explanation}</p>
      </div>
    </div>
  )
}

function DetailLine({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/35">{label}</p>
      <p className="mt-1 break-words text-sm text-white/75">{value || '-'}</p>
    </div>
  )
}

export default function SkeletonViewerPage() {
  const [skeletonCodes, setSkeletonCodes] = useState([])
  const [selectedSkeletonCode, setSelectedSkeletonCode] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [specimens, setSpecimens] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [images, setImages] = useState([])
  const [legacyImages, setLegacyImages] = useState([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [loadingCoverage, setLoadingCoverage] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadSkeletonCodes() {
      setLoadingCodes(true)
      const { data, error: loadError } = await supabase
        .from('specimens')
        .select('skeleton_code')
        .order('skeleton_code', { ascending: true })

      if (!active) return

      const codes = [...new Set((data || [])
        .map((row) => row.skeleton_code?.trim())
        .filter(Boolean))]

      setSkeletonCodes(codes)
      setError(loadError?.message || '')
      setLoadingCodes(false)
    }

    loadSkeletonCodes()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCoverageRecords() {
      if (!selectedSkeletonCode) {
        setSpecimens([])
        setMeasurements([])
        setImages([])
        setLegacyImages([])
        return
      }

      setLoadingCoverage(true)
      setError('')

      const specimenResult = await supabase
        .from('specimens')
        .select('specimen_id, skeleton_code, bone_type, side, preservation_state, site_name, district, province, time_period')
        .eq('skeleton_code', selectedSkeletonCode)

      if (!active) return
      if (specimenResult.error) {
        setError(specimenResult.error.message)
        setLoadingCoverage(false)
        return
      }

      const loadedSpecimens = specimenResult.data || []
      const specimenIds = loadedSpecimens.map((specimen) => specimen.specimen_id)

      const measurementQuery = specimenIds.length > 0
        ? supabase
          .from('measurements')
          .select('measurement_id, specimen_id, bone_type, measurement_type, value, unit, notes')
          .in('specimen_id', specimenIds)
        : Promise.resolve({ data: [], error: null })

      const imageQuery = specimenIds.length > 0
        ? supabase
          .from('bone_images')
          .select(IMAGE_COLUMNS)
          .in('specimen_id', specimenIds)
        : Promise.resolve({ data: [], error: null })

      const legacyImageQuery = supabase
        .from('bone_images')
        .select(IMAGE_COLUMNS)
        .eq('skeleton_code', selectedSkeletonCode)

      const [measurementResult, imageResult, legacyImageResult] = await Promise.all([
        measurementQuery,
        imageQuery,
        legacyImageQuery,
      ])

      if (!active) return

      const loadError = measurementResult.error || imageResult.error || legacyImageResult.error
      setSpecimens(loadedSpecimens)
      setMeasurements(measurementResult.data || [])
      setImages(imageResult.data || [])
      const specimenIdSet = new Set(specimenIds)
      setLegacyImages((legacyImageResult.data || []).filter((image) => !specimenIdSet.has(image.specimen_id)))
      setError(loadError?.message || '')
      setLoadingCoverage(false)
    }

    loadCoverageRecords()
    return () => { active = false }
  }, [selectedSkeletonCode])

  const coverage = useMemo(
    () => calculateCoverage(specimens, measurements, images),
    [specimens, measurements, images],
  )

  const uniqueUnmappedValues = useMemo(() => {
    const values = new Map()
    coverage.unmappedValues.forEach((item) => {
      const existing = values.get(item.value) || { value: item.value, count: 0, sources: new Set() }
      existing.count += 1
      existing.sources.add(item.source)
      values.set(item.value, existing)
    })
    return [...values.values()]
      .map((item) => ({ ...item, sources: [...item.sources] }))
      .sort((a, b) => a.value.localeCompare(b.value))
  }, [coverage.unmappedValues])

  useEffect(() => {
    if (!selectedSkeletonCode || loadingCoverage) return

    const knownRecords = Object.values(coverage.statusData)
      .filter((record) => record.status === 'documented' || record.status === 'present_no_image')
      .sort((a, b) => {
        if (a.status === b.status) return a.key.localeCompare(b.key)
        return a.status === 'documented' ? -1 : 1
      })

    setSelectedKey((currentKey) => {
      if (coverage.statusData[currentKey]?.status && coverage.statusData[currentKey].status !== 'unknown') return currentKey
      return knownRecords[0]?.key || ''
    })
  }, [coverage.statusData, loadingCoverage, selectedSkeletonCode])

  const selectedRecord = selectedKey
    ? coverage.statusData[selectedKey] || { status: 'unknown', specimenIds: [], images: [], sourceValues: [], conditionValues: [], fragmented: false }
    : null
  const selectedParts = parseCategorySideKey(selectedKey)
  const hasSelection = Boolean(selectedSkeletonCode)

  const selectClass = 'w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-7">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-6">
          <p className="text-xs font-semibold text-cyan-300/70">PP1 Image Documentation</p>
          <h1 className="mt-2 text-3xl font-bold">Skeleton Documentation Coverage Viewer</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">
            Category-level documentation for saved specimen bones and images linked through specimen ID.
          </p>
        </header>

        {error && (
          <div className="mb-5 rounded-md border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-base font-semibold">Skeleton / Individual</h2>
            <p className="mt-1 text-xs leading-5 text-white/40">Codes come from saved specimen records.</p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs text-white/45">Skeleton code</span>
              <select
                value={selectedSkeletonCode}
                onChange={(event) => {
                  setSelectedSkeletonCode(event.target.value)
                  setSelectedKey('')
                }}
                className={selectClass}
                disabled={loadingCodes || skeletonCodes.length === 0}
              >
                <option value="">{loadingCodes ? 'Loading skeleton codes...' : 'Select skeleton code...'}</option>
                {skeletonCodes.map((code) => <option key={code} value={code}>{code}</option>)}
              </select>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <DetailLine label="Specimen records" value={hasSelection ? specimens.length : '-'} />
              <DetailLine label="Linked images" value={hasSelection ? images.length : '-'} />
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-base font-semibold">Coverage Summary</h2>
            <p id="recorded-group-help" className="mt-1 max-w-3xl text-xs leading-5 text-white/40" title="A recorded group is a saved bone category and side combination, such as Humerus — Left.">
              A recorded group is a saved bone category and side combination, such as Humerus — Left.
            </p>
            <div className="mt-4 grid gap-3 xl:grid-cols-2" aria-describedby="recorded-group-help">
              <CoverageGauge
                label="Recorded Category Coverage"
                percent={hasSelection ? coverage.recordedCategoryCoveragePercent : 0}
                fraction={hasSelection ? `${coverage.knownCategoryCount} of ${coverage.supportedCategoryCount} supported categories recorded` : 'Select a skeleton to calculate coverage'}
                explanation={hasSelection && coverage.knownCategoryCount === 0
                  ? 'No supported bone categories have been registered for this skeleton.'
                  : 'Distinct saved bone categories divided by the controlled catalogue. This is category coverage, not scientific skeletal completeness.'}
              />
              <CoverageGauge
                label="Image Documentation"
                percent={hasSelection ? coverage.imageDocumentationPercent : 0}
                fraction={hasSelection ? `${coverage.documentedCount} of ${coverage.knownCount} recorded groups have images` : 'Select a skeleton to calculate coverage'}
                explanation={hasSelection && coverage.knownCount === 0
                  ? 'No bone records have been registered, so image documentation is 0%.'
                  : 'Recorded category-side groups with linked images divided by all recorded category-side groups.'}
                tone="green"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
              <SummaryCard label="Saved bone categories" value={hasSelection ? coverage.knownCategoryCount : '-'} tone="cyan" />
              <SummaryCard label="Recorded category-side groups" value={hasSelection ? coverage.knownCount : '-'} />
              <SummaryCard label="Groups with linked images" value={hasSelection ? coverage.documentedCount : '-'} tone="green" />
              <SummaryCard label="Recorded groups without images" value={hasSelection ? coverage.presentNoImageCount : '-'} tone="amber" />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-md border border-white/10 bg-[#0f172a] p-4 sm:p-5">
          {!hasSelection ? (
            <div className="flex min-h-[500px] items-center justify-center rounded-md border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
              Select a skeleton code to load specimen coverage.
            </div>
          ) : loadingCoverage ? (
            <div className="flex min-h-[500px] items-center justify-center text-sm text-white/45">Loading saved specimen, measurement, and image records...</div>
          ) : specimens.length === 0 ? (
            <div className="flex min-h-[500px] items-center justify-center rounded-md border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
              No specimen records were found for this skeleton code.
            </div>
          ) : (
            <SkeletonViewer
              key={selectedSkeletonCode}
              statusData={coverage.statusData}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />
          )}
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]">
          <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Selected Bone / Category</h2>
                <p className="mt-1 text-xs text-white/40">Only images connected through specimen_id are shown here.</p>
              </div>
              {selectedRecord && (
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    selectedRecord.status === 'documented'
                      ? 'border-emerald-300/30 bg-emerald-300/15 text-emerald-100'
                      : selectedRecord.status === 'present_no_image'
                        ? 'border-amber-300/30 bg-amber-300/15 text-amber-100'
                        : 'border-slate-300/20 bg-slate-300/10 text-slate-200'
                  }`}>
                    {STATUS_LABELS[selectedRecord.status]}
                  </span>
                  {selectedRecord.fragmented && (
                    <span className="rounded-md border border-red-300/40 bg-red-300/10 px-2.5 py-1 text-xs font-semibold text-red-100">Fragmented</span>
                  )}
                </div>
              )}
            </div>

            {!selectedParts ? (
              <div className="mt-5 rounded-md border border-dashed border-white/10 p-5 text-sm text-white/45">Select a category and side from the skeleton or list.</div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailLine label="Bone category" value={selectedParts.category.label} />
                  <DetailLine label="Side" value={selectedParts.side === 'Unknown' ? 'Side unknown' : selectedParts.side} />
                  <DetailLine label="Saved source value" value={selectedRecord.sourceValues?.join(', ')} />
                  <DetailLine label="Recorded condition" value={selectedRecord.conditionValues?.join(', ')} />
                </div>

                <div className="mt-5">
                  <p className="text-xs text-white/35">Linked specimen IDs</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRecord.specimenIds?.length > 0 ? selectedRecord.specimenIds.map((specimenId) => (
                      <Link
                        key={specimenId}
                        to={`/specimens/${encodeURIComponent(specimenId)}`}
                        className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100 transition hover:border-cyan-300/50"
                      >
                        {specimenId}
                      </Link>
                    )) : <span className="text-sm text-white/40">No reliable saved record for this category and side.</span>}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedRecord.images?.length > 0 ? selectedRecord.images.map((image) => {
                    const imageSrc = image.image_url || image.file_url
                    return (
                      <article key={image.image_id} className="overflow-hidden rounded-md border border-white/10 bg-slate-950">
                        {imageSrc ? (
                          <img src={imageSrc} alt={image.bone_name || selectedParts.category.label} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center text-sm text-white/35">No thumbnail</div>
                        )}
                        <div className="p-3">
                          <p className="text-sm font-semibold text-white/85">{image.bone_name || selectedParts.category.label}</p>
                          <p className="mt-1 text-xs text-white/40">{image.image_view || 'View not recorded'}</p>
                          <p className="mt-1 text-xs text-white/40">Condition: {image.condition || 'Not recorded'}</p>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{imageNotes(image) || 'No image notes.'}</p>
                          <Link to={`/image/${image.image_id}`} className="mt-3 inline-flex text-xs font-semibold text-cyan-200 hover:text-cyan-100">View image detail</Link>
                        </div>
                      </article>
                    )
                  }) : (
                    <div className="rounded-md border border-dashed border-white/10 p-4 text-sm text-white/40 sm:col-span-2 xl:col-span-3">
                      No specimen-linked images for this category and side.
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-md border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-base font-semibold">Status Legend</h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center gap-3 text-white/70"><span className="h-3 w-3 rounded-sm bg-emerald-400" /> Documented</p>
                <p className="flex items-center gap-3 text-white/70"><span className="h-3 w-3 rounded-sm bg-amber-400" /> Present, no image</p>
                <p className="flex items-center gap-3 text-white/70"><span className="h-3 w-3 rounded-sm bg-slate-500" /> Not assessed</p>
                <p className="flex items-center gap-3 text-white/70"><span className="h-3 w-3 rounded-sm border-2 border-sky-300 shadow-[0_0_6px_rgba(56,189,248,0.8)]" /> Selected outline</p>
                <p className="flex items-center gap-3 text-white/70"><span className="h-3 w-3 rounded-sm border-2 border-dashed border-red-400" /> Fragmented condition</p>
              </div>
            </section>

            {legacyImages.length > 0 && (
              <section className="rounded-md border border-amber-300/25 bg-amber-300/10 p-5">
                <h2 className="text-sm font-semibold text-amber-100">Legacy images need verification</h2>
                <p className="mt-2 text-sm leading-6 text-amber-50/70">
                  {legacyImages.length} image record{legacyImages.length === 1 ? '' : 's'} use this skeleton_code text but are not linked to a specimen in the selected skeleton. They are not counted as documented.
                </p>
                <div className="mt-3 space-y-2">
                  {legacyImages.map((image) => (
                    <div key={image.image_id} className="rounded-md border border-amber-100/15 bg-slate-950/30 px-3 py-2 text-xs text-amber-50/65">
                      <p className="font-semibold text-amber-50">{image.image_id}</p>
                      <p className="mt-1">Linked specimen: {image.specimen_id || 'None'}</p>
                      <p className="mt-1">Saved bone name: {image.bone_name || 'Not recorded'}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {uniqueUnmappedValues.length > 0 && (
              <section className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-5">
                <h2 className="text-sm font-semibold text-cyan-50">Unmapped database values</h2>
                <p className="mt-2 text-xs leading-5 text-cyan-50/60">These values were kept visible and were not guessed into a category.</p>
                <div className="mt-3 space-y-2">
                  {uniqueUnmappedValues.map((item) => (
                    <div key={item.value} className="rounded-md border border-cyan-100/10 bg-slate-950/35 px-3 py-2">
                      <p className="text-sm font-medium text-cyan-50">{item.value} <span className="text-cyan-100/45">({item.count})</span></p>
                      <p className="mt-1 text-[11px] text-cyan-50/45">{item.sources.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        <p className="mt-6 text-center text-xs text-white/25">
          The full catalogue contains {CONTROLLED_BONE_CATEGORIES.length} controlled categories. Unrecorded categories remain Not assessed. SVG source details are recorded in the local attribution file.
        </p>
      </div>
    </main>
  )
}
