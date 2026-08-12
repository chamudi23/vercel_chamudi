import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';

/* ------------------------------------------------------------------ */
/*  Small visual helpers (self-contained, styled like the real UI)     */
/* ------------------------------------------------------------------ */

// Coloured prediction badge — mirrors the badges used in Step 2
function PredictBadge({ type }) {
  const map = {
    Sex: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Age: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Height: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[type]}`}>
      Predicts {type}
    </span>
  );
}

// A callout box (tip / warning / info)
function Callout({ tone = 'tip', title, children }) {
  const tones = {
    tip: { ring: 'border-emerald-500/30 bg-emerald-500/[0.06]', dot: 'text-emerald-400', label: 'Tip' },
    warn: { ring: 'border-amber-500/30 bg-amber-500/[0.06]', dot: 'text-amber-400', label: 'Watch out' },
    info: { ring: 'border-blue-500/30 bg-blue-500/[0.06]', dot: 'text-blue-400', label: 'Good to know' },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-xl border ${t.ring} p-4 flex gap-3`}>
      <span className={`mt-0.5 ${t.dot}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${t.dot}`}>{title || t.label}</p>
        <div className="text-sm text-white/60 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// A faux form field, so the guide looks like the real screen
function MockField({ label, value, hint, badge, accent = 'orange' }) {
  const accents = {
    orange: 'text-orange-300',
    emerald: 'text-emerald-400',
    slate: 'text-slate-200',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-slate-400 text-xs">{label}</label>
        {badge}
      </div>
      <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
        <span className={value ? accents[accent] : 'text-slate-500'}>{value || 'Select an option'}</span>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
    </div>
  );
}

// The 3-step progress rail exactly like the analysis wizard
function StepRail({ active }) {
  const steps = ['Basic Information', 'Skeletal Measurements', 'Review & Predict'];
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
              i === active
                ? 'bg-orange-500 border-orange-500 text-white'
                : i < active
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-slate-600 text-slate-500'
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-xs font-medium ${i === active ? 'text-orange-400' : i < active ? 'text-slate-300' : 'text-slate-500'}`}>{step}</span>
          {i < 2 && <div className="w-8 h-px bg-slate-600" />}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bone-type reference used inside Step 2                              */
/* ------------------------------------------------------------------ */
const boneGuide = [
  {
    type: 'Skull',
    fields: [
      { label: 'Brow Ridge', predicts: 'Sex', how: 'Prominent / thick → Male · Smooth / less-developed → Female' },
      { label: 'Mastoid Size', predicts: 'Sex', how: 'Bony bump behind the ear · > 30 mm → Male · < 25 mm → Female' },
      { label: 'Jaw Shape', predicts: 'Age', how: 'U / V / robust / rounded angle of the mandible' },
      { label: 'Cranial Suture', predicts: 'Age', how: 'Open → 18–25 · Partially → 25–35 · … · Completely closed → 55+' },
    ],
  },
  {
    type: 'Pelvis',
    fields: [
      { label: 'Subpubic Angle', predicts: 'Height', how: 'Wide (> 90°) → Female tendency · Narrow (< 90°) → Male' },
      { label: 'Sciatic Notch', predicts: 'Sex', how: 'Wide → Female · Narrow → Male' },
      { label: 'Pubic Symphysis', predicts: 'Age', how: 'Smooth (young) → Ridged → Granular → Eroded (elderly)' },
    ],
  },
  {
    type: 'Lower Limb',
    fields: [
      { label: 'Femur Length (mm)', predicts: 'Height', how: 'Stature = 2.15 × femur(cm) + 72.57' },
      { label: 'Femur Head Diameter (mm)', predicts: 'Sex', how: '> 43 mm → Male · < 41 mm → Female' },
      { label: 'Growth Plate', predicts: 'Age', how: 'Unfused → <18 · Partially → 18–25 · Fused → 25+' },
    ],
  },
  {
    type: 'Upper Limb',
    fields: [
      { label: 'Humerus Length (mm)', predicts: 'Height', how: 'Stature = 2.68 × humerus(cm) + 83.19' },
      { label: 'Bone Robusticity', predicts: 'Sex', how: 'Robust → Male · Gracile → Female' },
    ],
  },
  {
    type: 'Thorax',
    fields: [
      { label: 'Rib Shape', predicts: 'Age', how: 'Smooth → 18–30 · Scalloped → 30–50 · Irregular → 50+' },
      { label: 'Sternum Length (mm)', predicts: 'Age', how: 'Manubrium to xiphoid process' },
    ],
  },
  {
    type: 'Teeth',
    fields: [
      { label: 'Teeth Type', predicts: 'Age', how: 'Deciduous → <6 · Mixed → 6–12 · Permanent → 12+' },
      { label: 'Dental Wear', predicts: 'Age', how: 'None → Mild → Moderate → Severe (refines adult age)' },
      { label: 'Eruption Stage', predicts: 'Age', how: 'Early / Partial / Complete' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function NewAnalysisTutorial() {
  const navigate = useNavigate();
  const [activeBone, setActiveBone] = useState('Skull');
  const bone = boneGuide.find((b) => b.type === activeBone);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'before', label: 'Before you begin' },
    { id: 'open', label: 'Open New Analysis' },
    { id: 'step1', label: 'Step 1 · Basic Info' },
    { id: 'step2', label: 'Step 2 · Measurements' },
    { id: 'step3', label: 'Step 3 · Review & Predict' },
    { id: 'after', label: 'Report & History' },
    { id: 'mistakes', label: 'Common mistakes' },
  ];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader
        title="New Analysis — Complete Tutorial"
        subtitle="A step-by-step visual guide to running your first skeletal analysis from start to finish"
      />

      <div className="max-w-5xl mx-auto px-6 pb-24">
        {/* Back to knowledge base */}
        <button
          onClick={() => navigate('/skeletal/knowledge')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Knowledge Base
        </button>

        {/* Jump nav */}
        <div className="flex flex-wrap gap-2 mb-10 sticky top-0 bg-[#0f1219]/95 backdrop-blur py-3 z-10 -mx-2 px-2 border-b border-white/5">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="text-xs text-white/50 hover:text-orange-300 border border-white/10 hover:border-orange-500/40 rounded-full px-3 py-1.5 transition-colors"
            >
              <span className="text-white/30 mr-1">{i + 1}.</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ---------------- OVERVIEW ---------------- */}
        <Section id="overview" kicker="Introduction" title="What this system does">
          <p className="text-white/60 leading-relaxed">
            The <span className="text-orange-300">Automated Skeletal Analysis System</span> estimates a{' '}
            <span className="text-white/80">biological profile</span> — <b>gender</b>, <b>age range</b> and{' '}
            <b>height</b> — from measurements you take on a skeletal specimen. You enter what you observe on the
            bone; the system applies established osteology rules and stature formulae (Bass, 2005) and returns a
            prediction with a confidence score and a printable report.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { k: 'You provide', v: 'Bone type + measurements', c: 'text-orange-300' },
              { k: 'System returns', v: 'Gender · Age · Height', c: 'text-blue-300' },
              { k: 'Output', v: 'Confidence + PDF report', c: 'text-emerald-300' },
            ].map((x) => (
              <div key={x.k} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{x.k}</p>
                <p className={`text-sm font-semibold ${x.c}`}>{x.v}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Callout tone="info" title="The whole flow in one line">
              Open <b>New Analysis</b> → <b>Step 1</b> basic info → <b>Step 2</b> measurements → <b>Step 3</b> review the
              prediction → <b>Generate Report</b>. Three screens, about two minutes.
            </Callout>
          </div>
        </Section>

        {/* ---------------- BEFORE ---------------- */}
        <Section id="before" kicker="Preparation" title="Before you begin">
          <p className="text-white/60 leading-relaxed mb-5">
            You get a reliable prediction only from reliable observations. Have these ready before you open the form:
          </p>
          <div className="space-y-3">
            {[
              ['The physical specimen', 'A cleaned bone or bone fragment you can examine and measure.'],
              ['Know the bone type', 'Skull, Pelvis, Upper Limb, Lower Limb, Thorax or Teeth — this decides which measurements you will be asked for.'],
              ['Measuring tools', 'An osteometric board or sliding calipers for length measurements (femur, humerus, sternum, mastoid).'],
              ['Find details', 'The location and date the specimen was found, for the case record.'],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-4">
                <span className="w-7 h-7 shrink-0 rounded-full bg-orange-500/20 text-orange-300 text-sm font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white/90">{t}</p>
                  <p className="text-sm text-white/50 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------- OPEN ---------------- */}
        <Section id="open" kicker="Getting there" title="Open the New Analysis wizard">
          <p className="text-white/60 leading-relaxed mb-5">
            There are two ways to start a new analysis:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Option A — Module overview</p>
              <p className="text-sm text-white/60 leading-relaxed">
                From the module home, click the blue <span className="text-blue-300 font-medium">New Analysis</span>{' '}
                card (marked <i>Entry Point</i>).
              </p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
              <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Option B — Sidebar</p>
              <p className="text-sm text-white/60 leading-relaxed">
                From the Dashboard, use the left sidebar and click{' '}
                <span className="text-white/80 font-medium">New Analysis</span>.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <button
              onClick={() => navigate('/skeletal/analysis/new')}
              className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              Try it now — open New Analysis
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Section>

        {/* ---------------- STEP 1 ---------------- */}
        <Section id="step1" kicker="Step 1 of 3" title="Enter the basic information">
          <StepRail active={0} />
          <p className="text-white/60 leading-relaxed mb-6">
            This screen records <b>who</b> is doing the analysis and <b>what</b> specimen it is. Here is exactly what
            the form looks like and what each field means:
          </p>

          {/* Mock form */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-6">
            <h4 className="text-slate-100 font-semibold mb-5">Enter Basic Information</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              <MockField label="Case ID (auto-generated)" value="SK-2026-0159" accent="emerald" hint="read-only" />
              <MockField label="User Name" value="Chamudi Gayeshika" accent="slate" />
              <MockField label="Bones Type" value="Skull" accent="orange" />
              <MockField label="Location" value="Kottawa" accent="slate" />
              <MockField label="Date Found" value="2026-05-04" accent="slate" />
              <MockField label="Analysis Date" value="Today (auto-filled)" accent="slate" />
              <div className="sm:col-span-2">
                <MockField label="Email (optional)" value="chamudi@gmail.com" accent="slate" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <FieldExplain name="Case ID" req="Auto">
              Generated for you — you cannot edit it. It is how the case is found later in <i>Past Analysis</i> and on the
              report.
            </FieldExplain>
            <FieldExplain name="User Name" req="Required">The investigator running the analysis.</FieldExplain>
            <FieldExplain name="Bones Type" req="Required">
              <b className="text-orange-300">The most important choice on this screen.</b> It decides which measurement
              fields Step 2 shows you. Options: Skull, Pelvis, Upper Limb, Lower Limb, Thorax, Teeth.
            </FieldExplain>
            <FieldExplain name="Location" req="Required">Where the specimen was excavated / found.</FieldExplain>
            <FieldExplain name="Date Found" req="Required">Excavation date of the specimen.</FieldExplain>
            <FieldExplain name="Analysis Date" req="Required">Defaults to today — change it only if back-dating.</FieldExplain>
            <FieldExplain name="Email" req="Optional">Contact for the record; can be left blank.</FieldExplain>
          </div>

          <div className="mt-6 space-y-3">
            <Callout tone="tip" title="Pick the bone type carefully">
              Choosing the wrong bone type sends you to the wrong measurement form. If you notice mid-way, go back and
              fix it here.
            </Callout>
            <p className="text-white/50 text-sm">
              When every required field is filled, click <span className="text-orange-300 font-medium">Next →</span> to
              move to Step 2.
            </p>
          </div>
        </Section>

        {/* ---------------- STEP 2 ---------------- */}
        <Section id="step2" kicker="Step 2 of 3" title="Enter the skeletal measurements">
          <StepRail active={1} />
          <p className="text-white/60 leading-relaxed mb-6">
            The fields here <b>change depending on the bone type you picked in Step 1</b>. Each field feeds a specific
            prediction — <PredictBadge type="Sex" />, <PredictBadge type="Age" /> or <PredictBadge type="Height" />.
            Pick your bone type below to see the exact fields:
          </p>

          {/* Bone-type selector */}
          <div className="flex flex-wrap gap-2 mb-5">
            {boneGuide.map((b) => (
              <button
                key={b.type}
                onClick={() => setActiveBone(b.type)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  activeBone === b.type
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
                }`}
              >
                {b.type}
              </button>
            ))}
          </div>

          {/* Mock measurement form for the selected bone */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 mb-4">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-slate-400 text-sm">Selected Bone Type:</span>
              <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                {bone.type}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {bone.fields.map((f) => (
                <MockField key={f.label} label={f.label} value="" badge={<PredictBadge type={f.predicts} />} />
              ))}
            </div>
          </div>

          {/* How to read each field */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 mb-6">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-3">
              How each {bone.type} field is read
            </p>
            <div className="space-y-2.5">
              {bone.fields.map((f) => (
                <div key={f.label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <span className="text-sm text-white/80 font-medium sm:w-52 shrink-0">{f.label}</span>
                  <span className="text-sm text-white/50">{f.how}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Callout tone="info" title="Every field is required">
              You cannot advance until all measurement fields have a value. If you truly cannot observe one, the
              specimen may not support that bone type — reconsider your Step 1 choice.
            </Callout>
            <Callout tone="tip" title="Measure, don't guess">
              Use calipers / an osteometric board for the millimetre fields (femur, humerus, mastoid, sternum). Small
              measurement errors change the stature and sex estimate.
            </Callout>
            <p className="text-white/50 text-sm">
              Click <span className="text-orange-300 font-medium">Next →</span> to see the prediction. Use{' '}
              <span className="text-white/70 font-medium">← Back</span> if you need to change the bone type.
            </p>
          </div>
        </Section>

        {/* ---------------- STEP 3 ---------------- */}
        <Section id="step3" kicker="Step 3 of 3" title="Review the predicted biological profile">
          <StepRail active={2} />
          <p className="text-white/60 leading-relaxed mb-6">
            The system now computes the profile from your measurements and shows four result cards, a summary of what
            you entered, and similar historical cases:
          </p>

          {/* Mock result cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { l: 'Gender', v: 'Male' },
              { l: 'Age Range', v: '25 – 35' },
              { l: 'Height', v: '168.4 cm' },
              { l: 'Confidence', v: '92.0%', c: 'text-emerald-400' },
            ].map((s) => (
              <div key={s.l} className="bg-slate-800 border border-slate-700 p-5 rounded-xl text-center">
                <span className="text-slate-400 text-xs">{s.l}</span>
                <p className={`text-xl font-bold mt-1.5 ${s.c || 'text-slate-100'}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 mb-6">
            <FieldExplain name="Gender" req="Sex">Male / Female / Indeterminate from sex-indicating features (brow ridge, mastoid, sciatic notch, robusticity…).</FieldExplain>
            <FieldExplain name="Age Range" req="Age">A range in years from age indicators (suture closure, pubic symphysis, growth plate, dental wear…).</FieldExplain>
            <FieldExplain name="Height" req="Height">Estimated stature in cm from long-bone length using Bass (2005) regression formulae. Shows only for limb bones.</FieldExplain>
            <FieldExplain name="Confidence" req="Score">Rises with the number of usable measurements you provided — more complete input, higher confidence.</FieldExplain>
          </div>

          <Callout tone="info" title="Why 'Indeterminate' or 'Unknown' can appear">
            If a chosen option doesn't point clearly to one sex/age, or the bone type doesn't estimate height, that
            field stays Indeterminate/Unknown. That is honest output, not an error — add more diagnostic measurements
            to sharpen it.
          </Callout>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <p className="text-sm font-medium text-white/90 mb-1">Generate Report →</p>
              <p className="text-sm text-white/50">Saves the prediction and opens a full printable / PDF report.</p>
            </div>
            <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <p className="text-sm font-medium text-white/90 mb-1">Back To Dashboard</p>
              <p className="text-sm text-white/50">Return without generating a report.</p>
            </div>
          </div>
        </Section>

        {/* ---------------- AFTER ---------------- */}
        <Section id="after" kicker="After the analysis" title="Report & case history">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
              <p className="text-sm font-semibold text-white/90 mb-1">Prediction Report</p>
              <p className="text-sm text-white/55 leading-relaxed">
                Full biological profile, confidence, the measurements you entered and similar cases — downloadable as a
                PDF for your records or publication.
              </p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5">
              <p className="text-sm font-semibold text-white/90 mb-1">Past Analysis</p>
              <p className="text-sm text-white/55 leading-relaxed">
                Every case is stored and searchable by Case ID. Reopen any record to review or re-print its report.
              </p>
            </div>
          </div>
        </Section>

        {/* ---------------- MISTAKES ---------------- */}
        <Section id="mistakes" kicker="Quality" title="Common mistakes to avoid">
          <div className="space-y-3">
            {[
              ['Wrong bone type in Step 1', 'You get the wrong measurement form. Double-check before clicking Next.'],
              ['Eyeballing millimetre fields', 'Always use calipers / an osteometric board — guesses skew height and sex.'],
              ['Ignoring low confidence', 'A low score means too few usable inputs. Add more measurements before trusting the result.'],
              ['Treating output as certain', 'These are probabilistic estimates from morphology — corroborate with context where it matters.'],
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3 bg-amber-500/[0.05] border border-amber-500/20 rounded-xl p-4">
                <span className="text-amber-400 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 001.74-3l-7.07-12a2 2 0 00-3.48 0l-7.07 12a2 2 0 001.74 3z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-white/90">{t}</p>
                  <p className="text-sm text-white/50 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer CTA */}
        <div className="mt-14 border border-orange-500/30 bg-orange-500/[0.06] rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Ready to run your first analysis?</h3>
          <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
            You now know every screen. Open the wizard and work through the three steps.
          </p>
          <button
            onClick={() => navigate('/skeletal/analysis/new')}
            className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2"
          >
            Start New Analysis
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section + field-explanation primitives                             */
/* ------------------------------------------------------------------ */
function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-12 first:pt-0">
      <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-2">{kicker}</p>
      <h2 className="text-2xl font-bold text-white mb-5">{title}</h2>
      {children}
    </section>
  );
}

function FieldExplain({ name, req, children }) {
  const tone =
    req === 'Required'
      ? 'text-red-300 border-red-500/30 bg-red-500/10'
      : req === 'Optional'
      ? 'text-slate-300 border-slate-500/30 bg-slate-500/10'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <div className="sm:w-44 shrink-0 flex items-start gap-2">
        <span className="text-sm font-semibold text-white/90">{name}</span>
        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${tone}`}>{req}</span>
      </div>
      <p className="text-sm text-white/55 leading-relaxed">{children}</p>
    </div>
  );
}
