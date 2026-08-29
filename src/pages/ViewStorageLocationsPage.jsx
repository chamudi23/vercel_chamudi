import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes, Building2, FlaskConical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Can } from "../components/auth/AuthGuards";
import { supabase } from "../supabase";

function ViewStorageLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteLocation, setDeleteLocation] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteLocation || deleting) return;
    setDeleting(true);
    setActionError("");

    const { error: deleteError } = await supabase
      .from("storage_locations")
      .delete()
      .eq("id", deleteLocation.id);

    if (deleteError) {
      setActionError(`Could not delete ${deleteLocation.display_label}: ${deleteError.message}`);
      setDeleteLocation(null);
      setDeleting(false);
      return;
    }

    setLocations((current) => current.filter((location) => location.id !== deleteLocation.id));
    setDeleteLocation(null);
    setDeleting(false);
  }

  useEffect(() => {
    let active = true;

    async function loadLocations() {
      setLoading(true);
      setError("");
      const { data, error: loadError } = await supabase
        .from("storage_locations")
        .select("id, location_code, lab_no, shelf_no, display_label, description, is_active, created_at")
        .order("location_code", { ascending: true })
        .order("lab_no", { ascending: true })
        .order("shelf_no", { ascending: true });

      if (!active) return;
      setLocations(data || []);
      setError(loadError?.message || "");
      setLoading(false);
    }

    loadLocations();
    return () => {
      active = false;
    };
  }, []);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return locations;
    return locations.filter((location) =>
      [
        location.location_code,
        location.lab_no,
        location.shelf_no,
        location.display_label,
        location.description,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [locations, search]);

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link to="/minuri" className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Module
          </Link>
          <span className="text-xs uppercase tracking-widest text-white/30">Storage Records</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">Storage Catalogue</p>
            <h1 className="text-3xl font-bold">Storage Locations</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/40">
              View the laboratories and shelf locations available for specimen storage.
            </p>
          </div>
          <Can write>
            <Link
              to="/minuri/storage-locations/add"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium transition hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Location
            </Link>
          </Can>
        </div>

        {!loading && !error && locations.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
              <span className="sr-only">Search storage locations</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code, lab, shelf, or description"
                className="w-full rounded-xl border border-white/10 bg-white/[0.035] py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none transition focus:border-emerald-500"
              />
            </label>
            <p className="text-sm text-white/35">
              {filteredLocations.length} {filteredLocations.length === 1 ? "location" : "locations"}
            </p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading storage locations">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-red-200">
            <p className="font-semibold">Storage locations could not be loaded.</p>
            <p className="mt-1 text-sm text-red-200/70">{error}</p>
          </div>
        )}

        {actionError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-200">
            {actionError}
          </div>
        )}

        {!loading && !error && locations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <Boxes className="mx-auto h-10 w-10 text-white/20" aria-hidden="true" />
            <p className="mt-4 font-medium text-white/70">No storage locations have been added yet.</p>
          </div>
        )}

        {!loading && !error && locations.length > 0 && filteredLocations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center text-sm text-white/50">
            No storage locations match your search.
          </div>
        )}

        {!loading && !error && filteredLocations.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredLocations.map((location) => (
              <article key={location.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-emerald-400/25 hover:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-emerald-300">
                      {location.display_label}
                    </p>
                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-white/40">
                      {location.description || "No description recorded."}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${location.is_active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/5 text-white/35"}`}>
                    {location.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
                  {[
                    [Building2, "Location", location.location_code],
                    [FlaskConical, "Lab", location.lab_no],
                    [Boxes, "Shelf", location.shelf_no],
                  ].map(([Icon, label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/30">
                        <Icon className="h-3 w-3" aria-hidden="true" />
                        {label}
                      </dt>
                      <dd className="mt-1 truncate text-xs font-medium text-white/65">{value}</dd>
                    </div>
                  ))}
                </dl>
                <Can write>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                    <Link to={`/minuri/storage-locations/edit/${encodeURIComponent(location.id)}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-300 transition hover:bg-amber-400/15">
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </Link>
                    <button type="button" onClick={() => setDeleteLocation(location)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/15">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </Can>
              </article>
            ))}
          </div>
        )}
      </main>

      {deleteLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-location-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#17231b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-location-title" className="text-lg font-bold">Delete storage location?</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  This will permanently delete <span className="font-medium text-white/80">{deleteLocation.display_label}</span>. This action cannot be undone.
                </p>
              </div>
              <button type="button" onClick={() => setDeleteLocation(null)} disabled={deleting} className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close delete confirmation">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteLocation(null)} disabled={deleting} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white disabled:opacity-40">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:bg-red-900">
                {deleting ? "Deleting..." : "Delete Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStorageLocationsPage;
