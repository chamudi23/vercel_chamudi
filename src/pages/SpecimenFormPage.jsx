import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const TIME_PERIODS = [
  "Mesolithic",
  "Neolithic",
  "Bronze Age",
  "Iron Age",
  "Protohistoric",
  "Early Historic",
  "Medieval",
  "Unknown",
];

const PRESERVATION_STATES = [
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Fragmentary",
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

function generateSpecimenId() {
  const num = Math.floor(Math.random() * 900) + 100;
  return `SPEC-${num}`;
}

export default function SpecimenFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
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
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);

    // Check for duplicate specimen_id
    const { data: existing } = await supabase
      .from("specimens")
      .select("specimen_id")
      .eq("specimen_id", form.specimen_id)
      .single();

    if (existing) {
      setErrors({ specimen_id: "This Specimen ID already exists. Use a different ID." });
      setLoading(false);
      return;
    }

    const payload = {
      ...form,
      excavation_year: form.excavation_year ? parseInt(form.excavation_year) : null,
    };

    const { error } = await supabase.from("specimens").insert([payload]);

    setLoading(false);

    if (error) {
      setErrors({ submit: error.message });
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/specimens"), 1500);
    }
  }

  const inputClass = (field) =>
    `w-full bg-[#0f1a14] border ${
      errors[field] ? "border-red-500" : "border-white/10"
    } rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors`;

  const selectClass = (field) =>
    `w-full bg-[#0f1a14] border ${
      errors[field] ? "border-red-500" : "border-white/10"
    } rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer`;

  const labelClass = "block text-xs text-white/50 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      {/* Fix dropdown option colors globally */}
      <style>{`
        select option {
          background-color: #0f1a14;
          color: white;
        }
        select option:hover {
          background-color: #1a2e1f;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          opacity: 1;
        }
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

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">New Record</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Register Specimen</h1>
          <p className="text-white/40 text-sm mt-2">
            Add a new osteoarchaeological specimen with full site and contextual metadata.
          </p>
        </div>

        {/* Success banner */}
        {success && (
          <div className="mb-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-5 py-4 text-emerald-300 text-sm flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Specimen saved successfully! Redirecting to list…
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-500/20 border border-red-500/40 rounded-xl px-5 py-4 text-red-300 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">

          {/* Section 1 — Identity */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Identity</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Specimen ID *</label>
                <div className="flex gap-2">
                  <input
                    name="specimen_id"
                    value={form.specimen_id}
                    onChange={handleChange}
                    placeholder="SPEC-001"
                    className={inputClass("specimen_id") + " flex-1"}
                  />
                  <button
                    onClick={() => setForm((p) => ({ ...p, specimen_id: generateSpecimenId() }))}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white transition-colors"
                    title="Generate new ID"
                  >
                    ↻
                  </button>
                </div>
                {errors.specimen_id && <p className="text-red-400 text-xs mt-1">{errors.specimen_id}</p>}
              </div>

              <div>
                <label className={labelClass}>Skeleton Code *</label>
                <input
                  name="skeleton_code"
                  value={form.skeleton_code}
                  onChange={handleChange}
                  placeholder="SK1"
                  className={inputClass("skeleton_code")}
                />
                {errors.skeleton_code && <p className="text-red-400 text-xs mt-1">{errors.skeleton_code}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 — Site Info */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Site Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Site Name</label>
                <input
                  name="site_name"
                  value={form.site_name}
                  onChange={handleChange}
                  placeholder="e.g. Sigiriya Potana Cave"
                  className={inputClass("site_name")}
                />
              </div>

              <div>
                <label className={labelClass}>District</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className={selectClass("district")}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Province</label>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className={selectClass("province")}
                >
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Excavation Year</label>
                <input
                  name="excavation_year"
                  type="number"
                  min="1"
                  max={new Date().getFullYear()}
                  value={form.excavation_year}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Prevent negative and zero
                    if (val === "" || parseInt(val) >= 1) {
                      handleChange(e);
                    }
                  }}
                  placeholder={`e.g. ${new Date().getFullYear()}`}
                  className={inputClass("excavation_year")}
                />
                {errors.excavation_year && <p className="text-red-400 text-xs mt-1">{errors.excavation_year}</p>}
              </div>

              <div>
                <label className={labelClass}>Time Period</label>
                <select
                  name="time_period"
                  value={form.time_period}
                  onChange={handleChange}
                  className={selectClass("time_period")}
                >
                  <option value="">Select period</option>
                  {TIME_PERIODS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 — Condition */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-5">Condition & Storage</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Preservation State</label>
                <select
                  name="preservation_state"
                  value={form.preservation_state}
                  onChange={handleChange}
                  className={selectClass("preservation_state")}
                >
                  <option value="">Select state</option>
                  {PRESERVATION_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Storage Location</label>
                <input
                  name="location_stored"
                  value={form.location_stored}
                  onChange={handleChange}
                  placeholder="e.g. Lab Shelf B-3"
                  className={inputClass("location_stored")}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Burial Context</label>
                <input
                  name="burial_context"
                  value={form.burial_context}
                  onChange={handleChange}
                  placeholder="e.g. Primary inhumation, extended supine, Context No. 10"
                  className={inputClass("burial_context")}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional observations or remarks..."
                  className={inputClass("notes") + " resize-none"}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => navigate("/specimens")}
              className="px-5 py-2.5 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving…
                </>
              ) : (
                "Save Specimen"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
