/**
 * KgcSimilarCaseDetail.jsx
 * ========================
 * The **View** popup behind each row of the Similar Cases panel: the full
 * catalogue record of one matched Centralized Specimen Record Management
 * (CSRM) specimen, together with the evidence that made it a match.
 *
 * ── Why this reads nothing ──────────────────────────────────────────────
 * Every value shown here arrives on the `caseRow.source` object that
 * lib/similarCases.js already assembled while scoring — the specimen row,
 * its `measurements` rows and its `skeletal_inputs` rows were all fetched by
 * the panel's original three queries. Opening, closing or reopening this
 * dialog therefore issues NO query: it is pure presentation over data the
 * page is already holding, and the CSRM read path is untouched.
 *
 * Props
 *   caseRow   one scored case from findSimilarCases() (must carry `.source`)
 *   onClose   called on backdrop click, close button or Escape
 */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CHANNEL_WEIGHTS } from '../lib/similarCases'

/* ------------------------------------------------------------------ *
 * Presentation vocabulary
 * ------------------------------------------------------------------ */

/** Evidence channels, in the order they are explained to the reader. */
const CHANNEL_LABELS = {
  boneGroup: 'Bone group',
  features: 'Morphological features',
  metrics: 'Metric measurements',
  provenance: 'Provenance',
  profile: 'Biological profile',
}

/** `specimens` columns worth showing, in reading order. */
const SPECIMEN_FIELDS = [
  ['specimen_id', 'Specimen ID'],
  ['skeleton_code', 'Skeleton Code'],
  ['bone_type', 'Bone Type'],
  ['side', 'Side'],
  ['site_name', 'Site'],
  ['district', 'District'],
  ['province', 'Province'],
  ['excavation_year', 'Excavation Year'],
  ['time_period', 'Time Period'],
  ['preservation_state', 'Preservation'],
  ['burial_context', 'Burial Context'],
  ['location_stored', 'Stored At'],
  ['sex_estimate', 'Recorded Sex'],
  ['age_estimate', 'Recorded Age'],
  ['height_estimate', 'Recorded Height'],
]

/** Bookkeeping columns of `skeletal_inputs` — never useful to a reader. */
const MORPHOLOGY_SKIP = new Set([
  'input_id', 'id', 'specimen_id', 'created_at', 'updated_at', 'recorded_by',
])

/** `snake_case_column` -> "Snake Case Column". */
function titleise(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === ''
}

/* ------------------------------------------------------------------ *
 * Small building blocks
 * ------------------------------------------------------------------ */

function Section({ title, subtitle, children }) {
  return (
    <section className="border-t border-slate-700/70 px-6 py-5">
      <h4 className="text-slate-200 font-semibold text-sm">{title}</h4>
      {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-slate-200 text-sm mt-0.5 break-words">
        {isBlank(value) ? <span className="text-slate-600">Not recorded</span> : String(value)}
      </dd>
    </div>
  )
}

/** A 0-100 channel score, drawn as a bar so contributions compare at a glance. */
function ChannelBar({ name, score, weight }) {
  const tone =
    score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-orange-500' : 'bg-slate-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-44 shrink-0">{name}</span>
      <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full ${tone} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-slate-300 text-xs font-mono w-10 text-right">{score}%</span>
      <span className="text-slate-600 text-[10px] w-20 text-right whitespace-nowrap">
        weight {Math.round(weight * 100)}%
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The dialog
 * ------------------------------------------------------------------ */

export default function KgcSimilarCaseDetail({ caseRow, onClose }) {
  // Escape closes, and the page behind must not scroll while the dialog is up.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  if (!caseRow) return null

  const source = caseRow.source || {}
  const specimen = source.specimen || {}
  const measurements = source.measurements || []
  const morphologyRows = source.skeletalInputs || []
  const channels = caseRow.channels || {}

  // Every recorded (non-blank, non-bookkeeping) morphology value across the
  // specimen's skeletal_inputs rows.
  const morphology = []
  for (const row of morphologyRows) {
    for (const [key, value] of Object.entries(row)) {
      if (MORPHOLOGY_SKIP.has(key) || isBlank(value)) continue
      morphology.push({ key, label: titleise(key), value })
    }
  }

  const matchTone =
    caseRow.match >= 75
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : caseRow.match >= 55
        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        : 'bg-slate-500/15 text-slate-400 border-slate-500/30'

  // Portalled to <body>: the Similar Cases panel clips its overflow, and the
  // report page nests it inside a column, so an in-place overlay could be cut.
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Case details for ${caseRow.caseId}`}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] overflow-y-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl"
      >
        {/* ---------------- Header ---------------- */}
        <div className="px-6 py-5 flex items-start justify-between gap-4 sticky top-0 bg-slate-800 z-10">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-orange-400">
              Specimen Catalogue Record
            </p>
            <h3 className="text-slate-100 text-xl font-semibold mt-1 font-mono">
              {caseRow.caseId}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {caseRow.bonesType}
              {caseRow.side && caseRow.side !== 'Not Applicable' ? ` · ${caseRow.side}` : ''}
              {caseRow.location && caseRow.location !== '—' ? ` · ${caseRow.location}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${matchTone}`}>
              {caseRow.match}% match
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Close case details"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ---------------- Why it matched ---------------- */}
        <Section
          title="Why this case matched"
          subtitle="Only the evidence channels with data on both sides are scored; their weights are rescaled to sum to 100%."
        >
          <ul className="space-y-1.5 mb-4">
            {(caseRow.reasons || []).map((reason, i) => (
              <li key={i} className="text-slate-300 text-sm flex gap-2">
                <span className="text-emerald-400 shrink-0">✓</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            {Object.keys(CHANNEL_LABELS)
              .filter((key) => channels[key] !== undefined)
              .map((key) => (
                <ChannelBar
                  key={key}
                  name={CHANNEL_LABELS[key]}
                  score={channels[key]}
                  weight={CHANNEL_WEIGHTS[key]}
                />
              ))}
          </div>
        </Section>

        {/* ---------------- Catalogue record ---------------- */}
        <Section
          title="Catalogue record"
          subtitle="As held in the Centralized Specimen Record Management system."
        >
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
            {SPECIMEN_FIELDS.map(([key, label]) => (
              <Field key={key} label={label} value={specimen[key]} />
            ))}
          </dl>
        </Section>

        {/* ---------------- Metric measurements ---------------- */}
        <Section
          title="Metric measurements"
          subtitle={
            measurements.length
              ? `${measurements.length} measurement${measurements.length === 1 ? '' : 's'} recorded against this specimen.`
              : undefined
          }
        >
          {measurements.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No metric measurements recorded for this specimen.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/40">
                    <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Bone</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Measurement</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Value</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-medium text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, i) => (
                    <tr key={m.measurement_id || i} className="border-b border-slate-700 last:border-b-0">
                      <td className="px-4 py-2 text-slate-300">{m.bone_type || '—'}</td>
                      <td className="px-4 py-2 text-slate-300">{m.measurement_type || '—'}</td>
                      <td className="px-4 py-2 text-slate-200 font-mono text-xs">
                        {isBlank(m.value) ? '—' : `${m.value}${m.unit ? ` ${m.unit}` : ''}`}
                      </td>
                      <td className="px-4 py-2 text-slate-500 text-xs">{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ---------------- Morphological observations ---------------- */}
        <Section
          title="Morphological observations"
          subtitle="Non-metric features recorded on the specimen; these are what the feature channel compares against."
        >
          {morphology.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No morphological observations recorded for this specimen — the feature channel was
              dropped and its weight redistributed.
            </p>
          ) : (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
              {morphology.map((f, i) => (
                <Field key={`${f.key}-${i}`} label={f.label} value={f.value} />
              ))}
            </dl>
          )}
        </Section>

        {/* ---------------- Footer ---------------- */}
        <div className="border-t border-slate-700/70 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-slate-600 text-[11px]">
            Read-only view of the specimen catalogue. Nothing here is part of, or written back to,
            this analysis.
          </p>
          <button
            onClick={onClose}
            className="shrink-0 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
