/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Camera,
  ChevronDown,
  Database,
  Image as ImageIcon,
  Layers3,
  Map,
  MapPin,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import SkullyAvatar from '../components/assistant/SkullyAvatar'
import excavationHero from '../assets/oahris-excavation-hero.png'

const imageUrls = {
  hero: excavationHero,
  lab:
    'https://images.unsplash.com/photo-1639772823849-6efbd173043c?auto=format&fit=crop&q=80&w=1600',
  sriLankaRuins:
    'https://images.pexels.com/photos/12584869/pexels-photo-12584869.jpeg?auto=compress&cs=tinysrgb&w=1600',
  skeletalRemains:
    'https://images.pexels.com/photos/18416951/pexels-photo-18416951.jpeg?auto=compress&cs=tinysrgb&w=1600',
  analytics:
    'https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?auto=format&fit=crop&q=80&w=1600',
  labAnalytics:
    'https://images.unsplash.com/photo-1748609160056-7b95f30041f0?auto=format&fit=crop&q=80&w=1600',
}

const modules = [
  {
    title: 'Data Integration & Management',
    description:
      'Centralized specimen record management with data integration, validation rules, and consistency checks across multiple osteoarchaeological data sources.',
    icon: Database,
    link: '/minuri',
    image: imageUrls.lab,
    tags: ['Specimen Records', 'Data Validation', 'Data Quality'],
    iconClass: 'bg-blue-400/10 text-blue-300 ring-blue-400/25',
    tagClass: 'border-blue-400/20 bg-blue-400/10 text-blue-100',
    linkClass: 'text-blue-300',
    hoverClass: 'hover:border-blue-400/50 hover:shadow-blue-500/20',
  },
  {
    title: 'GIS & Spatial Analysis',
    description:
      'GIS tools to map skeletal find locations and archaeological sites. Supports spatial and temporal interpretation of osteoarchaeological records across Sri Lanka.',
    icon: Map,
    link: '/parami/home',
    image: imageUrls.sriLankaRuins,
    tags: ['Site Mapping', 'Spatial Queries', 'Temporal Analysis'],
    iconClass: 'bg-purple-400/10 text-purple-300 ring-purple-400/25',
    tagClass: 'border-purple-400/20 bg-purple-400/10 text-purple-100',
    linkClass: 'text-purple-300',
    hoverClass: 'hover:border-purple-400/50 hover:shadow-purple-500/20',
  },
  {
    title: 'Skeletal Image Documentation',
    description:
      'Skeletal image documentation, annotation, retrieval and visualization module. Manage image records with standardized metadata connected to a skeletal viewer.',
    icon: Camera,
    link: '/image-documentation',
    image: imageUrls.skeletalRemains,
    tags: ['Image Upload', 'Metadata', 'SVG Skeleton', 'Search'],
    iconClass: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
    tagClass: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    linkClass: 'text-emerald-300',
    hoverClass: 'hover:border-emerald-400/50 hover:shadow-emerald-500/20',
  },
  {
    title: 'Skeletal Analysis',
    description:
      'Guided skeletal assessment workflows and clear data visualizations that support the interpretation of osteoarchaeological specimen records.',
    icon: Brain,
    link: '/skeletal',
    image: imageUrls.analytics,
    tags: ['Assessment', 'Documentation', 'Dashboards'],
    iconClass: 'bg-orange-400/10 text-orange-300 ring-orange-400/25',
    tagClass: 'border-orange-400/20 bg-orange-400/10 text-orange-100',
    linkClass: 'text-orange-300',
    hoverClass: 'hover:border-orange-400/50 hover:shadow-orange-500/20',
  },
]

const featureHighlights = [
  {
    title: 'Multi-Source Data Integration',
    text: 'Structured specimen records, metadata quality checks, and linked research context in one workspace.',
    icon: ShieldCheck,
    accent: 'text-blue-300 bg-blue-400/10 ring-blue-400/20',
  },
  {
    title: '2D Skeletal Visualization',
    text: 'Interactive skeletal views connect image records with anatomical regions for faster inspection.',
    icon: Layers3,
    accent: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/20',
  },
  {
    title: 'Structured Analysis',
    text: 'Guided workflows and dashboards support consistent interpretation of curated skeletal records.',
    icon: Brain,
    accent: 'text-orange-300 bg-orange-400/10 ring-orange-400/20',
  },
]

const galleryImages = [
  {
    title: 'Polonnaruwa Ruins',
    label: 'Research Context',
    image: imageUrls.hero,
  },
  {
    title: 'Field Mapping',
    label: 'Spatial Records',
    image: imageUrls.sriLankaRuins,
  },
  {
    title: 'Skeletal Archive',
    label: 'Image Evidence',
    image: imageUrls.skeletalRemains,
  },
  {
    title: 'Laboratory Review',
    label: 'Data Workflow',
    image: imageUrls.labAnalytics,
  },
]

const skullyQuickActions = [
  { label: 'Find a specimen', to: '/specimens', icon: Search },
  { label: 'Explore a site', to: '/parami/home', icon: MapPin },
  { label: 'Learn a workflow', to: '/skeletal/knowledge', icon: BookOpen },
]

function SkullyLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const [showCallout, setShowCallout] = useState(true)
  const launcherRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!launcherRef.current?.contains(event.target)) setIsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div ref={launcherRef} className="fixed bottom-5 right-4 z-[60] sm:bottom-7 sm:right-7">
      {isOpen && (
        <section
          id="skully-launcher-panel"
          className="mb-3 w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl border border-teal-300/15 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
          aria-label="Skully quick assistant"
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-4">
            <div className="flex items-center gap-3">
              <SkullyAvatar size="medium" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-100">Skully</h2>
                  <span className="rounded-full bg-teal-300/[0.1] px-2 py-0.5 text-[10px] font-medium text-teal-100">
                    OAHRIS Model 1.1
                  </span>
                </div>
                <p className="mt-1 text-xs text-teal-200/75">Research assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
              aria-label="Close Skully panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <p className="text-sm leading-6 text-slate-300">
              Hi, I’m Skully. I can help you explore OAHRIS records and workflows.
            </p>
            <div className="mt-4 grid gap-2">
              {skullyQuickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-sm text-slate-300 transition hover:border-teal-300/20 hover:bg-teal-300/[0.07] hover:text-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
                >
                  <action.icon className="h-4 w-4 text-teal-300" aria-hidden="true" />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
            <Link
              to="/ai-assistant"
              onClick={() => setIsOpen(false)}
              className="mt-4 flex items-center justify-between rounded-xl bg-teal-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span>Open AI Assistant</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}

      {showCallout && !isOpen && (
        <section className="relative mb-3 w-[17.5rem] rounded-2xl border border-teal-300/20 bg-slate-950/95 px-4 py-3.5 shadow-xl shadow-black/45 backdrop-blur-xl" aria-label="Skully assistant introduction">
          <div className="absolute -bottom-1 right-6 h-3 w-3 rotate-45 border-b border-r border-teal-300/20 bg-slate-950" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setShowCallout(false)}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            aria-label="Dismiss Skully introduction"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="pr-7 text-sm font-medium text-slate-100">Hi, I’m Skully — your AI assistant.</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Ask about specimens, sites, or workflows.</p>
          <Link
            to="/ai-assistant"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-200 transition hover:text-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <span>Open assistant</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      )}

      <div className="group relative ml-auto w-fit">
        <span className="pointer-events-none absolute right-0 top-1/2 mr-[4.5rem] -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
          Ask Skully
        </span>
        <button
          type="button"
          onClick={() => {
            setShowCallout(false)
            setIsOpen((open) => !open)
          }}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-300/25 bg-slate-950/95 shadow-xl shadow-black/40 transition hover:-translate-y-0.5 hover:border-teal-300/45 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 sm:h-16 sm:w-16"
          aria-label={isOpen ? 'Close Skully assistant' : 'Ask Skully'}
          aria-expanded={isOpen}
          aria-controls="skully-launcher-panel"
        >
          <span className="pointer-events-none absolute inset-1 rounded-[0.9rem] border border-teal-300/10 motion-safe:animate-pulse" aria-hidden="true" />
          <SkullyAvatar size="medium" />
        </button>
      </div>
    </div>
  )
}

function Reveal({ children, className = '', delay = 0, immediate = false }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(immediate)

  useEffect(() => {
    if (immediate) {
      return undefined
    }

    const element = ref.current

    if (!element) {
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.12 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [immediate])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        'transition-all duration-700 ease-out',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function ModuleCard({ module, index }) {
  const Icon = module.icon

  return (
    <Reveal delay={index * 90}>
      <Link
        to={module.link}
        className={[
          'group relative block min-h-[390px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:scale-[1.02]',
          module.hoverClass,
        ].join(' ')}
      >
        <img
          src={module.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-105 group-hover:opacity-45"
          loading="lazy"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/80 to-[#0a0f1a]/30" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="relative z-10 flex h-full min-h-[342px] flex-col">
          <div
            className={[
              'mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg ring-1 backdrop-blur-md',
              module.iconClass,
            ].join(' ')}
          >
            <Icon className="h-6 w-6" />
          </div>

          <h3 className="mb-3 text-xl font-semibold text-white">{module.title}</h3>
          <p className="text-sm leading-6 text-white/65">{module.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {module.tags.map((tag) => (
              <span
                key={tag}
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md',
                  module.tagClass,
                ].join(' ')}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className={[
              'mt-auto flex items-center gap-2 pt-8 text-sm font-semibold transition group-hover:translate-x-1',
              module.linkClass,
            ].join(' ')}
          >
            <span>Open Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </Reveal>
  )
}

function FeatureCard({ feature, index }) {
  const Icon = feature.icon

  return (
    <Reveal delay={index * 80}>
      <div className="h-full rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/30 hover:bg-white/[0.05]">
        <div className={['mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1', feature.accent].join(' ')}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-white">{feature.title}</h3>
        <p className="mt-3 text-sm leading-6 text-white/60">{feature.text}</p>
      </div>
    </Reveal>
  )
}

function GalleryCard({ item, index }) {
  return (
    <Reveal delay={index * 70}>
      <div className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] sm:aspect-[3/4] lg:aspect-[4/3]">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a]/95 via-[#0a0f1a]/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-200/70">{item.label}</p>
          <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
        </div>
      </div>
    </Reveal>
  )
}

function HomePage() {
  const [heroOffset, setHeroOffset] = useState(0)

  useEffect(() => {
    let frameId = null

    const handleScroll = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        setHeroOffset(window.scrollY * 0.08)
        frameId = null
      })
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)

      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  const scrollToSection = (sectionId) => (event) => {
    event.preventDefault()
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="overflow-hidden bg-[#0a0f1a] text-white">
      <section className="relative flex min-h-[calc(100vh-220px)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
        <img
          src={imageUrls.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: `translateY(${heroOffset}px) scale(1.06)` }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/48 via-[#0a0f1a]/58 to-[#0a0f1a]/72" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />
        <div className="absolute inset-x-0 bottom-0 z-[5] h-44 bg-gradient-to-b from-transparent via-[#0a0f1a]/80 to-[#0a0f1a]" aria-hidden="true" />

        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <Reveal immediate>
            <h1 className="mx-auto max-w-4xl break-words text-3xl font-bold leading-[1.08] tracking-normal text-white sm:text-5xl md:text-6xl">
              Osteoarchaeological Research{' '}
              <span className="text-emerald-400">Information System</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl break-words text-sm leading-7 text-white/70 sm:text-base md:text-lg">
              A centralized platform for managing skeletal specimen records, measurements, image documentation, and interactive anatomical exploration.
            </p>
          </Reveal>

          <Reveal delay={220} immediate>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/specimens"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 sm:w-auto"
              >
                <span>Browse Specimen Records</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:border-emerald-300/50 hover:bg-white/[0.08] sm:w-auto"
              >
                <ImageIcon className="h-4 w-4" />
                <span>View Image Library</span>
              </Link>
            </div>
          </Reveal>
        </div>

        <a
          href="#modules"
          onClick={scrollToSection('modules')}
          className="absolute bottom-5 left-1/2 z-10 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-md transition hover:text-emerald-300"
          aria-label="Scroll to system modules"
        >
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      <section id="modules" className="relative z-10 -mt-12 px-5 pb-20 pt-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/70">System Modules</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">A connected research workspace for skeletal records</h2>
            <p className="mt-4 text-sm leading-6 text-white/60 md:text-base">
              OAHRIS brings specimen records, spatial context, image evidence, and analysis workflows into one dark, focused research interface.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {modules.map((module, index) => (
              <ModuleCard key={module.title} module={module} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {featureHighlights.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/70">Gallery Preview</p>
              <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Visual records from field to lab</h2>
            </div>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {galleryImages.map((item, index) => (
              <GalleryCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <SkullyLauncher />

    </main>
  )
}

export default HomePage
