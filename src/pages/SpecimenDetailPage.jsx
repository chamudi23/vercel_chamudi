import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

const TIME_PERIODS = ["Mesolithic","Neolithic","Bronze Age","Iron Age","Protohistoric","Early Historic","Medieval","Unknown"];
const PRESERVATION_STATES = ["Excellent","Good","Fair","Poor","Fragmentary"];
const DISTRICTS = ["Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"];
const PROVINCES = ["Western","Central","Southern","Northern","Eastern","North Western","North Central","Uva","Sabaragamuwa"];

export default function SpecimenDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [specimen, setSpecimen] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [excavation, setExcavation] = useState(null);
  const [labDating, setLabDating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  async function fetchAll() {
    setLoading(true);
    const { data: specData, error } = await supabase
      .from("specimens")
      .select("*")
      .eq("specimen_id", id)
      .single();
    if (error || !specData) { setNotFound(true); setLoading(false); return; }
    setSpecimen(specData);
    setEditForm(specData);
    const { data: measData } = await supabase.from("measurements").select("*").eq("specimen_id", specData.specimen_id);
    setMeasurements(measData || []);
    const { data: excData } = await supabase.from("excavation_records").select("*").eq("specimen_id", specData.specimen_id).single();
    setExcavation(excData || null);
    const { data: labData } = await supabase.from("laboratory_dating_results").select("*").eq("specimen_id", specData.specimen_id).single();
    setLabDating(labData || null);
    setLoading(false);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("specimens")
      .update({
        skeleton_code: editForm.skeleton_code,
        site_name: editForm.site_name,
        district: editForm.district,
        province: editForm.province,
        excavation_year: editForm.excavation_year ? parseInt(editForm.excavation_year) : null,
        time_period: editForm.time_period,
        preservation_state: editForm.preservation_state,
        location_stored: editForm.location_stored,
        burial_context: editForm.burial_context,
        notes: editForm.notes,
      })
      .eq("specimen_id", id);
    setSaving(false);
    if (!error) {
      setSpecimen({ ...specimen, ...editForm });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      alert("Error saving: " + error.message);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("measurements").delete().eq("specimen_id", id);
    await supabase.from("excavation_records").delete().eq("specimen_id", id);
    await supabase.from("laboratory_dating_results").delete().eq("specimen_id", id);
    const { error } = await supabase.from("specimens").delete().eq("specimen_id", id);
    setDeleting(false);
    if (!error) { navigate("/specimens"); }
    else { alert("Error deleting: " + error.message); }
  }

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
            <p className="text-white/50 text-sm mb-1">
              Are you sure you want to delete <span className="text-red-400 font-mono">{id}</span>?
            </p>
            <p className="text-white/30 text-xs mb-6">
              This will also delete all related measurements, excavation records, and lab dating results. This cannot be undone!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/specimens")} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to List
        </button>
        <div className="flex items-center gap-3">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditing(false); setEditForm(specimen); }}
                className="px-4 py-2 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm text-white font-medium transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        {saveSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
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
            <p className="text-white/40 text-sm mt-1">
              Skeleton Code: <span className="text-white/60">{specimen.skeleton_code || "—"}</span>
            </p>
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
              <div>
                <label className={labelClass}>Skeleton Code</label>
                <input name="skeleton_code" value={editForm.skeleton_code || ""} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Site Name</label>
                <input name="site_name" value={editForm.site_name || ""} onChange={handleEditChange} className={inputClass} />
              </div>
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
                <label className={labelClass}>Excavation Year</label>
                <input name="excavation_year" type="number" min="1" max={new Date().getFullYear()} value={editForm.excavation_year || ""} onChange={handleEditChange} className={inputClass} />
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
              <div>
                <label className={labelClass}>Storage Location</label>
                <input name="location_stored" value={editForm.location_stored || ""} onChange={handleEditChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Burial Context</label>
                <input name="burial_context" value={editForm.burial_context || ""} onChange={handleEditChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea name="notes" value={editForm.notes || ""} onChange={handleEditChange} rows={3} className={inputClass + " resize-none"} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              {[
                { label: "Site Name", value: specimen.site_name },
                { label: "District", value: specimen.district },
                { label: "Province", value: specimen.province },
                { label: "Excavation Year", value: specimen.excavation_year },
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

        {/* Measurements */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs text-white/30 uppercase tracking-widest">Bone Measurements</p>
            <span className="text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {measurements.length} record{measurements.length !== 1 ? "s" : ""}
            </span>
          </div>
          {measurements.length === 0 ? (
            <p className="text-white/25 text-sm">No measurements recorded for this specimen.</p>
          ) : (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Bone Type</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Measurement Type</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Value</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Unit</th>
                    <th className="text-left px-4 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {measurements.map((m, i) => (
                    <tr key={m.measurement_id || i} className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                      <td className="px-4 py-3 text-white/70">{m.bone_type || "—"}</td>
                      <td className="px-4 py-3 text-white/70">{m.measurement_type || "—"}</td>
                      <td className="px-4 py-3 text-emerald-400 font-mono">{m.value ?? "—"}</td>
                      <td className="px-4 py-3 text-white/50">{m.unit || "—"}</td>
                      <td className="px-4 py-3 text-white/40">{m.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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