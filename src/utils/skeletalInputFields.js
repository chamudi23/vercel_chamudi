export const SKELETAL_INPUT_FIELD_DEFINITIONS = {
  Skull: [
    { field: 'skull_brow_ridge', label: 'Brow Ridge', type: 'select', options: ['Smooth', 'Less Developed', 'Moderate', 'Prominent', 'Thick'] },
    { field: 'mastoid_process_size', label: 'Mastoid Process Size', type: 'select', options: ['<25 mm', '25–30 mm', '>30 mm'] },
    { field: 'cranial_suture_status', label: 'Cranial Suture Status', type: 'select', options: ['Open', 'Partially Open', 'Moderately Closed', 'Mostly Closed', 'Completely Closed'] },
    { field: 'skull_size', label: 'Skull Size', type: 'text' },
    { field: 'orbital_shape', label: 'Orbital Shape', type: 'text' },
  ],
  Mandible: [
    { field: 'jaw_shape', label: 'Jaw Shape', type: 'select', options: ['U-shaped', 'V-shaped', 'Robust Jaw', 'Rounded Jaw'] },
  ],
  Pelvis: [
    { field: 'subpubic_angle', label: 'Subpubic Angle', type: 'select', options: ['Wide >90°', 'Narrow <90°'] },
    { field: 'sciatic_notch_width', label: 'Sciatic Notch Width', type: 'select', options: ['Wide', 'Narrow'] },
    { field: 'pelvic_inlet_shape', label: 'Pelvic Inlet Shape', type: 'select', options: ['Gynecoid (Round or slightly oval)', 'Android (Heart shaped or wedge shaped)', 'Anthropoid (Upright oval or egg-shaped)', 'Platypelloid (Flattened oval)'] },
    { field: 'pubic_symphysis_stage', label: 'Pubic Symphysis Stage', type: 'select', options: ['Smooth / Flat', 'Moderate / Flat Ridges', 'Rough / Granular', 'Degenerated / Eroded'] },
    { field: 'pelvis_size', label: 'Pelvis Size', type: 'text' },
  ],
  Pubis: [
    { field: 'subpubic_angle', label: 'Subpubic Angle', type: 'select', options: ['Wide >90°', 'Narrow <90°'] },
    { field: 'sciatic_notch_width', label: 'Sciatic Notch Width', type: 'select', options: ['Wide', 'Narrow'] },
    { field: 'pelvic_inlet_shape', label: 'Pelvic Inlet Shape', type: 'select', options: ['Gynecoid (Round or slightly oval)', 'Android (Heart shaped or wedge shaped)', 'Anthropoid (Upright oval or egg-shaped)', 'Platypelloid (Flattened oval)'] },
    { field: 'pubic_symphysis_stage', label: 'Pubic Symphysis Stage', type: 'select', options: ['Smooth / Flat', 'Moderate / Flat Ridges', 'Rough / Granular', 'Degenerated / Eroded'] },
    { field: 'pelvis_size', label: 'Pelvis Size', type: 'text' },
  ],
  Humerus: [
    { field: 'humerus_length', label: 'Humerus Length', type: 'number', unit: 'mm' },
    { field: 'humerus_head_diameter', label: 'Humerus Head Diameter', type: 'number', unit: 'mm' },
    { field: 'upper_limb_robusticity', label: 'Upper Limb Robusticity', type: 'select', options: ['Robust', 'Gracile'] },
    { field: 'growth_plate', label: 'Growth Plate', type: 'select', options: ['Fused', 'Partially Fused', 'Unfused'] },
  ],
  Femur: [
    { field: 'femur_length', label: 'Femur Length', type: 'number', unit: 'mm' },
    { field: 'femur_head_diameter', label: 'Femur Head Diameter', type: 'number', unit: 'mm' },
    { field: 'lower_limb_robusticity', label: 'Lower Limb Robusticity', type: 'select', options: ['Robust', 'Gracile'] },
    { field: 'growth_plate', label: 'Growth Plate', type: 'select', options: ['Fused', 'Partially Fused', 'Unfused'] },
  ],
  Tibia: [],
  Fibula: [],
  Rib: [
    { field: 'rib_shape', label: 'Rib Shape', type: 'select', options: ['Smooth Edges', 'Scalloped Edges', 'Irregular / Porous'] },
  ],
  Sternum: [
    { field: 'sternum_length', label: 'Sternum Length', type: 'number', unit: 'mm' },
    { field: 'thoracic_size', label: 'Thoracic Size', type: 'text' },
  ],
  Incisor: [
    { field: 'teeth_type', label: 'Tooth Type', type: 'hidden' },
    { field: 'tooth_eruption_stage', label: 'Tooth Eruption Stage', type: 'select', options: ['Early', 'Partial', 'Complete'] },
    { field: 'dental_wear', label: 'Dental Wear', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
  ],
  Canine: [
    { field: 'teeth_type', label: 'Tooth Type', type: 'hidden' },
    { field: 'tooth_eruption_stage', label: 'Tooth Eruption Stage', type: 'select', options: ['Early', 'Partial', 'Complete'] },
    { field: 'dental_wear', label: 'Dental Wear', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
  ],
  Premolar: [
    { field: 'teeth_type', label: 'Tooth Type', type: 'hidden' },
    { field: 'tooth_eruption_stage', label: 'Tooth Eruption Stage', type: 'select', options: ['Early', 'Partial', 'Complete'] },
    { field: 'dental_wear', label: 'Dental Wear', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
  ],
  Molar: [
    { field: 'teeth_type', label: 'Tooth Type', type: 'hidden' },
    { field: 'tooth_eruption_stage', label: 'Tooth Eruption Stage', type: 'select', options: ['Early', 'Partial', 'Complete'] },
    { field: 'dental_wear', label: 'Dental Wear', type: 'select', options: ['Mild', 'Moderate', 'Severe'] },
  ],
  Clavicle: [
    { field: 'clavicle_robusticity', label: 'Clavicle Robusticity', type: 'select', options: ['Robust', 'Gracile'] },
  ],
};

export function getRelevantSkeletalInputFields(boneType) {
  if (!boneType) return [];
  const defs = SKELETAL_INPUT_FIELD_DEFINITIONS[boneType] || [];
  return defs.map((definition) => ({ ...definition }));
}

export function buildSkeletalInputPayload(boneType, values = {}) {
  const fields = getRelevantSkeletalInputFields(boneType);
  if (!fields.length) return {};

  const payload = {};
  fields.forEach(({ field, type }) => {
    if (!field || type === 'hidden') return;
    const rawValue = values[field];
    if (rawValue === null || rawValue === undefined || rawValue === '') return;
    if (type === 'number') {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) return;
      payload[field] = numericValue;
      return;
    }
    payload[field] = String(rawValue).trim();
  });

  if (['Incisor', 'Canine', 'Premolar', 'Molar'].includes(boneType)) {
    const toothTypeValue = boneType;
    if (toothTypeValue) payload.teeth_type = toothTypeValue;
  }

  return payload;
}

export function keepRelevantSkeletalValues(boneType, existing = {}) {
  if (!boneType) return { ...existing };
  const relevantFields = new Set(
    getRelevantSkeletalInputFields(boneType).map((field) => field.field).filter(Boolean),
  );
  const output = { ...existing };
  Object.keys(output).forEach((key) => {
    if (!relevantFields.has(key)) {
      delete output[key];
    }
  });
  if (['Incisor', 'Canine', 'Premolar', 'Molar'].includes(boneType)) {
    output.teeth_type = boneType;
  }
  return output;
}

export function normalizeSkeletalInputValue(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  return value;
}

function measurementValueInCm(value, unit) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return null;
  if (unit === 'mm') return numericValue / 10;
  if (unit === 'm') return numericValue * 100;
  return numericValue;
}

export function buildSpecimenDimensionPayload(measurements = []) {
  const payload = {};
  const dimensionTypes = {
    length_cm: new Set(['Maximum Length', 'Minimum Length', 'Height']),
    width_cm: new Set(['Maximum Width', 'Minimum Width', 'Maximum Diameter', 'Minimum Diameter']),
    thickness_cm: new Set(['Thickness']),
  };

  measurements.forEach((measurement) => {
    const measurementType = String(measurement.measurement_type || '').trim();
    Object.entries(dimensionTypes).some(([column, types]) => {
      if (!types.has(measurementType) || payload[column] !== undefined) return false;
      const value = measurementValueInCm(measurement.value, measurement.unit);
      if (value !== null) payload[column] = value;
      return value !== null;
    });
  });

  return payload;
}
