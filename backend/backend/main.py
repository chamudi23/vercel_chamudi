from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

app = FastAPI(title="OAHRIS AI Backend", version="1.0.0")

# Allow React to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase connection
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ─────────────────────────────────────────
# Models
# ─────────────────────────────────────────
class MeasurementInput(BaseModel):
    specimen_id: str
    bone_type: str
    measurement_type: Optional[str] = ""
    value: float
    unit: str = "mm"
    shape_category: Optional[str] = ""
    surface_morphology: Optional[str] = ""
    joint_surface_present: Optional[str] = ""
    cortical_thickness: Optional[str] = ""
    muscle_attachment: Optional[str] = ""

# ─────────────────────────────────────────
# Human bone size ranges in mm
# ─────────────────────────────────────────
HUMAN_SIZE_RANGES = {
    "Femur": (380, 550),
    "Tibia": (300, 450),
    "Fibula": (290, 430),
    "Humerus": (260, 380),
    "Humerus (Distal End)": (50, 90),
    "Radius": (200, 310),
    "Ulna": (220, 330),
    "Skull": (130, 200),
    "Mandible (Left)": (80, 130),
    "Mandible (Right)": (80, 130),
    "Maxilla (Left)": (50, 90),
    "Maxilla (Right)": (50, 90),
    "Calcaneum (Left)": (60, 90),
    "Calcaneum (Right)": (60, 90),
    "Astragalus (Left)": (50, 75),
    "Astragalus (Right)": (50, 75),
    "Patella": (35, 55),
    "Clavicle": (120, 190),
    "Scapula": (130, 190),
    "Metacarpal": (40, 85),
    "Metatarsal": (50, 90),
    "Pelvis": (160, 250),
    "Vertebra": (20, 50),
    "Rib": (100, 300),
    "Phalanx (Hand)": (15, 50),
    "Phalanx (Foot)": (20, 60),
}

HUMAN_SHAPE_MAP = {
    "Femur": ["curved", "cylindrical"],
    "Skull": ["rounded", "dome-shaped"],
    "Mandible (Left)": ["curved", "U-shaped"],
    "Mandible (Right)": ["curved", "U-shaped"],
    "Pelvis": ["bowl-shaped", "curved"],
    "Humerus": ["cylindrical", "curved"],
    "Patella": ["rounded", "oval"],
    "Rib": ["curved", "flat"],
    "Scapula": ["flat", "triangular"],
    "Clavicle": ["curved", "S-shaped"],
    "Vertebra": ["irregular", "ring-shaped"],
    "Tibia": ["triangular", "flat"],
}

JOINT_BONES = [
    "Femur", "Tibia", "Humerus", "Radius", "Ulna",
    "Patella", "Calcaneum (Left)", "Calcaneum (Right)",
    "Astragalus (Left)", "Astragalus (Right)",
    "Pelvis", "Scapula", "Fibula",
]

# ─────────────────────────────────────────
# Rule Engine
# ─────────────────────────────────────────
def run_rule_engine(data: MeasurementInput):
    rules = {}
    
    # Convert to mm
    value_mm = data.value
    if data.unit == "cm": value_mm *= 10
    if data.unit == "m": value_mm *= 1000

    # Rule 1 - Size Range (20pts)
    size_range = HUMAN_SIZE_RANGES.get(data.bone_type)
    if size_range and "length" in (data.measurement_type or "").lower():
        if size_range[0] <= value_mm <= size_range[1]:
            rules["rule1_size"] = {"score": 20, "detail": f"{data.bone_type} {value_mm}mm within human range {size_range}"}
        elif size_range[0]*0.85 <= value_mm <= size_range[1]*1.15:
            rules["rule1_size"] = {"score": 10, "detail": f"{data.bone_type} {value_mm}mm slightly outside range {size_range}"}
        else:
            rules["rule1_size"] = {"score": 0, "detail": f"{data.bone_type} {value_mm}mm outside human range {size_range}"}
    else:
        rules["rule1_size"] = {"score": 10, "detail": "Partial score — non-length or unknown range"}

    # Rule 2 - Shape (25pts)
    expected_shapes = HUMAN_SHAPE_MAP.get(data.bone_type, [])
    if data.shape_category:
        if data.shape_category in expected_shapes:
            rules["rule2_shape"] = {"score": 25, "detail": f"Shape '{data.shape_category}' matches expected for {data.bone_type}"}
        elif not expected_shapes:
            rules["rule2_shape"] = {"score": 12, "detail": "No shape reference available — partial score"}
        else:
            rules["rule2_shape"] = {"score": 5, "detail": f"Shape '{data.shape_category}' doesn't match expected {expected_shapes}"}
    else:
        rules["rule2_shape"] = {"score": 0, "detail": "Shape not provided"}

    # Rule 3 - Joint (20pts)
    expects_joint = data.bone_type in JOINT_BONES
    if data.joint_surface_present:
        if data.joint_surface_present == "yes" and expects_joint:
            rules["rule3_joint"] = {"score": 20, "detail": f"Joint surface present as expected for {data.bone_type}"}
        elif data.joint_surface_present == "no" and not expects_joint:
            rules["rule3_joint"] = {"score": 20, "detail": "No joint surface — consistent with bone type"}
        elif data.joint_surface_present == "yes" and not expects_joint:
            rules["rule3_joint"] = {"score": 10, "detail": "Unexpected joint surface"}
        else:
            rules["rule3_joint"] = {"score": 5, "detail": "Expected joint surface missing"}
    else:
        rules["rule3_joint"] = {"score": 0, "detail": "Joint data not provided"}

    # Rule 4 - Surface (15pts)
    surface_scores = {"smooth": 15, "slightly-rough": 10, "porous": 8, "rough": 5, "other": 3}
    if data.surface_morphology:
        score = surface_scores.get(data.surface_morphology, 3)
        rules["rule4_surface"] = {"score": score, "detail": f"Surface '{data.surface_morphology}'"}
    else:
        rules["rule4_surface"] = {"score": 0, "detail": "Surface not provided"}

    # Rule 5 - Cortical (10pts)
    cortical_scores = {"normal": 10, "thin": 7, "thick": 7}
    if data.cortical_thickness:
        score = cortical_scores.get(data.cortical_thickness, 3)
        rules["rule5_cortical"] = {"score": score, "detail": f"Cortical thickness '{data.cortical_thickness}'"}
    else:
        rules["rule5_cortical"] = {"score": 0, "detail": "Cortical data not provided"}

    # Rule 6 - Muscle (10pts)
    muscle_scores = {"present": 10, "faint": 7, "absent": 3}
    if data.muscle_attachment:
        score = muscle_scores.get(data.muscle_attachment, 0)
        rules["rule6_muscle"] = {"score": score, "detail": f"Muscle attachment '{data.muscle_attachment}'"}
    else:
        rules["rule6_muscle"] = {"score": 0, "detail": "Muscle data not provided"}

    total = sum(r["score"] for r in rules.values())

    if total >= 80:
        classification = "Likely Human Bone"
    elif total >= 60:
        classification = "Possibly Human Bone"
    elif total >= 40:
        classification = "Uncertain — Further Analysis Needed"
    else:
        classification = "Unlikely Human Bone"

    return {"score": total, "classification": classification, "rules": rules}

# ─────────────────────────────────────────
# Isolation Forest ML Anomaly Detection
# ─────────────────────────────────────────
def run_isolation_forest(measurements: list, new_value: float, bone_type: str):
    if len(measurements) < 5:
        return {
            "is_anomaly": False,
            "anomaly_score": 0,
            "detail": "Not enough data for ML analysis (need 5+ records)",
            "method": "Isolation Forest"
        }

    values = np.array([m["value"] for m in measurements]).reshape(-1, 1)
    
    scaler = StandardScaler()
    values_scaled = scaler.fit_transform(values)
    new_scaled = scaler.transform([[new_value]])

    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    model.fit(values_scaled)

    prediction = model.predict(new_scaled)[0]
    anomaly_score = model.decision_function(new_scaled)[0]

    is_anomaly = prediction == -1
    normalized_score = round((1 - (anomaly_score + 0.5)) * 100, 2)

    return {
        "is_anomaly": bool(is_anomaly),
        "anomaly_score": normalized_score,
        "detail": f"Isolation Forest detected {'anomaly' if is_anomaly else 'normal'} value. Score: {normalized_score}%",
        "method": "Isolation Forest ML",
        "sample_size": len(measurements)
    }

# ─────────────────────────────────────────
# Z-Score Statistical Detection
# ─────────────────────────────────────────
def run_zscore(measurements: list, new_value: float):
    if len(measurements) < 3:
        return {
            "is_anomaly": False,
            "z_score": 0,
            "detail": "Not enough data for Z-score analysis (need 3+ records)",
            "method": "Z-Score"
        }

    values = np.array([m["value"] for m in measurements])
    mean = np.mean(values)
    std = np.std(values)

    if std == 0:
        return {
            "is_anomaly": False,
            "z_score": 0,
            "detail": "All values identical — Z-score not applicable",
            "method": "Z-Score"
        }

    z_score = abs((new_value - mean) / std)
    is_anomaly = z_score > 2.5

    return {
        "is_anomaly": bool(is_anomaly),
        "z_score": round(z_score, 3),
        "mean": round(float(mean), 2),
        "std": round(float(std), 2),
        "detail": f"Z-score: {round(z_score, 3)} ({'anomaly' if is_anomaly else 'normal'} — threshold 2.5)",
        "method": "Z-Score Statistical"
    }

# ─────────────────────────────────────────
# API ENDPOINTS
# ─────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "OAHRIS AI Backend running!", "version": "1.0.0"}

@app.post("/analyse-bone")
async def analyse_bone(data: MeasurementInput):
    """
    Full AI analysis:
    1. Rule-based classification
    2. Isolation Forest anomaly detection
    3. Z-score statistical check
    """

    # 1. Run rule engine
    rule_result = run_rule_engine(data)

    # 2. Get existing measurements for this bone type
    existing = supabase.from_("measurements")\
        .select("value")\
        .eq("bone_type", data.bone_type)\
        .execute()
    
    existing_measurements = existing.data or []

    # 3. Run Isolation Forest
    isolation_result = run_isolation_forest(
        existing_measurements, data.value, data.bone_type
    )

    # 4. Run Z-score
    zscore_result = run_zscore(existing_measurements, data.value)

    # 5. Combined anomaly flag
    is_anomaly = isolation_result["is_anomaly"] or zscore_result["is_anomaly"]

    # 6. Save to data_quality_log
    log_id = f"LOG-{int(datetime.now().timestamp())}"
    rule_breakdown = " | ".join([
        f"{k}: {v['score']}pts — {v['detail']}"
        for k, v in rule_result["rules"].items()
    ])
    ml_notes = f"ML: {isolation_result['detail']} | Stats: {zscore_result['detail']}"

    supabase.from_("data_quality_log").insert({
        "log_id": log_id,
        "specimen_id": data.specimen_id,
        "field_name": f"bone_analysis_{data.bone_type.replace(' ', '_').lower()}",
        "issue_type": rule_result["classification"],
        "status": f"{rule_result['score']}/100",
        "notes": f"{rule_breakdown} | {ml_notes}",
    }).execute()

    return {
        "specimen_id": data.specimen_id,
        "bone_type": data.bone_type,
        "rule_based": rule_result,
        "isolation_forest": isolation_result,
        "z_score": zscore_result,
        "is_anomaly": is_anomaly,
        "overall_classification": rule_result["classification"],
        "confidence_score": rule_result["score"],
    }

@app.get("/quality-report/{specimen_id}")
async def quality_report(specimen_id: str):
    """Get full quality report for a specimen"""
    
    logs = supabase.from_("data_quality_log")\
        .select("*")\
        .eq("specimen_id", specimen_id)\
        .order("created_at", { "ascending": False })\
        .execute()

    measurements = supabase.from_("measurements")\
        .select("*")\
        .eq("specimen_id", specimen_id)\
        .execute()

    return {
        "specimen_id": specimen_id,
        "analysis_count": len(logs.data or []),
        "measurements_count": len(measurements.data or []),
        "analyses": logs.data or [],
    }

@app.get("/anomaly-report")
async def anomaly_report():
    """Get all anomalies across all specimens"""
    
    all_measurements = supabase.from_("measurements")\
        .select("*")\
        .execute()

    measurements_by_bone = {}
    for m in (all_measurements.data or []):
        bone = m["bone_type"]
        if bone not in measurements_by_bone:
            measurements_by_bone[bone] = []
        measurements_by_bone[bone].append(m)

    anomalies = []
    for bone_type, bone_measurements in measurements_by_bone.items():
        if len(bone_measurements) >= 3:
            values = [m["value"] for m in bone_measurements]
            mean = np.mean(values)
            std = np.std(values)
            
            if std > 0:
                for m in bone_measurements:
                    z = abs((m["value"] - mean) / std)
                    if z > 2.5:
                        anomalies.append({
                            "specimen_id": m["specimen_id"],
                            "bone_type": bone_type,
                            "value": m["value"],
                            "unit": m.get("unit", "mm"),
                            "z_score": round(z, 3),
                            "mean": round(float(mean), 2),
                            "std": round(float(std), 2),
                        })

    return {
        "total_anomalies": len(anomalies),
        "anomalies": anomalies
    }