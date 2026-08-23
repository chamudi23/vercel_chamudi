/**
 * KgcAgeDistribution.jsx
 * ======================
 * Age profile of the Centralized Specimen Record Management (CSRM) specimens
 * that were scanned for this analysis, with the analysis's own age estimate
 * marked against it.
 *
 * ── What this chart is, and is not ──────────────────────────────────────
 * It is a REFERENCE DISTRIBUTION: of the catalogued specimens of the same
 * skeletal element, how old were they at death? Its purpose is to say whether
 * this individual's estimated age is typical of the assemblage or unusual
 * within it. That is the only claim it makes.
 *
 * It is NOT a probability distribution over this individual's age, and the
 * highlighted band is NOT a confidence interval. The subject is excluded from
 * the counts — it is not part of its own reference set.
 *
 * The data is the `ageDistribution` computed by lib/similarCases.js from the
 * specimen rows already fetched for matching, so this chart costs no query of
 * its own.
 *
 * Props
 *   distribution   `ageDistribution` from findSimilarCases()
 *   analysisType   e.g. 'Upper Limb' — names the element pool in the caption
 *   loading        panel is still fetching
 */

import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const POPULATION_FILL = '#64748B' // slate-500 — the reference assemblage
const ESTIMATE_FILL = '#F97316' // orange-500 — bands this estimate touches

function Frame({ children }) {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">{children}</div>
  )
}

function Heading({ analysisType }) {
  return (
    <>
      <h3 className="text-slate-200 font-semibold">Age Distribution</h3>
      <p className="text-slate-500 text-xs mt-0.5">
        Age at death of catalogued
        {analysisType ? ` ${analysisType.toLowerCase()}` : ''} specimens — the reference
        assemblage this analysis is being read against
      </p>
    </>
  )
}

export default function KgcAgeDistribution({ distribution, analysisType = '', loading = false }) {
  if (loading) {
    return (
      <Frame>
        <Heading analysisType={analysisType} />
        <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
          Reading the specimen catalogue…
        </div>
      </Frame>
    )
  }

  const counted = distribution?.counted || 0

  // No usable ages means no chart. Drawing empty axes would imply a measured
  // result of zero, which is not what an absence of records means.
  if (!distribution || counted === 0) {
    return (
      <Frame>
        <Heading analysisType={analysisType} />
        <div className="h-64 flex items-center justify-center text-center px-6">
          <p className="text-slate-500 text-sm">
            No age estimates are recorded for the
            {analysisType ? ` ${analysisType.toLowerCase()}` : ''} specimens in the catalogue,
            so there is no reference distribution to compare against.
            {distribution?.total ? ` (${distribution.total} specimens scanned.)` : ''}
          </p>
        </div>
      </Frame>
    )
  }

  const { bands, unknown, vague = 0, total, hasEstimate, estimateBands } = distribution

  // Everything not plotted, named rather than quietly absent.
  const excluded = []
  if (unknown > 0) excluded.push(`${unknown} with no recorded age`)
  if (vague > 0) excluded.push(`${vague} recorded only as a broad category such as "Adult"`)

  return (
    <Frame>
      <Heading analysisType={analysisType} />

      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bands} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="ageGroup" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: '#374151', opacity: 0.4 }}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6',
              }}
              formatter={(value, _name, item) => [
                `${value} specimen${value === 1 ? '' : 's'}`,
                item?.payload?.isEstimate ? 'Catalogue — estimate falls here' : 'Catalogue',
              ]}
            />
            {/* No entry animation: this is a report figure, so it must be fully
                drawn the moment it renders — for printing, PDF capture and
                screenshots alike, not only after a transition has played. */}
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false}>
              {bands.map((b) => (
                <Cell key={b.ageGroup} fill={b.isEstimate ? ESTIMATE_FILL : POPULATION_FILL} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + provenance. The counts a reader needs in order to judge how
          much weight the chart deserves are stated, not implied. */}
      <div className="mt-4 pt-3 border-t border-slate-700/70 space-y-1.5">
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: POPULATION_FILL }} />
            Catalogued specimens
          </span>
          {hasEstimate && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ESTIMATE_FILL }} />
              Band(s) this analysis&apos;s estimate falls in
              {estimateBands.length ? ` — ${estimateBands.join(', ')}` : ''}
            </span>
          )}
        </div>

        <p className="text-slate-500 text-[11px]">
          Based on {counted} of {total} scanned specimen{total === 1 ? '' : 's'} whose recorded age
          is specific enough to place in a band
          {excluded.length ? `; excluded: ${excluded.join(', ')}` : ''}. Each counted specimen
          appears exactly once.
        </p>

        {!hasEstimate && (
          <p className="text-amber-300/70 text-[11px]">
            This analysis produced no age estimate, so no band is highlighted.
          </p>
        )}

        <p className="text-slate-600 text-[11px]">
          Reference distribution only — it describes the assemblage, not the probability of this
          individual&apos;s age.
        </p>
      </div>
    </Frame>
  )
}
