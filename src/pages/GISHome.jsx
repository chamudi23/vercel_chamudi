/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Search } from 'lucide-react'

const imageUrls = {
  hero:
    'https://images.pexels.com/photos/12584869/pexels-photo-12584869.jpeg?auto=compress&cs=tinysrgb&w=2400',
  siteMapping:
    'https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?auto=format&fit=crop&q=80&w=1600',
  similarFindings:
    'https://images.pexels.com/photos/18416951/pexels-photo-18416951.jpeg?auto=compress&cs=tinysrgb&w=1600',
}

const subModules = [
  {
    icon: MapPin,
    title: 'Site Mapping & Analysis',
    description:
      'Interactive GIS map of Sri Lanka archaeological sites with temporal layer filtering, excavation phase timeline, and DBSCAN AI spatial pattern detection.',
    tags: ['Site Mapping', 'Temporal Layers', 'DBSCAN AI', 'Cluster Detection'],
    link: '/parami',
    image: imageUrls.siteMapping,
    iconClass: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    linkClass: 'text-purple-300 hover:text-purple-200',
  },
  {
    icon: Search,
    title: 'Similar Findings',
    description:
      'Discover archaeologically similar bone findings based on skeletal measurements, burial type, and time period using Rule-Based, K-Means, and KNN machine learning.',
    tags: ['Site Comparison', 'Pattern Match', 'KNN Machine Learning', 'Proximity Search'],
    link: '/parami/similar-findings',
    image: imageUrls.similarFindings,
    iconClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/30',
    linkClass: 'text-fuchsia-300 hover:text-fuchsia-200',
  },
]

const moduleStats = [
  { value: '23', title: 'Sites', label: 'Mapped Locations' },
  { value: 'DBSCAN', title: 'AI Algorithm', label: 'Spatial Clustering' },
  { value: '5', title: 'Phases', label: 'Excavation Timeline' },
  { value: '50K BP', title: 'Coverage', label: 'Time Depth' },
]

function SubModuleCard({ module }) {
  const Icon = module.icon

  return (
    <Link
      to={module.link}
      className="group relative min-h-[360px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10"
    >
      <img
        src={module.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
        loading="lazy"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/60 via-[#0a0f1a]/90 to-[#0a0f1a]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-300/60 to-transparent opacity-0 transition group-hover:opacity-100" />

      <div className="relative z-10 flex h-full min-h-[312px] flex-col">
        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border backdrop-blur-md ${module.iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <h3 className="text-xl font-semibold text-white">{module.title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/60">{module.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {module.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60 backdrop-blur-md"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className={`mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold underline-offset-4 transition group-hover:underline ${module.linkClass}`}>
          <span>Open Module</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

function GISHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0f1a] text-white">
      <section className="relative px-5 pb-10 pt-8 sm:px-8 lg:pt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_34%),linear-gradient(180deg,#0a0f1a_0%,#0d1320_100%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-2xl shadow-black/30 sm:px-8 lg:px-10">
            <img
              src={imageUrls.hero}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1a]/95 via-[#0a0f1a]/78 to-[#0a0f1a]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/85 via-transparent to-transparent" />

            <div className="relative z-10">
              <div className="max-w-3xl">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-purple-300">
                  <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_18px_rgba(192,132,252,0.9)]" />
                  GIS &amp; Spatial Analysis
                </p>
                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white md:text-5xl">
                  GIS &amp; Spatial{' '}
                  <span className="text-purple-400">Analysis Module</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                  Site mapping, temporal layers, and AI spatial pattern detection for
                  osteoarchaeological research across Sri Lanka.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300/70">
                Module Workspace
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Spatial analysis tools for archaeological research
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/50">
              Each sub-module supports the chain from site mapping and temporal filtering
              through AI-driven cluster detection and cross-site similarity matching.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {subModules.map((module) => (
              <SubModuleCard key={module.title} module={module} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-6 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4">
          {moduleStats.map((stat) => (
            <div key={stat.label} className="py-3 text-center">
              <p className="text-3xl font-bold text-purple-400 md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-white/70">{stat.title}</p>
              <p className="mt-1 text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}

export default GISHome
