/* ------------------------------------------------------------------ *
 *  Aggregates over saved analyses.
 *
 *  Kept in one place so that every screen summarising the same records
 *  quotes the same number. The module landing page and the Dashboard both
 *  show mean confidence; before this they computed it separately, and the
 *  landing page had drifted to a hardcoded figure.
 * ------------------------------------------------------------------ */

/**
 * Mean prediction confidence across the given analyses, to one decimal.
 *
 * Records with no usable confidence are skipped rather than counted as
 * zero, which would drag the mean down the moment one analysis was saved
 * without a prediction.
 *
 * @param   {Array<{predictions?: {confidence?: string|number}}>} analyses
 * @returns {string} e.g. `'90.5'`. `'0.0'` when nothing carries a value.
 */
export function averageConfidence(analyses = []) {
  const values = (analyses || [])
    .map((a) => parseFloat(String(a?.predictions?.confidence).replace('%', '')))
    .filter((n) => !isNaN(n));

  if (!values.length) return '0.0';
  return (values.reduce((sum, n) => sum + n, 0) / values.length).toFixed(1);
}
