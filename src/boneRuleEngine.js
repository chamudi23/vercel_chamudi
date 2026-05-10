// ─────────────────────────────────────────────────────────────
// OAHRIS — Human Bone Identification Rule Engine
// IT22159908 — Minuri
// ─────────────────────────────────────────────────────────────

// Standard human osteometric ranges (in mm)
const HUMAN_SIZE_RANGES = {
  "Femur": { min: 380, max: 550 },
  "Tibia": { min: 300, max: 450 },
  "Fibula": { min: 290, max: 430 },
  "Humerus": { min: 260, max: 380 },
  "Humerus (Distal End)": { min: 50, max: 90 },
  "Radius": { min: 200, max: 310 },
  "Ulna": { min: 220, max: 330 },
  "Skull": { min: 130, max: 200 },
  "Mandible (Left)": { min: 80, max: 130 },
  "Mandible (Right)": { min: 80, max: 130 },
  "Maxilla (Left)": { min: 50, max: 90 },
  "Maxilla (Right)": { min: 50, max: 90 },
  "Calcaneum (Left)": { min: 60, max: 90 },
  "Calcaneum (Right)": { min: 60, max: 90 },
  "Astragalus (Left)": { min: 50, max: 75 },
  "Astragalus (Right)": { min: 50, max: 75 },
  "Patella": { min: 35, max: 55 },
  "Clavicle": { min: 120, max: 190 },
  "Scapula": { min: 130, max: 190 },
  "Metacarpal": { min: 40, max: 85 },
  "Metatarsal": { min: 50, max: 90 },
  "Pelvis": { min: 160, max: 250 },
  "Vertebra": { min: 20, max: 50 },
  "Rib": { min: 100, max: 300 },
  "Phalanx (Hand)": { min: 15, max: 50 },
  "Phalanx (Foot)": { min: 20, max: 60 },
};

// Expected shapes per bone type
const HUMAN_SHAPE_MAP = {
  "Femur": ["curved", "cylindrical"],
  "Tibia": ["triangular", "flat"],
  "Skull": ["rounded", "dome-shaped"],
  "Mandible (Left)": ["curved", "U-shaped"],
  "Mandible (Right)": ["curved", "U-shaped"],
  "Maxilla (Left)": ["curved", "flat"],
  "Maxilla (Right)": ["curved", "flat"],
  "Pelvis": ["bowl-shaped", "curved"],
  "Humerus": ["cylindrical", "curved"],
  "Humerus (Distal End)": ["flat", "irregular"],
  "Patella": ["rounded", "oval"],
  "Calcaneum (Left)": ["irregular", "block-shaped"],
  "Calcaneum (Right)": ["irregular", "block-shaped"],
  "Astragalus (Left)": ["rounded", "irregular"],
  "Astragalus (Right)": ["rounded", "irregular"],
  "Vertebra": ["irregular", "ring-shaped"],
  "Rib": ["curved", "flat"],
  "Scapula": ["flat", "triangular"],
  "Clavicle": ["curved", "S-shaped"],
};

// Expected joint surfaces per bone
const JOINT_BONES = [
  "Femur", "Tibia", "Humerus", "Radius", "Ulna",
  "Patella", "Calcaneum (Left)", "Calcaneum (Right)",
  "Astragalus (Left)", "Astragalus (Right)",
  "Pelvis", "Scapula", "Fibula",
];

// ─────────────────────────────────────────────────────────────
// MAIN RULE ENGINE FUNCTION
// Input: measurement object with all fields
// Output: { score, classification, rules }
// ─────────────────────────────────────────────────────────────
export function runBoneRuleEngine(measurement) {
  const results = {
    rule1_size: { name: "Size Range Validation", score: 0, maxScore: 20, passed: false, detail: "" },
    rule2_shape: { name: "Shape Analysis", score: 0, maxScore: 25, passed: false, detail: "" },
    rule3_joint: { name: "Joint Compatibility", score: 0, maxScore: 20, passed: false, detail: "" },
    rule4_surface: { name: "Surface Morphology", score: 0, maxScore: 15, passed: false, detail: "" },
    rule5_cortical: { name: "Cortical Structure", score: 0, maxScore: 10, passed: false, detail: "" },
    rule6_proportion: { name: "Proportional Relationships", score: 0, maxScore: 10, passed: false, detail: "" },
  };

  const {
    bone_type,
    value,
    unit,
    shape_category,
    surface_morphology,
    joint_surface_present,
    cortical_thickness,
    muscle_attachment,
    measurement_type,
  } = measurement;

  // Convert value to mm for comparison
  let valueInMm = parseFloat(value) || 0;
  if (unit === "cm") valueInMm = valueInMm * 10;
  if (unit === "m") valueInMm = valueInMm * 1000;

  // ── Rule 1: Size Range Validation (20 points) ──
  const range = HUMAN_SIZE_RANGES[bone_type];
  if (range && valueInMm > 0 && measurement_type?.toLowerCase().includes("length")) {
    if (valueInMm >= range.min && valueInMm <= range.max) {
      results.rule1_size.score = 20;
      results.rule1_size.passed = true;
      results.rule1_size.detail = `${bone_type} length ${valueInMm}mm is within human range (${range.min}–${range.max}mm)`;
    } else if (valueInMm >= range.min * 0.85 && valueInMm <= range.max * 1.15) {
      results.rule1_size.score = 10;
      results.rule1_size.passed = false;
      results.rule1_size.detail = `${bone_type} length ${valueInMm}mm is slightly outside human range (${range.min}–${range.max}mm)`;
    } else {
      results.rule1_size.score = 0;
      results.rule1_size.passed = false;
      results.rule1_size.detail = `${bone_type} length ${valueInMm}mm is outside human range (${range.min}–${range.max}mm)`;
    }
  } else if (!range) {
    results.rule1_size.score = 10;
    results.rule1_size.detail = "No standard range available for this bone type — partial score awarded";
  } else {
    results.rule1_size.score = 10;
    results.rule1_size.detail = "Non-length measurement — size rule partially applied";
  }

  // ── Rule 2: Shape Analysis (25 points) ──
  if (shape_category) {
    const expectedShapes = HUMAN_SHAPE_MAP[bone_type] || [];
    if (expectedShapes.includes(shape_category)) {
      results.rule2_shape.score = 25;
      results.rule2_shape.passed = true;
      results.rule2_shape.detail = `Shape "${shape_category}" matches expected human ${bone_type} morphology`;
    } else if (expectedShapes.length === 0) {
      results.rule2_shape.score = 12;
      results.rule2_shape.detail = `No shape reference for ${bone_type} — partial score awarded`;
    } else {
      results.rule2_shape.score = 5;
      results.rule2_shape.passed = false;
      results.rule2_shape.detail = `Shape "${shape_category}" does not match expected shapes for human ${bone_type}: ${expectedShapes.join(", ")}`;
    }
  } else {
    results.rule2_shape.score = 0;
    results.rule2_shape.detail = "Shape category not provided";
  }

  // ── Rule 3: Joint Compatibility (20 points) ──
  if (joint_surface_present) {
    const expectsJoint = JOINT_BONES.includes(bone_type);
    if (joint_surface_present === "yes" && expectsJoint) {
      results.rule3_joint.score = 20;
      results.rule3_joint.passed = true;
      results.rule3_joint.detail = `Joint surface present as expected for ${bone_type}`;
    } else if (joint_surface_present === "no" && !expectsJoint) {
      results.rule3_joint.score = 20;
      results.rule3_joint.passed = true;
      results.rule3_joint.detail = `No joint surface expected for ${bone_type} — consistent`;
    } else if (joint_surface_present === "yes" && !expectsJoint) {
      results.rule3_joint.score = 10;
      results.rule3_joint.detail = `Unexpected joint surface on ${bone_type}`;
    } else {
      results.rule3_joint.score = 5;
      results.rule3_joint.detail = `Expected joint surface missing on ${bone_type}`;
    }
  } else {
    results.rule3_joint.score = 0;
    results.rule3_joint.detail = "Joint surface data not provided";
  }

  // ── Rule 4: Surface Morphology (15 points) ──
  if (surface_morphology) {
    if (surface_morphology === "smooth") {
      results.rule4_surface.score = 15;
      results.rule4_surface.passed = true;
      results.rule4_surface.detail = "Smooth cortical surface consistent with human bone";
    } else if (surface_morphology === "slightly-rough") {
      results.rule4_surface.score = 10;
      results.rule4_surface.passed = true;
      results.rule4_surface.detail = "Slightly rough surface — may indicate age or taphonomic changes";
    } else if (surface_morphology === "rough") {
      results.rule4_surface.score = 5;
      results.rule4_surface.detail = "Rough surface — possible taphonomic damage or non-human";
    } else if (surface_morphology === "porous") {
      results.rule4_surface.score = 8;
      results.rule4_surface.detail = "Porous surface — may indicate pathology or elderly individual";
    } else {
      results.rule4_surface.score = 3;
      results.rule4_surface.detail = `Surface morphology "${surface_morphology}" — atypical`;
    }
  } else {
    results.rule4_surface.score = 0;
    results.rule4_surface.detail = "Surface morphology not provided";
  }

  // ── Rule 5: Cortical Structure (10 points) ──
  if (cortical_thickness) {
    if (cortical_thickness === "normal") {
      results.rule5_cortical.score = 10;
      results.rule5_cortical.passed = true;
      results.rule5_cortical.detail = "Normal cortical thickness consistent with human bone";
    } else if (cortical_thickness === "thin") {
      results.rule5_cortical.score = 7;
      results.rule5_cortical.detail = "Thin cortex — may indicate elderly individual or pathology";
    } else if (cortical_thickness === "thick") {
      results.rule5_cortical.score = 7;
      results.rule5_cortical.detail = "Thick cortex — consistent with robust individual";
    } else {
      results.rule5_cortical.score = 3;
      results.rule5_cortical.detail = "Unusual cortical thickness";
    }
  } else {
    results.rule5_cortical.score = 0;
    results.rule5_cortical.detail = "Cortical thickness not provided";
  }

  // ── Rule 6: Muscle Attachment / Proportions (10 points) ──
  if (muscle_attachment) {
    if (muscle_attachment === "present") {
      results.rule6_proportion.score = 10;
      results.rule6_proportion.passed = true;
      results.rule6_proportion.detail = "Muscle attachment marks present — consistent with human bone";
    } else if (muscle_attachment === "faint") {
      results.rule6_proportion.score = 7;
      results.rule6_proportion.detail = "Faint muscle attachment — possible gracile individual or juvenile";
    } else {
      results.rule6_proportion.score = 3;
      results.rule6_proportion.detail = "No muscle attachment marks detected";
    }
  } else {
    results.rule6_proportion.score = 0;
    results.rule6_proportion.detail = "Muscle attachment data not provided";
  }

  // ── Calculate total score ──
  const totalScore = Object.values(results).reduce((sum, r) => sum + r.score, 0);

  // ── Classification ──
  let classification = "";
  let classificationColor = "";

  if (totalScore >= 80) {
    classification = "Likely Human Bone";
    classificationColor = "emerald";
  } else if (totalScore >= 60) {
    classification = "Possibly Human Bone";
    classificationColor = "yellow";
  } else if (totalScore >= 40) {
    classification = "Uncertain — Further Analysis Needed";
    classificationColor = "orange";
  } else {
    classification = "Unlikely Human Bone";
    classificationColor = "red";
  }

  return {
    score: totalScore,
    maxScore: 100,
    classification,
    classificationColor,
    rules: results,
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: Format result for saving to data_quality_log
// ─────────────────────────────────────────────────────────────
export function formatForQualityLog(specimenId, boneType, engineResult) {
  const ruleBreakdown = Object.values(engineResult.rules)
    .map((r) => `${r.name}: ${r.score}/${r.maxScore} — ${r.detail}`)
    .join(" | ");

  return {
    log_id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    specimen_id: specimenId,
    field_name: `bone_analysis_${boneType.replace(/\s+/g, "_").toLowerCase()}`,
    issue_type: engineResult.classification,
    status: `${engineResult.score}/100`,
    notes: ruleBreakdown,
  };
}
