/**
 * KgcGuideCarousel.jsx
 * ====================
 * The measurement-guide viewer on Step 2: one guide image at a time, with
 * next/previous controls, for the bone type being analysed.
 *
 * ── Where the artwork comes from ────────────────────────────────────────
 * `public/guides/<bone-slug>/`, where each file is named for the measurement
 * field it illustrates — `skull/cranialSuture.png` for the `cranialSuture`
 * field — plus an optional `overview.png` for the element as a whole. Adding
 * or replacing a guide is a matter of dropping the file in under the right
 * name; nothing here needs changing.
 *
 * ── Why it probes before rendering ──────────────────────────────────────
 * Not every field has artwork yet. A carousel that included a slide per field
 * regardless would deal the reader blank panels and a misleading "3 of 5", so
 * each candidate is loaded once up front and only the ones that decode become
 * slides. This also means the images are already in cache by the time the
 * reader clicks through, so paging is instant.
 *
 * Note the app is served with an SPA fallback: a missing file comes back as
 * 200 with the index document, not a 404. That still fails to decode as an
 * image, so probing catches it where a status check would not.
 *
 * Props
 *   boneType  e.g. 'Skull' — selects the folder and labels the overview
 *   fields    the Step-2 field list for that bone type ({ key, label })
 */

import { useEffect, useMemo, useRef, useState } from 'react'

/** ASA bone type → folder under public/guides. */
const GUIDE_DIR = {
  Skull: 'skull',
  Pelvis: 'pelvis',
  'Upper Limb': 'upper-limb',
  'Lower Limb': 'lower-limb',
  Thorax: 'thorax',
  Teeth: 'teeth',
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  )
}

export default function KgcGuideCarousel({ boneType, fields = [] }) {
  const dir = GUIDE_DIR[boneType]

  // Overview first, then one candidate per measurement field, in form order.
  const candidates = useMemo(() => {
    if (!dir) return []
    return [
      { key: '__overview', src: `/guides/${dir}/overview.png`, caption: `${boneType} — measurement points` },
      ...fields.map((f) => ({ key: f.key, src: `/guides/${dir}/${f.key}.png`, caption: f.label })),
    ]
  }, [dir, boneType, fields])

  const [slides, setSlides] = useState(null) // null while probing
  const [index, setIndex] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    let alive = true
    setSlides(null)
    setIndex(0)
    if (!candidates.length) {
      setSlides([])
      return undefined
    }
    Promise.all(
      candidates.map(
        (c) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(c)
            img.onerror = () => resolve(null) // absent, or the SPA fallback
            img.src = c.src
          })
      )
    ).then((found) => {
      if (alive) setSlides(found.filter(Boolean))
    })
    return () => {
      alive = false
    }
  }, [candidates])

  const count = slides ? slides.length : 0
  const go = (n) => setIndex(((n % count) + count) % count) // wraps both ways

  const onKeyDown = (e) => {
    if (count < 2) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      go(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      go(index + 1)
    }
  }

  if (slides === null) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 h-56 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Loading measurement guides…</span>
      </div>
    )
  }

  if (count === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-6 text-slate-500 text-sm">
        No measurement guide images are available for {boneType} yet.
      </div>
    )
  }

  const current = slides[index]

  return (
    <div
      ref={frameRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${boneType} measurement guides`}
      className="rounded-lg border border-slate-700 overflow-hidden bg-slate-950 focus:outline-none focus:ring-1 focus:ring-orange-500"
    >
      {/* Viewport. The track holds every slide side by side and is shifted by
          whole viewport widths, so paging is one transform rather than a
          swap — which would flash while the next image decodes. */}
      <div className="relative overflow-hidden">
        <div
          className="flex kgc-guide-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={s.key} className="min-w-full" aria-hidden={i !== index}>
              <img
                src={s.src}
                alt={`${s.caption} — measurement guide`}
                className="w-full object-contain bg-slate-950 max-h-[28rem]"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous guide"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-slate-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next guide"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-600 text-slate-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <Chevron dir="right" />
            </button>
          </>
        )}
      </div>

      {/* Caption and position. aria-live so the label is announced on paging,
          since the image itself is swapped out from under a screen reader. */}
      <div className="bg-slate-900 border-t border-slate-700 px-3 py-2 flex items-center justify-between gap-3">
        <p className="text-slate-300 text-xs truncate" aria-live="polite">
          <span className="text-slate-500 font-mono mr-2">
            {index + 1}/{count}
          </span>
          {current.caption}
        </p>

        {count > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show guide ${i + 1}: ${s.caption}`}
                aria-current={i === index}
                className={`w-1.5 h-1.5 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  i === index ? 'bg-orange-400' : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Motion is a convenience here, not information — drop it when the
          reader has asked for reduced motion. */}
      <style>{`
        .kgc-guide-track { transition: transform 300ms ease; }
        @media (prefers-reduced-motion: reduce) {
          .kgc-guide-track { transition: none; }
        }
      `}</style>
    </div>
  )
}
