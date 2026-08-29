/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ImageOff, Landmark, MapPin, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../supabase";

function Detail({ label, value, mono = false }) {
  const displayValue = value === null || value === undefined || value === "" ? "Not recorded" : value;
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</dt>
      <dd className={`mt-1 break-words text-sm text-white/75 ${mono ? "font-mono" : ""}`}>{displayValue}</dd>
    </div>
  );
}

function DetailsSection({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-4">
        <Icon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function formatCreatedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function SiteDetailsPage() {
  const { siteId } = useParams();
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSite() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("sites")
        .select("*")
        .eq("site_id", siteId)
        .maybeSingle();

      if (!active) return;
      setSite(data || null);
      setError(loadError?.message || (!data ? "This site record does not exist." : ""));
      setLoading(false);
    }

    loadSite();
    return () => {
      active = false;
    };
  }, [siteId]);

  const createdAt = formatCreatedAt(site?.created_at);

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <Link to="/minuri/sites" className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Sites
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {loading && (
          <div className="space-y-5" aria-label="Loading site details">
            <div className="h-72 animate-pulse rounded-2xl bg-white/[0.06]" />
            <div className="h-9 w-2/5 animate-pulse rounded bg-white/[0.06]" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
              <div className="h-48 animate-pulse rounded-2xl bg-white/[0.06]" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-red-200">
            <p className="font-semibold">Site details could not be loaded.</p>
            <p className="mt-1 text-sm text-red-200/70">{error}</p>
          </div>
        )}

        {!loading && !error && site && (
          <>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              {site.image_url && !imageFailed ? (
                <img
                  src={site.image_url}
                  alt={`${site.site_name || "Archaeological site"} site`}
                  className="h-72 w-full object-cover sm:h-96"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-emerald-950/50 text-white/25 sm:h-96">
                  <div className="text-center">
                    <ImageOff className="mx-auto h-12 w-12" aria-hidden="true" />
                    <span className="mt-3 block text-sm">No site image available</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8 mt-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-xs tracking-widest text-emerald-400/80">{site.site_id}</p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{site.site_name || "Unnamed site"}</h1>
                <p className="mt-2 text-sm text-white/40">
                  {[site.district, site.province].filter(Boolean).join(", ") || "Location not recorded"}
                </p>
              </div>
              {site.risk_level && (
                <span className="w-fit rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-200">
                  {site.risk_level} Risk
                </span>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <DetailsSection icon={Landmark} title="Site Information">
                <Detail label="Site ID" value={site.site_id} mono />
                <Detail label="Site Name" value={site.site_name} />
                <Detail label="Site Type" value={site.site_type} />
                <Detail label="Time Period" value={site.time_period} />
              </DetailsSection>

              <DetailsSection icon={MapPin} title="Location">
                <Detail label="District" value={site.district} />
                <Detail label="Province" value={site.province} />
                <Detail label="Latitude" value={site.latitude} mono />
                <Detail label="Longitude" value={site.longitude} mono />
              </DetailsSection>

              <DetailsSection icon={CalendarDays} title="Excavation Information">
                <Detail label="Excavation Year" value={site.excavation_year} />
                <Detail label="Record Created" value={createdAt} />
              </DetailsSection>

              <DetailsSection icon={ShieldCheck} title="Heritage Status">
                <Detail label="Protected Status" value={site.protected_status} />
                <Detail label="Risk Level" value={site.risk_level} />
              </DetailsSection>

              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6 md:col-span-2">
                <h2 className="border-b border-white/10 pb-4 font-semibold">Description</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/60">
                  {site.description || "No description has been recorded for this site."}
                </p>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default SiteDetailsPage;
