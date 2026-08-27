/* ------------------------------------------------------------------ *
 *  Normalised KGC case records — Supabase persistence
 *
 *  analysisStore.js keeps the whole analysis as three JSONB blobs in the
 *  `analyses` table; that is what the dashboard, Past Analysis and the
 *  report read. This module writes the SAME analysis out a second time,
 *  normalised across the relational schema in kgc_database_schema.sql:
 *
 *    kgc_investigators        one row per investigator (keyed by email)
 *    kgc_cases                one row per case_id
 *    kgc_*_measurements       one row per case_id, table by bone type
 *    kgc_predictions          one row per prediction run (audit trail)
 *
 *  Those tables stopped being written when the parallel supabaseService
 *  layer was removed (commit 74eb0d4), which is why `analyses` kept
 *  growing while every kgc_* table stayed frozen at that date. Writing
 *  from here means one save keeps both representations in step.
 *
 *  Every write is an upsert keyed on case_id, so re-generating a report
 *  for the same case updates the row instead of failing on the primary
 *  key — the old insert-only service errored out on the second attempt.
 *  kgc_predictions is the exception: it is an audit trail by design, so
 *  each run appends a row.
 *
 *  The camelCase → snake_case mapping lives in kgcCaseMapping.js, shared
 *  with scripts/backfillKgcTables.mjs so the two cannot diverge.
 * ------------------------------------------------------------------ */

import { supabase } from './skeletalSupabase';
import {
  MEASUREMENT_TABLES,
  boneTypeOf,
  caseRow,
  describeGap,
  measurementRow,
  predictionRow,
  txt,
} from './kgcCaseMapping';

/** The signed-in account's email, or null when there is no session. */
async function accountEmail() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Find the investigator row for an email, creating it if absent.
 *
 * Deliberately select-then-insert rather than upsert: kgc_investigators
 * has INSERT and SELECT policies but no UPDATE policy, so an upsert that
 * hit the unique email would be refused by RLS.
 *
 * @returns {Promise<string|null>} the investigator UUID, or null when
 *   there is no email to key on (investigator_id is nullable).
 */
async function resolveInvestigatorId(name, email) {
  if (!email) return null;

  const { data: found, error: findErr } = await supabase
    .from('kgc_investigators')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (findErr) throw findErr;
  if (found) return found.id;

  const { data: created, error: insertErr } = await supabase
    .from('kgc_investigators')
    .insert({ name: name || email.split('@')[0], email, role: 'analyst' })
    .select('id')
    .single();

  if (insertErr) {
    // Another tab may have created the same investigator between the two
    // statements. Re-read before giving up.
    const { data: retry } = await supabase
      .from('kgc_investigators')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (retry) return retry.id;
    throw insertErr;
  }
  return created.id;
}

/**
 * Mirror one analysis into the normalised kgc_* tables.
 *
 * @param {Object} record { caseId, basicInfo, measurements, predictions }
 * @returns {Promise<{ error: Error|null }>}
 */
export async function saveKgcCase(record) {
  const basicInfo = record?.basicInfo || {};
  const measurements = record?.measurements || {};
  const predictions = record?.predictions || {};

  const caseId = record?.caseId || basicInfo.caseId;
  const boneType = boneTypeOf(basicInfo, measurements);

  // location / dateFound / bonesType are all required fields in Step 1, so
  // a gap here means the wizard state was lost rather than mis-entered.
  const gap = describeGap(caseId, basicInfo, measurements);
  if (gap) return { error: new Error(gap) };

  try {
    // Prefer the account email over the free-text one in Step 1, for the
    // same reason the investigator name is taken from the account: a case
    // must not be filed against someone else's identity.
    const email = (await accountEmail()) || txt(basicInfo.email);
    const investigatorId = await resolveInvestigatorId(basicInfo.userName, email);

    const { error: caseErr } = await supabase
      .from('kgc_cases')
      .upsert(caseRow(caseId, basicInfo, boneType, investigatorId), { onConflict: 'case_id' });
    if (caseErr) throw caseErr;

    const { error: measureErr } = await supabase
      .from(MEASUREMENT_TABLES[boneType])
      .upsert(measurementRow(caseId, boneType, measurements), { onConflict: 'case_id' });
    if (measureErr) throw measureErr;

    const { error: predictErr } = await supabase
      .from('kgc_predictions')
      .insert(predictionRow(caseId, boneType, predictions));
    if (predictErr) throw predictErr;

    return { error: null };
  } catch (err) {
    console.error('[kgc] normalised save failed:', err?.message || err);
    return { error: err instanceof Error ? err : new Error(err?.message || String(err)) };
  }
}
