import { useEffect, useState } from "react";
import { ArrowLeft, Boxes, CheckCircle2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase";

const inputBase =
  "w-full rounded-xl border border-white/10 bg-[#0f1a14] px-4 py-2.5 text-sm text-white placeholder-white/25 transition-colors focus:border-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

function AddStorageLocationPage() {
  const navigate = useNavigate();
  const { locationId } = useParams();
  const editing = Boolean(locationId);
  const [form, setForm] = useState({
    location_code: "",
    lab_no: "",
    shelf_no: "",
    description: "",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!editing) return undefined;
    let active = true;

    async function loadLocation() {
      setLoading(true);
      const { data, error } = await supabase
        .from("storage_locations")
        .select("location_code, lab_no, shelf_no, description, is_active")
        .eq("id", locationId)
        .single();

      if (!active) return;
      if (error) {
        setErrors({ submit: `The storage location could not be loaded: ${error.message}` });
      } else {
        setForm({
          location_code: data.location_code || "",
          lab_no: data.lab_no || "",
          shelf_no: data.shelf_no || "",
          description: data.description || "",
          is_active: data.is_active ?? true,
        });
      }
      setLoading(false);
    }

    loadLocation();
    return () => {
      active = false;
    };
  }, [editing, locationId]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((previous) => ({ ...previous, [name]: "", submit: "" }));
    setSuccess("");
  }

  function validate() {
    const nextErrors = {};
    [
      ["location_code", "Location code"],
      ["lab_no", "Lab number"],
      ["shelf_no", "Shelf number"],
    ].forEach(([field, label]) => {
      const value = form[field].trim();
      if (!value) nextErrors[field] = `${label} is required.`;
      else if (value.length > 50) nextErrors[field] = `${label} must be 50 characters or fewer.`;
    });
    return nextErrors;
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

    const payload = {
      location_code: form.location_code.trim().toUpperCase(),
      lab_no: form.lab_no.trim().toUpperCase(),
      shelf_no: form.shelf_no.trim().toUpperCase(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    const query = editing
      ? supabase.from("storage_locations").update(payload).eq("id", locationId)
      : supabase.from("storage_locations").insert(payload);
    const { data, error } = await query.select("display_label").single();

    if (error) {
      setErrors({
        submit:
          error.code === "23505"
            ? "That location, lab, and shelf combination already exists."
            : error.message || "The storage location could not be saved.",
      });
    } else {
      setSuccess(`${data.display_label} was ${editing ? "updated" : "added"} successfully.`);
      if (editing) {
        setTimeout(() => navigate("/minuri/storage-locations"), 1000);
      } else {
        setForm({
          location_code: "",
          lab_no: "",
          shelf_no: "",
          description: "",
          is_active: true,
        });
      }
    }
    setSaving(false);
  }

  const inputClass = (name) => `${inputBase} ${errors[name] ? "border-red-500" : ""}`;

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(editing ? "/minuri/storage-locations" : "/minuri")}
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {editing ? "Back to Locations" : "Back to Module"}
          </button>
          <span className="text-xs uppercase tracking-widest text-white/30">{editing ? "Edit Storage" : "Storage Form"}</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">{editing ? "Update Record" : "New Record"}</p>
          <h1 className="text-3xl font-bold">{editing ? "Edit Storage Location" : "Add Storage Location"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Register a laboratory shelf or storage slot for use when specimens are added.
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/15 px-5 py-4 text-sm text-red-200">
            {errors.submit}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-5 py-4 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="rounded-xl bg-emerald-400/10 p-2 text-emerald-300">
                <Boxes className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/35">Storage Details</p>
                <h2 className="mt-1 text-xl font-semibold">Location and shelf</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                ["Location Code", "location_code", "e.g. PGIAR"],
                ["Lab Number", "lab_no", "e.g. LAB-01"],
                ["Shelf Number", "shelf_no", "e.g. A-01"],
              ].map(([label, name, placeholder]) => (
                <div key={name}>
                  <label htmlFor={name} className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
                    {label} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={name}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder={placeholder}
                    disabled={loading}
                    className={inputClass(name)}
                  />
                  {errors[name] && <p className="mt-1 text-xs text-red-400">{errors[name]}</p>}
                </div>
              ))}

              <div className="md:col-span-2">
                <label htmlFor="description" className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="e.g. Osteology laboratory - cabinet A"
                  disabled={loading}
                  className={`${inputClass("description")} resize-y`}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 md:col-span-2">
                <input
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                  disabled={loading}
                  className="h-4 w-4 rounded border-white/20 accent-emerald-500"
                />
                <span>
                  <span className="block text-sm text-white/75">Active storage location</span>
                  <span className="mt-0.5 block text-xs text-white/35">Active locations appear in the specimen registration form.</span>
                </span>
              </label>
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate("/minuri/storage-locations")}
              disabled={saving || loading}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/55 transition hover:text-white disabled:opacity-40"
            >
              View Locations
            </button>
            <button
              type="submit"
              disabled={saving || loading || Boolean(errors.submit && loading)}
              className="rounded-xl bg-emerald-600 px-7 py-2.5 text-sm font-medium transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-900 disabled:text-emerald-600"
            >
              {loading ? "Loading Location..." : saving ? "Saving Location..." : editing ? "Save Changes" : "Add Storage Location"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddStorageLocationPage;
