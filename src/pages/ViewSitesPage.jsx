/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { ArrowLeft, ImageOff, MapPin, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

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
              <button
                key={site.id || site.site_id}
                type="button"
                onClick={() => navigate(`/minuri/sites/${encodeURIComponent(site.site_id)}`)}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left transition duration-200 hover:-translate-y-1 hover:border-emerald-400/35 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                aria-label={`View details for ${site.site_name || site.site_id}`}
              >
                <div className="overflow-hidden">
                  <SiteImage src={site.image_url} siteName={site.site_name} />
                </div>
                <div className="p-4">
                  <h2 className="truncate font-semibold text-white transition group-hover:text-emerald-300">
                    {site.site_name || "Unnamed site"}
                  </h2>
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
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ViewSitesPage;
