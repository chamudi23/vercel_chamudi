/* ------------------------------------------------------------------ *
 *  Analysis record → normalised kgc_* rows
 *
 *  Pure mapping only: no Supabase import, no import.meta.env, so this
 *  runs unchanged in the browser (kgcCaseStore.js) and under plain Node
 *  (scripts/backfillKgcTables.mjs). Both paths therefore write the same
 *  columns from the same input and cannot drift apart.
 *
 *  The camelCase keys come from the Step 1 / Step 2 forms; the snake_case
 *  columns and their CHECK vocabularies come from kgc_database_schema.sql.
 * ------------------------------------------------------------------ */

/** Bone type → the measurement table that holds its fields. */
export const MEASUREMENT_TABLES = {
  Skull: 'kgc_skull_measurements',
  Pelvis: 'kgc_pelvis_measurements',
  'Lower Limb': 'kgc_limb_measurements',
  'Upper Limb': 'kgc_limb_measurements',
  Thorax: 'kgc_thorax_measurements',
  Teeth: 'kgc_teeth_measurements',
};

/** Recorded in kgc_predictions.formula_used — see computePredictions(). */
export const FORMULA_USED = {
  Skull: 'Cranial morphoscopic traits (Bass 2005)',
  Pelvis: 'Innominate morphoscopic traits (Bass 2005)',
  'Lower Limb': 'Trotter & Gleser femur (2.15 x cm + 72.57)',
  'Upper Limb': 'Trotter & Gleser humerus (2.68 x cm + 83.19)',
  Thorax: 'Rib sternal end morphology (Bass 2005)',
  Teeth: 'Dental development & wear (Bass 2005)',
};

/** '' / undefined → null, so CHECK constraints see NULL rather than ''. */
export const txt = (v) => (v === '' || v === undefined || v === null ? null : v);

/** Form numbers arrive as strings; the columns CHECK for > 0 or NULL. */
export const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** The bone type a record is filed under, from wherever it was recorded. */
export function boneTypeOf(basicInfo = {}, measurements = {}) {
  return basicInfo.bonesType || measurements.bonesType || null;
}

/**
 * Why a record cannot be normalised, or null when it can.
 * kgc_cases declares location and date_found NOT NULL, and bone_type is a
 * CHECK against the six known types.
 */
export function describeGap(caseId, basicInfo = {}, measurements = {}) {
  if (!caseId) return 'missing caseId';
  const boneType = boneTypeOf(basicInfo, measurements);
  if (!MEASUREMENT_TABLES[boneType]) return `unknown bone type: ${boneType || '(none)'}`;
  if (!basicInfo.location) return 'kgc_cases needs a location';
  if (!basicInfo.dateFound) return 'kgc_cases needs a dateFound';
  return null;
}

/** The kgc_cases row. `investigatorId` may be null — the column is nullable. */
export function caseRow(caseId, basicInfo, boneType, investigatorId) {
  const row = {
    case_id: caseId,
    investigator_id: investigatorId || null,
    bone_type: boneType,
    location: basicInfo.location,
    date_found: basicInfo.dateFound,
    status: 'completed',
  };
  // Left out when unset so the column default (CURRENT_DATE) applies.
  if (basicInfo.analysisDate) row.analysis_date = basicInfo.analysisDate;
  return row;
}

/** The measurement row for a bone type, mapped camelCase → snake_case. */
export function measurementRow(caseId, boneType, m = {}) {
  const row = { case_id: caseId };
  switch (boneType) {
    case 'Skull':
      return {
        ...row,
        brow_ridge: txt(m.browRidge),
        mastoid_size: txt(m.mastoidSize),
        jaw_shape: txt(m.jawShape),
        cranial_suture: txt(m.cranialSuture),
      };
    case 'Pelvis':
      return {
        ...row,
        subpubic_angle: txt(m.subpubicAngle),
        sciatic_notch: txt(m.sciaticNotch),
        pubic_symphysis: txt(m.pubicSymphysis),
      };
    case 'Lower Limb':
      return {
        ...row,
        limb_type: 'lower',
        femur_length: num(m.femurLength),
        femur_head_diameter: num(m.femurHeadDiameter),
        growth_plate: txt(m.growthPlate),
      };
    case 'Upper Limb':
      return {
        ...row,
        limb_type: 'upper',
        humerus_length: num(m.humerusLength),
        bone_robusticity: txt(m.boneRobusticity),
      };
    case 'Thorax':
      return {
        ...row,
        rib_shape: txt(m.ribShape),
        sternum_length: num(m.sternumLength),
      };
    case 'Teeth':
      return {
        ...row,
        teeth_type: txt(m.teethType),
        dental_wear: txt(m.dentalWear),
        eruption_stage: txt(m.eruptionStage),
      };
    default:
      return null;
  }
}

/** The kgc_predictions row. Confidence arrives as "85.0%". */
export function predictionRow(caseId, boneType, predictions = {}) {
  const confidence = parseFloat(String(predictions.confidence).replace('%', ''));
  return {
    case_id: caseId,
    predicted_sex: predictions.gender || 'Indeterminate',
    age_range: txt(predictions.ageRange),
    estimated_height: txt(predictions.height),
    confidence: Number.isFinite(confidence) ? confidence : 0,
    methodology: 'Bass 2005',
    formula_used: FORMULA_USED[boneType] || null,
  };
}
