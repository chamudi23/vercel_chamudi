import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { analyseBone } from "../api";
import BoneImageList from "../components/BoneImageList";

const TIME_PERIODS = ["Mesolithic","Neolithic","Bronze Age","Iron Age","Protohistoric","Early Historic","Medieval","Unknown"];
const PRESERVATION_STATES = ["Excellent","Good","Fair","Poor","Fragmentary"];
const DISTRICTS = ["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"];
const PROVINCES = ["Western","Central","Southern","Northern","Eastern","North Western","North Central","Uva","Sabaragamuwa"];

const BONE_TYPES = [
  "Femur","Tibia","Fibula","Humerus","Humerus (Distal End)",
  "Radius","Ulna","Skull","Mandible (Left)","Mandible (Right)",
  "Maxilla (Left)","Maxilla (Right)","Maxilla (Upper)",
  "Molar 1st (Upper)","Molar 1st (Lower)","Molar 2nd (Upper)",
  "Molar 2nd (Lower)","Molar 3rd (Upper)","Molar 3rd (Lower)",
  "Premolar 1st (Upper)","Premolar 1st (Lower)",
  "Premolar 2nd (Upper)","Premolar 2nd (Lower)",
  "Clavicle","Scapula","Pelvis","Vertebra","Rib","Sternum",
  "Patella","Calcaneum (Left)","Calcaneum (Right)",
  "Astragalus (Left)","Astragalus (Right)",
  "Metacarpal","Metatarsal","Phalanx (Hand)","Phalanx (Foot)","Other",
];

const MEASUREMENT_TYPES = [
  "Maximum Length","Minimum Length","Maximum Width",
  "Minimum Width","Maximum Diameter","Minimum Diameter",
  "Circumference","Height","Depth","Thickness","Other",
];

const UNITS = ["mm","cm","m"];
const SHAPE_CATEGORIES = ["rounded","dome-shaped","curved","flat","triangular","cylindrical","bowl-shaped","U-shaped","S-shaped","irregular","block-shaped","ring-shaped","oval","other"];

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

export default function SpecimenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const attachmentSectionRef = useRef(null);
  const attachmentSectionRequested = searchParams.get("section") === "attachments";
  const attachmentEditImageId = attachmentSectionRequested ? (searchParams.get("editImage") || "") : "";
  const fromGallery = searchParams.get("from") === "gallery";

  const [specimen, setSpecimen] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [excavation, setExcavation] = useState(null);
  const [labDating, setLabDating] = useState(null);
  const [qualityLogs, setQualityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [measurementDrafts, setMeasurementDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

    setSpecimen(specData);
    setEditForm(specData);

    const { data: measData } = await supabase
      .from("measurements")
      .select("*")
      .eq("specimen_id", specData.specimen_id);
    setMeasurements(measData || []);
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

    const { data: labData } = await supabase
      .from("laboratory_dating_results")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .single();
    setLabDating(labData || null);

    const { data: logData } = await supabase
      .from("data_quality_log")
      .select("*")
      .eq("specimen_id", specData.specimen_id)
      .order("created_at", { ascending: false });
    setQualityLogs(logData || []);

    setLoading(false);
  }, [id]);

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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
    setEditForm(specimen);
    setMeasurementDrafts(Object.fromEntries(measurements.map((measurement) => [measurement.measurement_id, {
      bone_type: measurement.bone_type || "",
      measurement_type: measurement.measurement_type || "",
      value: measurement.value ?? "",
      unit: measurement.unit || "mm",
      notes: measurement.notes || "",
    }])));
    setEditing(true);
  }

  function cancelEditing() {
    setEditForm(specimen);
    setEditing(false);
  }

  function handleMeasurementEdit(measurementId, field, value) {
    setMeasurementDrafts((current) => ({
      ...current,
      [measurementId]: { ...current[measurementId], [field]: value },
    }));
  }

  async function handleSave() {
    const invalidMeasurement = measurements.find((measurement) => {
      const draft = measurementDrafts[measurement.measurement_id];
      return !draft?.bone_type || draft.value === "" || Number.isNaN(Number(draft.value));
    });
    if (invalidMeasurement) {
      alert("Each measurement must have a bone type and numeric value.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("specimens")
      .update({
        site_name: editForm.site_name,
        district: editForm.district,
        province: editForm.province,
        time_period: editForm.time_period,
        preservation_state: editForm.preservation_state,
        location_stored: editForm.location_stored,
        burial_context: editForm.burial_context,
        notes: editForm.notes,
      })
      .eq("specimen_id", id);

    let measurementError = null;
    if (!error) {
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
    if (!error && !measurementError) {
      setSpecimen({ ...specimen, ...editForm, specimen_id: specimen.specimen_id, skeleton_code: specimen.skeleton_code });
      setMeasurements((current) => current.map((measurement) => ({
        ...measurement,
        ...measurementDrafts[measurement.measurement_id],
        value: Number(measurementDrafts[measurement.measurement_id].value),
      })));
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Error saving: " + (error || measurementError).message);
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

    const { data: logData } = await supabase
      .from("data_quality_log").select("*").eq("specimen_id", id)
      .order("created_at", { ascending: false });
    setQualityLogs(logData || []);

    setTimeout(() => setMeasurementSuccess(false), 3000);
  }

  async function handleDeleteMeasurement(measurementId) {
    await supabase.from("measurements").delete().eq("measurement_id", measurementId);
    setMeasurements((prev) => prev.filter((m) => m.measurement_id !== measurementId));
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
          {!editing ? (
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
          ) : (
            <>
              <button onClick={cancelEditing} className="px-4 py-2 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Specimen updated successfully!
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

        {/* Specimen Info */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">
            Specimen Information {editing && <span className="text-emerald-400/60 ml-2">— Editing</span>}
          </p>
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Specimen ID</label><input value={specimen.specimen_id || ""} readOnly disabled className={`${inputClass} cursor-not-allowed border-white/5 bg-white/5 text-white/35`} /></div>
              <div><label className={labelClass}>Skeleton ID</label><input value={specimen.skeleton_code || ""} readOnly disabled className={`${inputClass} cursor-not-allowed border-white/5 bg-white/5 text-white/35`} /></div>
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
              <div>
                <label className={labelClass}>Preservation State</label>
                <select name="preservation_state" value={editForm.preservation_state || ""} onChange={handleEditChange} className={selectClass}>
                  <option value="">Select state</option>
                  {PRESERVATION_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Storage Location</label><input name="location_stored" value={editForm.location_stored || ""} onChange={handleEditChange} className={inputClass} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Burial Context</label><input name="burial_context" value={editForm.burial_context || ""} onChange={handleEditChange} className={inputClass} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Notes</label><textarea name="notes" value={editForm.notes || ""} onChange={handleEditChange} rows={3} className={inputClass + " resize-none"} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {[
                { label: "Site Name", value: specimen.site_name },
                { label: "District", value: specimen.district },
                { label: "Province", value: specimen.province },
                { label: "Time Period", value: specimen.time_period },
                { label: "Storage Location", value: specimen.location_stored },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-white/80">{item.value || "—"}</p>
                </div>
              ))}
              <div className="md:col-span-2">
                <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Burial Context</p>
                <p className="text-white/80">{specimen.burial_context || "—"}</p>
              </div>
              {specimen.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-white/30 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-white/80">{specimen.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attached Images */}
        <div ref={attachmentSectionRef} className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/30">Attached Images</p>
              <p className="mt-1 text-[10px] text-white/20">{attachmentEditImageId ? "Only the selected attachment is editable. Specimen data and measurements remain read-only." : "Images linked through the shared bone_images records."}</p>
            </div>
            {!editing && !attachmentEditImageId && <p className="text-[10px] text-white/25">Choose Edit to manage files and metadata here.</p>}
          </div>
          <BoneImageList specimenId={specimen.specimen_id} editing={editing} editImageId={attachmentEditImageId} onFinishSelectedEdit={finishAttachmentEdit} />
        </div>

        {/* Measurements */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest">Bone Measurements</p>
              <p className="text-[10px] text-white/20 mt-0.5">{measurements.length} record{measurements.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setShowAddMeasurement(!showAddMeasurement)}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Measurement
            </button>
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
          {showAddMeasurement && (
            <div className="mb-5 border border-emerald-500/20 rounded-xl p-5 bg-emerald-500/[0.03]">
              <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-4">New Measurement + Python AI Analysis</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-white/30 uppercase tracking-wider mb-1">Bone Type *</label>
                  <select value={newMeasurement.bone_type} onChange={(e) => handleNewMeasurementChange("bone_type", e.target.value)} className={plainSelect}>
                    <option value="">Select bone</option>
                    {BONE_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
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
                          {editing ? <select value={draft.bone_type || ""} onChange={(event) => handleMeasurementEdit(m.measurement_id, "bone_type", event.target.value)} className={plainSelect}><option value="">Select bone</option>{BONE_TYPES.map((bone) => <option key={bone}>{bone}</option>)}</select> : (m.bone_type || "—")}
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
          {!excavation ? (
            <p className="text-white/25 text-sm">No excavation record for this specimen.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Date</p><p className="text-white/80">{excavation.excavation_date || "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Phase</p><p className="text-white/80">{excavation.excavation_phase || "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Depth Found (m)</p><p className="text-white/80">{excavation.depth_found ?? "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavator Name</p><p className="text-white/80">{excavation.excavator_name || "—"}</p></div>
              {excavation.excavation_notes && (
                <div className="md:col-span-2"><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Excavation Notes</p><p className="text-white/80">{excavation.excavation_notes}</p></div>
              )}
            </div>
          )}
        </div>

        {/* Lab Dating */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Laboratory Dating</p>
          {!labDating ? (
            <p className="text-white/25 text-sm">No laboratory dating results for this specimen.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Dating Method</p><p className="text-white/80">{labDating.dating_method || "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Result</p><p className="text-white/80 font-mono">{labDating.date_result || "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Range Min (BP)</p><p className="text-white/80 font-mono">{labDating.date_range_min ?? "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Date Range Max (BP)</p><p className="text-white/80 font-mono">{labDating.date_range_max ?? "—"}</p></div>
              <div><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Lab Name</p><p className="text-white/80">{labDating.lab_name || "—"}</p></div>
              {labDating.result_notes && (
                <div className="md:col-span-2"><p className="text-xs text-white/30 uppercase tracking-wider mb-1">Result Notes</p><p className="text-white/80">{labDating.result_notes}</p></div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
