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
 * ------------------------------------------------------------------ */

import { supabase } from './skeletalSupabase';

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

/** Insert or update an analysis (keyed by case_id). Returns { error }. */
export async function saveAnalysis(record) {
  if (!record?.caseId) return { error: new Error('missing caseId') };
  const row = {
    case_id: record.caseId,
    basic_info: record.basicInfo || {},
    measurements: record.measurements || {},
    predictions: record.predictions || {},
  };
  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'case_id' });
  if (error) console.error('[analyses] save failed:', error.message);
  return { error };
}
