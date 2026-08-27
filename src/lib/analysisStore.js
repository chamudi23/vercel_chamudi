/* ------------------------------------------------------------------ *
 *  Saved skeletal analyses — Supabase persistence
 *
 *  All analyses live in the Supabase `analyses` table (see
 *  kgc_supabase_setup.sql). Nothing is stored in the browser, so the
 *  case list and every report are shared across devices and survive
 *  a refresh / cache clear.
 *
 *  Table shape:
 *    case_id text primary key
 *    basic_info   jsonb
 *    measurements jsonb
 *    predictions  jsonb
 *    created_at   timestamptz
 *
 *  Saving also mirrors the analysis into the normalised kgc_* tables via
 *  kgcCaseStore — see the note there. Reads stay on `analyses`, which is
 *  the shape every screen in the module already expects.
 * ------------------------------------------------------------------ */

import { supabase } from './skeletalSupabase';
import { saveKgcCase } from './kgcCaseStore';

const TABLE = 'analyses';
const COLS = 'case_id, basic_info, measurements, predictions, created_at';

function rowToRecord(r) {
  return {
    caseId: r.case_id,
    savedAt: r.created_at,
    basicInfo: r.basic_info || {},
    measurements: r.measurements || {},
    predictions: r.predictions || {},
  };
}

/** All saved analyses, newest first. Returns [] on error. */
export async function getAllAnalyses() {
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[analyses] load failed:', error.message);
    return [];
  }
  return (data || []).map(rowToRecord);
}

/** A single saved analysis by case id, or null. */
export async function getAnalysis(caseId) {
  if (!caseId) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq('case_id', caseId)
    .maybeSingle();
  if (error) {
    console.error('[analyses] fetch failed:', error.message);
    return null;
  }
  return data ? rowToRecord(data) : null;
}

/**
 * Insert or update an analysis (keyed by case_id).
 *
 * Writes `analyses` first, then mirrors the same record into the kgc_*
 * tables. The mirror is reported separately because it is not what any
 * screen reads: a case whose normalised rows failed is still fully usable
 * in the app, so blocking the report on it would cost the user their work
 * for no gain. Callers should surface `kgcError` as a warning.
 *
 * @returns {Promise<{ error: Error|null, kgcError: Error|null }>}
 */
export async function saveAnalysis(record) {
  if (!record?.caseId) return { error: new Error('missing caseId'), kgcError: null };
  const row = {
    case_id: record.caseId,
    basic_info: record.basicInfo || {},
    measurements: record.measurements || {},
    predictions: record.predictions || {},
  };
  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'case_id' });
  if (error) {
    console.error('[analyses] save failed:', error.message);
    return { error, kgcError: null };
  }

  const { error: kgcError } = await saveKgcCase(record);
  return { error: null, kgcError };
}
