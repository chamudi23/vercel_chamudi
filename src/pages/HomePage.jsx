/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppAuth } from '../context/AppAuthContext'
import {
  ArrowRight,
  Brain,
  Camera,
  ChevronDown,
  Database,
  Image as ImageIcon,
  Layers3,
  Map,
  ShieldCheck,
} from 'lucide-react'

const imageUrls = {
  hero:
    'https://images.pexels.com/photos/33171754/pexels-photo-33171754.jpeg?auto=compress&cs=tinysrgb&w=2400',
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
    roles: null, // every role can see this one
  },
  {
    title: 'GIS & Spatial Analysis',
    description:
      'GIS tools to map skeletal find locations and archaeological sites. Supports spatial and temporal interpretation of osteoarchaeological records across Sri Lanka.',
    icon: Map,
    link: '/parami',
    image: imageUrls.sriLankaRuins,
    tags: ['Site Mapping', 'Spatial Queries', 'Temporal Analysis'],
    iconClass: 'bg-purple-400/10 text-purple-300 ring-purple-400/25',
    tagClass: 'border-purple-400/20 bg-purple-400/10 text-purple-100',
    linkClass: 'text-purple-300',
    hoverClass: 'hover:border-purple-400/50 hover:shadow-purple-500/20',
    roles: ['researcher', 'student'],
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
    roles: ['researcher', 'student'],
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
    roles: ['researcher', 'student'],
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
    title: '3D Skeletal Visualization',
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
  const { role } = useAppAuth()
  const visibleModules = modules.filter((module) => !module.roles || module.roles.includes(role))
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/65 via-[#0a0f1a]/72 to-[#0a0f1a]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

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

      <section id="modules" className="relative px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/70">System Modules</p>
            <h2 className="mt-4 text-3xl font-semibold text-white md:text-4xl">A connected research workspace for skeletal records</h2>
            <p className="mt-4 text-sm leading-6 text-white/60 md:text-base">
              OAHRIS brings specimen records, spatial context, image evidence, and analysis workflows into one dark, focused research interface.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {visibleModules.map((module, index) => (
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

    </main>
  )
}

export default HomePage
