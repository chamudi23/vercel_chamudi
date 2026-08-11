/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'

const BONE_OPTIONS = [
  'Skull',
  'Mandible',
  'Rib',
  'Humerus',
  'Femur',
  'Tibia',
  'Pelvis',
  'Calcaneus',
]

const SIDE_OPTIONS = ['Left', 'Right', 'Axial', 'Unknown']

const CONDITION_OPTIONS = [
  'Complete', 'Fragmented', 'Partially Complete', 'Heavily Damaged', 'Unknown',
]

const REGION_OPTIONS = [
  'Cranial', 'Upper Limb', 'Thorax', 'Pelvis', 'Lower Limb', 'Foot', 'Unknown',
]

const IMAGE_VIEW_OPTIONS = [
  'Anterior', 'Posterior', 'Lateral', 'Superior', 'Inferior', 'Medial', 'Other',
]

const IMAGE_TYPE_OPTIONS = [
  'Excavation', 'Laboratory', 'Museum', 'Field', 'Reference',
]

const emptyForm = {
  bone_name: 'Skull',
  side: 'Unknown',
  condition: 'Complete',
  skeleton_region: 'Cranial',
  image_view: 'Anterior',
  image_type: 'Laboratory',
  notes: '',
  tags: '',
  annotation_text: '',
}

const SPECIMEN_SELECT = [
  'specimen_id',
  'site_name',
  'district',
  'province',
  'time_period',
  'preservation_state',
  'location_stored',
  'burial_context',
  'notes',
  'bone_type',
  'side',
  'length_cm',
  'width_cm',
  'thickness_cm',
  'age_estimate',
  'sex_estimate',
].join(', ')

function inferSkeletonRegion(boneType) {
  const value = String(boneType || '').toLowerCase()
  if (!value) return null
  if (/(skull|mandible|maxilla|incisor|canine|premolar|molar|teeth|tooth)/.test(value)) return 'Cranial'
  if (/(humerus|radius|ulna|metacarpal|clavicle|scapula|hand)/.test(value)) return 'Upper Limb'
  if (/(rib|sternum|vertebra)/.test(value)) return 'Thorax'
  if (/(pelvis|sacrum)/.test(value)) return 'Pelvis'
  if (/(femur|tibia|fibula|patella|calcane|astragalus|metatarsal|foot)/.test(value)) return 'Lower Limb'
  return 'Unknown'
}

function formatMeasurement(measurement) {
  return [
    measurement.measurement_type,
    measurement.value != null ? `${measurement.value}${measurement.unit ? ` ${measurement.unit}` : ''}` : '',
  ].filter(Boolean).join(' - ')
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-white/30">{hint}</span>}
    </label>
  )
}

function ReadOnlyRow({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{label}</p>
      <p className="mt-1 text-sm text-white/75">{value === null || value === undefined || value === '' ? '-' : value}</p>
    </div>
  )
}

export default function ImageUploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const specimenIdFromUrl = searchParams.get('specimen_id')?.trim() || ''
  const hasSpecimenParam = Boolean(specimenIdFromUrl)
  const [linkedSpecimen, setLinkedSpecimen] = useState(null)
  const [linkedMeasurements, setLinkedMeasurements] = useState([])
  const [linkedExcavation, setLinkedExcavation] = useState(null)
  const [linkedLabDating, setLinkedLabDating] = useState(null)
  const [specimenLoading, setSpecimenLoading] = useState(false)
  const [specimenError, setSpecimenError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  useEffect(() => {
    let mounted = true

    async function loadLinkedSpecimen() {
      if (!specimenIdFromUrl) {
        setLinkedSpecimen(null)
        setLinkedMeasurements([])
        setLinkedExcavation(null)
        setLinkedLabDating(null)
        setSpecimenError('')
        setSpecimenLoading(false)
        return
      }

      setSpecimenLoading(true)
      setSpecimenError('')
      setLinkedSpecimen(null)
      setLinkedMeasurements([])
      setLinkedExcavation(null)
      setLinkedLabDating(null)

      const [specimenResult, measurementResult, excavationResult, labResult] = await Promise.all([
        supabase
          .from('specimens')
          .select(SPECIMEN_SELECT)
          .eq('specimen_id', specimenIdFromUrl)
          .maybeSingle(),
        supabase
          .from('measurements')
          .select('measurement_id, bone_type, measurement_type, value, unit, notes')
          .eq('specimen_id', specimenIdFromUrl)
          .order('measurement_id', { ascending: true }),
        supabase
          .from('excavation_records')
          .select('excavation_id, excavation_date, excavation_phase, depth_found, excavator_name, excavation_notes')
          .eq('specimen_id', specimenIdFromUrl)
          .maybeSingle(),
        supabase
          .from('laboratory_dating_results')
          .select('lab_id, dating_method, date_result, date_range_min, date_range_max, lab_name, result_notes')
          .eq('specimen_id', specimenIdFromUrl)
          .maybeSingle(),
      ])

      if (!mounted) return

      if (specimenResult.error || !specimenResult.data) {
        setSpecimenError(specimenResult.error?.message || `No specimen found for ${specimenIdFromUrl}.`)
        setSpecimenLoading(false)
        return
      }

      if (measurementResult.error || excavationResult.error || labResult.error) {
        setSpecimenError(
          measurementResult.error?.message ||
          excavationResult.error?.message ||
          labResult.error?.message ||
          'Could not load all saved specimen details.'
        )
        setSpecimenLoading(false)
        return
      }

      setLinkedSpecimen(specimenResult.data)
      setLinkedMeasurements(measurementResult.data || [])
      setLinkedExcavation(excavationResult.data || null)
      setLinkedLabDating(labResult.data || null)
      setSpecimenLoading(false)
    }

    loadLinkedSpecimen()
    return () => { mounted = false }
  }, [specimenIdFromUrl])

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleFile = (nextFile) => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(nextFile || null)
    setPreview(nextFile ? URL.createObjectURL(nextFile) : '')
  }

  const validate = () => {
    if (hasSpecimenParam && specimenLoading) return 'Please wait until the specimen record finishes loading.'
    if (hasSpecimenParam && specimenError) return 'The selected specimen could not be loaded.'
    if (hasSpecimenParam && !linkedSpecimen) return 'The selected specimen could not be loaded.'
    if (!file) return 'Select a skeletal image file.'
    if (!hasSpecimenParam && !form.bone_name.trim()) return 'Bone name is required.'
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)

    const validationMessage = validate()
    if (validationMessage) {
      setMessage({ type: 'error', text: validationMessage })
      return
    }

    setSaving(true)

    try {
      const imageId = `IMG-${Date.now()}`
      const safeName = file.name.replace(/[^\w.-]+/g, '_')
      const savedBoneType = linkedMeasurements[0]?.bone_type || linkedSpecimen?.bone_type || ''
      const savedSide = linkedSpecimen?.side || null
      const savedRegion = inferSkeletonRegion(savedBoneType)
      const storageFolder = linkedSpecimen?.specimen_id || 'unlinked'
      const storagePath = `skeletons/${storageFolder}/${imageId}_${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('bone-images')
        .upload(storagePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('bone-images')
        .getPublicUrl(storagePath)

      const publicUrl = publicUrlData.publicUrl

      const imagePayload = {
        image_id: imageId,
        specimen_id: linkedSpecimen?.specimen_id || null,
        bone_name: hasSpecimenParam ? (savedBoneType || null) : form.bone_name.trim(),
        side: hasSpecimenParam ? savedSide : form.side || null,
        condition: form.condition || null,
        skeleton_region: hasSpecimenParam ? savedRegion : form.skeleton_region || null,
        image_view: form.image_view || null,
        image_type: form.image_type || null,
        notes: form.notes.trim() || null,
        tags: form.tags.trim() || null,
        annotation_text: form.annotation_text.trim() || null,
        image_url: publicUrl,
        file_url: publicUrl,
        uploaded_at: new Date().toISOString(),
      }

      const { error: imageError } = await supabase.from('bone_images').insert(imagePayload)
      if (imageError) throw imageError

      setMessage({ type: 'success', text: 'Image saved successfully. Redirecting to gallery...' })
      setForm(emptyForm)
      handleFile(null)

      setTimeout(() => navigate('/gallery'), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Upload failed.' })
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-violet-500'
  const selectClass = `${inputClass} cursor-pointer`
  const uploadDisabled = saving || (hasSpecimenParam && (specimenLoading || Boolean(specimenError) || !linkedSpecimen))
  const savedBoneType = linkedMeasurements[0]?.bone_type || linkedSpecimen?.bone_type || ''
  const savedSide = linkedSpecimen?.side || ''
  const savedRegion = inferSkeletonRegion(savedBoneType)

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/70">PP1 Image Documentation</p>
          <h1 className="mt-2 text-3xl font-bold">Upload Skeletal Image</h1>
          <p className="mt-2 text-sm text-white/45">
            {hasSpecimenParam
              ? 'Attach an image to the saved specimen record and add image-specific metadata.'
              : 'Upload an image and save image-specific metadata without linking to a specimen record.'}
          </p>
        </div>

        {hasSpecimenParam && (
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/70">A. Saved Specimen and Bone Details</p>
                <h2 className="mt-1 text-lg font-semibold text-white">Read-only registration data</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                Read-only
              </span>
            </div>

            {specimenLoading ? (
              <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-sm text-white/45">
                Loading specimen details...
              </div>
            ) : specimenError ? (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-4 text-sm text-red-200">
                {specimenError}
              </div>
            ) : linkedSpecimen ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Image will be attached to</p>
                  <p className="mt-1 text-base font-semibold text-emerald-100">
                    {savedBoneType || 'No saved bone type found'}{savedSide ? ` - ${savedSide}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/55">
                    Specimen {linkedSpecimen.specimen_id}{savedRegion ? ` - ${savedRegion}` : ''}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Specimen</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ReadOnlyRow label="Specimen ID" value={linkedSpecimen.specimen_id} />
                    <ReadOnlyRow label="Site" value={linkedSpecimen.site_name} />
                    <ReadOnlyRow label="District" value={linkedSpecimen.district} />
                    <ReadOnlyRow label="Province" value={linkedSpecimen.province} />
                    <ReadOnlyRow label="Time Period" value={linkedSpecimen.time_period} />
                    <ReadOnlyRow label="Preservation" value={linkedSpecimen.preservation_state} />
                    <ReadOnlyRow label="Storage" value={linkedSpecimen.location_stored} />
                    <ReadOnlyRow label="Burial Context" value={linkedSpecimen.burial_context} />
                    <ReadOnlyRow label="Specimen Notes" value={linkedSpecimen.notes} />
                    <ReadOnlyRow label="Age Estimate" value={linkedSpecimen.age_estimate} />
                    <ReadOnlyRow label="Sex Estimate" value={linkedSpecimen.sex_estimate} />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Bone Details</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <ReadOnlyRow label="Bone Name / Type" value={savedBoneType} />
                    <ReadOnlyRow label="Side" value={savedSide} />
                    <ReadOnlyRow label="Skeleton Region" value={savedRegion} />
                    <ReadOnlyRow label="Length" value={linkedSpecimen.length_cm != null ? `${linkedSpecimen.length_cm} cm` : ''} />
                    <ReadOnlyRow label="Width" value={linkedSpecimen.width_cm != null ? `${linkedSpecimen.width_cm} cm` : ''} />
                    <ReadOnlyRow label="Thickness" value={linkedSpecimen.thickness_cm != null ? `${linkedSpecimen.thickness_cm} cm` : ''} />
                  </div>
                  {linkedMeasurements.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-[10px] uppercase tracking-[0.14em] text-white/30">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Bone Type</th>
                            <th className="px-3 py-2 font-semibold">Measurement</th>
                            <th className="px-3 py-2 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {linkedMeasurements.map((measurement) => (
                            <tr key={measurement.measurement_id} className="bg-slate-950/30 text-white/70">
                              <td className="px-3 py-2">{measurement.bone_type || '-'}</td>
                              <td className="px-3 py-2">{formatMeasurement(measurement) || '-'}</td>
                              <td className="px-3 py-2 text-white/45">{measurement.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white/40">
                      No measurement rows were saved for this specimen, so no measurement-based bone type could be loaded.
                    </p>
                  )}
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Excavation</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ReadOnlyRow label="Excavation Date" value={linkedExcavation?.excavation_date} />
                      <ReadOnlyRow label="Phase" value={linkedExcavation?.excavation_phase} />
                      <ReadOnlyRow label="Depth Found" value={linkedExcavation?.depth_found != null ? `${linkedExcavation.depth_found} m` : ''} />
                      <ReadOnlyRow label="Excavator" value={linkedExcavation?.excavator_name} />
                      <ReadOnlyRow label="Excavation Notes" value={linkedExcavation?.excavation_notes} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Laboratory Dating</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ReadOnlyRow label="Dating Method" value={linkedLabDating?.dating_method} />
                      <ReadOnlyRow label="Date Result" value={linkedLabDating?.date_result} />
                      <ReadOnlyRow label="Range Min" value={linkedLabDating?.date_range_min} />
                      <ReadOnlyRow label="Range Max" value={linkedLabDating?.date_range_max} />
                      <ReadOnlyRow label="Lab Name" value={linkedLabDating?.lab_name} />
                      <ReadOnlyRow label="Result Notes" value={linkedLabDating?.result_notes} />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/25 bg-red-500/10 text-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-base font-semibold">B. Image File</h2>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="mt-4 block w-full rounded-xl border border-dashed border-white/15 bg-slate-900 px-3 py-4 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {preview && (
                <img src={preview} alt="Selected skeletal upload preview" className="mt-4 aspect-[4/3] w-full rounded-xl border border-white/10 object-contain" />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-base font-semibold">C. Image-specific Metadata</h2>
            <p className="mt-1 text-xs text-white/40">These values belong to the uploaded image only.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {!hasSpecimenParam && (
                <>
                  <Field label="Bone name">
                    <select value={form.bone_name} onChange={(event) => setField('bone_name', event.target.value)} className={selectClass}>
                      {BONE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Side">
                    <select value={form.side} onChange={(event) => setField('side', event.target.value)} className={selectClass}>
                      {SIDE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                  <Field label="Skeleton region">
                    <select value={form.skeleton_region} onChange={(event) => setField('skeleton_region', event.target.value)} className={selectClass}>
                      {REGION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </Field>
                </>
              )}
              <Field label="Condition visible in image">
                <select value={form.condition} onChange={(event) => setField('condition', event.target.value)} className={selectClass}>
                  {CONDITION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Image view">
                <select value={form.image_view} onChange={(event) => setField('image_view', event.target.value)} className={selectClass}>
                  {IMAGE_VIEW_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="Image type">
                <select value={form.image_type} onChange={(event) => setField('image_type', event.target.value)} className={selectClass}>
                  {IMAGE_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                </select>
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="Image notes">
                <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={3} className={inputClass} placeholder="Visible condition, context notes, or documentation comments" />
              </Field>
              <Field label="Tags" hint="Comma-separated retrieval tags, e.g. skull, fragmented, lab">
                <input value={form.tags} onChange={(event) => setField('tags', event.target.value)} className={inputClass} placeholder="skull, SK1, laboratory" />
              </Field>
              <Field label="Annotation text" hint="Stored as a text note alongside the image record.">
                <textarea value={form.annotation_text} onChange={(event) => setField('annotation_text', event.target.value)} rows={3} className={inputClass} placeholder="Annotation note visible in the image detail page" />
              </Field>
            </div>

            <button
              type="submit"
              disabled={uploadDisabled}
              className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-600/40"
            >
              {saving ? 'Saving image...' : 'Save Image to Supabase'}
            </button>
          </section>
        </form>
      </div>
    </main>
  )
}
