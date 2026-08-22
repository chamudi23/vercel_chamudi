/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import {
  CONTROLLED_BONE_CATEGORIES,
  CONTROLLED_BONE_SECTIONS,
  SKELETON_ORIENTATION_MARKERS,
  SKELETON_SVG_GROUPS,
  categorySideKey,
  categorySides,
  parseCategorySideKey,
  skeletonStatusKeysForSvgKey,
  skeletonViewsForMode,
  supportsFullBodyMap,
} from '../utils/pp1ImageModule'

const VIEW_OPTIONS = ['Front', 'Back', 'Both']
const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.35

const SVG_SOURCES = {
  front: '/assets/skeleton/human-skeleton-front.svg',
  back: '/assets/skeleton/human-skeleton-back.svg',
}

const STATUS_STYLES = {
  documented: {
    label: 'Documented',
    fill: 'rgba(56, 189, 248, 0.08)',
    stroke: '#38bdf8',
    badge: 'border-sky-300/40 bg-sky-300/15 text-sky-50',
  },
  present_no_image: {
    label: 'Present, no image',
    fill: 'rgba(245, 158, 11, 0.68)',
    stroke: '#b45309',
    badge: 'border-amber-300/35 bg-amber-300/15 text-amber-100',
  },
  unknown: {
    label: 'Not assessed',
    fill: 'rgba(148, 163, 184, 0.16)',
    stroke: '#64748b',
    badge: 'border-slate-300/20 bg-slate-300/10 text-slate-200',
  },
  selected: {
    label: 'Selected',
    badge: 'border-cyan-300/40 bg-cyan-300/15 text-cyan-50',
  },
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function prepareSvg(svgText, view, statusData, selectedKey, showAllCategories) {
  if (!svgText) return ''

  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const svg = document.documentElement
  const groups = [...svg.querySelectorAll('g')]

  svg.querySelectorAll('script, foreignObject').forEach((node) => node.remove())
  svg.querySelector('rect')?.remove()
  svg.removeAttribute('width')
  svg.removeAttribute('height')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', `${view} interactive skeleton reference view`)
  svg.setAttribute('class', 'h-full w-full')

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = `
    path, polygon, ellipse, circle {
      fill: #cbd5e1 !important;
      stroke: #94a3b8 !important;
      opacity: 0.28;
    }
    [data-bone-key] { cursor: pointer; outline: none; }
    [data-bone-key] path, [data-bone-key] polygon, [data-bone-key] ellipse, [data-bone-key] circle {
      fill: var(--bone-fill) !important;
      stroke: var(--bone-stroke) !important;
      stroke-width: var(--bone-stroke-width, 0.8px) !important;
      stroke-dasharray: var(--bone-dash, none) !important;
      filter: var(--bone-filter, none);
      opacity: var(--bone-opacity, 1);
      transition: fill 140ms ease, stroke 140ms ease;
    }
    [data-bone-key]:hover path, [data-bone-key]:focus path,
    [data-bone-key]:hover polygon, [data-bone-key]:focus polygon,
    [data-bone-key]:hover ellipse, [data-bone-key]:focus ellipse,
    [data-bone-key]:hover circle, [data-bone-key]:focus circle {
      filter: drop-shadow(0 0 3px rgba(34, 211, 238, 0.7));
      stroke-width: 1.6px !important;
    }
  `
  svg.prepend(style)

  Object.entries(SKELETON_SVG_GROUPS[view] || {}).forEach(([key, groupIndexes]) => {
    const statusKeys = skeletonStatusKeysForSvgKey(key)
    const selectedStatusKey = statusKeys.find((statusKey) => (
      statusKey === selectedKey && statusData[statusKey]?.status !== 'unknown'
    ))
    const firstKnownStatusKey = statusKeys.find((statusKey) => (
      statusData[statusKey]?.status && statusData[statusKey].status !== 'unknown'
    ))
    const interactionKey = selectedStatusKey || firstKnownStatusKey || key
    const record = statusData[interactionKey] || statusData[key]
    const baseStatus = record?.status || 'unknown'
    if (!showAllCategories && baseStatus === 'unknown') return

    groupIndexes.forEach((groupIndex, position) => {
      const group = groups[groupIndex]
      if (!group) return

      const selected = interactionKey === selectedKey
      const palette = STATUS_STYLES[baseStatus]
      const highlighted = baseStatus === 'documented' || selected
      const parsed = parseCategorySideKey(interactionKey)
      const sideUnknown = parsed?.side === 'Unknown' && baseStatus !== 'unknown'
      const label = parsed ? `${parsed.category.label}, ${parsed.side}` : key
      const conditionText = record?.fragmented ? ', fragmented condition' : ''

      group.setAttribute('id', position === 0 ? key : `${key}_${position + 1}`)
      group.setAttribute('data-bone-key', interactionKey)
      group.setAttribute('role', 'button')
      group.setAttribute('tabindex', '0')
      group.setAttribute('aria-label', `${label}: ${STATUS_STYLES[baseStatus].label}${conditionText}`)
      group.style.setProperty('--bone-fill', sideUnknown ? 'rgba(148, 163, 184, 0.08)' : palette.fill)
      group.style.setProperty('--bone-stroke', record?.fragmented ? '#ef4444' : highlighted ? '#38bdf8' : palette.stroke)
      group.style.setProperty('--bone-stroke-width', record?.fragmented || highlighted || sideUnknown ? '1.8px' : '0.8px')
      group.style.setProperty('--bone-dash', record?.fragmented || sideUnknown ? '3 1.5' : 'none')
      group.style.setProperty('--bone-filter', highlighted ? 'drop-shadow(0 0 4px rgba(56, 189, 248, 0.95))' : 'none')

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.textContent = `${label} - ${STATUS_STYLES[baseStatus].label}${conditionText}`
      group.prepend(title)
    })
  })

  return new XMLSerializer().serializeToString(svg)
}

function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }) {
  const buttonClass = 'inline-flex items-center gap-1.5 rounded border border-white/10 bg-slate-950/90 px-2.5 py-2 text-xs font-semibold text-white/75 shadow transition hover:border-cyan-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <div className="mb-2 flex flex-wrap justify-end gap-1" aria-label="Skeleton zoom controls">
      <button type="button" onClick={onZoomIn} disabled={scale >= MAX_ZOOM} className={buttonClass} title="Zoom in">
        <ZoomIn size={15} aria-hidden="true" /> Zoom in
      </button>
      <button type="button" onClick={onZoomOut} disabled={scale <= MIN_ZOOM} className={buttonClass} title="Zoom out">
        <ZoomOut size={15} aria-hidden="true" /> Zoom out
      </button>
      <button type="button" onClick={onReset} disabled={scale === MIN_ZOOM} className={buttonClass} title="Reset zoom and position">
        <RotateCcw size={15} aria-hidden="true" /> Reset
      </button>
    </div>
  )
}

function InteractiveSvg({ view, statusData, selectedKey, showAllCategories, onSelect }) {
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [hoverLabel, setHoverLabel] = useState('')
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map())
  const gestureRef = useRef(null)
  const suppressClickRef = useRef(false)
  const orientation = SKELETON_ORIENTATION_MARKERS[view]

  useEffect(() => {
    let active = true
    setSource('')
    setError('')

    fetch(SVG_SOURCES[view])
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load the ${view} skeleton SVG.`)
        return response.text()
      })
      .then((text) => {
        if (active) setSource(text)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })

    return () => { active = false }
  }, [view])

  const svgMarkup = useMemo(
    () => prepareSvg(source, view, statusData, selectedKey, showAllCategories),
    [source, view, statusData, selectedKey, showAllCategories],
  )

  const findBoneKey = (target) => target instanceof Element
    ? target.closest('[data-bone-key]')?.getAttribute('data-bone-key')
    : ''

  const updateHoverLabel = (target) => {
    const key = findBoneKey(target)
    const parsed = parseCategorySideKey(key)
    setHoverLabel(parsed ? `${parsed.category.label} - ${parsed.side}` : '')
  }

  const updateScale = (nextScale) => {
    setTransform((current) => {
      const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
      return scale === MIN_ZOOM ? { scale, x: 0, y: 0 } : { ...current, scale }
    })
  }

  const handlePointerDown = (event) => {
    suppressClickRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const pointers = [...pointersRef.current.values()]
    if (pointers.length === 2) {
      suppressClickRef.current = true
      gestureRef.current = {
        type: 'pinch',
        distance: Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y),
        scale: transform.scale,
      }
    } else if (transform.scale > MIN_ZOOM) {
      gestureRef.current = {
        type: 'pan',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: transform.x,
        y: transform.y,
      }
    }
  }

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const pointers = [...pointersRef.current.values()]

    if (pointers.length === 2 && gestureRef.current?.type === 'pinch') {
      suppressClickRef.current = true
      const distance = Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y)
      updateScale(gestureRef.current.scale * (distance / Math.max(gestureRef.current.distance, 1)))
      return
    }

    if (gestureRef.current?.type === 'pan' && gestureRef.current.pointerId === event.pointerId) {
      if (Math.abs(event.clientX - gestureRef.current.startX) > 3 || Math.abs(event.clientY - gestureRef.current.startY) > 3) {
        suppressClickRef.current = true
      }
      setTransform((current) => ({
        ...current,
        x: gestureRef.current.x + event.clientX - gestureRef.current.startX,
        y: gestureRef.current.y + event.clientY - gestureRef.current.startY,
      }))
    }
  }

  const handlePointerEnd = (event) => {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = null
  }

  if (error) {
    return <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-red-200">{error}</div>
  }

  if (!svgMarkup) {
    return <div className="flex min-h-[420px] items-center justify-center text-sm text-white/45">Loading {view} skeleton...</div>
  }

  return (
    <div className="min-w-0">
      <ZoomControls
        scale={transform.scale}
        onZoomIn={() => updateScale(transform.scale + ZOOM_STEP)}
        onZoomOut={() => updateScale(transform.scale - ZOOM_STEP)}
        onReset={() => setTransform({ scale: 1, x: 0, y: 0 })}
      />
      <div className="relative mx-auto w-full max-w-[390px]">
        <span className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded border border-white/15 bg-slate-950/85 px-2 py-1 text-xs font-bold text-white/70" aria-hidden="true">
          {orientation.left}
        </span>
        <span className="pointer-events-none absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded border border-white/15 bg-slate-950/85 px-2 py-1 text-xs font-bold text-white/70" aria-hidden="true">
          {orientation.right}
        </span>
        <div
        className={`h-[650px] w-full overflow-hidden pb-6 ${transform.scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ touchAction: 'none' }}
        onWheel={(event) => {
          event.preventDefault()
          updateScale(transform.scale + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
          const key = findBoneKey(event.target)
          onSelect(key || '')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onSelect('')
            return
          }
          if (event.key !== 'Enter' && event.key !== ' ') return
          const key = findBoneKey(event.target)
          if (!key) return
          event.preventDefault()
          onSelect(key)
        }}
        onMouseOver={(event) => updateHoverLabel(event.target)}
        onMouseLeave={() => setHoverLabel('')}
        onFocus={(event) => updateHoverLabel(event.target)}
        onBlur={() => setHoverLabel('')}
      >
        <div
          className="h-full w-full transition-transform duration-150"
          style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: 'center' }}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
        </div>
      </div>
      <div className="mx-auto mt-2 grid min-h-8 w-full max-w-[390px] grid-cols-[auto_1fr_auto] items-center gap-2 border-t border-white/10 px-1 pt-2 text-xs text-white/60">
        <span>{`${view[0].toUpperCase()}${view.slice(1)} view`}</span>
        <span className="truncate text-center text-white/45">{hoverLabel}</span>
        <span>{Math.round(transform.scale * 100)}%</span>
      </div>
    </div>
  )
}

function statusButtonClass(status, selected) {
  const palette = STATUS_STYLES[status || 'unknown']
  const selectedClass = selected ? 'ring-2 ring-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.65)]' : ''
  return `rounded-md border px-2 py-1 text-[11px] font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-300/60 ${palette.badge} ${selectedClass}`
}

export default function SkeletonViewer({ statusData = {}, selectedKey = '', onSelect }) {
  const [viewMode, setViewMode] = useState('Both')
  const [categoryMode, setCategoryMode] = useState('available')
  const [search, setSearch] = useState('')

  const availableKeys = useMemo(() => Object.values(statusData)
    .filter((record) => record.status && record.status !== 'unknown')
    .map((record) => record.key), [statusData])

  const availableCategoryCodes = useMemo(() => new Set(availableKeys
    .map((key) => parseCategorySideKey(key)?.category.code)
    .filter(Boolean)), [availableKeys])

  const visibleCategories = useMemo(() => {
    const searchText = search.trim().toLowerCase()
    return CONTROLLED_BONE_CATEGORIES.filter((category) => {
      if (categoryMode === 'available' && !availableCategoryCodes.has(category.code)) return false
      return !searchText || category.label.toLowerCase().includes(searchText)
    })
  }, [availableCategoryCodes, categoryMode, search])

  const visibleSections = useMemo(() => CONTROLLED_BONE_SECTIONS
    .map((section) => ({
      section,
      categories: visibleCategories.filter((category) => category.section === section),
    }))
    .filter((group) => group.categories.length > 0), [visibleCategories])

  const views = skeletonViewsForMode(viewMode)
  const showAllCategories = categoryMode === 'all'

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex w-fit rounded-md border border-white/10 bg-slate-950 p-1" aria-label="Skeleton view">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setViewMode(option)}
                className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === option ? 'bg-cyan-400 text-slate-950' : 'text-white/55 hover:text-white'
                }`}
                aria-pressed={viewMode === option}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="inline-flex w-fit rounded-md border border-white/10 bg-slate-950 p-1" aria-label="Bone category filter">
            <button
              type="button"
              onClick={() => setCategoryMode('available')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${categoryMode === 'available' ? 'bg-white text-slate-950' : 'text-white/55 hover:text-white'}`}
              aria-pressed={categoryMode === 'available'}
            >
              Available bones ({availableCategoryCodes.size})
            </button>
            <button
              type="button"
              onClick={() => setCategoryMode('all')}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${categoryMode === 'all' ? 'bg-white text-slate-950' : 'text-white/55 hover:text-white'}`}
              aria-pressed={categoryMode === 'all'}
            >
              All categories ({CONTROLLED_BONE_CATEGORIES.length})
            </button>
          </div>
        </div>
        <p className="text-xs text-white/40">Only reliably saved bones are highlighted by default.</p>
      </div>

      <div className={`grid items-start gap-4 ${views.length === 2 ? 'md:grid-cols-2' : ''}`}>
        {views.map((view) => (
          <InteractiveSvg
            key={view}
            view={view}
            statusData={statusData}
            selectedKey={selectedKey}
            showAllCategories={showAllCategories}
            onSelect={onSelect}
          />
        ))}
      </div>

      <section className="border-t border-white/10 pt-5" aria-label="Accessible bone category list">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {categoryMode === 'available' ? 'Available skeletal elements' : `All ${CONTROLLED_BONE_CATEGORIES.length} skeletal elements`}
            </h3>
            <p className="mt-1 text-xs text-white/40">
              {categoryMode === 'available'
                ? 'Categories found reliably in saved specimen or measurement records.'
                : 'Categories without a saved record are shown as Not assessed.'}
            </p>
          </div>
          <label className="block sm:w-64">
            <span className="sr-only">Search bone categories</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories"
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/60"
            />
          </label>
        </div>

        <div className="mt-4 space-y-5">
          {visibleSections.map(({ section, categories }) => (
            <section key={section} aria-labelledby={`skeleton-section-${section.replace(/\s+/g, '-').toLowerCase()}`}>
              <h4 id={`skeleton-section-${section.replace(/\s+/g, '-').toLowerCase()}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100/55">
                {section}
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const sides = categoryMode === 'available'
                    ? categorySides(category).filter((side) => {
                      const record = statusData[categorySideKey(category.code, side)]
                      return record && record.status !== 'unknown'
                    })
                    : categorySides(category)
                  const fragmented = sides.some((side) => statusData[categorySideKey(category.code, side)]?.fragmented)
                  const mapSupported = supportsFullBodyMap(category.code)

                  return (
                    <div key={category.code} className="flex min-h-20 items-center justify-between gap-3 rounded-md border border-white/10 bg-slate-950/60 px-3 py-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-white/80">{category.label}</span>
                        {!mapSupported && (
                          <span className="mt-1 block text-[11px] leading-4 text-violet-200/65">
                            Not available on the current full-body anatomical map.
                          </span>
                        )}
                        {fragmented && <span className="mt-1 block text-[11px] font-semibold text-red-300">Fragmented</span>}
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        {sides.map((side) => {
                          const key = categorySideKey(category.code, side)
                          const status = statusData[key]?.status || 'unknown'
                          return (
                            <button
                              key={side}
                              type="button"
                              onClick={() => onSelect(key)}
                              className={statusButtonClass(status, key === selectedKey)}
                              aria-pressed={key === selectedKey}
                              title={`${category.label}, ${side}: ${STATUS_STYLES[status].label}${mapSupported ? '' : '; not available on the current full-body anatomical map'}${statusData[key]?.fragmented ? ', fragmented condition' : ''}`}
                            >
                              {side === 'Unknown' ? (category.laterality === 'none' ? 'Not applicable' : 'Side: Unknown') : side}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {visibleCategories.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed border-white/10 p-4 text-sm text-white/45">
            {categoryMode === 'available' && !search ? 'No controlled bone categories were found in the saved records.' : 'No category matches this search.'}
          </p>
        )}
      </section>
    </div>
  )
}
