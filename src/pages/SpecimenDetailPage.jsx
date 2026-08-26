import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { analyseBone } from "../api";
import BoneImageList from "../components/BoneImageList";
import SiteLocationMiniMap from "../components/SiteLocationMiniMap";
import {
  PP1_BONE_LABELS,
  allowedSidesForCategory,
  findDuplicateSpecimen,
  normalizeBoneCategory,
  validateCategorySide,
} from "../utils/pp1ImageModule";
import {
  buildSkeletalInputPayload,
  buildSpecimenDimensionPayload,
  getRelevantSkeletalInputFields,
  keepRelevantSkeletalValues,
} from "../utils/skeletalInputFields";
import {
  DATING_METHODS,
  DISTRICTS,
  hasMetadataValue,
  optionalNumber,
  PRESERVATION_STATES,
  PROVINCES,
  TIME_PERIODS,
  validateExcavationAndDating,
} from "../utils/specimenMetadata";

const MEASUREMENT_TYPES = [
  "Maximum Length","Minimum Length","Maximum Width",
  "Minimum Width","Maximum Diameter","Minimum Diameter",
  "Circumference","Height","Depth","Thickness","Other",
];

const UNITS = ["mm","cm","m"];
const SHAPE_CATEGORIES = ["rounded","dome-shaped","curved","flat","triangular","cylindrical","bowl-shaped","U-shaped","S-shaped","irregular","block-shaped","ring-shaped","oval","other"];
const SEX_ESTIMATE_OPTIONS = ["Male", "Female", "Unknown"];

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

function relatedDraft(record, fields) {
  return Object.fromEntries(fields.map((field) => [field, record?.[field] ?? ""]));
}

function displayValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  return String(value);
}

function displayDate(value) {
  if (!value) return "—";
  const isoDate = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return isoDate || displayValue(value);
}

// eslint-disable-next-line react/prop-types
function MetadataValue({ label, value, className = "" }) {
  return (
    <div className={className}>
      <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white/80">{displayValue(value)}</p>
    </div>
  );
}

function resolveSavedBoneCategory(specimenRecord, measurementRecords) {
  if (String(specimenRecord.bone_type || "").trim()) return specimenRecord.bone_type;
  const categories = new Map();
  measurementRecords.forEach((measurement) => {
    const category = normalizeBoneCategory(measurement.bone_type);
    if (category) categories.set(category.code, category.label);
  });
  return categories.size === 1 ? [...categories.values()][0] : "";
}

const EXCAVATION_FIELDS = ["excavation_date", "depth_found", "excavator_name", "excavation_notes"];
const LAB_DATING_FIELDS = ["dating_method", "date_result", "date_range_min", "date_range_max", "lab_name", "result_notes"];

export default function SpecimenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const attachmentSectionRef = useRef(null);
  const attachmentSectionRequested = searchParams.get("section") === "attachments";
  const attachmentEditImageId = attachmentSectionRequested ? (searchParams.get("editImage") || "") : "";
  const attachmentAddRequested = attachmentSectionRequested && searchParams.get("addImage") === "true";
  const attachmentOnlyEditing = Boolean(attachmentEditImageId || attachmentAddRequested);
  const fromGallery = searchParams.get("from") === "gallery";

  const [specimen, setSpecimen] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [excavation, setExcavation] = useState(null);
  const [labDating, setLabDating] = useState(null);
  const [skeletalInput, setSkeletalInput] = useState(null);
  const [skeletalInputDraft, setSkeletalInputDraft] = useState({});
  const [qualityLogs, setQualityLogs] = useState([]);
  const [catalogueRecords, setCatalogueRecords] = useState([]);
  const [siteLocation, setSiteLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [excavationDraft, setExcavationDraft] = useState(relatedDraft(null, EXCAVATION_FIELDS));
  const [labDatingDraft, setLabDatingDraft] = useState(relatedDraft(null, LAB_DATING_FIELDS));
  const [measurementDrafts, setMeasurementDrafts] = useState({});
  const [deletedMeasurementIds, setDeletedMeasurementIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [duplicateSpecimenId, setDuplicateSpecimenId] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showAddMeasurement, setShowAddMeasurement] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState(newMeasurementRow());
  const [addingMeasurement, setAddingMeasurement] = useState(false);
  const [measurementSuccess, setMeasurementSuccess] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const { data: specData, error } = await supabase
      .from("specimens")
      .select("*")
      .eq("specimen_id", id)
      .single();

    if (error || !specData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const { data: measData } = await supabase
      .from("measurements")
      .select("*")
      .eq("specimen_id", specData.specimen_id);
    const displayedSpecimen = {
      ...specData,
      bone_type: resolveSavedBoneCategory(specData, measData || []),
    };
    setSpecimen(displayedSpecimen);
    setEditForm(displayedSpecimen);
    setMeasurements(measData || []);
    setDeletedMeasurementIds([]);
    setMeasurementDrafts(Object.fromEntries((measData || []).map((measurement) => [measurement.measurement_id, {
      bone_type: measurement.bone_type || "",
      measurement_type: measurement.measurement_type || "",
      value: measurement.value ?? "",
      unit: measurement.unit || "mm",
      notes: measurement.notes || "",
    }])));

    const { data: excData } = await supabase
      .from("excavation_records")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .single();
    setExcavation(excData || null);
    setExcavationDraft(relatedDraft(excData, EXCAVATION_FIELDS));

    const { data: labData } = await supabase
      .from("laboratory_dating_results")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .single();
    setLabDating(labData || null);
    setLabDatingDraft(relatedDraft(labData, LAB_DATING_FIELDS));

    const { data: skeletalInputData } = await supabase
      .from("skeletal_inputs")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .maybeSingle();
    setSkeletalInput(skeletalInputData || null);
    setSkeletalInputDraft(skeletalInputData ? { ...skeletalInputData } : {});

    const { data: logData } = await supabase
      .from("data_quality_log")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .order("created_at", { ascending: false });
    setQualityLogs(logData || []);

    const { data: skeletonData } = await supabase
      .from("specimens")
      .select("specimen_id, skeleton_code, bone_type, side, site_name, preservation_state, location_stored")
      .eq("skeleton_code", specData.skeleton_code)
      .order("specimen_id", { ascending: true });
    const skeletonRecords = skeletonData || [specData];
    const { data: imageData } = await supabase
      .from("bone_images")
      .select("*")
      .in("specimen_id", skeletonRecords.map((record) => record.specimen_id))
      .order("uploaded_at", { ascending: false });
    const allImages = imageData || [];
    setCatalogueRecords(skeletonRecords.map((record) => ({
      ...record,
      images: allImages.filter((image) => image.specimen_id === record.specimen_id),
    })));
    const { data: siteData } = await supabase
      .from("sites")
      .select("site_name, latitude, longitude")
      .eq("site_name", specData.site_name)
      .maybeSingle();
    setSiteLocation(siteData || null);

    setLoading(false);
  }, [id]);

  function handleEditChange(e) {
    const { name, value } = e.target;
    if (name === "bone_type") {
      const nextSides = allowedSidesForCategory(value);
      setEditForm((prev) => ({ ...prev, bone_type: value, side: nextSides.includes(prev.side) ? prev.side : (nextSides[0] || "Unknown") }));
      setSkeletalInputDraft((prev) => keepRelevantSkeletalValues(value, { ...prev }));
      setSaveError("");
      setDuplicateSpecimenId("");
      return;
    }
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (name === "side") {
      setSaveError("");
      setDuplicateSpecimenId("");
    }
  }

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!loading && attachmentSectionRequested) {
      const timer = setTimeout(() => attachmentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [attachmentSectionRequested, loading]);

  function finishAttachmentEdit() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("editImage");
    setSearchParams(nextParams, { replace: true });
  }

  function startEditing() {
    if (attachmentOnlyEditing) return;
    const sides = allowedSidesForCategory(specimen.bone_type);
    setEditForm({
      ...specimen,
      side: sides.length === 1 && sides[0] === "Midline" ? "Midline" : specimen.side,
    });
    setExcavationDraft(relatedDraft(excavation, EXCAVATION_FIELDS));
    setLabDatingDraft(relatedDraft(labDating, LAB_DATING_FIELDS));
    setSkeletalInputDraft({ ...(skeletalInput || {}) });
    setSaveError("");
    setDuplicateSpecimenId("");
    setMeasurementDrafts(Object.fromEntries(measurements.map((measurement) => [measurement.measurement_id, {
      bone_type: measurement.bone_type || "",
      measurement_type: measurement.measurement_type || "",
      value: measurement.value ?? "",
      unit: measurement.unit || "mm",
      notes: measurement.notes || "",
    }])));
    setDeletedMeasurementIds([]);
    setEditing(true);
  }

  function cancelEditing() {
    setEditForm(specimen);
    setExcavationDraft(relatedDraft(excavation, EXCAVATION_FIELDS));
    setLabDatingDraft(relatedDraft(labDating, LAB_DATING_FIELDS));
    setSkeletalInputDraft({ ...(skeletalInput || {}) });
    setSaveError("");
    setDuplicateSpecimenId("");
    setDeletedMeasurementIds([]);
    setShowAddMeasurement(false);
    setEditing(false);
    fetchAll();
  }

  function handleMeasurementEdit(measurementId, field, value) {
    setMeasurementDrafts((current) => ({
      ...current,
      [measurementId]: { ...current[measurementId], [field]: value },
    }));
  }

  async function handleSave() {
    const metadataErrors = validateExcavationAndDating(excavationDraft, labDatingDraft);
    if (Object.keys(metadataErrors).length > 0) {
      setSaveError(Object.values(metadataErrors)[0]);
      return;
    }
    const sideError = validateCategorySide(editForm.bone_type, editForm.side);
    if (sideError) {
      setSaveError(sideError);
      return;
    }
    const invalidMeasurement = measurements.find((measurement) => {
      const draft = measurementDrafts[measurement.measurement_id];
      return !draft?.bone_type || draft.value === "" || Number.isNaN(Number(draft.value));
    });
    if (invalidMeasurement) {
      setSaveError("Each measurement must have a bone type and numeric value.");
      return;
    }

    const relevantBoneFields = getRelevantSkeletalInputFields(editForm.bone_type);
    const nextSkeletalInputPayload = buildSkeletalInputPayload(editForm.bone_type, skeletalInputDraft);
    const mergedSkeletalRow = {
      ...(skeletalInput || {}),
      ...keepRelevantSkeletalValues(editForm.bone_type, skeletalInput || {}),
      ...nextSkeletalInputPayload,
      specimen_id: id,
    };

    setSaving(true);
    setSaveError("");
    setDuplicateSpecimenId("");
    const { data: authUserData, error: authUserError } = await supabase.auth.getUser();
    if (authUserError || !authUserData?.user?.id) {
      setSaving(false);
      setSaveError("Your sign-in session is missing or expired. Please sign in again.");
      return;
    }
    const createdBy = authUserData.user.id;
    const specimenDimensionPayload = buildSpecimenDimensionPayload(
      measurements.map((measurement) => ({
        ...measurementDrafts[measurement.measurement_id],
        measurement_type: measurementDrafts[measurement.measurement_id]?.measurement_type,
      })),
    );
    const { data: specimenRows, error: duplicateCheckError } = await supabase
      .from("specimens")
      .select("specimen_id, skeleton_code, bone_type, side, measurements(bone_type)");
    if (duplicateCheckError) {
      setSaving(false);
      setSaveError(`Could not check existing skeleton records: ${duplicateCheckError.message}`);
      return;
    }
    const duplicate = findDuplicateSpecimen(specimenRows, {
      skeletonCode: specimen.skeleton_code,
      boneCategory: editForm.bone_type,
      side: editForm.side,
      excludeSpecimenId: specimen.specimen_id,
    });
    if (duplicate) {
      const category = normalizeBoneCategory(editForm.bone_type);
      setSaving(false);
      setDuplicateSpecimenId(duplicate.specimen_id);
      setSaveError(`A ${editForm.side} ${category.label} is already registered for skeleton ${specimen.skeleton_code}.`);
      return;
    }
    const { error: specimenError } = await supabase
      .from("specimens")
      .update({
        bone_type: editForm.bone_type,
        side: editForm.side,
        site_name: editForm.site_name,
        district: editForm.district,
        province: editForm.province,
        time_period: editForm.time_period,
        preservation_state: editForm.preservation_state,
        location_stored: editForm.location_stored,
        notes: editForm.notes,
        age_estimate: editForm.age_estimate,
        sex_estimate: editForm.sex_estimate,
        height_estimate: optionalNumber(editForm.height_estimate),
        ...specimenDimensionPayload,
      })
      .eq("specimen_id", id);

    let measurementError = null;
    let excavationError = null;
    let labDatingError = null;
    if (!specimenError) {
      const excavationPayload = {
        specimen_id: id,
        excavation_date: excavationDraft.excavation_date || null,
        depth_found: optionalNumber(excavationDraft.depth_found),
        excavator_name: excavationDraft.excavator_name || null,
        excavation_notes: excavationDraft.excavation_notes || null,
        created_by: createdBy,
      };
      if (excavation) {
        ({ error: excavationError } = await supabase.from("excavation_records").update(excavationPayload).eq("excavation_id", excavation.excavation_id));
      } else if (hasMetadataValue(excavationDraft)) {
        ({ error: excavationError } = await supabase.from("excavation_records").insert([{ ...excavationPayload, excavation_id: generateId("EX") }]));
      }

      const labDatingPayload = {
        specimen_id: id,
        dating_method: labDatingDraft.dating_method || null,
        date_result: labDatingDraft.date_result || null,
        date_range_min: optionalNumber(labDatingDraft.date_range_min),
        date_range_max: optionalNumber(labDatingDraft.date_range_max),
        lab_name: labDatingDraft.lab_name || null,
        result_notes: labDatingDraft.result_notes || null,
      };
      if (!excavationError && labDating) {
        ({ error: labDatingError } = await supabase.from("laboratory_dating_results").update(labDatingPayload).eq("lab_id", labDating.lab_id));
      } else if (!excavationError && hasMetadataValue(labDatingDraft)) {
        ({ error: labDatingError } = await supabase.from("laboratory_dating_results").insert([{ ...labDatingPayload, lab_id: generateId("LAB") }]));
      }
    }

    let skeletalInputError = null;
    if (!specimenError && !excavationError && !labDatingError) {
      const skeletalRowToSave = relevantBoneFields.length
        ? { ...keepRelevantSkeletalValues(editForm.bone_type, mergedSkeletalRow), ...nextSkeletalInputPayload, specimen_id: id, created_by: createdBy }
        : undefined;

      if (skeletalInput && skeletalRowToSave) {
        ({ error: skeletalInputError } = await supabase
          .from("skeletal_inputs")
          .update(skeletalRowToSave)
          .eq("specimen_id", id));
      } else if (skeletalRowToSave) {
        ({ error: skeletalInputError } = await supabase
          .from("skeletal_inputs")
          .insert([{ input_id: generateId("SI"), ...skeletalRowToSave }]));
      }
    }

    if (!specimenError && !excavationError && !labDatingError && !skeletalInputError) {
      const deleteResults = await Promise.all(deletedMeasurementIds.map((measurementId) => (
        supabase.from("measurements").delete().eq("measurement_id", measurementId)
      )));
      measurementError = deleteResults.find((result) => result.error)?.error || null;
    }

    if (!specimenError && !excavationError && !labDatingError && !measurementError && !skeletalInputError) {
      const results = await Promise.all(measurements.map((measurement) => {
        const draft = measurementDrafts[measurement.measurement_id];
        return supabase
          .from("measurements")
          .update({
            bone_type: draft.bone_type,
            measurement_type: draft.measurement_type || null,
            value: Number(draft.value),
            unit: draft.unit || null,
            notes: draft.notes.trim() || null,
          })
          .eq("measurement_id", measurement.measurement_id);
      }));
      measurementError = results.find((result) => result.error)?.error || null;
    }

    setSaving(false);
    if (!specimenError && !excavationError && !labDatingError && !measurementError && !skeletalInputError) {
      setSaveSuccess(true);
      setEditing(false);
      await fetchAll();
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError("Error saving: " + (specimenError || excavationError || labDatingError || measurementError || skeletalInputError)?.message || "An unknown error occurred.");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("measurements").delete().eq("specimen_id", id);
    await supabase.from("excavation_records").delete().eq("specimen_id", id);
    await supabase.from("laboratory_dating_results").delete().eq("specimen_id", id);
    await supabase.from("data_quality_log").delete().eq("specimen_id", id);
    const { error } = await supabase.from("specimens").delete().eq("specimen_id", id);
    setDeleting(false);
    if (!error) { navigate("/specimens"); }
    else { alert("Error deleting: " + error.message); }
  }

  function handleNewMeasurementChange(field, value) {
    setNewMeasurement((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddMeasurement() {
    if (!newMeasurement.bone_type || !newMeasurement.value) {
      alert("Please fill in at least Bone Type and Value!");
      return;
    }
    setAddingMeasurement(true);

    // Save measurement to Supabase
    const payload = {
      measurement_id: newMeasurement.id,
      specimen_id: id,
      bone_type: newMeasurement.bone_type,
      measurement_type: newMeasurement.measurement_type,
      value: parseFloat(newMeasurement.value),
      unit: newMeasurement.unit,
      notes: newMeasurement.notes,
    };

    const { error } = await supabase.from("measurements").insert([payload]);
    if (error) {
      alert("Error saving measurement: " + error.message);
      setAddingMeasurement(false);
      return;
    }

    // Run Python AI backend
    const result = await analyseBone({
      specimen_id: id,
      bone_type: newMeasurement.bone_type,
      measurement_type: newMeasurement.measurement_type,
      value: parseFloat(newMeasurement.value),
      unit: newMeasurement.unit,
      shape_category: newMeasurement.shape_category,
      surface_morphology: newMeasurement.surface_morphology,
      joint_surface_present: newMeasurement.joint_surface_present,
      cortical_thickness: newMeasurement.cortical_thickness,
      muscle_attachment: newMeasurement.muscle_attachment,
    });

    if (result) {
      setLatestAnalysis({
        bone_type: newMeasurement.bone_type,
        result: {
          score: result.confidence_score,
          classification: result.overall_classification,
          rules: result.rule_based?.rules,
          isolation_forest: result.isolation_forest,
          z_score: result.z_score,
          is_anomaly: result.is_anomaly,
        }
      });
    }

    setAddingMeasurement(false);
    setMeasurementSuccess(true);
    setNewMeasurement(newMeasurementRow());

    // Refresh data
    const { data: measData } = await supabase
      .from("measurements").select("*").eq("specimen_id", id);
    setMeasurements(measData || []);
    setMeasurementDrafts(Object.fromEntries((measData || []).map((measurement) => [measurement.measurement_id, {
      bone_type: measurement.bone_type || "",
      measurement_type: measurement.measurement_type || "",
      value: measurement.value ?? "",
      unit: measurement.unit || "mm",
      notes: measurement.notes || "",
    }])));

    const { data: logData } = await supabase
      .from("data_quality_log").select("*").eq("specimen_id", id)
      .order("created_at", { ascending: false });
    setQualityLogs(logData || []);

    setTimeout(() => setMeasurementSuccess(false), 3000);
  }

  function handleDeleteMeasurement(measurementId) {
    setMeasurements((prev) => prev.filter((m) => m.measurement_id !== measurementId));
    setMeasurementDrafts((prev) => {
      const next = { ...prev };
      delete next[measurementId];
      return next;
    });
    setDeletedMeasurementIds((current) => [...current, measurementId]);
  }

  const scoreColor = (score) => {
    const s = parseInt(score);
    return s >= 80 ? "text-emerald-400" : s >= 60 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";
  };

  const scoreBg = (score) => {
    const s = parseInt(score);
    return s >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : s >= 60 ? "bg-yellow-500/10 border-yellow-500/20" : s >= 40 ? "bg-orange-500/10 border-orange-500/20" : "bg-red-500/10 border-red-500/20";
  };

  const badgeColor = (state) => {
    const map = {
      Excellent: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      Good: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      Fair: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      Poor: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      Fragmentary: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return map[state] || "bg-white/10 text-white/40 border-white/10";
  };

  const inputClass = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors";
  const selectClass = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors";
  const plainSelect = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors";
  const plainInput = "w-full bg-[#0f1a14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "block text-xs text-white/50 uppercase tracking-wider mb-1.5";
  const editAllowedSides = allowedSidesForCategory(editForm.bone_type);
  const editSideIsLocked = editAllowedSides.length === 1;

  if (loading) return (
    <div className="min-h-screen bg-[#0f1a14] text-white flex items-center justify-center">
      <svg className="animate-spin w-6 h-6 mr-3 text-emerald-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-white/40">Loading specimen...</span>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#0f1a14] text-white flex flex-col items-center justify-center gap-4">
      <p className="text-white/40 text-lg">Specimen not found</p>
      <button onClick={() => navigate("/specimens")} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white transition-colors">Back to List</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <style>{`select option { background-color: #0f1a14; color: white; }`}</style>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f1a14] border border-red-500/30 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete Specimen?</h3>
            <p className="text-white/50 text-sm mb-1">Are you sure you want to delete <span className="text-red-400 font-mono">{id}</span>?</p>
            <p className="text-white/30 text-xs mb-6">This will also delete all related data. This cannot be undone!</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-medium rounded-xl transition-colors">
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/specimens")} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to List
          </button>
          {fromGallery && <button onClick={() => navigate("/gallery")} className="text-sm font-medium text-violet-300 transition-colors hover:text-violet-200">Back to Gallery</button>}
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <button onClick={cancelEditing} className="px-4 py-2 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : !attachmentOnlyEditing ? (
            <>
              <button onClick={startEditing} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Edit Record
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Specimen updated successfully!
          </div>
        )}
        {saveError && (
          <div className="bg-red-500/15 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">
            {saveError}{" "}
            {duplicateSpecimenId && <button type="button" onClick={() => navigate(`/specimens/${encodeURIComponent(duplicateSpecimenId)}`)} className="underline hover:text-red-200">Open existing record</button>}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">
                {editing ? "Editing Record" : "Specimen Record"}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white font-mono">{specimen.specimen_id}</h1>
            <p className="text-white/40 text-sm mt-1">Skeleton ID: <span className="text-white/60">{specimen.skeleton_code || "Skeleton ID not assigned"}</span></p>
          </div>
          {specimen.preservation_state && !editing && (
            <span className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full border ${badgeColor(specimen.preservation_state)}`}>
              {specimen.preservation_state}
            </span>
          )}
        </div>

        {/* Specimen Information */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Specimen Information {editing && <span className="text-emerald-400/60 ml-2">— Editing</span>}
          </p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Specimen ID</label><input value={specimen.specimen_id || ""} readOnly disabled className={`${inputClass} cursor-not-allowed border-white/5 bg-white/5 text-white/35`} /></div>
              <div><label className={labelClass}>Skeleton ID</label><input value={specimen.skeleton_code || ""} readOnly disabled className={`${inputClass} cursor-not-allowed border-white/5 bg-white/5 text-white/35`} /></div>
              <div>
                <label className={labelClass}>Bone Category</label>
                <select name="bone_type" value={editForm.bone_type || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select skeletal element...</option>
                  {editForm.bone_type && !PP1_BONE_LABELS.includes(editForm.bone_type) && <option value={editForm.bone_type}>{editForm.bone_type}</option>}
                  {PP1_BONE_LABELS.map((bone) => <option key={bone} value={bone}>{bone}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Side</label>
                <select name="side" value={editForm.side || "Unknown"} onChange={handleEditChange} disabled={editSideIsLocked} className={selectClass + (editSideIsLocked ? " cursor-not-allowed opacity-65" : "")}>
                  {editForm.side && !editAllowedSides.includes(editForm.side) && <option value={editForm.side}>Legacy: {editForm.side}</option>}
                  {editAllowedSides.map((side) => <option key={side} value={side}>{side}</option>)}
                </select>
                {editSideIsLocked && <p className="text-white/35 text-xs mt-1">{editForm.bone_type === 'Other' ? 'Anatomical side is not applicable to Other.' : 'Midline is automatic because left/right is not anatomically applicable.'}</p>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <MetadataValue label="Specimen ID" value={specimen.specimen_id} />
              <MetadataValue label="Skeleton ID" value={specimen.skeleton_code} />
              <MetadataValue label="Bone Category" value={specimen.bone_type} />
              <MetadataValue label="Side" value={specimen.side} />
            </div>
          )}
        </div>

        {/* Site Information */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Site Information {editing && <span className="text-emerald-400/60 ml-2">— Editing</span>}
          </p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Site Name</label><input name="site_name" value={editForm.site_name || ""} onChange={handleEditChange} className={inputClass} /></div>
              <div>
                <label className={labelClass}>District</label>
                <select name="district" value={editForm.district || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Province</label>
                <select name="province" value={editForm.province || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Time Period</label>
                <select name="time_period" value={editForm.time_period || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select period</option>
                  {TIME_PERIODS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <MetadataValue label="Site Name" value={specimen.site_name} />
              <MetadataValue label="District" value={specimen.district} />
              <MetadataValue label="Province" value={specimen.province} />
              <MetadataValue label="Time Period" value={specimen.time_period} />
            </div>
          )}
        </div>

        {/* Condition & Storage */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Condition &amp; Storage {editing && <span className="text-emerald-400/60 ml-2">— Editing</span>}
          </p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Preservation State</label>
                <select name="preservation_state" value={editForm.preservation_state || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select state</option>
                  {PRESERVATION_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Storage Location</label><input name="location_stored" value={editForm.location_stored || ""} onChange={handleEditChange} className={inputClass} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Notes</label><textarea name="notes" value={editForm.notes || ""} onChange={handleEditChange} rows={3} className={inputClass + " resize-none"} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <MetadataValue label="Preservation State" value={specimen.preservation_state} />
              <MetadataValue label="Storage Location" value={specimen.location_stored} />
              <MetadataValue label="Notes" value={specimen.notes} className="md:col-span-2" />
            </div>
          )}
        </div>

        {editing && getRelevantSkeletalInputFields(editForm.bone_type).length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Bone-specific Observations</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRelevantSkeletalInputFields(editForm.bone_type).map((field) => {
                const value = skeletalInputDraft[field.field] ?? "";
                if (field.type === "select") {
                  return (
                    <div key={field.field}>
                      <label className={labelClass}>{field.label}</label>
                      <select value={value} onChange={(event) => setSkeletalInputDraft((previous) => ({ ...previous, [field.field]: event.target.value }))} className={selectClass}>
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.field}>
                    <label className={labelClass}>{field.label}</label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      min={field.type === "number" ? "0" : undefined}
                      step={field.type === "number" ? "0.1" : undefined}
                      value={value}
                      onChange={(event) => setSkeletalInputDraft((previous) => ({ ...previous, [field.field]: event.target.value }))}
                      className={inputClass}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Specimen image collection */}
        <div ref={attachmentSectionRef} className="order-first scroll-mt-24 rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-950/60 via-white/[0.03] to-cyan-950/30 p-6 shadow-2xl shadow-emerald-950/20">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300/80">Specimen Images</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{specimen.skeleton_code || "Skeleton"}</h2>
              <p className="mt-1 text-sm text-white/45">{catalogueRecords.length} bone records. Select a bone to open its full specimen detail page.</p>
            </div>
            {!editing && !attachmentOnlyEditing && <p className="text-[10px] text-white/25">Choose Edit to manage files and metadata here.</p>}
          </div>

          {catalogueRecords.length > 0 && (
            <div className="mb-7 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {catalogueRecords.map((record) => {
                  const image = record.images[0];
                  const imageSrc = image?.image_url || image?.file_url;
                  const imageLabel = image?.image_view || image?.view_angle || image?.image_type || "Bone image";
                  return (
                    <button
                      key={record.specimen_id}
                      type="button"
                      onClick={() => navigate(image ? `/image/${encodeURIComponent(image.image_id)}` : `/specimens/${encodeURIComponent(record.specimen_id)}`)}
                      className={`group overflow-hidden rounded-xl border text-left transition ${record.specimen_id === specimen.specimen_id ? "border-emerald-400 ring-2 ring-emerald-400/20" : "border-white/10 hover:border-emerald-500/40"}`}
                    >
                      <div className="aspect-[16/10] bg-black/25">
                        {imageSrc ? (
                          <img src={imageSrc} alt={`${record.bone_type || "Bone"} ${imageLabel}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-white/30"><span className="text-2xl">＋</span>No image attached</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-white">{record.bone_type || "Skeletal element"}</p>
                        <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-white/40">{[record.side, record.preservation_state].filter(Boolean).join(" · ") || "Details available"}</p>
                        <p className="mt-2 truncate font-mono text-[10px] text-emerald-300/60">{record.specimen_id}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[1fr_280px] md:items-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">Find Site</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{specimen.site_name || "Site location"}</h3>
                  <p className="mt-1 text-xs text-white/40">Location associated with this skeleton and its bone records.</p>
                </div>
                {siteLocation ? (
                  <SiteLocationMiniMap latitude={siteLocation.latitude} longitude={siteLocation.longitude} siteName={siteLocation.site_name || specimen.site_name} />
                ) : (
                  <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 text-xs text-white/35">No mapped coordinates are available for this site.</div>
                )}
              </div>

            </div>
          )}

          {(editing || attachmentAddRequested || attachmentEditImageId) && (
            <BoneImageList specimenId={specimen.specimen_id} specimen={{ ...specimen, boneCategory: resolveSavedBoneCategory(specimen, measurements) }} editing={editing} addMode={attachmentAddRequested} editImageId={attachmentEditImageId} onFinishSelectedEdit={finishAttachmentEdit} onAttachmentsChange={fetchAll} />
          )}
        </div>

        {/* Measurements */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest">Bone Measurements</p>
              <p className="text-[10px] text-white/20 mt-0.5">{measurements.length} record{measurements.length !== 1 ? "s" : ""}</p>
            </div>
            {editing && <button
              onClick={() => setShowAddMeasurement(!showAddMeasurement)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Measurement
            </button>}
          </div>

          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-3 text-xs uppercase tracking-widest text-emerald-300/80">Biological Profile</p>
            {editing ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div><label className={labelClass}>Age Estimate</label><input name="age_estimate" value={editForm.age_estimate || ""} onChange={handleEditChange} placeholder="e.g. 30-45 years" className={inputClass} /></div>
                <div>
                  <label className={labelClass}>Sex Estimate</label>
                  <select name="sex_estimate" value={editForm.sex_estimate || ""} onChange={handleEditChange} className={selectClass}>
                    <option value="">Select sex estimate</option>
                    {SEX_ESTIMATE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div><label className={labelClass}>Height Estimate (cm)</label><input name="height_estimate" type="number" min="0" step="0.1" value={editForm.height_estimate ?? ""} onChange={handleEditChange} placeholder="e.g. 168.5" className={inputClass} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-4 gap-x-8 md:grid-cols-3">
                <MetadataValue label="Age Estimate" value={specimen.age_estimate} />
                <MetadataValue label="Sex Estimate" value={specimen.sex_estimate} />
                <MetadataValue label="Height Estimate (cm)" value={specimen.height_estimate} />
              </div>
            )}
          </div>

          {measurementSuccess && (
            <div className="mb-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-4 py-3 text-emerald-300 text-xs flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Measurement saved and Python AI analysis complete!
            </div>
          )}

          {/* Latest AI result */}
          {latestAnalysis && (
            <div className={`mb-4 border rounded-xl p-4 ${scoreBg(latestAnalysis.result.score)}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">Latest AI Analysis — {latestAnalysis.bone_type}</p>
                  <p className={`text-sm font-medium mt-0.5 ${scoreColor(latestAnalysis.result.score)}`}>{latestAnalysis.result.classification}</p>
                  {latestAnalysis.result.is_anomaly && <p className="text-xs text-red-400 mt-0.5">⚠️ ML Anomaly Detected!</p>}
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor(latestAnalysis.result.score)}`}>{latestAnalysis.result.score}</p>
                  <p className="text-xs text-white/30">/ 100</p>
                </div>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full ${latestAnalysis.result.score >= 80 ? "bg-emerald-500" : latestAnalysis.result.score >= 60 ? "bg-yellow-500" : latestAnalysis.result.score >= 40 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${latestAnalysis.result.score}%` }} />
              </div>
              {latestAnalysis.result.isolation_forest && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[10px] text-white/30 uppercase">Isolation Forest ML</p>
                    <p className="text-xs text-white/50 mt-0.5">{latestAnalysis.result.isolation_forest.detail}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[10px] text-white/30 uppercase">Z-Score Statistical</p>
                    <p className="text-xs text-white/50 mt-0.5">{latestAnalysis.result.z_score?.detail}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Measurement Form */}
          {editing && showAddMeasurement && (
            <div className="mb-5 border border-emerald-500/20 rounded-xl p-5 bg-emerald-500/[0.03]">
              <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-4">New Measurement + Python AI Analysis</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Bone Type *</label>
                  <select value={newMeasurement.bone_type} onChange={(e) => handleNewMeasurementChange("bone_type", e.target.value)} className={plainSelect}>
                    <option value="">Select bone</option>
                    {PP1_BONE_LABELS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Measurement Type</label>
                  <select value={newMeasurement.measurement_type} onChange={(e) => handleNewMeasurementChange("measurement_type", e.target.value)} className={plainSelect}>
                    <option value="">Select type</option>
                    {MEASUREMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Value *</label>
                  <input type="number" min="0" value={newMeasurement.value} onChange={(e) => handleNewMeasurementChange("value", e.target.value)} placeholder="0.00" className={plainInput} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Unit</label>
                  <select value={newMeasurement.unit} onChange={(e) => handleNewMeasurementChange("unit", e.target.value)} className={plainSelect}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Notes</label>
                  <input type="text" value={newMeasurement.notes} onChange={(e) => handleNewMeasurementChange("notes", e.target.value)} placeholder="Optional notes..." className={plainInput} />
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 mb-4">
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-wider mb-3">Morphological Observations (for Python AI)</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Shape</label>
                    <select value={newMeasurement.shape_category} onChange={(e) => handleNewMeasurementChange("shape_category", e.target.value)} className={plainSelect}>
                      <option value="">Select</option>
                      {SHAPE_CATEGORIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Surface</label>
                    <select value={newMeasurement.surface_morphology} onChange={(e) => handleNewMeasurementChange("surface_morphology", e.target.value)} className={plainSelect}>
                      <option value="">Select</option>
                      {["smooth","slightly-rough","rough","porous","other"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Joint Surface</label>
                    <select value={newMeasurement.joint_surface_present} onChange={(e) => handleNewMeasurementChange("joint_surface_present", e.target.value)} className={plainSelect}>
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Cortical</label>
                    <select value={newMeasurement.cortical_thickness} onChange={(e) => handleNewMeasurementChange("cortical_thickness", e.target.value)} className={plainSelect}>
                      <option value="">Select</option>
                      {["thin","normal","thick"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Muscle Attach.</label>
                    <select value={newMeasurement.muscle_attachment} onChange={(e) => handleNewMeasurementChange("muscle_attachment", e.target.value)} className={plainSelect}>
                      <option value="">Select</option>
                      {["present","faint","absent"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowAddMeasurement(false); setNewMeasurement(newMeasurementRow()); }} className="px-4 py-2 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">Cancel</button>
                <button onClick={handleAddMeasurement} disabled={addingMeasurement} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white text-sm font-medium rounded-xl transition-colors">
                  {addingMeasurement ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analysing...</>
                  ) : "Save & Run AI Analysis"}
                </button>
              </div>
            </div>
          )}

          {/* Measurements Table */}
          {measurements.length === 0 ? (
            <p className="text-white/25 text-sm">No measurements recorded. Click &quot;Add Measurement&quot; to add one!</p>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Bone Type</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Measurement</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Value</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Unit</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Notes</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, i) => {
                    const draft = measurementDrafts[m.measurement_id] || m;
                    return (
                      <tr key={m.measurement_id || i} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                        <td className="px-3 py-3 text-white/70">
                          {editing ? <select value={draft.bone_type || ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "bone_type", event.target.value)} className={plainSelect}><option value="">Select skeletal element...</option>{draft.bone_type && !PP1_BONE_LABELS.includes(draft.bone_type) && <option value={draft.bone_type}>{draft.bone_type} (legacy)</option>}{PP1_BONE_LABELS.map((bone) => <option key={bone}>{bone}</option>)}</select> : (m.bone_type || "—")}
                        </td>
                        <td className="px-3 py-3 text-white/70">
                          {editing ? <select value={draft.measurement_type || ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "measurement_type", event.target.value)} className={plainSelect}><option value="">Select type</option>{MEASUREMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select> : (m.measurement_type || "—")}
                        </td>
                        <td className="px-3 py-3 text-emerald-400 font-mono">
                          {editing ? <input type="number" min="0" step="any" value={draft.value ?? ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "value", event.target.value)} className={plainInput} /> : (m.value ?? "—")}
                        </td>
                        <td className="px-3 py-3 text-white/50">
                          {editing ? <select value={draft.unit || ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "unit", event.target.value)} className={plainSelect}>{UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select> : (m.unit || "—")}
                        </td>
                        <td className="px-3 py-3 text-white/40">
                          {editing ? <input value={draft.notes || ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "notes", event.target.value)} className={plainInput} /> : (m.notes || "—")}
                        </td>
                        <td className="px-4 py-3">
                          {editing && <button onClick={() => handleDeleteMeasurement(m.measurement_id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Analysis History */}
        {qualityLogs.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">AI Analysis History</p>
            <div className="space-y-3">
              {qualityLogs.map((log, i) => (
                <div key={i} className={`border rounded-xl p-4 ${scoreBg(parseInt(log.status))}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider capitalize">
                        {log.field_name?.replace("bone_analysis_", "").replace(/_/g, " ")}
                      </p>
                      <p className={`text-sm font-medium mt-0.5 ${scoreColor(parseInt(log.status))}`}>{log.issue_type}</p>
                      <p className="text-[10px] text-white/20 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${scoreColor(parseInt(log.status))}`}>{log.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Excavation Record */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Excavation Record</p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Excavation Date</label><input name="excavation_date" type="date" value={excavationDraft.excavation_date} onChange={(event) => setExcavationDraft((draft) => ({ ...draft, excavation_date: event.target.value }))} className={inputClass} style={{ colorScheme: "dark" }} /></div>
              <div><label className={labelClass}>Depth Found (m)</label><input name="depth_found" type="number" min="0" step="0.01" value={excavationDraft.depth_found} onChange={(event) => setExcavationDraft((draft) => ({ ...draft, depth_found: event.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Excavator Name</label><input name="excavator_name" value={excavationDraft.excavator_name} onChange={(event) => setExcavationDraft((draft) => ({ ...draft, excavator_name: event.target.value }))} className={inputClass} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Excavation Notes</label><textarea name="excavation_notes" value={excavationDraft.excavation_notes} onChange={(event) => setExcavationDraft((draft) => ({ ...draft, excavation_notes: event.target.value }))} rows={3} className={inputClass + " resize-none"} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <MetadataValue label="Excavation Date" value={displayDate(excavation?.excavation_date)} />
              <MetadataValue label="Depth Found (m)" value={excavation?.depth_found} />
              <MetadataValue label="Excavator Name" value={excavation?.excavator_name} />
              <MetadataValue label="Excavation Notes" value={excavation?.excavation_notes} className="md:col-span-2" />
            </div>
          )}
        </div>

        {/* Lab Dating */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Laboratory Dating</p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Dating Method</label><select name="dating_method" value={labDatingDraft.dating_method} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, dating_method: event.target.value }))} className={selectClass}><option value="">Select method</option>{DATING_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}</select></div>
              <div><label className={labelClass}>Date Result</label><input name="date_result" value={labDatingDraft.date_result} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, date_result: event.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Date Range Min (BP)</label><input name="date_range_min" type="number" min="0" value={labDatingDraft.date_range_min} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, date_range_min: event.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Date Range Max (BP)</label><input name="date_range_max" type="number" min="0" value={labDatingDraft.date_range_max} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, date_range_max: event.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Lab Name</label><input name="lab_name" value={labDatingDraft.lab_name} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, lab_name: event.target.value }))} className={inputClass} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Result Notes</label><textarea name="result_notes" value={labDatingDraft.result_notes} onChange={(event) => setLabDatingDraft((draft) => ({ ...draft, result_notes: event.target.value }))} rows={3} className={inputClass + " resize-none"} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <MetadataValue label="Dating Method" value={labDating?.dating_method} />
              <MetadataValue label="Date Result" value={labDating?.date_result} />
              <MetadataValue label="Date Range Min (BP)" value={labDating?.date_range_min} />
              <MetadataValue label="Date Range Max (BP)" value={labDating?.date_range_max} />
              <MetadataValue label="Lab Name" value={labDating?.lab_name} />
              <MetadataValue label="Result Notes" value={labDating?.result_notes} className="md:col-span-2" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
