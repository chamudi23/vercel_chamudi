/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bone,
  BrainCircuit,
  Camera,
  Database,
  FileImage,
  Images,
  Layers,
  MousePointer2,
  ScanLine,
  Upload,
} from 'lucide-react'

const imageUrls = {
  hero:
    'https://images.unsplash.com/photo-1549836067-1aba91c8d8b6?auto=format&fit=crop&q=80&w=2200',
  upload:
    'https://images.unsplash.com/photo-1772764331317-4934ee566292?auto=format&fit=crop&q=80&w=1600',
  gallery:
    'https://images.unsplash.com/photo-1534534502714-2828e7c540d0?auto=format&fit=crop&q=80&w=1600',
  viewer:
    'https://images.unsplash.com/photo-1549836067-1aba91c8d8b6?auto=format&fit=crop&q=80&w=1600',
  assistant:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600',
}

const subModules = [
  {
    icon: Upload,
    title: 'Upload Image',
    description:
      'Upload skeletal bone images with full specimen metadata including bone name, side, condition, context notes, and excavation reference.',
    tags: ['Image Upload', 'Metadata', 'Specimen Link'],
    link: '/upload',
    image: imageUrls.upload,
    iconClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    linkClass: 'text-violet-300 hover:text-violet-200',
  },
  {
    icon: Images,
    title: 'Image Gallery',
    description:
      'Browse, filter, and search all uploaded skeletal images by specimen, bone type, site, or condition. Retrieve records with full metadata context.',
    tags: ['Browse', 'Search', 'Filter', 'Retrieve'],
    link: '/gallery',
    image: imageUrls.gallery,
    iconClass: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    linkClass: 'text-violet-300 hover:text-violet-200',
  },
  {
    icon: Layers,
    title: 'Skeleton Viewer',
    description:
      'Select anatomical regions in the interactive skeleton map to retrieve linked specimen images.',
    tags: ['2D Skeleton', 'Bone Linkage', 'Bone Map', 'Interactive'],
    link: '/skeleton',
    image: imageUrls.viewer,
    iconClass: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
    linkClass: 'text-violet-300 hover:text-violet-200',
  },
  {
    icon: BrainCircuit,
    title: 'Retrieval Assistant',
    description:
      'Ask natural-language retrieval questions about skeletal image records, bone conditions, skeleton codes, and sites.',
    tags: ['Natural Language', 'Query', 'Rule Based'],
    link: '/ai-assistant',
    image: imageUrls.assistant,
    iconClass: 'bg-pink-500/20 text-pink-200 border-pink-500/30',
    linkClass: 'text-pink-300 hover:text-pink-200',
  },
]

const moduleStats = [
  { value: '4', title: 'Sub-modules', label: 'Active Tools' },
  { value: 'Metadata', title: 'Driven', label: 'Retrieval System' },
  { value: '2D', title: 'Linked', label: 'Skeleton Viewer' },
  { value: 'Rules', title: 'Based', label: 'Query Interface' },
]

const workflowSteps = [
  { number: '01', label: 'Select Specimen Record', icon: Database },
  { number: '02', label: 'Upload Images + Metadata', icon: Upload },
  { number: '03', label: 'Add Annotations', icon: ScanLine },
  { number: '04', label: 'Retrieve & Visualize', icon: Layers },
]

function SubModuleCard({ module }) {
  const Icon = module.icon

  return (
    <Link
      to={module.link}
      className="group relative min-h-[360px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:scale-[1.02] hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10"
    >
      <img
        src={module.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
        loading="lazy"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/60 via-[#0a0f1a]/90 to-[#0a0f1a]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent opacity-0 transition group-hover:opacity-100" />

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
          <span>Open</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  )
}

function IlshanModulePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0f1a] text-white">
      <section className="relative px-5 pb-10 pt-8 sm:px-8 lg:pt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.16),transparent_34%),linear-gradient(180deg,#0a0f1a_0%,#0d1320_100%)]" />

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

            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="max-w-3xl">
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300">
                  <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.9)]" />
                  Skeletal Image Documentation
                </p>
                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white md:text-5xl">
                  Image Documentation{' '}
                  <span className="text-violet-400">&amp; Visualization</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                  Upload skeletal bone images with standardized metadata, add annotations, retrieve records, and explore linked 2D skeletal views for complete and fragmented remains.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs text-white/70 backdrop-blur-md">
                    <strong className="mr-1 text-violet-300">4 Tools</strong>
                    active sub-modules
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs text-white/70 backdrop-blur-md">
                    <strong className="mr-1 text-violet-300">Metadata-Driven</strong>
                    retrieval system
                  </span>
                </div>
              </div>

              <div className="relative hidden min-h-[230px] overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1a]/70 p-4 shadow-2xl shadow-violet-950/30 backdrop-blur-md md:block">
                <img
                  src={imageUrls.upload}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-35"
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/25 via-[#0a0f1a]/75 to-[#0a0f1a]" />
                <div className="relative flex h-full min-h-[198px] flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-400/15 text-violet-200">
                      <Bone className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-white/50">
                      Preview
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-200/70">
                      Specimen Media
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Linked Bone Record</h2>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {['Cranium', 'Left', 'Fragmented'].map((item) => (
                        <span key={item} className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-center text-xs text-white/60">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <section className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/70">
                Module Workspace
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Documentation tools for skeletal media records
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-white/50">
              Each sub-module supports the chain from capture and metadata entry through retrieval, visual mapping, and conversational research queries.
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
              <p className="text-3xl font-bold text-violet-400 md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-white/70">{stat.title}</p>
              <p className="mt-1 text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/70">
                How It Works
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">From specimen selection to visual retrieval</h2>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon

                return (
                  <div key={step.number} className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-400/25 bg-violet-400/10 text-violet-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-300/70">{step.number}</p>
                      <p className="text-xs font-medium leading-5 text-white/60">{step.label}</p>
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <ArrowRight className="absolute -right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-white/25 md:block" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: FileImage, title: 'Standardized Media', text: 'Store each image with specimen context, condition notes, and excavation references.' },
            { icon: MousePointer2, title: 'Interactive Mapping', text: 'Connect image evidence to anatomical positions for faster review and interpretation.' },
            { icon: Camera, title: 'Research Context', text: 'Support documentation workflows from field capture through lab-based analysis.' },
          ].map((feature) => {
            const Icon = feature.icon

            return (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-violet-200">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{feature.text}</p>
              </div>
            )
          })}
        </div>
      </section>

    </main>
  )
}

export default IlshanModulePage
