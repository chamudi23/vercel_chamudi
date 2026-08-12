import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { COURSE, COURSE_STEPS, PASS_RATIO } from './kgcCourseData';
import { useAuth } from '../../context/AuthContext';
import { useCourseProgress } from '../../hooks/useCourseProgress';

/* ------------------------------------------------------------------ */
/*  Lesson block renderer                                              */
/* ------------------------------------------------------------------ */
function Block({ block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-white/65 leading-relaxed">{block.text}</p>;
    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2.5 text-white/65 leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case 'image':
      return (
        <figure className="rounded-xl overflow-hidden border border-white/10 bg-slate-950">
          <div className="flex items-center justify-center p-3">
            <img src={block.src} alt={block.caption || ''} loading="lazy" className="max-w-full max-h-[340px] object-contain" />
          </div>
          {block.caption && (
            <figcaption className="text-xs text-white/40 px-4 py-2 border-t border-white/10 bg-white/[0.02]">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case 'facts':
      return (
        <div className="grid sm:grid-cols-2 gap-2">
          {block.items.map(([label, value], i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="text-sm text-white/80 font-medium">{label}</span>
              <span className="text-xs text-white/50 text-right">{value}</span>
            </div>
          ))}
        </div>
      );
    case 'callout': {
      const tones = {
        tip: 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-400',
        info: 'border-blue-500/30 bg-blue-500/[0.06] text-blue-400',
        warn: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-400',
      };
      return (
        <div className={`rounded-xl border p-4 ${tones[block.tone] || tones.info}`}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1">{block.title}</p>
          <p className="text-sm text-white/60 leading-relaxed">{block.text}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Quiz                                                               */
/* ------------------------------------------------------------------ */
function Quiz({ step, alreadyPassed, onPass }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Reset local quiz state when navigating between quizzes
  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [step.id]);

  const total = step.questions.length;
  const correctCount = step.questions.reduce(
    (n, q, i) => n + (answers[i] === q.answer ? 1 : 0),
    0
  );
  const ratio = correctCount / total;
  const passed = ratio >= PASS_RATIO;
  const needed = Math.ceil(total * PASS_RATIO);
  const allAnswered = step.questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = () => {
    setSubmitted(true);
    if (ratio >= PASS_RATIO) onPass();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 px-2.5 py-1 font-semibold uppercase tracking-wider">
          Checkpoint quiz
        </span>
        <span>Score {needed}/{total} to unlock the next module.</span>
      </div>

      {step.questions.map((q, qi) => {
        const chosen = answers[qi];
        return (
          <div key={qi} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-white/90 font-medium mb-3">
              <span className="text-white/40 mr-2">{qi + 1}.</span>
              {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isAnswer = q.answer === oi;
                let cls = 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]';
                if (submitted) {
                  if (isAnswer) cls = 'border-emerald-500/50 bg-emerald-500/10';
                  else if (isChosen && !isAnswer) cls = 'border-red-500/50 bg-red-500/10';
                  else cls = 'border-white/10 bg-white/[0.02] opacity-70';
                } else if (isChosen) {
                  cls = 'border-orange-500/60 bg-orange-500/10';
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm text-white/80 transition-all flex items-center gap-3 ${cls} ${
                      submitted ? 'cursor-default' : 'cursor-pointer'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center text-[10px] ${
                        isChosen ? 'border-current' : 'border-white/25'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {submitted && isAnswer && <span className="text-emerald-400">✓</span>}
                    {submitted && isChosen && !isAnswer && <span className="text-red-400">✗</span>}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-3 text-xs text-white/50 leading-relaxed border-t border-white/10 pt-3">
                <span className="text-white/70 font-medium">Explanation: </span>
                {q.explain}
              </p>
            )}
          </div>
        );
      })}

      {/* Result / actions */}
      {submitted ? (
        <div
          className={`rounded-xl border p-5 ${
            passed ? 'border-emerald-500/40 bg-emerald-500/[0.08]' : 'border-red-500/40 bg-red-500/[0.08]'
          }`}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className={`text-lg font-bold ${passed ? 'text-emerald-300' : 'text-red-300'}`}>
                {passed ? 'Passed! 🎉' : 'Not quite yet'}
              </p>
              <p className="text-sm text-white/60 mt-0.5">
                You scored {correctCount}/{total}. {passed ? 'The next module is unlocked.' : `You need ${needed}/${total} to continue.`}
              </p>
            </div>
            {!passed && (
              <button
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
                className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-white/40">
            {allAnswered ? 'All questions answered.' : 'Answer every question to submit.'}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`text-sm font-medium px-6 py-2.5 rounded-lg transition-colors ${
              allAnswered
                ? 'bg-orange-500 hover:bg-orange-400 text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            Submit answers
          </button>
        </div>
      )}

      {alreadyPassed && !submitted && (
        <p className="text-xs text-emerald-400/80">✓ You have already passed this checkpoint — retake it anytime.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Curriculum sidebar                                                 */
/* ------------------------------------------------------------------ */
function StepIcon({ state, isQuiz }) {
  if (state === 'done')
    return (
      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  if (state === 'locked')
    return (
      <span className="w-6 h-6 rounded-full bg-white/5 text-white/30 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </span>
    );
  // current / available
  return (
    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isQuiz ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>
      {isQuiz ? (
        <span className="text-[11px] font-bold">?</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function KgcCourse() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { completed, setCompleted, syncing } = useCourseProgress(user);
  const [currentId, setCurrentId] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const [guest, setGuest] = useState(false);

  const completedSet = useMemo(() => new Set(completed), [completed]);

  // A step is unlocked if it's the first, or every previous step is completed.
  const isUnlocked = (idx) => idx === 0 || COURSE_STEPS.slice(0, idx).every((s) => completedSet.has(s.id));

  // First not-yet-completed unlocked step = the natural "resume" point.
  const resumeIndex = useMemo(() => {
    const i = COURSE_STEPS.findIndex((s) => !completedSet.has(s.id));
    return i === -1 ? COURSE_STEPS.length - 1 : i;
  }, [completedSet]);

  const currentIndex = useMemo(() => {
    const i = COURSE_STEPS.findIndex((s) => s.id === currentId);
    return i === -1 ? resumeIndex : i;
  }, [currentId, resumeIndex]);

  const step = COURSE_STEPS[currentIndex];

  const markCompleteAndNext = () => {
    setCompleted((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
    const nextIdx = currentIndex + 1;
    if (nextIdx < COURSE_STEPS.length) {
      setCurrentId(COURSE_STEPS[nextIdx].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowComplete(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleQuizPass = () => {
    setCompleted((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
  };

  const goToStep = (idx) => {
    if (!isUnlocked(idx)) return;
    setShowComplete(false);
    setCurrentId(COURSE_STEPS[idx].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetCourse = () => {
    if (!window.confirm('Reset all course progress on this device?')) return;
    setCompleted([]);
    setCurrentId(COURSE_STEPS[0].id);
    setShowComplete(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pct = Math.round((completed.filter((id) => COURSE_STEPS.some((s) => s.id === id)).length / COURSE_STEPS.length) * 100);
  const quizPassedForCurrent = step && step.type === 'quiz' && completedSet.has(step.id);

  // ---- Auth gate: must sign in (or continue as guest) before the course ----
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f1219] text-white font-sans">
        <SkeletalHeader title={COURSE.title} subtitle={COURSE.subtitle} />
        <div className="max-w-md mx-auto px-6 py-24 text-center text-white/40 text-sm kb-anim-fade-in">
          Loading your learning profile…
        </div>
      </div>
    );
  }
  if (!user && !guest) {
    return <LoginGate navigate={navigate} signInWithGoogle={signInWithGoogle} onGuest={() => setGuest(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader title={COURSE.title} subtitle={COURSE.subtitle} />

      <div className="max-w-6xl mx-auto px-6 pb-24">
        {/* Back + user + progress */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <button
            onClick={() => navigate('/skeletal/knowledge')}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Knowledge Base
          </button>
          <div className="flex items-center gap-3">
            <UserChip user={user} guest={guest} syncing={syncing} onSignOut={signOut} onSignIn={signInWithGoogle} />
            <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-white/50 font-medium tabular-nums">{pct}%</span>
            {completed.length > 0 && (
              <button onClick={resetCourse} className="text-xs text-white/30 hover:text-red-300 transition-colors">
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* ---------------- CURRICULUM ---------------- */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Curriculum</p>
            <div className="space-y-5">
              {COURSE.modules.map((mod) => (
                <div key={mod.id}>
                  <p className="text-sm font-semibold text-white/80 mb-2">{mod.title}</p>
                  <div className="space-y-1">
                    {mod.steps.map((s) => {
                      const idx = COURSE_STEPS.findIndex((x) => x.id === s.id);
                      const unlocked = isUnlocked(idx);
                      const done = completedSet.has(s.id);
                      const state = done ? 'done' : !unlocked ? 'locked' : 'available';
                      const isCurrent = idx === currentIndex && !showComplete;
                      return (
                        <button
                          key={s.id}
                          onClick={() => goToStep(idx)}
                          disabled={!unlocked}
                          className={`w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                            isCurrent
                              ? 'bg-white/[0.08] text-white'
                              : unlocked
                              ? 'text-white/60 hover:bg-white/[0.04] hover:text-white/90'
                              : 'text-white/30 cursor-not-allowed'
                          }`}
                        >
                          <StepIcon state={state} isQuiz={s.type === 'quiz'} />
                          <span className="flex-1 leading-tight">{s.title}</span>
                          {s.type === 'quiz' && (
                            <span className="text-[9px] uppercase tracking-wider text-orange-300/70 shrink-0">Quiz</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ---------------- CONTENT ---------------- */}
          <main className="min-w-0">
            {showComplete ? (
              <CompletionCard onReview={() => goToStep(0)} onReset={resetCourse} navigate={navigate} />
            ) : (
              <div key={step.id} className="kb-anim-fade-up">
                {/* Step header */}
                <div className="mb-6">
                  <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-2">
                    {step.moduleTitle}
                    {step.type === 'lesson' && step.minutes ? ` · ${step.minutes} min read` : ''}
                  </p>
                  <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                </div>

                {/* Body */}
                {step.type === 'lesson' ? (
                  <div className="space-y-5">
                    {step.blocks.map((b, i) => (
                      <Block key={i} block={b} />
                    ))}

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                      <span className="text-xs text-white/40">
                        {completedSet.has(step.id) ? '✓ Completed' : 'Read through, then continue.'}
                      </span>
                      <button
                        onClick={markCompleteAndNext}
                        className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        {completedSet.has(step.id) ? 'Continue' : 'Mark complete'}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Quiz step={step} alreadyPassed={quizPassedForCurrent} onPass={handleQuizPass} />
                    {/* Continue appears once the checkpoint is passed */}
                    {quizPassedForCurrent && (
                      <div className="flex items-center justify-end gap-4 pt-5 mt-5 border-t border-white/10">
                        <span className="text-xs text-emerald-400/80">Checkpoint cleared ✓</span>
                        <button
                          onClick={markCompleteAndNext}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                          {currentIndex === COURSE_STEPS.length - 1 ? 'Finish course' : 'Continue to next module'}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login gate                                                         */
/* ------------------------------------------------------------------ */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 4.1 29.6 2 24 2 15.6 2 8.3 6.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 46c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.5-7.6 2.5-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C8.2 41.2 15.5 46 24 46z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C41.4 36.4 45 31 45 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function LoginGate({ navigate, signInWithGoogle, onGuest }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setBusy(false);
      setError(
        error.message?.includes('provider is not enabled')
          ? 'Google sign-in is not enabled yet on the Supabase project. See setup notes below.'
          : error.message || 'Sign-in failed. Please try again.'
      );
    }
    // On success the browser redirects to Google, so no further code runs here.
  };

  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader title={COURSE.title} subtitle={COURSE.subtitle} />

      <div className="max-w-md mx-auto px-6 py-16">
        <button
          onClick={() => navigate('/skeletal/knowledge')}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Knowledge Base
        </button>

        <div className="kb-anim-scale-in rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.08] to-orange-500/[0.03] p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-9 h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign in to start learning</h2>
          <p className="text-white/55 text-sm leading-relaxed mb-7">
            Sign in with Google so your lesson progress and quiz results are saved to your account and follow you across
            devices.
          </p>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-white/90 text-slate-800 font-semibold px-5 py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            <GoogleIcon />
            {busy ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="mt-4 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 leading-relaxed">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] text-white/30 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            onClick={onGuest}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Continue without an account
          </button>
          <p className="text-[11px] text-white/25 mt-1">Guest progress isn’t saved — sign in to keep your progress.</p>
        </div>

        <p className="text-[11px] text-white/25 leading-relaxed mt-5 text-center">
          Uses Supabase Auth. If Google sign-in isn’t enabled yet, an admin must turn it on in the Supabase dashboard
          (Authentication → Providers → Google) and add this app’s URL to the redirect list.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Signed-in user chip                                                */
/* ------------------------------------------------------------------ */
function UserChip({ user, guest, syncing, onSignOut, onSignIn }) {
  if (guest && !user) {
    return (
      <button
        onClick={onSignIn}
        className="flex items-center gap-2 text-xs text-white/50 hover:text-white border border-white/10 hover:border-white/25 rounded-full pl-2 pr-3 py-1 transition-colors"
        title="Sign in to save progress to your account"
      >
        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px]">?</span>
        Guest · Sign in
      </button>
    );
  }
  if (!user) return null;

  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email?.split('@')[0] || 'Learner';
  const avatar = meta.avatar_url || meta.picture;

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] pl-1 pr-2 py-1">
      {avatar ? (
        <img src={avatar} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[11px] font-semibold">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-xs text-white/70 max-w-[110px] truncate hidden sm:block">{name}</span>
      {syncing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 kb-glow" title="Syncing…" />}
      <button
        onClick={onSignOut}
        className="text-[11px] text-white/40 hover:text-red-300 transition-colors ml-1"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Completion certificate                                             */
/* ------------------------------------------------------------------ */
function CompletionCard({ onReview, onReset, navigate }) {
  return (
    <div className="kb-anim-scale-in rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.1] to-orange-500/[0.04] p-8 sm:p-12 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-5 kb-pulse-ring">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-11 h-11">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-2">Course complete</p>
      <h2 className="text-3xl font-bold text-white mb-3">You’re certified to run the system 🎓</h2>
      <p className="text-white/55 max-w-md mx-auto leading-relaxed mb-8">
        You’ve cleared every checkpoint — foundations, skull, skeleton, and using the system. You’re ready to run a real
        skeletal analysis.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => navigate('/skeletal/analysis/new')}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Start a New Analysis →
        </button>
        <button
          onClick={onReview}
          className="border border-white/15 hover:border-white/30 text-white/80 font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Review lessons
        </button>
        <button
          onClick={onReset}
          className="text-white/40 hover:text-white/70 font-medium px-4 py-3 rounded-lg transition-colors text-sm"
        >
          Reset progress
        </button>
      </div>
    </div>
  );
}
