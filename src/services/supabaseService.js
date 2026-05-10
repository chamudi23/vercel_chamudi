/**
 * supabaseService.js
 * Centralised Supabase database operations for the KGC Skeletal Analysis module.
 *
 * All functions return { data, error } so callers can handle success/failure.
 * Field names are mapped from frontend camelCase → database snake_case here
 * so the rest of the app never needs to know about DB column names.
 */

import { supabase } from '../supabase';

// ─── Investigators ──────────────────────────────────────────────────────────

/**
 * Find an existing investigator by email, or create a new one.
 * Returns the investigator row (with id).
 */
export async function upsertInvestigator(name, email) {
  if (!email) return { data: null, error: null }; // email is optional in the form

  // Try to find existing
  const { data: existing, error: fetchErr } = await supabase
    .from('kgc_investigators')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (fetchErr) return { data: null, error: fetchErr };
  if (existing) return { data: existing, error: null };

  // Create new
  const { data: created, error: insertErr } = await supabase
    .from('kgc_investigators')
    .insert({ name, email, role: 'analyst' })
    .select()
    .single();

  return { data: created, error: insertErr };
}

// ─── Cases ──────────────────────────────────────────────────────────────────

/**
 * Insert a new case into kgc_cases.
 * @param {Object} params
 * @param {string} params.caseId        – KGC-YYYYMMDD-XXXX
 * @param {string|null} params.investigatorId – UUID from kgc_investigators
 * @param {string} params.boneType      – e.g. 'Skull'
 * @param {string} params.location
 * @param {string} params.dateFound     – YYYY-MM-DD
 * @param {string} params.analysisDate  – YYYY-MM-DD
 * @param {string} [params.notes]
 */
export async function saveCase({
  caseId,
  investigatorId,
  boneType,
  location,
  dateFound,
  analysisDate,
  notes,
}) {
  const { data, error } = await supabase
    .from('kgc_cases')
    .insert({
      case_id: caseId,
      investigator_id: investigatorId || null,
      bone_type: boneType,
      location,
      date_found: dateFound,
      analysis_date: analysisDate,
      status: 'in_progress',
      notes: notes || null,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update the status of a case (e.g. 'completed').
 */
export async function updateCaseStatus(caseId, status) {
  const { data, error } = await supabase
    .from('kgc_cases')
    .update({ status })
    .eq('case_id', caseId)
    .select()
    .single();

  return { data, error };
}

/**
 * Fetch all cases, ordered by newest first.
 */
export async function fetchAllCases() {
  const { data, error } = await supabase
    .from('kgc_cases')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Fetch the N most recent cases.
 */
export async function fetchRecentCases(limit = 5) {
  const { data, error } = await supabase
    .from('kgc_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}

/**
 * Fetch cases with the same bone type (for "Similar Cases").
 */
export async function fetchSimilarCases(boneType, excludeCaseId, limit = 5) {
  let query = supabase
    .from('kgc_cases')
    .select('*')
    .eq('bone_type', boneType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (excludeCaseId) {
    query = query.neq('case_id', excludeCaseId);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

// ─── Measurements ───────────────────────────────────────────────────────────

/**
 * Save measurements to the correct bone-type table.
 * Automatically maps camelCase keys → snake_case columns.
 */
export async function saveMeasurements(caseId, boneType, measurements) {
  const tableMap = {
    Skull: 'kgc_skull_measurements',
    Pelvis: 'kgc_pelvis_measurements',
    'Lower Limb': 'kgc_limb_measurements',
    'Upper Limb': 'kgc_limb_measurements',
    Thorax: 'kgc_thorax_measurements',
    Teeth: 'kgc_teeth_measurements',
  };

  const table = tableMap[boneType];
  if (!table) return { data: null, error: { message: `Unknown bone type: ${boneType}` } };

  let row = { case_id: caseId };

  switch (boneType) {
    case 'Skull':
      row.brow_ridge = measurements.browRidge || null;
      row.mastoid_size = measurements.mastoidSize || null;
      row.jaw_shape = measurements.jawShape || null;
      row.cranial_suture = measurements.cranialSuture || null;
      break;

    case 'Pelvis':
      row.subpubic_angle = measurements.subpubicAngle || null;
      row.sciatic_notch = measurements.sciaticNotch || null;
      row.pubic_symphysis = measurements.pubicSymphysis || null;
      break;

    case 'Lower Limb':
      row.limb_type = 'lower';
      row.femur_length = measurements.femurLength ? parseFloat(measurements.femurLength) : null;
      row.femur_head_diameter = measurements.femurHeadDiameter ? parseFloat(measurements.femurHeadDiameter) : null;
      row.growth_plate = measurements.growthPlate || null;
      break;

    case 'Upper Limb':
      row.limb_type = 'upper';
      row.humerus_length = measurements.humerusLength ? parseFloat(measurements.humerusLength) : null;
      row.bone_robusticity = measurements.boneRobusticity || null;
      break;

    case 'Thorax':
      row.rib_shape = measurements.ribShape || null;
      row.sternum_length = measurements.sternumLength ? parseFloat(measurements.sternumLength) : null;
      break;

    case 'Teeth':
      row.teeth_type = measurements.teethType || null;
      row.dental_wear = measurements.dentalWear || null;
      row.eruption_stage = measurements.eruptionStage || null;
      break;
  }

  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();

  return { data, error };
}

// ─── Predictions ────────────────────────────────────────────────────────────

/**
 * Save a prediction result to kgc_predictions.
 * @param {string} caseId
 * @param {Object} predictions – { gender, ageRange, height, confidence }
 * @param {string} [formulaUsed] – e.g. 'Trotter & Gleser Mongoloid Male'
 */
export async function savePrediction(caseId, predictions, formulaUsed) {
  // confidence comes as "85.0%" — strip the % sign
  const confNum = parseFloat(String(predictions.confidence).replace('%', ''));

  const { data, error } = await supabase
    .from('kgc_predictions')
    .insert({
      case_id: caseId,
      predicted_sex: predictions.gender || 'Indeterminate',
      age_range: predictions.ageRange || null,
      estimated_height: predictions.height || null,
      confidence: isNaN(confNum) ? 0 : confNum,
      methodology: 'Bass 2005',
      formula_used: formulaUsed || null,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Fetch all predictions (for dashboard aggregation).
 */
export async function fetchAllPredictions() {
  const { data, error } = await supabase
    .from('kgc_predictions')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

// ─── Dashboard Aggregation ──────────────────────────────────────────────────

/**
 * Fetch summary statistics for the dashboard.
 */
export async function fetchDashboardStats() {
  // Total cases
  const { count: totalCases } = await supabase
    .from('kgc_cases')
    .select('*', { count: 'exact', head: true });

  // Completed cases
  const { count: completedCases } = await supabase
    .from('kgc_cases')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Total predictions
  const { data: predictions } = await supabase
    .from('kgc_predictions')
    .select('predicted_sex, confidence, age_range')
    .order('created_at', { ascending: false });

  // Avg confidence
  const avgConfidence = predictions && predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + Number(p.confidence), 0) / predictions.length).toFixed(1)
    : '0.0';

  // Last prediction sex
  const lastPrediction = predictions && predictions.length > 0
    ? predictions[0].predicted_sex
    : '—';

  // Gender distribution
  const genderCounts = { Male: 0, Female: 0, Indeterminate: 0 };
  (predictions || []).forEach((p) => {
    if (genderCounts[p.predicted_sex] !== undefined) genderCounts[p.predicted_sex]++;
  });

  // Age distribution
  const ageBuckets = { '0-18': 0, '19-30': 0, '31-40': 0, '41-50': 0, '51+': 0 };
  (predictions || []).forEach((p) => {
    const range = p.age_range || '';
    if (range.includes('<') || range.includes('6') || range.includes('12') || range.includes('18')) ageBuckets['0-18']++;
    else if (range.includes('20') || range.includes('25') || range.includes('30')) ageBuckets['19-30']++;
    else if (range.includes('35') || range.includes('40')) ageBuckets['31-40']++;
    else if (range.includes('45') || range.includes('50')) ageBuckets['41-50']++;
    else if (range.includes('55') || range.includes('+')) ageBuckets['51+']++;
  });

  return {
    totalCases: totalCases || 0,
    completedCases: completedCases || 0,
    avgConfidence,
    lastPrediction,
    genderData: [
      { name: 'Male', value: genderCounts.Male },
      { name: 'Female', value: genderCounts.Female },
    ],
    ageData: Object.entries(ageBuckets).map(([ageGroup, count]) => ({ ageGroup, count })),
  };
}
