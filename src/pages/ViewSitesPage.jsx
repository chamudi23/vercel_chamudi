/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, ImageOff, MapPin, Pencil, ShieldAlert, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Can } from "../components/auth/AuthGuards";

function SiteImage({ src, siteName }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-48 items-center justify-center bg-emerald-950/50 text-white/25">
        <div className="text-center">
          <ImageOff className="mx-auto h-9 w-9" aria-hidden="true" />
          <span className="mt-2 block text-xs">No site image</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={siteName ? `${siteName} archaeological site` : "Archaeological site"}
      className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
      onError={() => setFailed(true)}
    />
  );
}

function ViewSitesPage() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleteSite, setDeleteSite] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function storagePathFromUrl(url) {
    const marker = "/storage/v1/object/public/site-images/";
    const markerIndex = String(url || "").indexOf(marker);
    if (markerIndex < 0) return "";
    return decodeURIComponent(String(url).slice(markerIndex + marker.length).split("?")[0]);
  }

  async function handleDelete() {
    if (!deleteSite || deleting) return;
    setDeleting(true);
    setActionError("");

    const { error: deleteError } = await supabase
      .from("sites")
      .delete()
      .eq("site_id", deleteSite.site_id);

    if (deleteError) {
      setActionError(`Could not delete ${deleteSite.site_name || deleteSite.site_id}: ${deleteError.message}`);
      setDeleting(false);
      setDeleteSite(null);
      return;
    }

    const imagePath = storagePathFromUrl(deleteSite.image_url);
    if (imagePath) await supabase.storage.from("site-images").remove([imagePath]);

    setSites((current) => current.filter((site) => site.site_id !== deleteSite.site_id));
    setDeleteSite(null);
    setDeleting(false);
  }

  useEffect(() => {
    let active = true;

    async function loadSites() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("sites")
        .select("id, site_id, site_name, time_period, district, risk_level, image_url")
        .order("site_name", { ascending: true });

      if (!active) return;
      setSites(data || []);
      setError(loadError?.message || "");
      setLoading(false);
    }

    loadSites();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/minuri")}
            className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Module
          </button>
          <span className="text-xs uppercase tracking-widest text-white/30">Site Records</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400/80">Site Catalogue</p>
            <h1 className="text-3xl font-bold">Archaeological Sites</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/40">
              Browse registered excavation sites and open a record to view its complete details.
            </p>
          </div>
          {!loading && !error && (
            <p className="text-sm text-white/35">
              {sites.length} {sites.length === 1 ? "site" : "sites"}
            </p>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading sites">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="h-48 animate-pulse bg-white/[0.06]" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-red-200">
            <p className="font-semibold">Sites could not be loaded.</p>
            <p className="mt-1 text-sm text-red-200/70">{error}</p>
          </div>
        )}

        {!loading && !error && sites.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
            <MapPin className="mx-auto h-10 w-10 text-white/20" aria-hidden="true" />
            <p className="mt-4 font-medium text-white/70">No sites have been added yet.</p>
          </div>
        )}

        {!loading && !error && sites.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sites.map((site) => (
              <article
                key={site.id || site.site_id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left transition duration-200 hover:-translate-y-1 hover:border-emerald-400/35 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-black/20"
              >
                <button type="button" onClick={() => navigate(`/minuri/sites/${encodeURIComponent(site.site_id)}`)} className="block w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400" aria-label={`View details for ${site.site_name || site.site_id}`}>
                  <SiteImage src={site.image_url} siteName={site.site_name} />
                </button>
                <div className="p-4">
                  <button type="button" onClick={() => navigate(`/minuri/sites/${encodeURIComponent(site.site_id)}`)} className="block max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                    <h2 className="truncate font-semibold text-white transition group-hover:text-emerald-300">{site.site_name || "Unnamed site"}</h2>
                  </button>
                  <p className="mt-1 font-mono text-[11px] tracking-wide text-emerald-300/70">
                    {site.site_id || "No site ID"}
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-white/45">
                    <p className="truncate">{site.time_period || "Time period not recorded"}</p>
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {site.district || "District not recorded"}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {site.risk_level ? `${site.risk_level} risk` : "Risk not recorded"}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                    <button type="button" onClick={() => navigate(`/minuri/sites/${encodeURIComponent(site.site_id)}`)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
                    </button>
                    <Can write>
                      <button type="button" onClick={() => navigate(`/sites/edit/${encodeURIComponent(site.site_id)}`)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-400/20 bg-amber-400/5 px-2 py-2 text-[11px] text-amber-300 transition hover:bg-amber-400/15">
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                      </button>
                      <button type="button" onClick={() => setDeleteSite(site)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-2 text-[11px] text-red-300 transition hover:bg-red-500/15">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                      </button>
                    </Can>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {actionError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-200">
            {actionError}
          </div>
        )}
      </main>

      {deleteSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-site-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#17231b] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="delete-site-title" className="text-lg font-bold">Delete site?</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  This will permanently delete <span className="font-medium text-white/80">{deleteSite.site_name || deleteSite.site_id}</span> and its uploaded site image. This action cannot be undone.
                </p>
              </div>
              <button type="button" onClick={() => setDeleteSite(null)} disabled={deleting} className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close delete confirmation">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteSite(null)} disabled={deleting} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white disabled:opacity-40">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:bg-red-900">
                {deleting ? "Deleting..." : "Delete Site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewSitesPage;
