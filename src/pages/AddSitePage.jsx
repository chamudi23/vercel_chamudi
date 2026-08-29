/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { DISTRICTS, PROVINCES } from "../utils/specimenMetadata";

const TIME_PERIODS = [
  "Upper Paleolithic",
  "Mesolithic",
  "Prehistoric",
  "Iron Age",
  "Early Historic",
  "Classical Period",
  "Medieval",
];
const RISK_LEVELS = ["High", "Medium", "Low"];
const PROTECTED_STATUSES = ["Protected", "Not Protected", "Unknown"];
const SITE_TYPES = [
  "Burial Ground",
  "Cave Site",
  "Ancient City",
  "Rock Shelter",
  "Religious Site",
  "Rock Fortress",
  "Cave Temple",
  "Ancient Port",
  "Habitation Site",
];
const SITE_ID_PATTERN = /^SITE_(\d+)$/i;
const SITE_ID_PAGE_SIZE = 1000;
const currentYear = new Date().getFullYear();
const inputBase =
  "w-full rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white placeholder-white/25 transition-colors focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

function nextSiteId(records) {
  const highestNumber = (records || []).reduce((highest, record) => {
    const match = String(record.site_id || "").trim().match(SITE_ID_PATTERN);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `SITE_${String(highestNumber + 1).padStart(3, "0")}`;
}

async function fetchAllSiteIds() {
  const records = [];

  for (let from = 0; ; from += SITE_ID_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("sites")
      .select("site_id")
      .range(from, from + SITE_ID_PAGE_SIZE - 1);

    if (error) throw error;
    records.push(...(data || []));
    if (!data || data.length < SITE_ID_PAGE_SIZE) break;
  }

  return records;
}

function FieldError({ children }) {
  return children ? <p className="mt-1 text-xs text-red-400">{children}</p> : null;
}

function AddSitePage() {
  const navigate = useNavigate();
  const redirectTimer = useRef(null);
  const [form, setForm] = useState({
    site_id: "",
    site_name: "",
    district: "",
    province: "",
    latitude: "",
    longitude: "",
    site_type: "",
    excavation_year: "",
    time_period: "",
    risk_level: "",
    description: "",
    protected_status: "",
  });
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loadingId, setLoadingId] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function generateSiteId() {
      try {
        const records = await fetchAllSiteIds();
        if (active) {
          setForm((previous) => ({ ...previous, site_id: nextSiteId(records) }));
        }
      } catch (error) {
        if (active) {
          setErrors((previous) => ({
            ...previous,
            loadId: `Could not generate the next Site ID: ${error.message}`,
          }));
        }
      } finally {
        if (active) setLoadingId(false);
      }
    }

    generateSiteId();
    return () => {
      active = false;
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "", submit: "" }));
    setSuccess("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    if (file && !file.type.startsWith("image/")) {
      event.target.value = "";
      setImage(null);
      setErrors((previous) => ({ ...previous, image: "Select a valid image file." }));
      return;
    }

    setImage(file);
    setErrors((previous) => ({ ...previous, image: "", submit: "" }));
  }

  function validate() {
    const nextErrors = {};
    const latitude = form.latitude === "" ? null : Number(form.latitude);
    const longitude = form.longitude === "" ? null : Number(form.longitude);
    const excavationYear = form.excavation_year === "" ? null : Number(form.excavation_year);

    if (!form.site_id) nextErrors.site_id = "A Site ID must be generated before saving.";
    if (!form.site_name.trim()) nextErrors.site_name = "Site name is required.";
    if (!TIME_PERIODS.includes(form.time_period)) nextErrors.time_period = "Select a valid time period.";
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      nextErrors.latitude = "Latitude must be between -90 and 90.";
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      nextErrors.longitude = "Longitude must be between -180 and 180.";
    }
    if (
      excavationYear !== null &&
      (!Number.isInteger(excavationYear) || excavationYear < 1800 || excavationYear > currentYear)
    ) {
      nextErrors.excavation_year = `Enter a whole year from 1800 to ${currentYear}.`;
    }
    if (form.risk_level && !RISK_LEVELS.includes(form.risk_level)) {
      nextErrors.risk_level = "Select a valid risk level.";
    }
    if (form.protected_status && !PROTECTED_STATUSES.includes(form.protected_status)) {
      nextErrors.protected_status = "Select a valid protected status.";
    }

    return nextErrors;
  }

  async function getAvailableSiteId() {
    let candidate = form.site_id;

    while (candidate) {
      const { data, error } = await supabase
        .from("sites")
        .select("site_id")
        .eq("site_id", candidate)
        .maybeSingle();

      if (error) throw error;
      if (!data) return candidate;

      const records = await fetchAllSiteIds();
      candidate = nextSiteId(records);
      setForm((previous) => ({ ...previous, site_id: candidate }));
    }

    throw new Error("A Site ID could not be generated.");
  }

  async function uploadImage(file, siteId) {
    if (!file) return { publicUrl: null, storagePath: null };

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const storagePath = `sites/${siteId}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("site-images")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data } = supabase.storage.from("site-images").getPublicUrl(storagePath);
    return { publicUrl: data.publicUrl, storagePath };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    setSuccess("");
    let uploadedPath = null;

    try {
      const siteId = await getAvailableSiteId();
      const upload = await uploadImage(image, siteId);
      uploadedPath = upload.storagePath;

      const payload = {
        site_id: siteId,
        site_name: form.site_name.trim(),
        district: form.district || null,
        province: form.province || null,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
        site_type: form.site_type.trim() || null,
        excavation_year: form.excavation_year === "" ? null : Number(form.excavation_year),
        time_period: form.time_period,
        risk_level: form.risk_level || null,
        description: form.description.trim() || null,
        protected_status: form.protected_status || null,
        image_url: upload.publicUrl,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sites").insert(payload);
      if (error) throw error;

      setSuccess(`${siteId} was added successfully. Returning to the Minuri module...`);
      redirectTimer.current = setTimeout(() => navigate("/minuri"), 1200);
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage.from("site-images").remove([uploadedPath]);
      }
      setErrors({ submit: error.message || "The site could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  const inputClass = (name) => `${inputBase} ${errors[name] ? "border-red-500" : ""}`;

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <style>{`select option { background-color: #0f1a14; color: white; }`}</style>
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <button type="button" onClick={() => navigate("/minuri")} className="text-sm text-white/50 hover:text-white">
          &larr; Back to Module
        </button>
        <span className="text-xs uppercase tracking-widest text-white/30">Site Form</span>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">New Record</p>
          <h1 className="text-3xl font-bold">Add Archaeological Site</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Register the location, archaeological context, risk status, and an optional site photograph.
          </p>
        </div>

        {errors.loadId && <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-4 text-sm text-amber-200">{errors.loadId}</div>}
        {errors.submit && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/20 px-5 py-4 text-sm text-red-300">{errors.submit}</div>}
        {success && <div className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-4 text-sm text-emerald-300">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-6 border-b border-white/10 pb-4">
              <p className="text-xs uppercase tracking-widest text-white/35">Site Details</p>
              <h2 className="mt-1 text-xl font-semibold">Location and classification</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="site_id" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Site ID</label>
                <input id="site_id" name="site_id" value={loadingId ? "Generating..." : form.site_id} readOnly className={`${inputClass("site_id")} bg-white/[0.04] font-mono text-emerald-300`} />
                <FieldError>{errors.site_id}</FieldError>
              </div>
              <div>
                <label htmlFor="site_name" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Site Name <span className="text-red-400">*</span></label>
                <input id="site_name" name="site_name" value={form.site_name} onChange={handleChange} placeholder="e.g. Batadomba Lena" className={inputClass("site_name")} />
                <FieldError>{errors.site_name}</FieldError>
              </div>

              {[
                ["District", "district", DISTRICTS, "Select district"],
                ["Province", "province", PROVINCES, "Select province"],
              ].map(([label, name, options, placeholder]) => (
                <div key={name}>
                  <label htmlFor={name} className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{label}</label>
                  <select id={name} name={name} value={form[name]} onChange={handleChange} className={inputClass(name)}>
                    <option value="">{placeholder}</option>
                    {options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label htmlFor="latitude" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Latitude</label>
                <input id="latitude" name="latitude" type="number" min="-90" max="90" step="any" value={form.latitude} onChange={handleChange} placeholder="e.g. 6.8333" className={inputClass("latitude")} />
                <FieldError>{errors.latitude}</FieldError>
              </div>
              <div>
                <label htmlFor="longitude" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Longitude</label>
                <input id="longitude" name="longitude" type="number" min="-180" max="180" step="any" value={form.longitude} onChange={handleChange} placeholder="e.g. 80.3833" className={inputClass("longitude")} />
                <FieldError>{errors.longitude}</FieldError>
              </div>
              <div>
                <label htmlFor="site_type" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Site Type</label>
                <select id="site_type" name="site_type" value={form.site_type} onChange={handleChange} className={inputClass("site_type")}>
                  <option value="">Select site type</option>
                  {SITE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="excavation_year" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Excavation Year</label>
                <input id="excavation_year" name="excavation_year" type="number" min="1800" max={currentYear} step="1" value={form.excavation_year} onChange={handleChange} placeholder={`1800–${currentYear}`} className={inputClass("excavation_year")} />
                <FieldError>{errors.excavation_year}</FieldError>
              </div>
              <div>
                <label htmlFor="time_period" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Time Period <span className="text-red-400">*</span></label>
                <select id="time_period" name="time_period" value={form.time_period} onChange={handleChange} className={inputClass("time_period")}>
                  <option value="">Select time period</option>
                  {TIME_PERIODS.map((period) => <option key={period} value={period}>{period}</option>)}
                </select>
                <FieldError>{errors.time_period}</FieldError>
              </div>
              <div>
                <label htmlFor="risk_level" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Risk Level</label>
                <select id="risk_level" name="risk_level" value={form.risk_level} onChange={handleChange} className={inputClass("risk_level")}>
                  <option value="">Select risk level</option>
                  {RISK_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="protected_status" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Protected Status</label>
                <select id="protected_status" name="protected_status" value={form.protected_status} onChange={handleChange} className={inputClass("protected_status")}>
                  <option value="">Select protected status</option>
                  {PROTECTED_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Site context, condition, access, or other notes" className={`${inputClass("description")} resize-y`} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="site_image" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Site Image</label>
                <input id="site_image" type="file" accept="image/*" onChange={handleImageChange} className={`${inputClass("image")} file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-emerald-500`} />
                <FieldError>{errors.image}</FieldError>
                {image && <p className="mt-2 text-xs text-white/45">Selected: {image.name}</p>}
                {previewUrl && <img src={previewUrl} alt="Selected site preview" className="mt-3 h-40 w-full rounded-xl border border-white/10 object-cover sm:w-64" />}
              </div>
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => navigate("/minuri")} disabled={saving} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/55 hover:text-white disabled:opacity-40">Cancel</button>
            <button type="submit" disabled={saving || loadingId || Boolean(errors.loadId) || Boolean(success)} className="rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-medium hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-600">
              {saving ? "Saving Site..." : "Add Site"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddSitePage;
