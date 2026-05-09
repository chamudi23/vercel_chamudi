import { useNavigate } from "react-router-dom";

const features = [
  {
    id: 1,
    title: "Dashboard",
    description:
      "View overall statistics, gender and age distribution charts, and recent cases at a glance. Monitor total cases, accuracy, and recent predictions.",
    route: "/skeletal/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    accent: "#F97316",
    badge: "Overview",
  },
  {
    id: 2,
    title: "New Analysis",
    description:
      "Start a new skeletal analysis by entering basic specimen information, skull measurements, and skeletal features. Get AI-powered biological profile prediction.",
    route: "/skeletal/analysis/new",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
    accent: "#3B82F6",
    badge: "Entry Point",
  },
  {
    id: 3,
    title: "Past Analysis",
    description:
      "Browse all historical analysis cases in a searchable, sortable table. View details, access reports, and manage past records.",
    route: "/skeletal/cases",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    accent: "#10B981",
    badge: "Records",
  },
  {
    id: 4,
    title: "Prediction Report",
    description:
      "View detailed prediction reports with biological profile results, confidence levels, similar cases comparison, and downloadable PDF reports.",
    route: "/skeletal/report",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    accent: "#8B5CF6",
    badge: "Reports",
  },
  {
    id: 5,
    title: "Knowledge Base",
    description:
      "Access reference materials, measurement guides, and educational resources for osteoarchaeological skeletal analysis methodologies.",
    route: "/skeletal/knowledge",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    accent: "#EC4899",
    badge: "Reference",
  },
];

export default function SkeletalModulePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
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
        <span className="text-xs text-white/30 tracking-widest uppercase">IT22299802 — Chamudi</span>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        {/* Subtle top tag */}
        <div className="flex items-center gap-2 mb-5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs tracking-[0.2em] uppercase text-orange-400/80">
            Automated Analysis Module
          </span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
          Automated Skeletal
          <br />
          <span className="text-orange-400">Analysis System</span>
        </h1>

        <p className="mt-4 text-white/50 max-w-xl leading-relaxed text-sm">
          AI-powered biological profile prediction from skeletal remains.
          Analyze skull measurements, predict gender, age range, and height
          with high confidence using machine learning models trained on
          osteoarchaeological data.
        </p>

        {/* Quick stats strip */}
        <div className="flex flex-wrap gap-4 mt-8">
          {[
            { label: "Total Cases", value: "158" },
            { label: "Accuracy", value: "98.8%" },
            { label: "Module", value: "Chamudi" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2"
            >
              <span className="text-xl font-bold text-orange-400">{s.value}</span>
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
              onClick={() => navigate(f.route)}
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
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
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

        {/* Tech info strip */}
        <div className="mt-8 border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Key Features</p>
          <div className="flex flex-wrap gap-3">
            {[
              { name: "Gender Prediction", desc: "ML-based sex estimation from skull features" },
              { name: "Age Estimation", desc: "Cranial suture & bone density analysis" },
              { name: "Height Calculation", desc: "Long bone regression formulas" },
            ].map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <div>
                  <p className="text-xs font-mono text-orange-300">{t.name}</p>
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
