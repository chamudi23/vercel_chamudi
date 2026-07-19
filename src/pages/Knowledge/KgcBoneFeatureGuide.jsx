import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { useReveal } from '../../hooks/useReveal';
import { BONES, FEATURE_SEQUENCE, PREDICT_META } from './kbGuideData';

const AUTOPLAY_MS = 7000;

/* ------------------------------------------------------------------ */
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */

function PredictPill({ type, size = 'sm' }) {
  const m = PREDICT_META[type];
  if (!m) return null;
  const pad = size === 'lg' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5';
  return (
    <span
      className={`font-semibold rounded-full border uppercase tracking-wider ${pad}`}
      style={{ color: m.color, borderColor: m.color + '55', backgroundColor: m.color + '18' }}
    >
      Predicts {m.label}
    </span>
  );
}

// Lean tag (M / F / age band / measurement) shown on a category chip
function LeanTag({ lean }) {
  if (!lean || lean === '—') return null;
  const isMale = lean === 'M';
  const isFemale = lean === 'F';
  const style = isMale
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    : isFemale
    ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  const text = isMale ? '♂ Male' : isFemale ? '♀ Female' : lean;
  return <span className={`text-[9px] px-1.5 py-0.5 rounded border ${style} whitespace-nowrap`}>{text}</span>;
}

// Image with shimmer placeholder + lightbox trigger.
// Uses object-contain so the whole (labelled) figure is always visible.
function GuideImage({ src, alt, onClick, className = '' }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [src]);
  return (
    <div className={`relative overflow-hidden bg-slate-950 flex items-center justify-center ${className}`}>
      {!loaded && <div className="absolute inset-0 kb-shimmer" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        className={`max-w-full max-h-full w-auto h-auto object-contain cursor-zoom-in transition-opacity duration-500 ${
          loaded ? 'opacity-100 kb-anim-fade-in' : 'opacity-0'
        }`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function BoneFeatureGuide() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);          // index into FEATURE_SEQUENCE
  const [playing, setPlaying] = useState(true);
  const [lightbox, setLightbox] = useState(null);
  const timerRef = useRef(null);

  const feature = FEATURE_SEQUENCE[index];
  const activeBone = useMemo(() => BONES.find((b) => b.id === feature.boneId), [feature.boneId]);
  const boneFeatures = activeBone.features;
  const localIndex = boneFeatures.findIndex((f) => f.key === feature.key);

  const go = (i) => setIndex((i + FEATURE_SEQUENCE.length) % FEATURE_SEQUENCE.length);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  const jumpToBone = (boneId) => {
    const i = FEATURE_SEQUENCE.findIndex((f) => f.boneId === boneId);
    if (i >= 0) setIndex(i);
  };
  const jumpToFeatureKey = (key) => {
    const i = FEATURE_SEQUENCE.findIndex((f) => f.key === key);
    if (i >= 0) setIndex(i);
  };

  // Auto-play
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    timerRef.current = setTimeout(() => setIndex((p) => (p + 1) % FEATURE_SEQUENCE.length), AUTOPLAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [index, playing]);

  // Preload the next image for smoother transitions
  useEffect(() => {
    const nextFeature = FEATURE_SEQUENCE[(index + 1) % FEATURE_SEQUENCE.length];
    const img = new Image();
    img.src = nextFeature.image;
  }, [index]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // re-bind each render so next/prev close over latest index

  const introRef = useReveal();
  const gridRef = useReveal();

  const m = PREDICT_META[feature.predicts];

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader
        title="Bone Feature Guide"
        subtitle="An interactive, image-based tour of the skeletal features the system reads — and what each one predicts"
      />

      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* Back link */}
        <button
          onClick={() => navigate('/skeletal/knowledge')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Knowledge Base
        </button>

        {/* ---------------- BONE SELECTOR ---------------- */}
        <div ref={introRef} className="kb-reveal">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Choose a bone</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {BONES.map((bone) => {
              const isActive = bone.id === activeBone.id;
              return (
                <button
                  key={bone.id}
                  onClick={() => jumpToBone(bone.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${
                    isActive
                      ? 'border-orange-500/60 bg-orange-500/[0.08] scale-[1.02]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-slate-950 flex items-center justify-center p-1.5">
                    <img
                      src={bone.image}
                      alt={bone.name}
                      loading="lazy"
                      className={`max-w-full max-h-full object-contain transition-transform duration-500 ${
                        isActive ? 'scale-105' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>
                  <p className={`text-sm font-semibold ${isActive ? 'text-orange-300' : 'text-white/80'}`}>
                    {bone.name}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">{bone.tagline}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bone.predicts.map((p) => (
                      <span
                        key={p}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: PREDICT_META[p].color }}
                        title={`Predicts ${p}`}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------- BONE INTRO ---------------- */}
        <div
          key={activeBone.id}
          className="kb-anim-fade-in mb-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
        >
          <span className="mt-0.5 text-orange-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-white">{activeBone.name}</h3>
              {activeBone.predicts.map((p) => (
                <PredictPill key={p} type={p} />
              ))}
            </div>
            <p className="text-sm text-white/55 leading-relaxed">{activeBone.intro}</p>
          </div>
        </div>

        {/* ---------------- PLAYER ---------------- */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Image side */}
            <div className="relative bg-slate-950">
              <GuideImage
                key={feature.image + index}
                src={feature.image}
                alt={feature.name}
                onClick={() => setLightbox(feature)}
                className="h-72 sm:h-80 lg:h-full lg:min-h-[420px] p-3"
              />

              {/* Top overlays */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <PredictPill type={feature.predicts} size="lg" />
              </div>
              <div className="absolute top-4 right-4 z-10 text-[11px] text-white/70 bg-black/50 backdrop-blur rounded-full px-2.5 py-1">
                {localIndex + 1} / {boneFeatures.length} · {activeBone.name}
              </div>

              {/* zoom hint */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 text-[11px] text-white/60 bg-black/50 backdrop-blur rounded-full px-2.5 py-1">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Click to zoom
              </div>
            </div>

            {/* Text side */}
            <div key={feature.key} className="kb-anim-slide-in p-6 lg:p-8 flex flex-col">
              <p className="text-[11px] uppercase tracking-widest text-white/30 mb-1">
                {activeBone.name} · Feature {localIndex + 1}
              </p>
              <h2 className="text-2xl font-bold text-white mb-3">{feature.name}</h2>
              <p className="text-sm text-white/60 leading-relaxed mb-5">{feature.summary}</p>

              {/* Categories */}
              <p className="text-[11px] uppercase tracking-widest text-white/30 mb-2">Observed categories</p>
              <div className="space-y-2 mb-5">
                {feature.categories.map((c, i) => (
                  <div
                    key={c.label}
                    className="kb-anim-fade-up flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <div className="flex items-center gap-2 min-w-[132px] shrink-0">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{ backgroundColor: m.color + '22', color: m.color }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-white/85 font-medium">{c.label}</span>
                    </div>
                    <span className="text-xs text-white/45 flex-1 leading-snug">{c.note}</span>
                    <LeanTag lean={c.lean} />
                  </div>
                ))}
              </div>

              {/* Importance */}
              <div
                className="mt-auto rounded-xl border p-4"
                style={{ borderColor: m.color + '33', backgroundColor: m.color + '0d' }}
              >
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: m.color }}>
                  Why it matters
                </p>
                <p className="text-sm text-white/60 leading-relaxed">{feature.importance}</p>
              </div>
            </div>
          </div>

          {/* Autoplay progress bar */}
          <div className="h-1 bg-white/5">
            {playing && (
              <div
                key={index}
                className="h-full kb-progress-fill"
                style={{ backgroundColor: m.color, animationDuration: `${AUTOPLAY_MS}ms` }}
              />
            )}
          </div>

          {/* Controls + filmstrip */}
          <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/5 flex items-center justify-center transition-colors"
                aria-label="Previous"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="w-11 h-11 rounded-full bg-orange-500 hover:bg-orange-400 text-white flex items-center justify-center transition-colors kb-pulse-ring"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full border border-white/15 hover:border-white/40 hover:bg-white/5 flex items-center justify-center transition-colors"
                aria-label="Next"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Filmstrip of current bone's features */}
            <div className="flex gap-2 overflow-x-auto flex-1 pb-1">
              {boneFeatures.map((f) => {
                const isActive = f.key === feature.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => jumpToFeatureKey(f.key)}
                    className={`group relative shrink-0 rounded-lg overflow-hidden border transition-all ${
                      isActive ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ width: 64, height: 48 }}
                    title={f.name}
                  >
                    <img src={f.image} alt={f.name} loading="lazy" className="w-full h-full object-contain bg-slate-950" />
                    {!isActive && <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] text-white/30 shrink-0 hidden sm:block">
              ← → to navigate · space to play/pause
            </span>
          </div>
        </div>

        {/* ---------------- FULL GRID (all features) ---------------- */}
        <div ref={gridRef} className="kb-reveal mt-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">All features at a glance</h3>
              <p className="text-sm text-white/40">Every skeletal feature the system can read, grouped by bone.</p>
            </div>
          </div>

          <div className="space-y-8">
            {BONES.map((bone) => (
              <div key={bone.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-orange-300 uppercase tracking-wider">{bone.name}</h4>
                  <div className="flex-1 h-px bg-white/10" />
                  {bone.predicts.map((p) => (
                    <PredictPill key={p} type={p} />
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bone.features.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => {
                        jumpToFeatureKey(f.key);
                        setPlaying(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group text-left rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 overflow-hidden transition-all"
                    >
                      <div className="h-32 overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                        <img
                          src={f.image}
                          alt={f.name}
                          loading="lazy"
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-white/90 group-hover:text-orange-300 transition-colors leading-tight">
                            {f.name}
                          </p>
                        </div>
                        <PredictPill type={f.predicts} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/skeletal/knowledge/tutorial')}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 p-6 text-left transition-all group"
          >
            <p className="text-xs uppercase tracking-widest text-white/30 mb-1">Next</p>
            <p className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">
              New Analysis Tutorial →
            </p>
            <p className="text-sm text-white/45 mt-1">See how these features are entered, step by step.</p>
          </button>
          <button
            onClick={() => navigate('/skeletal/analysis/new')}
            className="flex-1 rounded-2xl border border-orange-500/30 bg-orange-500/[0.08] hover:bg-orange-500/[0.14] p-6 text-left transition-all group"
          >
            <p className="text-xs uppercase tracking-widest text-orange-300/70 mb-1">Start</p>
            <p className="text-base font-semibold text-white group-hover:text-orange-200 transition-colors">
              Run a New Analysis →
            </p>
            <p className="text-sm text-white/45 mt-1">Put the guide into practice on a real specimen.</p>
          </button>
        </div>
      </div>

      {/* ---------------- LIGHTBOX ---------------- */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 kb-anim-fade-in"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white/60 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-w-4xl w-full kb-anim-scale-in" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.name} className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="mt-3 flex items-center gap-3">
              <h3 className="text-white font-semibold">{lightbox.name}</h3>
              <PredictPill type={lightbox.predicts} />
              {lightbox.altImage && (
                <button
                  onClick={() => setLightbox({ ...lightbox, image: lightbox.altImage, altImage: lightbox.image })}
                  className="ml-auto text-xs text-white/50 hover:text-white border border-white/15 rounded-full px-3 py-1 transition-colors"
                >
                  View alternate image ⇄
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
