import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';

/* ------------------------------------------------------------------ */
/*  Reference articles that expand inline (tiles 2+)                    */
/* ------------------------------------------------------------------ */
const articles = {
  boneTypes: {
    title: 'Bone Type Reference',
    body: (
      <div className="space-y-4">
        <p className="text-white/60 text-sm leading-relaxed">
          The bone type you choose in Step 1 decides which measurements you enter and what can be predicted.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4">Bone Type</th>
                <th className="text-left py-2 pr-4">Measurements</th>
                <th className="text-left py-2">Predicts</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {[
                ['Skull', 'Brow ridge, mastoid size, jaw shape, cranial suture', 'Sex · Age'],
                ['Pelvis', 'Subpubic angle, sciatic notch, pubic symphysis', 'Sex · Age · Height'],
                ['Upper Limb', 'Humerus length, bone robusticity', 'Sex · Height'],
                ['Lower Limb', 'Femur length, femur head diameter, growth plate', 'Sex · Age · Height'],
                ['Thorax', 'Rib shape, sternum length', 'Age'],
                ['Teeth', 'Teeth type, dental wear, eruption stage', 'Age'],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-white/5">
                  <td className="py-2.5 pr-4 font-medium text-orange-300">{r[0]}</td>
                  <td className="py-2.5 pr-4 text-white/55">{r[1]}</td>
                  <td className="py-2.5 text-white/70">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  methodology: {
    title: 'Prediction Methodology',
    body: (
      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
        <p>
          Predictions apply established osteology decision rules and stature regression formulae adapted from{' '}
          <span className="text-white/80">Bass, W.M. (2005), Human Osteology (5th ed.)</span>.
        </p>
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div>
            <span className="text-emerald-400">Stature (femur)</span> = 2.15 × femur(cm) + 72.57 &nbsp;
            <span className="text-white/30">(±3.80 cm)</span>
          </div>
          <div>
            <span className="text-emerald-400">Stature (humerus)</span> = 2.68 × humerus(cm) + 83.19 &nbsp;
            <span className="text-white/30">(±4.25 cm)</span>
          </div>
        </div>
        <ul className="list-disc list-inside space-y-1.5 text-white/55">
          <li><b className="text-blue-300">Sex</b> from brow ridge, mastoid size, sciatic notch, femur head diameter, robusticity.</li>
          <li><b className="text-purple-300">Age</b> from cranial suture closure, pubic symphysis, growth-plate fusion, rib shape, dental wear.</li>
          <li><b className="text-emerald-300">Height</b> from long-bone length regression (limb bones only).</li>
          <li><b>Confidence</b> scales with the number of usable measurements provided.</li>
        </ul>
        <p className="text-white/40 text-xs italic">
          Note: thresholds are tuned toward South Asian / Sri Lankan population averages.
        </p>
      </div>
    ),
  },
  glossary: {
    title: 'Glossary of Terms',
    body: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          ['Biological profile', 'The set of estimated traits: sex, age and stature.'],
          ['Mastoid process', 'Bony bump behind the ear; larger in males.'],
          ['Cranial suture', 'Joints between skull bones; fuse progressively with age.'],
          ['Pubic symphysis', 'Pelvic joint surface; texture indicates age.'],
          ['Sciatic notch', 'Notch in the pelvis; wider in females.'],
          ['Robusticity', 'How rugged/muscular a bone is; higher in males.'],
          ['Growth plate', 'Cartilage that fuses when growth completes (~25).'],
          ['Stature', 'Estimated living height, from long-bone length.'],
        ].map(([t, d]) => (
          <div key={t} className="bg-white/[0.03] border border-white/10 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-300">{t}</p>
            <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    ),
  },
  faq: {
    title: 'FAQ',
    body: (
      <div className="space-y-3">
        {[
          ['Why is a result "Indeterminate"?', 'The measurements you entered don\'t point clearly to one outcome. Add more diagnostic measurements to sharpen it.'],
          ['Why is Height "Unknown"?', 'Height is only estimated from limb bones (femur/humerus). Skull, teeth and thorax do not produce a stature estimate.'],
          ['Can I edit a case after saving?', 'Open it from Past Analysis to review and re-generate its report.'],
          ['How is confidence calculated?', 'It rises with the number of usable measurements. More complete input → higher confidence, capped per bone type.'],
          ['Is the Case ID editable?', 'No — it is auto-generated so records stay unique and traceable.'],
        ].map(([q, a]) => (
          <details key={q} className="group bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-medium text-white/90 marker:text-orange-400 list-none flex items-center justify-between">
              {q}
              <span className="text-white/30 group-open:rotate-180 transition-transform">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <p className="text-sm text-white/55 mt-2 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  Reference tile definitions                                         */
/* ------------------------------------------------------------------ */
const refTiles = [
  {
    key: 'boneTypes',
    title: 'Bone Type Reference',
    desc: 'What each of the 6 bone types measures and predicts.',
    accent: '#3B82F6',
    badge: 'Reference',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3m2-14h14',
  },
  {
    key: 'methodology',
    title: 'Prediction Methodology',
    desc: 'The osteology rules and Bass (2005) stature formulae behind the results.',
    accent: '#8B5CF6',
    badge: 'Science',
    icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
  },
  {
    key: 'glossary',
    title: 'Glossary of Terms',
    desc: 'Plain-language definitions of the osteology terms used across the module.',
    accent: '#10B981',
    badge: 'Definitions',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    key: 'faq',
    title: 'Frequently Asked Questions',
    desc: 'Quick answers to the questions new analysts ask most.',
    accent: '#EC4899',
    badge: 'Help',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [openArticle, setOpenArticle] = useState(null);

  const toggle = (key) => setOpenArticle((prev) => (prev === key ? null : key));

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader
        title="Knowledge Base"
        subtitle="Tutorials, references and guides for the Automated Skeletal Analysis System"
      />

      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* ---------------- FEATURED TILE: LEARNING PATH (COURSE) ---------------- */}
        <button
          onClick={() => navigate('/skeletal/knowledge/course')}
          className="group w-full text-left relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.12] via-orange-500/[0.04] to-transparent hover:border-emerald-500/50 transition-all p-8 mb-8"
        >
          <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-emerald-500/10 blur-3xl kb-glow" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-9 h-9">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                  Guided course
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/30">Quizzes · Certificate</span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-emerald-200 transition-colors">
                Skeletal Analysis — Learning Path
              </h2>
              <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
                A self-paced, Coursera-style course. Work through four modules and clear a checkpoint quiz to unlock the
                next — finish to earn your certificate. Your progress is saved automatically.
              </p>

              {/* module chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['Foundations', 'Skull', 'Skeleton', 'Using the System'].map((s, i) => (
                  <span key={s} className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    <span className="text-emerald-300/70 mr-1">{i + 1}</span>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 self-start md:self-center">
              <span className="inline-flex items-center gap-2 bg-emerald-600 group-hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Start course
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </button>

        {/* ---------------- FEATURED TILE: TUTORIAL ---------------- */}
        <button
          onClick={() => navigate('/skeletal/knowledge/tutorial')}
          className="group w-full text-left relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.12] to-orange-500/[0.02] hover:border-orange-500/50 transition-all p-8 mb-8"
        >
          {/* glow */}
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-9 h-9">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border border-orange-500/40 text-orange-300 bg-orange-500/10">
                  Start here
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/30">Visual · Step-by-step</span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-orange-200 transition-colors">
                New Analysis — Complete Tutorial
              </h2>
              <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
                A full visual walkthrough that trains you to run a skeletal analysis from start to finish — every screen,
                every field, and how the prediction is made. Perfect for onboarding new analysts.
              </p>

              {/* mini step chips */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['1 · Basic Info', '2 · Measurements', '3 · Review & Predict'].map((s) => (
                  <span key={s} className="text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="shrink-0 self-start md:self-center">
              <span className="inline-flex items-center gap-2 bg-orange-500 group-hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Open tutorial
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </button>

        {/* ---------------- FEATURED TILE: VISUAL GUIDE ---------------- */}
        <button
          onClick={() => navigate('/skeletal/knowledge/guide')}
          className="group w-full text-left relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/[0.10] to-purple-500/[0.03] hover:border-blue-500/50 transition-all p-6 sm:p-8 mb-8"
        >
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl kb-glow" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border border-blue-500/40 text-blue-300 bg-blue-500/10">
                  Interactive · Animated
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white/30">Real specimen images</span>
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-blue-200 transition-colors">
                Bone Feature Guide
              </h2>
              <p className="text-white/55 text-sm mt-2 max-w-xl leading-relaxed">
                An auto-playing visual tour of every skeletal feature the system reads — brow ridge, mastoid, jaw,
                sutures, pelvis, femur, ribs, sternum and teeth — each with a real image, its categories, and what it
                predicts.
              </p>

              {/* predict legend */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  ['Sex', '#3B82F6'],
                  ['Age', '#8B5CF6'],
                  ['Height', '#10B981'],
                ].map(([label, color]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[11px] text-white/60 bg-white/5 border border-white/10 rounded-full px-3 py-1"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* thumbnail preview strip */}
            <div className="flex gap-2 shrink-0">
              {[
                '/kb/skull-all.png',
                '/kb/pelvis.png',
                '/kb/lower-limb.png',
                '/kb/teeth-type.png',
              ].map((src, i) => (
                <div
                  key={src}
                  className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-white/15 bg-slate-950 flex items-center justify-center p-1 kb-float"
                  style={{ animationDelay: `${i * 0.4}s` }}
                >
                  <img src={src} alt="" loading="lazy" className="max-w-full max-h-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-6 flex items-center justify-end">
            <span className="inline-flex items-center gap-2 bg-blue-500 group-hover:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Open guide
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </button>

        {/* ---------------- REFERENCE TILES ---------------- */}
        <p className="text-xs text-white/30 uppercase tracking-widest mb-4">Reference material</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {refTiles.map((t) => {
            const isOpen = openArticle === t.key;
            return (
              <button
                key={t.key}
                onClick={() => toggle(t.key)}
                className={`group text-left rounded-2xl border p-6 transition-all duration-200 ${
                  isOpen
                    ? 'bg-white/[0.07] border-white/25'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: t.accent + '22', color: t.accent }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                    </svg>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded-full border"
                    style={{ color: t.accent, borderColor: t.accent + '44', backgroundColor: t.accent + '11' }}
                  >
                    {t.badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-orange-300 transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-white/45 leading-relaxed">{t.desc}</p>
                <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/30">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {isOpen ? 'Hide' : 'Read'}
                </div>
              </button>
            );
          })}
        </div>

        {/* ---------------- EXPANDED ARTICLE ---------------- */}
        {openArticle && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{articles[openArticle].title}</h3>
              <button
                onClick={() => setOpenArticle(null)}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {articles[openArticle].body}
          </div>
        )}
      </div>
    </div>
  );
}
