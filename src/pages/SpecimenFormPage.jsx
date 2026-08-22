/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { CONTROLLED_BONE_CATEGORIES, CONTROLLED_BONE_SECTIONS, allowedSidesForCategory, findDuplicateSpecimen, normalize, normalizeBoneCategory, validateCategorySide } from "../utils/pp1ImageModule";
import { DATING_METHODS, DISTRICTS, optionalNumber, PRESERVATION_STATES, PROVINCES, TIME_PERIODS, validateExcavationAndDating } from "../utils/specimenMetadata";
const MEASUREMENT_TYPES = ["Maximum Length", "Minimum Length", "Maximum Width", "Minimum Width", "Maximum Diameter", "Minimum Diameter", "Circumference", "Height", "Depth", "Thickness", "Other"];
const UNITS = ["mm", "cm", "m"];
const SITE_FIELDS = ["site_name", "district", "province", "time_period"];
const STEPS = ["Skeleton & Bone", "Site Information", "Condition & Storage", "Measurements", "Excavation & Dating", "Review & Save"];
const inputBase = "w-full rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white placeholder-white/25 transition-colors focus:border-emerald-500 focus:outline-none";
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
}
function generateSpecimenId() {
  return `SPEC-${Math.floor(Math.random() * 900) + 100}`;
}
function emptyMeasurement() {
  return { id: generateId("M"), measurement_type: "", value: "", unit: "mm", notes: "" };
}
function FieldError({ children }) {
  return children ? <p className="mt-1 text-xs text-red-400">{children}</p> : null;
}
function WizardProgress({ currentStep, onStepChange }) {
  return <ol className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Registration progress">{STEPS.map((name, index) => {
    const step = index + 1;
    const complete = step < currentStep;
    const current = step === currentStep;
    return <li key={name}><button type="button" disabled={!complete} onClick={() => complete && onStepChange(step)} aria-current={current ? "step" : void 0} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${current ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-100" : complete ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10" : "border-white/10 bg-white/[0.02] text-white/35"}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${complete || current ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-white/60"}`}>{complete ? "\u2713" : step}</span><span>{name}</span></button></li>;
  })}</ol>;
}
function ReviewSection({ title, onEdit, children }) {
  return <section className="rounded-xl border border-white/10 bg-[#0f1a14]/70 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-medium">{title}</h3><button type="button" onClick={onEdit} className="text-xs text-emerald-300 underline underline-offset-4">Edit</button></div><dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">{children}</dl></section>;
}
function ReviewField({ label, value }) {
  if (value === "" || value === null || value === void 0) return null;
  return <div><dt className="text-[10px] uppercase tracking-wider text-white/35">{label}</dt><dd className="mt-0.5 break-words text-sm text-white/80">{value}</dd></div>;
}
function SpecimenFormPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [form, setForm] = useState({ specimen_id: generateSpecimenId(), skeleton_code: "", bone_type: "", side: "Unknown", site_name: "", district: "", province: "", time_period: "", preservation_state: "", location_stored: "", burial_context: "", notes: "" });
  const [measurements, setMeasurements] = useState([emptyMeasurement()]);
  const [excavation, setExcavation] = useState({ excavation_date: "", excavation_phase: "", depth_found: "", excavator_name: "", excavation_notes: "" });
  const [labDating, setLabDating] = useState({ dating_method: "", date_result: "", date_range_min: "", date_range_max: "", lab_name: "", result_notes: "" });
  useEffect(() => {
    let active = true;
    async function loadSkeletonRecords() {
      setLoadingSkeletons(true);
      const { data, error } = await supabase.from("specimens").select("specimen_id, skeleton_code, bone_type, side, site_name, district, province, time_period, measurements(bone_type)").order("skeleton_code", { ascending: true });
      if (!active) return;
      setSkeletonRecords(data || []);
      setErrors((previous) => ({ ...previous, loadSkeletons: error?.message || "" }));
      setLoadingSkeletons(false);
    }
    loadSkeletonRecords();
    return () => {
      active = false;
    };
  }, []);
  const skeletonCodes = useMemo(() => {
    const values = /* @__PURE__ */ new Map();
    skeletonRecords.forEach((record) => {
      const code = record.skeleton_code?.trim();
      if (code && !values.has(normalize(code))) values.set(normalize(code), code);
    });
    return [...values.values()].sort((a, b) => a.localeCompare(b));
  }, [skeletonRecords]);
  const filteredSkeletonCodes = useMemo(() => skeletonCodes.filter((code) => !normalize(skeletonSearch) || normalize(code).includes(normalize(skeletonSearch))), [skeletonCodes, skeletonSearch]);
  const categoriesBySection = useMemo(() => new Map(CONTROLLED_BONE_SECTIONS.map((section) => [section, CONTROLLED_BONE_CATEGORIES.filter((category) => category.section === section)])), []);
  const allowedSides = useMemo(() => allowedSidesForCategory(form.bone_type), [form.bone_type]);
  const sideIsLocked = allowedSides.length === 1;
  const selectedMeasurementTypes = useMemo(() => new Set(measurements.map((row) => normalize(row.measurement_type)).filter(Boolean)), [measurements]);
  const inputClass = (field2) => `${inputBase} ${errors[field2] ? "border-red-500" : ""}`;
  const selectClass = (field2) => `${inputClass(field2)} appearance-none cursor-pointer`;
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
    setForm((previous) => ({ ...previous, specimen_id: generateSpecimenId(), skeleton_code: "", bone_type: "", side: "Unknown", site_name: "", district: "", province: "", time_period: "" }));
    resetBoneMeasurements();
  }
  function selectExistingSkeleton(code) {
    const matching = skeletonRecords.filter((record) => normalize(record.skeleton_code) === normalize(code));
    const sharedSite = {};
    const conflicts = [];
    SITE_FIELDS.forEach((field2) => {
      const distinct = /* @__PURE__ */ new Map();
      matching.forEach((record) => {
        const value = String(record[field2] || "").trim();
        if (value && !distinct.has(normalize(value))) distinct.set(normalize(value), value);
      });
      const values = [...distinct.values()];
      if (values.length > 1) conflicts.push(`${field2.replace("_", " ")}: ${values.join(" / ")}`);
      sharedSite[field2] = values.length === 1 ? values[0] : "";
    });
    setSiteConflicts(conflicts);
    setErrors((previous) => ({ ...previous, skeleton_code: "", duplicateBone: "", siteConflict: "" }));
    setForm((previous) => ({ ...previous, ...sharedSite, specimen_id: generateSpecimenId(), skeleton_code: code, bone_type: "", side: "Unknown" }));
    resetBoneMeasurements();
  }
  function handleChange(event) {
    const { name, value } = event.target;
    if (name === "bone_type" && value !== form.bone_type) {
      const hasMeasurementData = measurements.some((row) => row.measurement_type || row.value || row.notes);
      resetBoneMeasurements(hasMeasurementData ? "Bone Category changed. Existing unsaved measurement entries were cleared." : "");
      const nextSides = allowedSidesForCategory(value);
      setForm((previous) => ({ ...previous, bone_type: value, side: nextSides.includes(previous.side) ? previous.side : nextSides[0] || "Unknown" }));
      setErrors((previous) => ({ ...previous, bone_type: "", side: "", duplicateBone: "", duplicateSpecimenId: "" }));
      return;
    }
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "", ...name === "side" ? { duplicateBone: "", duplicateSpecimenId: "" } : {} }));
  }
  function handleExcavationChange(event) {
    const { name, value } = event.target;
    setExcavation((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  }
  function handleLabChange(event) {
    const { name, value } = event.target;
    setLabDating((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "", ...name.startsWith("date_range") ? { date_range: "" } : {} }));
  }
  function addMeasurement() {
    if (form.bone_type) setMeasurements((previous) => [...previous, emptyMeasurement()]);
  }
  function removeMeasurement(id) {
    setMeasurements((previous) => previous.filter((row) => row.id !== id));
  }
  function handleMeasurementChange(id, field2, value) {
    setMeasurements((previous) => previous.map((row) => row.id === id ? { ...row, [field2]: value } : row));
    setErrors((previous) => ({ ...previous, measurements: "" }));
  }
  function validate() {
    const validationErrors = {};
    if (!form.specimen_id.trim()) validationErrors.specimen_id = "Specimen ID is required.";
    if (!form.skeleton_code.trim()) validationErrors.skeleton_code = "Skeleton Code is required.";
    if (!form.bone_type) validationErrors.bone_type = "Bone Category is required.";
    if (form.bone_type) {
      const sideError = validateCategorySide(form.bone_type, form.side);
      if (sideError) validationErrors.side = sideError;
    }
    if (skeletonMode === "existing" && siteConflicts.length > 0) validationErrors.siteConflict = "This skeleton has conflicting Site Information. Registration is blocked until the conflict is reviewed.";
    const typeCounts = /* @__PURE__ */ new Map();
    measurements.forEach((row) => {
      const type = normalize(row.measurement_type);
      if (type) typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      const partial = row.measurement_type || row.value;
      const numericValue = Number(row.value);
      if (partial && (!row.measurement_type || row.value === "" || !Number.isFinite(numericValue) || numericValue < 0)) validationErrors.measurements = "Each measurement needs a Measurement Type and a valid numeric Value.";
    });
    if ([...typeCounts.values()].some((count) => count > 1)) validationErrors.measurements = "This measurement type has already been added for this specimen.";
    Object.assign(validationErrors, validateExcavationAndDating(excavation, labDating));
    return validationErrors;
  }
  function goNext() {
    const keys = { 1: ["specimen_id", "skeleton_code", "bone_type", "side"], 2: ["siteConflict"], 4: ["measurements"], 5: ["depth_found", "date_range_min", "date_range_max", "date_range", "dating_method"] }[currentStep] || [];
    const stepErrors = Object.fromEntries(Object.entries(validate()).filter(([key]) => keys.includes(key)));
    if (Object.keys(stepErrors).length) {
      setErrors((previous) => ({ ...previous, ...stepErrors, validation: "Please correct the highlighted fields before continuing." }));
      return;
    }
    setErrors((previous) => ({ ...previous, validation: "" }));
    setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  }
  async function saveSpecimen(attachImage = false) {
    if (saving || success) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors({ ...validationErrors, validation: "Please correct the highlighted metadata fields." });
      return;
    }
    setSaving(true);
    setSaveDestination(attachImage ? "attachment" : "record");
    setErrors({});
    const specimenId = form.specimen_id.trim();
    const skeletonCode = form.skeleton_code.trim();
    const { data: existingId, error: idCheckError } = await supabase.from("specimens").select("specimen_id").eq("specimen_id", specimenId).maybeSingle();
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
    const { data: currentSkeletonRows, error: skeletonCheckError } = await supabase.from("specimens").select("specimen_id, skeleton_code, bone_type, side, measurements(bone_type)");
    if (skeletonCheckError) {
      setErrors({ submit: `Could not check existing skeleton records: ${skeletonCheckError.message}` });
      setSaving(false);
      return;
    }
    const matchingRows = (currentSkeletonRows || []).filter((record) => normalize(record.skeleton_code) === normalize(skeletonCode));
    if (skeletonMode === "new" && matchingRows.length > 0) {
      setErrors({ skeleton_code: "This Skeleton Code already exists. Choose Existing Skeleton or enter a new code." });
      setSaving(false);
      return;
    }
    const duplicateBone = findDuplicateSpecimen(matchingRows, { skeletonCode, boneCategory: form.bone_type, side: form.side });
    if (duplicateBone) {
      const category = normalizeBoneCategory(form.bone_type);
      setErrors({ duplicateBone: `A ${form.side} ${category.label} is already registered for skeleton ${skeletonCode}.`, duplicateSpecimenId: duplicateBone.specimen_id });
      setSaving(false);
      return;
    }
    const { error: specimenError } = await supabase.from("specimens").insert([{ ...form, specimen_id: specimenId, skeleton_code: skeletonCode }]);
    if (specimenError) {
      setErrors({ submit: specimenError.message });
      setSaving(false);
      return;
    }
    const validMeasurements = measurements.filter((row) => row.measurement_type && row.value !== "" && Number.isFinite(Number(row.value)));
    if (validMeasurements.length) {
      const payload = validMeasurements.map((row) => ({ measurement_id: row.id, specimen_id: specimenId, bone_type: form.bone_type, measurement_type: row.measurement_type, value: parseFloat(row.value), unit: row.unit, notes: row.notes }));
      const { error } = await supabase.from("measurements").insert(payload);
      if (error) {
        setErrors({ submit: `Measurement error: ${error.message}` });
        setSaving(false);
        return;
      }
    }
    if (excavation.excavation_date || excavation.excavation_phase) {
      const payload = { excavation_id: generateId("EX"), specimen_id: specimenId, excavation_date: excavation.excavation_date || null, excavation_phase: excavation.excavation_phase, depth_found: optionalNumber(excavation.depth_found), excavator_name: excavation.excavator_name, excavation_notes: excavation.excavation_notes };
      const { error } = await supabase.from("excavation_records").insert([payload]);
      if (error) {
        setErrors({ submit: `Excavation error: ${error.message}` });
        setSaving(false);
        return;
      }
    }
    if (labDating.dating_method) {
      const payload = { lab_id: generateId("LAB"), specimen_id: specimenId, dating_method: labDating.dating_method, date_result: labDating.date_result, date_range_min: optionalNumber(labDating.date_range_min), date_range_max: optionalNumber(labDating.date_range_max), lab_name: labDating.lab_name, result_notes: labDating.result_notes };
      const { error } = await supabase.from("laboratory_dating_results").insert([payload]);
      if (error) {
        setErrors({ submit: `Lab dating error: ${error.message}` });
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => navigate(attachImage ? `/specimens/${encodeURIComponent(specimenId)}?section=attachments&addImage=true` : `/specimens/${encodeURIComponent(specimenId)}`), 1e3);
  }
  const field = (label, name, options, placeholder = "") => <div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{label}</label>{options ? <select name={name} value={form[name]} onChange={handleChange} className={selectClass(name)}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} className={inputClass(name)} />}</div>;
  const completedMeasurements = measurements.filter((row) => row.measurement_type && row.value !== "");
  let content;
  if (currentStep === 1) content = <div className="space-y-5"><div className="inline-flex rounded-xl border border-white/10 bg-[#0f1a14] p-1">{[["existing", "Existing Skeleton"], ["new", "New Skeleton"]].map(([mode, label]) => <button key={mode} type="button" onClick={() => setMode(mode)} className={`rounded-lg px-4 py-2 text-sm font-medium ${skeletonMode === mode ? "bg-emerald-500 text-slate-950" : "text-white/50 hover:text-white"}`}>{label}</button>)}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Specimen ID *</label><div className="flex gap-2"><input name="specimen_id" value={form.specimen_id} onChange={handleChange} className={`${inputClass("specimen_id")} flex-1`} /><button type="button" aria-label="Generate specimen ID" onClick={() => setForm((previous) => ({ ...previous, specimen_id: generateSpecimenId() }))} className="rounded-xl border border-white/10 bg-white/5 px-3 text-white/50">↻</button></div><FieldError>{errors.specimen_id}</FieldError></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Skeleton Code *</label>{skeletonMode === "existing" ? <div className="space-y-2"><input type="search" value={skeletonSearch} onChange={(event) => setSkeletonSearch(event.target.value)} placeholder="Search existing codes" disabled={loadingSkeletons} className={inputClass("skeleton_code")} /><select value={form.skeleton_code} onChange={(event) => selectExistingSkeleton(event.target.value)} disabled={loadingSkeletons || !skeletonCodes.length} className={selectClass("skeleton_code")}><option value="">{loadingSkeletons ? "Loading Skeleton Codes..." : "Select an existing Skeleton Code"}</option>{filteredSkeletonCodes.map((code) => <option key={code} value={code}>{code}</option>)}</select></div> : <input name="skeleton_code" value={form.skeleton_code} onChange={handleChange} placeholder="SK1" className={inputClass("skeleton_code")} />}<FieldError>{errors.skeleton_code}</FieldError></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Bone Category *</label><select name="bone_type" value={form.bone_type} onChange={handleChange} className={selectClass("bone_type")}><option value="">Select skeletal element...</option>{CONTROLLED_BONE_SECTIONS.map((section) => <optgroup key={section} label={section}>{categoriesBySection.get(section).map((category) => <option key={category.code} value={category.label}>{category.label}</option>)}</optgroup>)}</select><FieldError>{errors.bone_type}</FieldError>{errors.duplicateBone && <p className="mt-1 text-xs text-red-400">{errors.duplicateBone} {errors.duplicateSpecimenId && <button type="button" onClick={() => navigate(`/specimens/${encodeURIComponent(errors.duplicateSpecimenId)}`)} className="underline">Open existing record</button>}</p>}</div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Side *</label><select name="side" value={form.side} onChange={handleChange} disabled={!form.bone_type || sideIsLocked} className={`${selectClass("side")} ${!form.bone_type || sideIsLocked ? "cursor-not-allowed opacity-65" : ""}`}>{!form.bone_type && <option value="Unknown">Select a bone category first</option>}{allowedSides.map((side) => <option key={side} value={side}>{side}</option>)}</select>{sideIsLocked && <p className="mt-1 text-xs text-white/35">{form.bone_type === "Other" ? "Anatomical side is not applicable to Other." : "Midline is automatic for this category."}</p>}<FieldError>{errors.side}</FieldError></div></div></div>;
  if (currentStep === 2) content = <div className="space-y-4">{skeletonMode === "existing" && form.skeleton_code && !siteConflicts.length && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">Site Information was loaded from the selected skeleton and is read-only to prevent contradictory records.</p>}{siteConflicts.length > 0 && <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"><p className="font-semibold">Conflicting Site Information was found. No value was guessed.</p>{siteConflicts.map((conflict) => <p key={conflict} className="mt-1 text-xs">{conflict}</p>)}</div>}<FieldError>{errors.siteConflict}</FieldError><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="md:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Site Name</label><input name="site_name" value={form.site_name} onChange={handleChange} readOnly={skeletonMode === "existing"} className={`${inputClass("site_name")} ${skeletonMode === "existing" ? "opacity-65" : ""}`} /></div>{[["District", "district", DISTRICTS], ["Province", "province", PROVINCES], ["Time Period", "time_period", TIME_PERIODS]].map(([label, name, options]) => <div key={name}><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{label}</label><select name={name} value={form[name]} onChange={handleChange} disabled={skeletonMode === "existing"} className={`${selectClass(name)} ${skeletonMode === "existing" ? "opacity-65" : ""}`}><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>)}</div></div>;
  if (currentStep === 3) content = <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{field("Preservation State", "preservation_state", PRESERVATION_STATES)}{field("Storage Location", "location_stored", null, "e.g. Lab Shelf B-3")}<div className="md:col-span-2">{field("Burial Context", "burial_context", null, "e.g. Primary inhumation")}</div><div className="md:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={4} className={`${inputClass("notes")} resize-none`} /></div></div>;
  if (currentStep === 4) content = <div><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-medium">Bone measurements</p><p className="mt-1 text-xs text-white/40">New rows use the bone category selected in Step 1.</p></div><button type="button" onClick={addMeasurement} disabled={!form.bone_type} className="rounded-xl border border-emerald-500/30 bg-emerald-600/20 px-3 py-2 text-xs text-emerald-300 disabled:border-white/10 disabled:text-white/20">+ Add Row</button></div>{measurementNotice && <p className="mb-4 text-xs text-amber-300">{measurementNotice}</p>}<FieldError>{errors.measurements}</FieldError><div className="space-y-3">{measurements.map((row, index) => <div key={row.id} className="rounded-xl border border-white/10 bg-[#0f1a14]/60 p-3"><div className="mb-3 flex justify-between"><span className="text-xs text-white/40">Measurement {index + 1}</span><button type="button" onClick={() => removeMeasurement(row.id)} disabled={measurements.length === 1} className="text-xs text-white/40 disabled:opacity-30">Remove</button></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Bone Category</label><div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/60">{form.bone_type || "No category selected"}</div></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Measurement Type</label><select value={row.measurement_type} onChange={(event) => handleMeasurementChange(row.id, "measurement_type", event.target.value)} disabled={!form.bone_type} className={selectClass("measurements")}><option value="">Select type</option>{MEASUREMENT_TYPES.map((type) => <option key={type} value={type} disabled={selectedMeasurementTypes.has(normalize(type)) && normalize(row.measurement_type) !== normalize(type)}>{type}</option>)}</select></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Value</label><input type="number" min="0" value={row.value} onChange={(event) => handleMeasurementChange(row.id, "value", event.target.value)} disabled={!form.bone_type} className={inputClass("measurements")} /></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Unit</label><select value={row.unit} onChange={(event) => handleMeasurementChange(row.id, "unit", event.target.value)} disabled={!form.bone_type} className={selectClass("measurements")}>{UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></div><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Notes</label><input value={row.notes} onChange={(event) => handleMeasurementChange(row.id, "notes", event.target.value)} disabled={!form.bone_type} className={inputClass("measurements")} /></div></div></div>)}</div></div>;
  if (currentStep === 5) content = <div className="space-y-7"><section><h3 className="mb-4 text-sm font-medium">Excavation Record</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{[["Excavation Date", "excavation_date", "date"], ["Excavation Phase", "excavation_phase", "text"], ["Depth Found (m)", "depth_found", "number"], ["Excavator Name", "excavator_name", "text"]].map(([label, name, type]) => <div key={name}><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{label}</label><input name={name} type={type} min={type === "number" ? "0" : void 0} step={name === "depth_found" ? "0.01" : void 0} value={excavation[name]} onChange={handleExcavationChange} className={`${inputBase} ${errors[name] ? "border-red-500" : ""}`} style={type === "date" ? { colorScheme: "dark" } : void 0} /><FieldError>{errors[name]}</FieldError></div>)}<div className="md:col-span-2"><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Excavation Notes</label><textarea name="excavation_notes" value={excavation.excavation_notes} onChange={handleExcavationChange} rows={3} className={`${inputBase} resize-none`} /></div></div></section><section className="border-t border-white/10 pt-6"><h3 className="mb-4 text-sm font-medium">Laboratory Dating</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Dating Method</label><select name="dating_method" value={labDating.dating_method} onChange={handleLabChange} className={selectClass("dating_method")}><option value="">Select method</option>{DATING_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select><FieldError>{errors.dating_method}</FieldError></div>{[["Date Result", "date_result"], ["Date Range Min (BP)", "date_range_min"], ["Date Range Max (BP)", "date_range_max"], ["Lab Name", "lab_name"], ["Result Notes", "result_notes"]].map(([label, name]) => <div key={name}><label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{label}</label><input name={name} type={name.startsWith("date_range") ? "number" : "text"} min={name.startsWith("date_range") ? "0" : void 0} value={labDating[name]} onChange={handleLabChange} className={`${inputBase} ${errors[name] || name.startsWith("date_range") && errors.date_range ? "border-red-500" : ""}`} /><FieldError>{errors[name] || (name.startsWith("date_range") ? errors.date_range : "")}</FieldError></div>)}</div></section></div>;
  if (currentStep === 6) content = <div className="space-y-4"><p className="text-sm text-white/55">Review the registration before saving. Edit returns to that step without losing entries.</p><ReviewSection title="Skeleton & Bone" onEdit={() => setCurrentStep(1)}><ReviewField label="Skeleton Mode" value={skeletonMode === "existing" ? "Existing Skeleton" : "New Skeleton"} /><ReviewField label="Specimen ID" value={form.specimen_id} /><ReviewField label="Skeleton Code" value={form.skeleton_code} /><ReviewField label="Bone Category" value={form.bone_type} /><ReviewField label="Side" value={form.side} /></ReviewSection><ReviewSection title="Site" onEdit={() => setCurrentStep(2)}><ReviewField label="Site Name" value={form.site_name} /><ReviewField label="District" value={form.district} /><ReviewField label="Province" value={form.province} /><ReviewField label="Time Period" value={form.time_period} /></ReviewSection><ReviewSection title="Condition & Storage" onEdit={() => setCurrentStep(3)}><ReviewField label="Preservation State" value={form.preservation_state} /><ReviewField label="Storage Location" value={form.location_stored} /><ReviewField label="Burial Context" value={form.burial_context} /><ReviewField label="Notes" value={form.notes} /></ReviewSection><ReviewSection title="Measurements" onEdit={() => setCurrentStep(4)}>{completedMeasurements.length ? completedMeasurements.map((row, index) => <ReviewField key={row.id} label={`Measurement ${index + 1}`} value={`${form.bone_type} \u2014 ${row.measurement_type}: ${row.value} ${row.unit}${row.notes ? ` (${row.notes})` : ""}`} />) : <ReviewField label="Measurements" value="Not provided" />}</ReviewSection><ReviewSection title="Excavation" onEdit={() => setCurrentStep(5)}><ReviewField label="Excavation Date" value={excavation.excavation_date} /><ReviewField label="Excavation Phase" value={excavation.excavation_phase} /><ReviewField label="Depth Found" value={excavation.depth_found === "" ? "" : `${excavation.depth_found} m`} /><ReviewField label="Excavator Name" value={excavation.excavator_name} /><ReviewField label="Excavation Notes" value={excavation.excavation_notes} /></ReviewSection><ReviewSection title="Laboratory Dating" onEdit={() => setCurrentStep(5)}><ReviewField label="Dating Method" value={labDating.dating_method} /><ReviewField label="Date Result" value={labDating.date_result} /><ReviewField label="Date Range" value={labDating.date_range_min || labDating.date_range_max ? `${labDating.date_range_min || "?"}\u2013${labDating.date_range_max || "?"} BP` : ""} /><ReviewField label="Lab Name" value={labDating.lab_name} /><ReviewField label="Result Notes" value={labDating.result_notes} /></ReviewSection></div>;
  return <div className="min-h-screen bg-[#0f1a14] text-white"><style>{`select option, select optgroup { background-color: #0f1a14; color: white; } input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1); }`}</style><header className="flex items-center justify-between border-b border-white/10 px-6 py-4"><button type="button" onClick={() => navigate("/minuri")} className="text-sm text-white/50 hover:text-white">← Back to Module</button><span className="text-xs uppercase tracking-widest text-white/30">Specimen Form</span></header><main className="mx-auto max-w-4xl px-6 py-10"><div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">New Record</p><h1 className="text-3xl font-bold">Register Specimen</h1><p className="mt-2 text-sm text-white/40">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</p></div><WizardProgress currentStep={currentStep} onStepChange={setCurrentStep} />{success && <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-4 text-sm text-emerald-300">{saveDestination === "attachment" ? "All specimen data saved. Opening the linked attachment form..." : "All specimen data saved. Opening the Specimen Record..."}</div>}{errors.submit && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/20 px-5 py-4 text-sm text-red-300">{errors.submit}</div>}{errors.validation && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/20 px-5 py-4 text-sm text-red-300">{errors.validation}</div>}{errors.loadSkeletons && <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-4 text-sm text-amber-200">Existing Skeleton Codes could not be loaded: {errors.loadSkeletons}</div>}<section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"><div className="mb-6 border-b border-white/10 pb-4"><p className="text-xs uppercase tracking-widest text-white/35">Step {currentStep}</p><h2 className="mt-1 text-xl font-semibold">{STEPS[currentStep - 1]}</h2></div>{content}</section><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><button type="button" onClick={() => navigate("/specimens")} disabled={saving} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/45 hover:text-white">Cancel</button>{currentStep > 1 && <button type="button" onClick={() => setCurrentStep((step) => step - 1)} disabled={saving} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/75">Previous</button>}</div>{currentStep < STEPS.length ? <button type="button" onClick={goNext} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium hover:bg-emerald-500">Next</button> : <div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => saveSpecimen(false)} disabled={saving || success} className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-2.5 text-sm font-medium text-emerald-200 disabled:opacity-40">{saving && saveDestination === "record" ? "Saving\u2026" : "Save Specimen Only"}</button><button type="button" onClick={() => saveSpecimen(true)} disabled={saving || success} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium disabled:bg-emerald-900 disabled:text-emerald-600">{saving && saveDestination === "attachment" ? "Saving\u2026" : "Save & Attach Image"}</button></div>}</div></main></div>;
}
export {
  SpecimenFormPage as default
};
