/**
 * KgcSimilarCases.jsx
 * ===================
 * Renders the **Similar Cases** panel of the Automated Skeletal Analysis
 * System (ASA), populated live from the Centralized Specimen Record
 * Management (CSRM) catalogue.
 *
 * This is a presentation-only component:
 *   - it never writes to CSRM or to the ASA `analyses` table;
 *   - it adds no attribute to the ASA analysis record — the rows shown here
 *     are derived at view time by lib/similarCases.js and then discarded;
 *   - if CSRM is unreachable, the panel degrades to a message and the rest
 *     of the ASA workflow is unaffected.
 *
 * Props
 *   basicInfo    ASA Step-1 values (used for the provenance channel)
 *   measurements ASA Step-2 values, incl. `bonesType` (the analysis type)
 *   predictions  ASA Step-3 output (used for the biological-profile channel)
 *   limit        max rows to show (default MAX_RESULTS)
 *   compact      narrower layout for the two-column report page
 */

import { useEffect, useState } from 'react'
import { findSimilarCases, MAX_RESULTS } from '../lib/similarCases'

function MatchBadge({ value }) {
  const tone =
    value >= 75
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : value >= 55
        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tone}`}>
      {value}%
    </span>
  )
}

export default function KgcSimilarCases({
  basicInfo = {},
  measurements = {},
  predictions = {},
  limit = MAX_RESULTS,
  compact = false,
}) {
  const [state, setState] = useState({ status: 'loading', cases: [], error: null, scanned: 0, analysisType: '' })

  const analysisType = measurements.bonesType || basicInfo.bonesType || ''
  // Serialised inputs keep the effect from re-firing on every render.
  const depKey = JSON.stringify({ basicInfo, measurements, predictions, limit })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, status: 'loading' }))

    findSimilarCases({ basicInfo, measurements, predictions, limit })
      .then((res) => {
        if (!active) return
        setState({
          status: res.error ? 'error' : 'ready',
          cases: res.cases,
          error: res.error,
          scanned: res.scanned,
          analysisType: res.analysisType,
        })
      })
      .catch((err) => {
        if (!active) return
        setState({ status: 'error', cases: [], error: err, scanned: 0, analysisType })
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey])

  const { status, cases, error, scanned } = state
  const cell = compact ? 'px-4 py-3' : 'px-6 py-3'

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className={`${compact ? 'px-4' : 'px-6'} py-4 border-b border-slate-700 flex items-center justify-between gap-3`}>
        <div>
          <h3 className="text-slate-200 font-semibold">Similar Cases</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Matched from the Centralized Specimen Record Management catalogue
            {analysisType ? ` — ${analysisType} records` : ''}
          </p>
        </div>
        {status === 'ready' && cases.length > 0 && (
          <span className="text-[10px] uppercase tracking-wider text-slate-500 whitespace-nowrap">
            {cases.length} of {scanned} scanned
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="px-6 py-8 text-slate-500 text-sm flex items-center gap-3">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Searching the specimen catalogue…
        </div>
      )}

      {status === 'error' && (
        <div className="px-6 py-6 text-sm text-amber-300/80">
          Specimen catalogue unavailable — similar cases could not be loaded.
          {error?.message ? <span className="block text-slate-500 text-xs mt-1">{error.message}</span> : null}
        </div>
      )}

      {status === 'ready' && cases.length === 0 && (
        <div className="px-6 py-8 text-slate-500 text-sm">
          No comparable specimens found in the catalogue for this
          {analysisType ? ` ${analysisType.toLowerCase()}` : ''} analysis.
        </div>
      )}

      {status === 'ready' && cases.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className={`text-left ${cell} text-slate-400 font-medium`}>Case ID</th>
                <th className={`text-left ${cell} text-slate-400 font-medium`}>Bones Type</th>
                <th className={`text-left ${cell} text-slate-400 font-medium`}>Location</th>
                <th className={`text-left ${cell} text-slate-400 font-medium`}>Date</th>
                <th className={`text-left ${cell} text-slate-400 font-medium`}>Match</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((r) => (
                <tr
                  key={r.caseId}
                  title={r.reasons.join(' · ')}
                  className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors"
                >
                  <td className={`${cell} text-slate-300`}>
                    <span className="font-mono text-xs text-orange-400">{r.caseId}</span>
                    {r.skeletonCode && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{r.skeletonCode}</span>
                    )}
                  </td>
                  <td className={`${cell} text-slate-300`}>
                    {r.bonesType}
                    {r.side && r.side !== 'Not Applicable' && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{r.side}</span>
                    )}
                  </td>
                  <td className={`${cell} text-slate-300`}>
                    {r.location}
                    {r.district && r.district !== r.location && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{r.district}</span>
                    )}
                  </td>
                  <td className={`${cell} text-slate-300`}>
                    {r.foundDate}
                    {r.timePeriod && (
                      <span className="block text-[10px] text-slate-500 mt-0.5">{r.timePeriod}</span>
                    )}
                  </td>
                  <td className={cell}>
                    <MatchBadge value={r.match} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
