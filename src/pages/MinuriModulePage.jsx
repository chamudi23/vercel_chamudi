import { useNavigate } from "react-router-dom";

const features = [
  {
    id: 1,
    title: "Specimen Form",
    description:
      "Register a new osteoarchaeological specimen with full metadata — site, district, excavation year, burial context, and preservation state.",
    route: "/specimens/add",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    accent: "#4f9e6f",
    badge: "Entry Point",
  },
  {
    id: 2,
    title: "Specimen List",
    description:
      "Browse all registered specimens in a searchable, filterable table. Filter by district, time period, or preservation state. Export to CSV.",
    route: "/specimens",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    accent: "#4a7fb5",
    badge: "Records",
  },
  {
    id: 3,
    title: "Specimen Detail",
    description:
      "View full specimen metadata, all linked measurements, data completeness score, and a link to Ilshan's image module for that skeleton.",
    route: "/specimens/:id",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    accent: "#7c5cbf",
    badge: "Detail View",
  },
  {
    id: 4,
    title: "Data Import",
    description:
      "Upload a CSV file of bulk specimen records. Preview, validate, and confirm before saving to Supabase. Errors are shown before commit.",
    route: "/specimens/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
    accent: "#c07a3a",
    badge: "Bulk Upload",
  },
  {
    id: 5,
    title: "Data Quality Dashboard",
    description:
      "Monitor total specimens, completeness percentage, missing field summaries, duplicate warnings, and records needing attention.",
    route: "/data-quality",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    accent: "#b54a4a",
    badge: "Analytics",
  },
];

export default function MinuriModulePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f1a14] text-white font-sans">
      {/* Top nav bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to OAHRIS Home
        </button>
        <span className="text-xs text-white/30 tracking-widest uppercase">IT22159908 — Minuri</span>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        {/* Subtle top tag */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">
            Data Integration Module
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Centralized Specimen
          <br />
          <span className="text-emerald-400">Record Management</span>
        </h1>

        <p className="mt-4 text-white/50 max-w-xl leading-relaxed text-sm">
          Integrate osteoarchaeological data from multiple sources into a
          centralized database. Manage specimen records, run validation checks,
          and monitor data completeness across the collection.
        </p>

        {/* Quick stats strip */}
        <div className="flex flex-wrap gap-4 mt-8">
          {[
            { label: "Database Tables", value: "3" },
            { label: "Pages", value: "5" },
            { label: "Module", value: "Minuri" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2"
            >
              <span className="text-xl font-bold text-emerald-400">{s.value}</span>
              <span className="text-xs text-white/40 uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                // Don't navigate to :id placeholder — show list instead
                if (f.route.includes(":")) {
                  navigate("/specimens");
                } else {
                  navigate(f.route);
                }
              }}
              className="group text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200 cursor-pointer"
            >
              {/* Top row: icon + badge */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="p-2.5 rounded-xl"
                  style={{ backgroundColor: f.accent + "22", color: f.accent }}
                >
                  {f.icon}
                </div>
                <span
                  className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border"
                  style={{ color: f.accent, borderColor: f.accent + "44", backgroundColor: f.accent + "11" }}
                >
                  {f.badge}
                </span>
              </div>

              {/* Step number */}
              <div className="text-[11px] text-white/25 mb-1 tracking-wider uppercase">
                Step {f.id}
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                {f.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-white/40 leading-relaxed">{f.description}</p>

              {/* Route tag */}
              <div className="mt-5 flex items-center justify-between">
                <code className="text-[10px] text-white/20 font-mono">{f.route}</code>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* DB tables info strip */}
        <div className="mt-8 border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Supabase Tables</p>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "specimens", desc: "Core record — all metadata" },
              { name: "measurements", desc: "Bone measurements per specimen" },
              { name: "data_quality_log", desc: "Validation issues & status" },
            ].map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-mono text-emerald-300">{t.name}</p>
                  <p className="text-[10px] text-white/30">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
