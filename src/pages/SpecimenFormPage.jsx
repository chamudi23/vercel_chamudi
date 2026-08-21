import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import {
  PP1_BONE_LABELS,
  allowedSidesForCategory,
  findDuplicateSpecimen,
  normalize,
  normalizeBoneCategory,
  validateCategorySide,
} from "../utils/pp1ImageModule";
import {
  DATING_METHODS,
  DISTRICTS,
  optionalNumber,
  PRESERVATION_STATES,
  PROVINCES,
  TIME_PERIODS,
  validateExcavationAndDating,
} from "../utils/specimenMetadata";

const MEASUREMENT_TYPES = [
  "Maximum Length", "Minimum Length", "Maximum Width",
  "Minimum Width", "Maximum Diameter", "Minimum Diameter",
  "Circumference", "Height", "Depth", "Thickness", "Other",
];

const UNITS = ["mm", "cm", "m"];

const SITE_FIELDS = ["site_name", "district", "province", "time_period"];

function emptyMeasurement() {
  return { id: generateId("M"), measurement_type: "", value: "", unit: "mm", notes: "" };
}

function generateSpecimenId() {
  const num = Math.floor(Math.random() * 900) + 100;
  return `SPEC-${num}`;
}

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function SpecimenFormPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveDestination, setSaveDestination] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [skeletonMode, setSkeletonMode] = useState("new");
  const [skeletonSearch, setSkeletonSearch] = useState("");
  const [skeletonRecords, setSkeletonRecords] = useState([]);
  const [loadingSkeletons, setLoadingSkeletons] = useState(true);
  const [siteConflicts, setSiteConflicts] = useState([]);
  const [measurementNotice, setMeasurementNotice] = useState("");

  // Section 1 - Specimen
  const [form, setForm] = useState({
    specimen_id: generateSpecimenId(),
    skeleton_code: "",
    bone_type: "",
    side: "Unknown",
    site_name: "",
    district: "",
    province: "",
    time_period: "",
    preservation_state: "",
    location_stored: "",
    burial_context: "",
    notes: "",
  });

  // Section 2 - Measurements (dynamic rows)
  const [measurements, setMeasurements] = useState([
    emptyMeasurement(),
  ]);

  // Section 3 - Excavation Record
  const [excavation, setExcavation] = useState({
    excavation_date: "",
    excavation_phase: "",
    depth_found: "",
    excavator_name: "",
    excavation_notes: "",
  });

  // Section 4 - Lab Dating
  const [labDating, setLabDating] = useState({
    dating_method: "",
    date_result: "",
    date_range_min: "",
    date_range_max: "",
    lab_name: "",
    result_notes: "",
  });

  useEffect(() => {
    let active = true;

    async function loadSkeletonRecords() {
      setLoadingSkeletons(true);
      const { data, error } = await supabase
        .from("specimens")
        .select("specimen_id, skeleton_code, bone_type, side, site_name, district, province, time_period, measurements(bone_type)")
        .order("skeleton_code", { ascending: true });

      if (!active) return;
      setSkeletonRecords(data || []);
      setErrors((prev) => ({ ...prev, loadSkeletons: error?.message || "" }));
      setLoadingSkeletons(false);
    }

    loadSkeletonRecords();
    return () => { active = false; };
  }, []);

  const skeletonCodes = useMemo(() => {
    const values = new Map();
    skeletonRecords.forEach((record) => {
      const code = record.skeleton_code?.trim();
      const key = normalize(code);
      if (code && !values.has(key)) values.set(key, code);
    });
    return [...values.values()].sort((a, b) => a.localeCompare(b));
  }, [skeletonRecords]);

  const filteredSkeletonCodes = useMemo(() => {
    const search = normalize(skeletonSearch);
    return skeletonCodes.filter((code) => !search || normalize(code).includes(search));
  }, [skeletonCodes, skeletonSearch]);

  const selectedMeasurementTypes = useMemo(() => new Set(
    measurements.map((measurement) => normalize(measurement.measurement_type)).filter(Boolean)
  ), [measurements]);
  const allowedSides = useMemo(() => allowedSidesForCategory(form.bone_type), [form.bone_type]);
  const sideIsLocked = allowedSides.length === 1;

  function resetBoneMeasurements(message = "") {
    setMeasurements([emptyMeasurement()]);
    setMeasurementNotice(message);
  }

  function setMode(mode) {
    setSkeletonMode(mode);
    setSkeletonSearch("");
    setSiteConflicts([]);
    setErrors({});
    setSuccess(false);
    setForm((prev) => ({
      ...prev,
      specimen_id: generateSpecimenId(),
      skeleton_code: "",
      bone_type: "",
      side: "Unknown",
      site_name: "",
      district: "",
      province: "",
      time_period: "",
    }));
    resetBoneMeasurements();
  }

  function selectExistingSkeleton(code) {
    const matching = skeletonRecords.filter((record) => normalize(record.skeleton_code) === normalize(code));
    const sharedSite = {};
    const conflicts = [];

    SITE_FIELDS.forEach((field) => {
      const distinctValues = new Map();
      matching.forEach((record) => {
        const value = String(record[field] || "").trim();
        if (value && !distinctValues.has(normalize(value))) distinctValues.set(normalize(value), value);
      });
      const values = [...distinctValues.values()];
      if (values.length > 1) conflicts.push(`${field.replace("_", " ")}: ${values.join(" / ")}`);
      sharedSite[field] = values.length === 1 ? values[0] : "";
    });

    setSiteConflicts(conflicts);
    setErrors((prev) => ({ ...prev, skeleton_code: "", duplicateBone: "", siteConflict: "" }));
    setForm((prev) => ({
      ...prev,
      ...sharedSite,
      specimen_id: generateSpecimenId(),
      skeleton_code: code,
      bone_type: "",
      side: "Unknown",
    }));
    resetBoneMeasurements();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "bone_type" && value !== form.bone_type) {
      const hasMeasurementData = measurements.some((measurement) => (
        measurement.measurement_type || measurement.value || measurement.notes
      ));
      resetBoneMeasurements(hasMeasurementData
        ? "Bone Category changed. Existing unsaved measurement entries were cleared."
        : "");
      const nextSides = allowedSidesForCategory(value);
      setForm((prev) => ({ ...prev, bone_type: value, side: nextSides.includes(prev.side) ? prev.side : (nextSides[0] || "Unknown") }));
      setErrors((prev) => ({ ...prev, bone_type: "", side: "", duplicateBone: "", duplicateSpecimenId: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      ...(name === "side" ? { duplicateBone: "", duplicateSpecimenId: "" } : {}),
    }));
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
    if (!form.bone_type) return;
    setMeasurements((prev) => [
      ...prev,
      emptyMeasurement(),
    ]);
  }

  function removeMeasurement(id) {
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  }

  function handleMeasurementChange(id, field, value) {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
    setErrors((prev) => ({ ...prev, measurements: "" }));
  }

  function validate() {
    const e = {};
    if (!form.specimen_id.trim()) e.specimen_id = "Specimen ID is required.";
    if (!form.skeleton_code.trim()) e.skeleton_code = "Skeleton Code is required.";
    if (!form.bone_type) e.bone_type = "Bone Category is required.";
    if (form.bone_type) {
      const sideError = validateCategorySide(form.bone_type, form.side);
      if (sideError) e.side = sideError;
    }
    if (skeletonMode === "existing" && siteConflicts.length > 0) {
      e.siteConflict = "This skeleton has conflicting Site Information. Registration is blocked until the conflict is reviewed.";
    }

    const measurementTypeCounts = new Map();
    measurements.forEach((measurement) => {
      const type = normalize(measurement.measurement_type);
      if (type) measurementTypeCounts.set(type, (measurementTypeCounts.get(type) || 0) + 1);
      const hasPartialValue = measurement.measurement_type || measurement.value;
      const numericValue = Number(measurement.value);
      if (hasPartialValue && (!measurement.measurement_type || measurement.value === "" || !Number.isFinite(numericValue) || numericValue < 0)) {
        e.measurements = "Each measurement needs a Measurement Type and a valid numeric Value.";
      }
    });
    if ([...measurementTypeCounts.values()].some((count) => count > 1)) {
      e.measurements = "This measurement type has already been added for this specimen.";
    }
    Object.assign(e, validateExcavationAndDating(excavation, labDating));
    return e;
  }

  async function saveSpecimen(attachImage = false) {
    if (saving || success) return;
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors({ ...e, validation: "Please correct the highlighted metadata fields." });
      return;
    }

    setSaving(true);
    setSaveDestination(attachImage ? "attachment" : "record");
    setErrors({});
    const specimenId = form.specimen_id.trim();
    const skeletonCode = form.skeleton_code.trim();

    const { data: existingId, error: idCheckError } = await supabase
      .from("specimens")
      .select("specimen_id")
      .eq("specimen_id", specimenId)
      .maybeSingle();

    if (idCheckError) {
      setErrors({ submit: `Could not check the Specimen ID: ${idCheckError.message}` });
      setSaving(false);
      return;
    }
    if (existingId) {
      setErrors({ specimen_id: "This Specimen ID already exists." });
      setSaving(false);
      return;
    }

    const { data: currentSkeletonRows, error: skeletonCheckError } = await supabase
      .from("specimens")
      .select("specimen_id, skeleton_code, bone_type, side, measurements(bone_type)");

    if (skeletonCheckError) {
      setErrors({ submit: `Could not check existing skeleton records: ${skeletonCheckError.message}` });
      setSaving(false);
      return;
    }

    const normalizedCode = normalize(skeletonCode);
    const matchingSkeletonRows = (currentSkeletonRows || []).filter((record) => normalize(record.skeleton_code) === normalizedCode);
    if (skeletonMode === "new" && matchingSkeletonRows.length > 0) {
      setErrors({ skeleton_code: "This Skeleton Code already exists. Choose Existing Skeleton or enter a new code." });
      setSaving(false);
      return;
    }

    const duplicateBone = findDuplicateSpecimen(matchingSkeletonRows, {
      skeletonCode,
      boneCategory: form.bone_type,
      side: form.side,
    });

    if (duplicateBone) {
      const category = normalizeBoneCategory(form.bone_type);
      setErrors({
        duplicateBone: `A ${form.side} ${category.label} is already registered for skeleton ${skeletonCode}.`,
        duplicateSpecimenId: duplicateBone.specimen_id,
      });
      setSaving(false);
      return;
    }

    // 1. Save specimen
    const specimenPayload = { ...form, specimen_id: specimenId, skeleton_code: skeletonCode };

    const { error: specimenError } = await supabase.from("specimens").insert([specimenPayload]);
    if (specimenError) {
      setErrors({ submit: specimenError.message });
      setSaving(false);
      return;
    }

    // 2. Save measurements
    const validMeasurements = measurements.filter((measurement) => (
      measurement.measurement_type
      && measurement.value !== ""
      && Number.isFinite(Number(measurement.value))
    ));
    if (validMeasurements.length > 0) {
      const measurementPayload = validMeasurements.map((m) => ({
        measurement_id: m.id,
        specimen_id: specimenId,
        bone_type: form.bone_type,
        measurement_type: m.measurement_type,
        value: parseFloat(m.value),
        unit: m.unit,
        notes: m.notes,
      }));
      const { error: measError } = await supabase.from("measurements").insert(measurementPayload);
      if (measError) {
        setErrors({ submit: `Measurement error: ${measError.message}` });
        setSaving(false);
        return;
      }
    }

    // 3. Save excavation record
    if (excavation.excavation_date || excavation.excavation_phase) {
      const excavationPayload = {
        excavation_id: generateId("EX"),
        specimen_id: specimenId,
        excavation_date: excavation.excavation_date || null,
        excavation_phase: excavation.excavation_phase,
        depth_found: optionalNumber(excavation.depth_found),
        excavator_name: excavation.excavator_name,
        excavation_notes: excavation.excavation_notes,
      };
      const { error: excError } = await supabase.from("excavation_records").insert([excavationPayload]);
      if (excError) {
        setErrors({ submit: `Excavation error: ${excError.message}` });
        setSaving(false);
        return;
      }
    }

    // 4. Save lab dating
    if (labDating.dating_method) {
      const labPayload = {
        lab_id: generateId("LAB"),
        specimen_id: specimenId,
        dating_method: labDating.dating_method,
        date_result: labDating.date_result,
        date_range_min: optionalNumber(labDating.date_range_min),
        date_range_max: optionalNumber(labDating.date_range_max),
        lab_name: labDating.lab_name,
        result_notes: labDating.result_notes,
      };
      const { error: labError } = await supabase.from("laboratory_dating_results").insert([labPayload]);
      if (labError) {
        setErrors({ submit: `Lab dating error: ${labError.message}` });
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setSuccess(true);
    const destination = attachImage
      ? `/specimens/${encodeURIComponent(specimenId)}?section=attachments&addImage=true`
      : `/specimens/${encodeURIComponent(specimenId)}`;
    setTimeout(() => navigate(destination), 1000);
  }

  const inputClass = (field) =>
    `w-full bg-[#0f1a14] border ${
      errors[field] ? "border-red-500" : "border-white/10"
    } rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors`;

  const selectClass = (field) =>
    `w-full bg-[#0f1a14] border ${
      errors[field] ? "border-red-500" : "border-white/10"
    } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer`;

  const plainSelect = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer";
  const plainInput = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "block text-xs text-white/50 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <style>{`
        select option { background-color: #0f1a14; color: white; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/minuri")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
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
            Add specimen info, bone measurements, excavation details, and lab dating results.
          </p>
        </div>

        {success && (
          <div className="mb-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {saveDestination === "attachment"
              ? "All specimen data saved. Opening the linked attachment form..."
              : "All specimen data saved. Opening the Specimen Record..."}
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">
            {errors.submit}
          </div>
        )}
        {errors.validation && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">
            {errors.validation}
          </div>
        )}

        {errors.loadSkeletons && (
          <div className="mb-6 bg-amber-500/15 border border-amber-500/30 rounded-xl px-5 py-4 text-amber-200 text-sm">
            Existing Skeleton Codes could not be loaded: {errors.loadSkeletons}
          </div>
        )}

        <div className="space-y-6">

          {/* Section 1 — Identity */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">1 — Identity</p>
            <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-[#0f1a14] p-1" aria-label="Skeleton registration mode">
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${skeletonMode === "existing" ? "bg-emerald-500 text-slate-950" : "text-white/50 hover:text-white"}`}
                aria-pressed={skeletonMode === "existing"}
              >
                Existing Skeleton
              </button>
              <button
                type="button"
                onClick={() => setMode("new")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${skeletonMode === "new" ? "bg-emerald-500 text-slate-950" : "text-white/50 hover:text-white"}`}
                aria-pressed={skeletonMode === "new"}
              >
                New Skeleton
              </button>
            </div>
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
                {skeletonMode === "existing" ? (
                  <div className="space-y-2">
                    <input
                      type="search"
                      value={skeletonSearch}
                      onChange={(event) => setSkeletonSearch(event.target.value)}
                      placeholder="Search existing codes"
                      className={inputClass("skeleton_code")}
                      disabled={loadingSkeletons}
                    />
                    <select
                      value={form.skeleton_code}
                      onChange={(event) => selectExistingSkeleton(event.target.value)}
                      className={selectClass("skeleton_code")}
                      disabled={loadingSkeletons || skeletonCodes.length === 0}
                    >
                      <option value="">{loadingSkeletons ? "Loading Skeleton Codes..." : "Select an existing Skeleton Code"}</option>
                      {filteredSkeletonCodes.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    {!loadingSkeletons && skeletonCodes.length === 0 && <p className="text-xs text-white/35">No existing Skeleton Codes were found.</p>}
                  </div>
                ) : (
                  <input name="skeleton_code" value={form.skeleton_code} onChange={handleChange} placeholder="SK1" className={inputClass("skeleton_code")} />
                )}
                {errors.skeleton_code && <p className="text-red-400 text-xs mt-1">{errors.skeleton_code}</p>}
              </div>
              <div>
                <label className={labelClass}>Bone Category</label>
                <select name="bone_type" value={form.bone_type} onChange={handleChange} className={selectClass("bone_type")}>
                  <option value="">Select skeletal element...</option>
                  {PP1_BONE_LABELS.map((bone) => <option key={bone} value={bone}>{bone}</option>)}
                </select>
                {errors.bone_type && <p className="text-red-400 text-xs mt-1">{errors.bone_type}</p>}
                {errors.duplicateBone && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.duplicateBone}{" "}
                    {errors.duplicateSpecimenId && <button type="button" onClick={() => navigate(`/specimens/${encodeURIComponent(errors.duplicateSpecimenId)}`)} className="underline hover:text-red-300">Open existing record</button>}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Side</label>
                <select name="side" value={form.side} onChange={handleChange} disabled={!form.bone_type || sideIsLocked} className={selectClass("side") + (!form.bone_type || sideIsLocked ? " cursor-not-allowed opacity-65" : "")}>
                  {!form.bone_type && <option value="Unknown">Select a bone category first</option>}
                  {allowedSides.map((side) => <option key={side} value={side}>{side}</option>)}
                </select>
                {sideIsLocked && <p className="text-white/35 text-xs mt-1">{form.bone_type === 'Other' ? 'Anatomical side is not applicable to Other.' : 'Midline is automatic because left/right is not anatomically applicable.'}</p>}
                {errors.side && <p className="text-red-400 text-xs mt-1">{errors.side}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 — Site Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">2 — Site Information</p>
            {skeletonMode === "existing" && form.skeleton_code && siteConflicts.length === 0 && (
              <p className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs leading-5 text-emerald-200">
                Site Information was loaded from the selected skeleton and is read-only to prevent contradictory records.
              </p>
            )}
            {siteConflicts.length > 0 && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                <p className="font-semibold">Conflicting Site Information was found. No value was guessed.</p>
                {siteConflicts.map((conflict) => <p key={conflict} className="mt-1 text-xs text-red-100/70">{conflict}</p>)}
              </div>
            )}
            {errors.siteConflict && <p className="mb-4 text-xs text-red-400">{errors.siteConflict}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Site Name</label>
                <input name="site_name" value={form.site_name} onChange={handleChange} readOnly={skeletonMode === "existing"} placeholder="e.g. Sigiriya Potana Cave" className={inputClass("site_name") + (skeletonMode === "existing" ? " cursor-not-allowed opacity-65" : "")} />
              </div>
              <div>
                <label className={labelClass}>District</label>
                <select name="district" value={form.district} onChange={handleChange} disabled={skeletonMode === "existing"} className={selectClass("district") + (skeletonMode === "existing" ? " cursor-not-allowed opacity-65" : "")}>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <select name="province" value={form.province} onChange={handleChange} disabled={skeletonMode === "existing"} className={selectClass("province") + (skeletonMode === "existing" ? " cursor-not-allowed opacity-65" : "")}>
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Time Period</label>
                <select name="time_period" value={form.time_period} onChange={handleChange} disabled={skeletonMode === "existing"} className={selectClass("time_period") + (skeletonMode === "existing" ? " cursor-not-allowed opacity-65" : "")}>
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

          {/* Section 4 — Measurements */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs text-white/30 uppercase tracking-widest">4 — Bone Measurements</p>
              <button
                type="button"
                onClick={addMeasurement}
                disabled={!form.bone_type}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:bg-white/[0.03] disabled:border-white/10 disabled:text-white/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
            </div>

            {!form.bone_type && (
              <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Select a Bone Category first.</p>
            )}
            {measurementNotice && <p className="mb-4 text-xs text-amber-300">{measurementNotice}</p>}
            {errors.measurements && <p className="mb-4 text-xs text-red-400">{errors.measurements}</p>}

            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-1">
                <span className="col-span-3 text-[10px] text-white/25 uppercase tracking-wider">Bone Type</span>
                <span className="col-span-3 text-[10px] text-white/25 uppercase tracking-wider">Measurement Type</span>
                <span className="col-span-2 text-[10px] text-white/25 uppercase tracking-wider">Value</span>
                <span className="col-span-1 text-[10px] text-white/25 uppercase tracking-wider">Unit</span>
                <span className="col-span-2 text-[10px] text-white/25 uppercase tracking-wider">Notes</span>
                <span className="col-span-1"></span>
              </div>

              {measurements.map((m) => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <div className="min-h-[42px] rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/60">
                      {form.bone_type || "No category selected"}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <select value={m.measurement_type} onChange={(e) => handleMeasurementChange(m.id, "measurement_type", e.target.value)} disabled={!form.bone_type} className={plainSelect}>
                      <option value="">Select type</option>
                      {MEASUREMENT_TYPES.map((t) => (
                        <option
                          key={t}
                          value={t}
                          disabled={selectedMeasurementTypes.has(normalize(t)) && normalize(m.measurement_type) !== normalize(t)}
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" value={m.value} onChange={(e) => handleMeasurementChange(m.id, "value", e.target.value)} disabled={!form.bone_type} placeholder="0.00" className={plainInput} />
                  </div>
                  <div className="col-span-1">
                    <select value={m.unit} onChange={(e) => handleMeasurementChange(m.id, "unit", e.target.value)} disabled={!form.bone_type} className={plainSelect}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="text" value={m.notes} onChange={(e) => handleMeasurementChange(m.id, "notes", e.target.value)} disabled={!form.bone_type} placeholder="Optional" className={plainInput} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button onClick={() => removeMeasurement(m.id)} disabled={measurements.length === 1} className="p-1.5 text-white/20 hover:text-red-400 disabled:opacity-20 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-white/20 mt-4">Only rows with a Measurement Type and valid numeric Value will be saved.</p>
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
                <input name="depth_found" type="number" min="0" step="0.01" value={excavation.depth_found} onChange={handleExcavationChange} placeholder="e.g. 1.5" className={plainInput + (errors.depth_found ? " border-red-500" : "")} />
                {errors.depth_found && <p className="text-red-400 text-xs mt-1">{errors.depth_found}</p>}
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
                <input name="date_range_min" type="number" min="0" value={labDating.date_range_min} onChange={handleLabChange} placeholder="e.g. 3450" className={plainInput + (errors.date_range_min || errors.date_range ? " border-red-500" : "")} />
                {(errors.date_range_min || errors.date_range) && <p className="text-red-400 text-xs mt-1">{errors.date_range_min || errors.date_range}</p>}
              </div>
              <div>
                <label className={labelClass}>Date Range Max (BP)</label>
                <input name="date_range_max" type="number" min="0" value={labDating.date_range_max} onChange={handleLabChange} placeholder="e.g. 3550" className={plainInput + (errors.date_range_max || errors.date_range ? " border-red-500" : "")} />
                {(errors.date_range_max || errors.date_range) && <p className="text-red-400 text-xs mt-1">{errors.date_range_max || errors.date_range}</p>}
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
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate("/specimens")}
              disabled={saving}
              className="px-5 py-2.5 text-sm text-white/40 hover:text-white disabled:text-white/20 border border-white/10 hover:border-white/20 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => saveSpecimen(false)}
                disabled={saving || success}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:opacity-40"
              >
                {saving && saveDestination === "record" ? "Saving…" : "Save Specimen Only"}
              </button>
              <button
                type="button"
                onClick={() => saveSpecimen(true)}
                disabled={saving || success}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-600"
              >
                {saving && saveDestination === "attachment" ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving…
                  </>
                ) : "Save & Attach Image"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
