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
    title: "Add Site",
    description:
      "Register an archaeological site with location, period, protection and risk details, plus an optional site photograph.",
    route: "/sites/add",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.2 6-11a6 6 0 10-12 0c0 5.8 6 11 6 11z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v6m-3-3h6" />
      </svg>
    ),
    accent: "#34d399",
    badge: "Site Entry",
  },
  {
    id: 4,
    title: "View Sites",
    description:
      "Browse registered archaeological sites in a visual catalogue and open each record to see its complete details.",
    route: "/minuri/sites",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A2.75 2.75 0 015.75 4h12.5A2.75 2.75 0 0121 6.75v10.5A2.75 2.75 0 0118.25 20H5.75A2.75 2.75 0 013 17.25V6.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l4.2-4.2a1.5 1.5 0 012.1 0L13 14.5l1.7-1.7a1.5 1.5 0 012.1 0L21 17M16.5 8.5h.01" />
      </svg>
    ),
    accent: "#2dd4bf",
    badge: "Site Records",
  },
  {
    id: 5,
    title: "Add Storage Location",
    description:
      "Register a laboratory, shelf, or storage slot so it can be selected during specimen registration.",
    route: "/minuri/storage-locations/add",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13zM4 10h16M10 10v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13v4m-2-2h4" />
      </svg>
    ),
    accent: "#a78bfa",
    badge: "Storage Entry",
  },
  {
    id: 6,
    title: "View Storage Locations",
    description:
      "Browse active and inactive specimen storage slots by collection, laboratory, and shelf.",
    route: "/minuri/storage-locations",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16v14H4V6zM7 3h10v3H7V3zM4 11h16M9 11v9M15 11v9" />
      </svg>
    ),
    accent: "#818cf8",
    badge: "Storage Records",
  },
  {
    id: 7,
    title: "Data Import",
    description:
      "Upload a CSV file of bulk specimen records. Preview, validate, and confirm before saving. Errors are shown before import.",
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
    id: 8,
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
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <div className="flex items-center gap-2 mb-5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs tracking-[0.2em] uppercase text-emerald-400/80">Data Integration</span></div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">Centralized Specimen<br /><span className="text-emerald-400">Record Management</span></h1>
        <p className="mt-4 text-white/50 max-w-xl leading-relaxed text-sm">Integrate osteoarchaeological data from multiple sources into a centralized collection. Manage specimen records, run validation checks, and monitor data completeness across the collection.</p>
      </div>
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <button key={feature.id} onClick={() => navigate(feature.route)} className="group text-left bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200 cursor-pointer">
              <div className="flex items-start justify-between mb-5"><div className="p-2.5 rounded-xl" style={{ backgroundColor: feature.accent + "22", color: feature.accent }}>{feature.icon}</div><span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border" style={{ color: feature.accent, borderColor: feature.accent + "44", backgroundColor: feature.accent + "11" }}>{feature.badge}</span></div>
              <div className="text-[11px] text-white/25 mb-1 tracking-wider uppercase">Step {feature.id}</div>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">{feature.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              <div className="mt-5 flex items-center justify-between"><code className="text-[10px] text-white/20 font-mono">{feature.route}</code><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
