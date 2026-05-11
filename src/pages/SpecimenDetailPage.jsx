import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { analyseBone } from "../api";

const TIME_PERIODS = [
  "Mesolithic", "Neolithic", "Bronze Age", "Iron Age",
  "Protohistoric", "Early Historic", "Medieval", "Unknown",
];

const PRESERVATION_STATES = [
  "Excellent", "Good", "Fair", "Poor", "Fragmentary",
];

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya",
  "Galle", "Matara", "Hambantota", "Jaffna", "Kilinochchi", "Mannar",
  "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
  "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla",
  "Monaragala", "Ratnapura", "Kegalle",
];

const PROVINCES = [
  "Western", "Central", "Southern", "Northern", "Eastern",
  "North Western", "North Central", "Uva", "Sabaragamuwa",
];

const BONE_TYPES = [
  "Femur", "Tibia", "Fibula", "Humerus", "Humerus (Distal End)",
  "Radius", "Ulna", "Skull", "Mandible (Left)", "Mandible (Right)",
  "Maxilla (Left)", "Maxilla (Right)", "Maxilla (Upper)",
  "Molar 1st (Upper)", "Molar 1st (Lower)", "Molar 2nd (Upper)",
  "Molar 2nd (Lower)", "Molar 3rd (Upper)", "Molar 3rd (Lower)",
  "Premolar 1st (Upper)", "Premolar 1st (Lower)",
  "Premolar 2nd (Upper)", "Premolar 2nd (Lower)",
  "Clavicle", "Scapula", "Pelvis", "Vertebra", "Rib", "Sternum",
  "Patella", "Calcaneum (Left)", "Calcaneum (Right)",
  "Astragalus (Left)", "Astragalus (Right)",
  "Metacarpal", "Metatarsal", "Phalanx (Hand)", "Phalanx (Foot)", "Other",
];

const MEASUREMENT_TYPES = [
  "Maximum Length", "Minimum Length", "Maximum Width",
  "Minimum Width", "Maximum Diameter", "Minimum Diameter",
  "Circumference", "Height", "Depth", "Thickness", "Other",
];

const UNITS = ["mm", "cm", "m"];

const DATING_METHODS = [
  "Radiocarbon (C14)", "AMS Radiocarbon", "Thermoluminescence",
  "Optically Stimulated Luminescence", "Dendrochronology",
  "Stratigraphy", "Typology", "Other",
];

const SHAPE_CATEGORIES = [
  "rounded", "dome-shaped", "curved", "flat", "triangular",
  "cylindrical", "bowl-shaped", "U-shaped", "S-shaped",
  "irregular", "block-shaped", "ring-shaped", "oval", "other",
];

function generateSpecimenId() {
  const num = Math.floor(Math.random() * 900) + 100;
  return `SPEC-${num}`;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function newMeasurementRow() {
  return {
    id: generateId("M"),
    bone_type: "",
    measurement_type: "",
    value: "",
    unit: "mm",
    notes: "",
    shape_category: "",
    surface_morphology: "",
    joint_surface_present: "",
    cortical_thickness: "",
    muscle_attachment: "",
  };
}

export default function SpecimenFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);

  const [form, setForm] = useState({
    specimen_id: generateSpecimenId(),
    skeleton_code: "",
    site_name: "",
    district: "",
    province: "",
    excavation_year: "",
    time_period: "",
    preservation_state: "",
    location_stored: "",
    burial_context: "",
    notes: "",
  });

  const [measurements, setMeasurements] = useState([newMeasurementRow()]);

  const [excavation, setExcavation] = useState({
    excavation_date: "",
    excavation_phase: "",
    depth_found: "",
    excavator_name: "",
    excavation_notes: "",
  });

  const [labDating, setLabDating] = useState({
    dating_method: "",
    date_result: "",
    date_range_min: "",
    date_range_max: "",
    lab_name: "",
    result_notes: "",
  });

  const [expandedRows, setExpandedRows] = useState({});

  function toggleExpand(id) {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleExcavationChange(e) {
    const { name, value } = e.target;
    setExcavation((prev) => ({ ...prev, [name]: value }));
  }

  function handleLabChange(e) {
    const { name, value } = e.target;
    setLabDating((prev) => ({ ...prev, [name]: value }));
  }

  function addMeasurement() {
    setMeasurements((prev) => [...prev, newMeasurementRow()]);
  }

  function removeMeasurement(id) {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }

  function handleMeasurementChange(id, field, value) {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function validate() {
    const e = {};
    if (!form.specimen_id.trim()) e.specimen_id = "Specimen ID is required.";
    if (!form.skeleton_code.trim()) e.skeleton_code = "Skeleton Code is required.";
    if (
      form.excavation_year &&
      (isNaN(form.excavation_year) ||
        parseInt(form.excavation_year) < 1 ||
        parseInt(form.excavation_year) > new Date().getFullYear())
    ) {
      e.excavation_year = `Year must be between 1 and ${new Date().getFullYear()}.`;
    }
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setLoading(true);

    // Check duplicate
    const { data: existing } = await supabase
      .from("specimens")
      .select("specimen_id")
      .eq("specimen_id", form.specimen_id)
      .single();

    if (existing) {
      setErrors({ specimen_id: "This Specimen ID already exists." });
      setLoading(false);
      return;
    }

    // 1. Save specimen
    const { error: specError } = await supabase.from("specimens").insert([{
      ...form,
      excavation_year: form.excavation_year ? parseInt(form.excavation_year) : null,
    }]);
    if (specError) { setErrors({ submit: specError.message }); setLoading(false); return; }

    // 2. Save measurements + run Python AI backend
    const validMeasurements = measurements.filter((m) => m.bone_type && m.value);
    const analysisResultsList = [];

    if (validMeasurements.length > 0) {
      const measurementPayload = validMeasurements.map((m) => ({
        measurement_id: m.id,
        specimen_id: form.specimen_id,
        bone_type: m.bone_type,
        measurement_type: m.measurement_type,
        value: parseFloat(m.value),
        unit: m.unit,
        notes: m.notes,
      }));
      await supabase.from("measurements").insert(measurementPayload);

      // Run Python AI backend for each measurement
      for (const m of validMeasurements) {
        const result = await analyseBone({
          specimen_id: form.specimen_id,
          bone_type: m.bone_type,
          measurement_type: m.measurement_type,
          value: parseFloat(m.value),
          unit: m.unit,
          shape_category: m.shape_category,
          surface_morphology: m.surface_morphology,
          joint_surface_present: m.joint_surface_present,
          cortical_thickness: m.cortical_thickness,
          muscle_attachment: m.muscle_attachment,
        });

        if (result) {
          analysisResultsList.push({
            bone_type: m.bone_type,
            result: {
              score: result.confidence_score,
              classification: result.overall_classification,
              rules: result.rule_based.rules,
              isolation_forest: result.isolation_forest,
              z_score: result.z_score,
              is_anomaly: result.is_anomaly,
            }
          });
        }
      }
      setAnalysisResults(analysisResultsList);
    }

    // 3. Save excavation record
    if (excavation.excavation_date || excavation.excavation_phase) {
      await supabase.from("excavation_records").insert([{
        excavation_id: generateId("EX"),
        specimen_id: form.specimen_id,
        excavation_date: excavation.excavation_date || null,
        excavation_phase: excavation.excavation_phase,
        depth_found: excavation.depth_found ? parseFloat(excavation.depth_found) : null,
        excavator_name: excavation.excavator_name,
        excavation_notes: excavation.excavation_notes,
      }]);
    }

    // 4. Save lab dating
    if (labDating.dating_method) {
      await supabase.from("laboratory_dating_results").insert([{
        lab_id: generateId("LAB"),
        specimen_id: form.specimen_id,
        dating_method: labDating.dating_method,
        date_result: labDating.date_result,
        date_range_min: labDating.date_range_min ? parseFloat(labDating.date_range_min) : null,
        date_range_max: labDating.date_range_max ? parseFloat(labDating.date_range_max) : null,
        lab_name: labDating.lab_name,
        result_notes: labDating.result_notes,
      }]);
    }

    setLoading(false);
    setSuccess(true);
  }

  const scoreColor = (score) =>
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-yellow-400" :
    score >= 40 ? "text-orange-400" : "text-red-400";

  const scoreBg = (score) =>
    score >= 80 ? "bg-emerald-500/10 border-emerald-500/20" :
    score >= 60 ? "bg-yellow-500/10 border-yellow-500/20" :
    score >= 40 ? "bg-orange-500/10 border-orange-500/20" : "bg-red-500/10 border-red-500/20";

  const inputClass = (field) =>
    `w-full bg-[#0f1a14] border ${errors[field] ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors`;

  const selectClass = (field) =>
    `w-full bg-[#0f1a14] border ${errors[field] ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer`;

  const plainSelect = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer";
  const plainInput = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "block text-xs text-white/50 uppercase tracking-wider mb-1.5";

  // Success page with AI results
  if (success) {
    return (
      <div className="min-h-screen bg-[#0f1a14] text-white">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/minuri")} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Module
          </button>
          <span className="text-xs text-white/30 tracking-widest uppercase">Specimen Saved</span>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Specimen saved! Python AI backend analysis complete.
          </div>

          {/* AI Analysis Results */}
          {analysisResults.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
                AI Analysis Results — Rule Engine + Isolation Forest + Z-Score
              </p>
              <div className="space-y-4">
                {analysisResults.map(({ bone_type, result }, i) => (
                  <div key={i} className={`border rounded-xl p-5 ${scoreBg(result.score)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-white">{bone_type}</p>
                        <p className={`text-xs mt-0.5 ${scoreColor(result.score)}`}>{result.classification}</p>
                        {result.is_anomaly && (
                          <p className="text-xs text-red-400 mt-0.5">⚠️ ML Anomaly Detected!</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${scoreColor(result.score)}`}>{result.score}</p>
                        <p className="text-xs text-white/30">out of 100</p>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full rounded-full ${result.score >= 80 ? "bg-emerald-500" : result.score >= 60 ? "bg-yellow-500" : result.score >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                        style={{ width: `${result.score}%` }}
                      />
                    </div>

                    {/* Rule breakdown */}
                    <div className="space-y-1.5 mb-3">
                      {result.rules && Object.values(result.rules).map((rule, j) => (
                        <div key={j} className="flex items-start justify-between gap-3">
                          <p className="text-[10px] text-white/30 flex-1">{rule.detail}</p>
                          <span className={`text-xs font-mono shrink-0 ${rule.score > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {rule.score}pts
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ML results */}
                    {result.isolation_forest && (
                      <div className="border-t border-white/10 pt-3 mt-3 grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">Isolation Forest</p>
                          <p className="text-xs text-white/60 mt-0.5">{result.isolation_forest.detail}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[10px] text-white/30 uppercase tracking-wider">Z-Score</p>
                          <p className="text-xs text-white/60 mt-0.5">{result.z_score?.detail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => navigate("/specimens")} className="flex-1 px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">
              View All Specimens
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              Add Another Specimen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <style>{`
        select option { background-color: #0f1a14; color: white; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/minuri")} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Module
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">Specimen Form</span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">New Record</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Register Specimen</h1>
          <p className="text-white/40 text-sm mt-2">
            Add specimen info, bone measurements with Python AI analysis, excavation details, and lab dating results.
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">{errors.submit}</div>
        )}

        <div className="space-y-6">

          {/* Section 1 — Identity */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">1 — Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Specimen ID *</label>
                <div className="flex gap-2">
                  <input name="specimen_id" value={form.specimen_id} onChange={handleChange} placeholder="SPEC-001" className={inputClass("specimen_id") + " flex-1"} />
                  <button onClick={() => setForm((p) => ({ ...p, specimen_id: generateSpecimenId() }))} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white transition-colors">↻</button>
                </div>
                {errors.specimen_id && <p className="text-red-400 text-xs mt-1">{errors.specimen_id}</p>}
              </div>
              <div>
                <label className={labelClass}>Skeleton Code *</label>
                <input name="skeleton_code" value={form.skeleton_code} onChange={handleChange} placeholder="SK1" className={inputClass("skeleton_code")} />
                {errors.skeleton_code && <p className="text-red-400 text-xs mt-1">{errors.skeleton_code}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 — Site Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">2 — Site Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Site Name</label>
                <input name="site_name" value={form.site_name} onChange={handleChange} placeholder="e.g. Sigiriya Potana Cave" className={inputClass("site_name")} />
              </div>
              <div>
                <label className={labelClass}>District</label>
                <select name="district" value={form.district} onChange={handleChange} className={selectClass("district")}>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <select name="province" value={form.province} onChange={handleChange} className={selectClass("province")}>
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Excavation Year</label>
                <input name="excavation_year" type="number" min="1" max={new Date().getFullYear()} value={form.excavation_year} onChange={(e) => { const val = e.target.value; if (val === "" || parseInt(val) >= 1) handleChange(e); }} placeholder={`e.g. ${new Date().getFullYear()}`} className={inputClass("excavation_year")} />
                {errors.excavation_year && <p className="text-red-400 text-xs mt-1">{errors.excavation_year}</p>}
              </div>
              <div>
                <label className={labelClass}>Time Period</label>
                <select name="time_period" value={form.time_period} onChange={handleChange} className={selectClass("time_period")}>
                  <option value="">Select period</option>
                  {TIME_PERIODS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 — Condition */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">3 — Condition & Storage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Preservation State</label>
                <select name="preservation_state" value={form.preservation_state} onChange={handleChange} className={selectClass("preservation_state")}>
                  <option value="">Select state</option>
                  {PRESERVATION_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Storage Location</label>
                <input name="location_stored" value={form.location_stored} onChange={handleChange} placeholder="e.g. Lab Shelf B-3" className={inputClass("location_stored")} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Burial Context</label>
                <input name="burial_context" value={form.burial_context} onChange={handleChange} placeholder="e.g. Primary inhumation, extended supine, Context No. 10" className={inputClass("burial_context")} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Additional observations or remarks..." className={inputClass("notes") + " resize-none"} />
              </div>
            </div>
          </div>

          {/* Section 4 — Measurements with Python AI */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest">4 — Bone Measurements</p>
                <p className="text-[10px] text-emerald-400/60 mt-1">Python AI (Rule Engine + Isolation Forest + Z-Score) runs on save</p>
              </div>
              <button onClick={addMeasurement} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Row
              </button>
            </div>

            <div className="space-y-4 mt-5">
              {measurements.map((m) => (
                <div key={m.id} className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 p-3 items-center bg-white/[0.02]">
                    <div className="col-span-3">
                      <select value={m.bone_type} onChange={(e) => handleMeasurementChange(m.id, "bone_type", e.target.value)} className={plainSelect}>
                        <option value="">Bone type</option>
                        {BONE_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <select value={m.measurement_type} onChange={(e) => handleMeasurementChange(m.id, "measurement_type", e.target.value)} className={plainSelect}>
                        <option value="">Measurement type</option>
                        {MEASUREMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" value={m.value} onChange={(e) => handleMeasurementChange(m.id, "value", e.target.value)} placeholder="Value" className={plainInput} />
                    </div>
                    <div className="col-span-1">
                      <select value={m.unit} onChange={(e) => handleMeasurementChange(m.id, "unit", e.target.value)} className={plainSelect}>
                        {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="text" value={m.notes} onChange={(e) => handleMeasurementChange(m.id, "notes", e.target.value)} placeholder="Notes" className={plainInput} />
                    </div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      <button onClick={() => toggleExpand(m.id)} className="p-1.5 text-emerald-400/50 hover:text-emerald-400 transition-colors" title="Add morphology for AI">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d={expandedRows[m.id] ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                      </button>
                      <button onClick={() => removeMeasurement(m.id)} disabled={measurements.length === 1} className="p-1.5 text-white/20 hover:text-red-400 disabled:opacity-20 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>

                  {expandedRows[m.id] && (
                    <div className="p-4 border-t border-white/10 bg-emerald-500/[0.02]">
                      <p className="text-[10px] text-emerald-400/60 uppercase tracking-wider mb-3">Morphological Observations — Python AI Analysis</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Shape</label>
                          <select value={m.shape_category} onChange={(e) => handleMeasurementChange(m.id, "shape_category", e.target.value)} className={plainSelect}>
                            <option value="">Select</option>
                            {SHAPE_CATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Surface</label>
                          <select value={m.surface_morphology} onChange={(e) => handleMeasurementChange(m.id, "surface_morphology", e.target.value)} className={plainSelect}>
                            <option value="">Select</option>
                            {["smooth","slightly-rough","rough","porous","other"].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Joint Surface</label>
                          <select value={m.joint_surface_present} onChange={(e) => handleMeasurementChange(m.id, "joint_surface_present", e.target.value)} className={plainSelect}>
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Cortical</label>
                          <select value={m.cortical_thickness} onChange={(e) => handleMeasurementChange(m.id, "cortical_thickness", e.target.value)} className={plainSelect}>
                            <option value="">Select</option>
                            {["thin","normal","thick"].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Muscle Attach.</label>
                          <select value={m.muscle_attachment} onChange={(e) => handleMeasurementChange(m.id, "muscle_attachment", e.target.value)} className={plainSelect}>
                            <option value="">Select</option>
                            {["present","faint","absent"].map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-3">Click ▼ to add morphology details. Only rows with bone type and value will be saved and analysed.</p>
          </div>

          {/* Section 5 — Excavation */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">5 — Excavation Record</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Excavation Date</label>
                <input name="excavation_date" type="date" value={excavation.excavation_date} onChange={handleExcavationChange} className={plainInput} style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className={labelClass}>Excavation Phase</label>
                <input name="excavation_phase" value={excavation.excavation_phase} onChange={handleExcavationChange} placeholder="e.g. Phase 1, Layer A" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Depth Found (m)</label>
                <input name="depth_found" type="number" min="0" step="0.01" value={excavation.depth_found} onChange={handleExcavationChange} placeholder="e.g. 1.5" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Excavator Name</label>
                <input name="excavator_name" value={excavation.excavator_name} onChange={handleExcavationChange} placeholder="e.g. Prof. Gamini Adikari" className={plainInput} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Excavation Notes</label>
                <textarea name="excavation_notes" value={excavation.excavation_notes} onChange={handleExcavationChange} rows={3} placeholder="Field observations, context details..." className={plainInput + " resize-none"} />
              </div>
            </div>
          </div>

          {/* Section 6 — Lab Dating */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">6 — Laboratory Dating</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Dating Method</label>
                <select name="dating_method" value={labDating.dating_method} onChange={handleLabChange} className={plainSelect}>
                  <option value="">Select method</option>
                  {DATING_METHODS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Date Result</label>
                <input name="date_result" value={labDating.date_result} onChange={handleLabChange} placeholder="e.g. 3500 BP ± 50" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Date Range Min (BP)</label>
                <input name="date_range_min" type="number" min="0" value={labDating.date_range_min} onChange={handleLabChange} placeholder="e.g. 3450" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Date Range Max (BP)</label>
                <input name="date_range_max" type="number" min="0" value={labDating.date_range_max} onChange={handleLabChange} placeholder="e.g. 3550" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Lab Name</label>
                <input name="lab_name" value={labDating.lab_name} onChange={handleLabChange} placeholder="e.g. PGIAR Laboratory" className={plainInput} />
              </div>
              <div>
                <label className={labelClass}>Result Notes</label>
                <input name="result_notes" value={labDating.result_notes} onChange={handleLabChange} placeholder="Additional lab notes..." className={plainInput} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => navigate("/specimens")} className="px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving & Analysing...
                </>
              ) : "Save & Run AI Analysis"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
