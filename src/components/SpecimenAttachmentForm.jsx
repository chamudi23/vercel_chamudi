/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { Link } from 'react-router-dom'
import {
  CONDITION_OPTIONS,
  IMAGE_TYPE_OPTIONS,
  IMAGE_VIEW_OPTIONS,
  regionForBoneCategory,
} from '../utils/pp1ImageModule'

export const EMPTY_ATTACHMENT_METADATA = {
  condition: '',
  image_view: '',
  image_type: '',
  notes: '',
  tags: '',
  annotation_text: '',
}

export function attachmentMetadataFromImage(image) {
  return {
    condition: image?.condition || '',
    image_view: image?.image_view || image?.view_angle || '',
    image_type: image?.image_type || '',
    notes: image?.notes || image?.image_notes || '',
    tags: image?.tags || '',
    annotation_text: image?.annotation_text || '',
  }
}

export function attachmentMetadataPayload(value) {
  return {
    condition: value.condition || null,
    image_view: value.image_view || null,
    image_type: value.image_type || null,
    notes: value.notes.trim() || null,
    tags: value.tags.trim() || null,
    annotation_text: value.annotation_text.trim() || null,
  }
}

export function validateAttachmentMetadata(value) {
  if (value.condition && !CONDITION_OPTIONS.includes(value.condition)) return 'Select a valid visible condition.'
  if (value.image_view && !IMAGE_VIEW_OPTIONS.includes(value.image_view)) return 'Select a valid image view.'
  if (value.image_type && !IMAGE_TYPE_OPTIONS.includes(value.image_type)) return 'Select a valid image type.'
  return ''
}

const fieldClass = 'w-full rounded-lg border border-white/10 bg-[#0f1a14] px-3 py-2 text-xs text-white outline-none transition focus:border-emerald-500'
const labelClass = 'mb-1 block text-[10px] uppercase tracking-wider text-white/35'

function ReadOnlyIdentity({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/15 px-3 py-2">
      <p className={labelClass}>{label}</p>
      <p className="text-sm text-white/75">{String(value || '').trim() || '—'}</p>
    </div>
  )
}

export function SpecimenAttachmentIdentity({ specimen }) {
  const boneCategory = specimen?.boneCategory || specimen?.bone_type || ''
  return (
    <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Linked specimen identity</p>
          <p className="mt-1 text-[11px] text-white/40">Bone identity is managed by the Specimen Record and is read-only here.</p>
        </div>
        {specimen?.specimen_id && (
          <Link to={`/specimens/${encodeURIComponent(specimen.specimen_id)}`} className="text-xs font-medium text-emerald-300 hover:text-emerald-200">
            Open Specimen Record
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <ReadOnlyIdentity label="Skeleton ID" value={specimen?.skeleton_code} />
        <ReadOnlyIdentity label="Specimen ID" value={specimen?.specimen_id} />
        <ReadOnlyIdentity label="Bone Category" value={boneCategory} />
        <ReadOnlyIdentity label="Side" value={specimen?.side} />
        <ReadOnlyIdentity label="Skeleton Region" value={regionForBoneCategory(boneCategory)} />
      </div>
      <p className="mt-3 text-[11px] text-white/40">
        Specimen Preservation State: <span className="text-white/65">{specimen?.preservation_state || '—'}</span>
      </p>
    </div>
  )
}

export default function SpecimenAttachmentForm({ value, onChange, specimen }) {
  return (
    <div>
      <SpecimenAttachmentIdentity specimen={specimen} />
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">Image-specific metadata</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Condition Visible in Image</label>
          <select value={value.condition} onChange={(event) => onChange('condition', event.target.value)} className={fieldClass}>
            <option value="">Not specified</option>
            {CONDITION_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Image View</label>
          <select value={value.image_view} onChange={(event) => onChange('image_view', event.target.value)} className={fieldClass}>
            <option value="">Not specified</option>
            {IMAGE_VIEW_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Image Type</label>
          <select value={value.image_type} onChange={(event) => onChange('image_type', event.target.value)} className={fieldClass}>
            <option value="">Not specified</option>
            {IMAGE_TYPE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Tags</label>
          <input value={value.tags} onChange={(event) => onChange('tags', event.target.value)} placeholder="Comma-separated" className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Image Notes</label>
          <textarea value={value.notes} onChange={(event) => onChange('notes', event.target.value)} rows={2} className={`${fieldClass} resize-none`} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Annotation Text</label>
          <textarea value={value.annotation_text} onChange={(event) => onChange('annotation_text', event.target.value)} rows={2} className={`${fieldClass} resize-none`} />
        </div>
      </div>
    </div>
  )
}
