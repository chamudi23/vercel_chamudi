/**
 * KgcLearnerProgress.jsx
 * ======================
 * Admin dashboard for the Learning Path — enrollment and completion tracking.
 *
 * Read-only. Access is enforced by Row-Level Security on `course_progress`
 * (see kgc_admin_setup.sql): a learner's own query returns only their row, and
 * only accounts listed in `course_admins` receive every row. The gate below
 * decides what to render, not what the database will hand over.
 *
 * Route: /skeletal/admin/learners
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import SkeletalHeader from '../../components/KgcSkeletalHeader';
import { useAuth } from '../../context/AuthContext';
import { COURSE_STEPS } from './kgcCourseData';
import { getAllLearnerProgress, summariseProgress } from '../../lib/courseAdmin';

const ADMIN_PATH = '/skeletal/admin/learners';

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#0f1219] text-white font-sans">
      <SkeletalHeader
        title="Learner Progress"
        subtitle="Learning Path — enrollment & completion tracking"
      />
      <div className="max-w-6xl mx-auto px-6 pb-24">{children}</div>
    </div>
  );
}

function BackLink({ navigate }) {
  return (
    <button
      onClick={() => navigate('/skeletal/knowledge')}
      className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Knowledge Base
    </button>
  );
}

function Stat({ label, value, sub, tone = 'text-white' }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
      <p className="text-white/40 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${tone}`}>{value}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

export default function KgcLearnerProgress() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signInWithGoogle } = useAuth();

  const [state, setState] = useState({ status: 'checking', rows: [], error: null });
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setState({ status: 'signed-out', rows: [], error: null });
      return;
    }
    setState((s) => ({ ...s, status: 'checking' }));

    // "Admin" is the role on the user's profile — one notion of administrator
    // system-wide, rather than a separate allow-list for this page.
    if (!isAdmin) {
      setState({ status: 'forbidden', rows: [], error: null });
      return;
    }

    const { rows, error } = await getAllLearnerProgress();
    setState({ status: error ? 'error' : 'ready', rows, error });
  }, [user, isAdmin]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const summary = useMemo(
    () => summariseProgress(state.rows, COURSE_STEPS),
    [state.rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summary.learners;
    return summary.learners.filter(
      (l) =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        l.userId.toLowerCase().includes(q)
    );
  }, [summary.learners, search]);

  const exportCsv = () => {
    const headers = ['learner_name', 'learner_email', 'user_id', 'steps_completed', 'total_steps', 'percent', 'quizzes_passed', 'finished', 'last_active'];
    const rows = filtered.map((l) =>
      [l.name || '', l.email || '', l.userId, l.stepsDone, COURSE_STEPS.length, l.pct, l.quizzesPassed, l.finished ? 'yes' : 'no', l.lastActive || '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learner_progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------------------- gates ---------------------------- */

  if (authLoading || state.status === 'checking') {
    return (
      <Shell>
        <BackLink navigate={navigate} />
        <div className="py-24 text-center text-white/40 text-sm">Checking your access…</div>
      </Shell>
    );
  }

  if (state.status === 'signed-out') {
    return (
      <Shell>
        <BackLink navigate={navigate} />
        <div className="max-w-md mx-auto rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Sign in required</h2>
          <p className="text-white/55 text-sm mb-6">
            The learner-progress dashboard is restricted to course administrators.
          </p>
          <button
            onClick={() => signInWithGoogle(ADMIN_PATH)}
            className="w-full bg-white hover:bg-white/90 text-slate-800 font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Continue with Google
          </button>
        </div>
      </Shell>
    );
  }

  if (state.status === 'forbidden') {
    return (
      <Shell>
        <BackLink navigate={navigate} />
        <div className="max-w-lg mx-auto rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-8">
          <h2 className="text-xl font-bold mb-2">Not an administrator</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            You are signed in as <span className="text-white">{user?.email}</span>, whose role is not
            administrator. Learner progress is protected by row-level security, so this page shows
            nothing until that account is given the admin role.
          </p>
          <p className="text-white/40 text-xs mb-2">
            An administrator can change it from the Users screen, or directly in SQL:
          </p>
          <pre className="text-[11px] bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto text-emerald-300/80">
{`update public.profiles
   set role = 'admin'
 where lower(email) = lower('${user?.email || 'you@example.com'}');`}
          </pre>
          <p className="text-white/30 text-[11px] mt-3">
            If the <code>profiles</code> table does not exist yet, run{' '}
            <code>access_control/01_identity_and_roles.sql</code> first.
          </p>
        </div>
      </Shell>
    );
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <BackLink navigate={navigate} />
        <div className="max-w-lg mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
          Could not load learner progress.
          <span className="block text-white/40 text-xs mt-1">{state.error?.message}</span>
        </div>
      </Shell>
    );
  }

  /* ---------------------------- dashboard ---------------------------- */

  const maxFunnel = Math.max(1, ...summary.funnel.map((f) => f.count));

  return (
    <Shell>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
        <BackLink navigate={navigate} />
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={load}
            className="px-4 py-2 text-sm rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="px-4 py-2 text-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Headline figures */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Learners enrolled" value={summary.totalLearners} sub="accounts with saved progress" />
        <Stat
          label="Completed course"
          value={summary.finished}
          tone="text-emerald-400"
          sub={summary.totalLearners ? `${Math.round((summary.finished / summary.totalLearners) * 100)}% completion rate` : '—'}
        />
        <Stat label="In progress" value={summary.inProgress} tone="text-orange-400" sub={`${summary.notStarted} not started`} />
        <Stat label="Average progress" value={`${summary.avgPct}%`} sub={`${summary.activeThisWeek} active in last 7 days`} />
      </div>

      {/* Step funnel */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8">
        <h3 className="font-semibold mb-1">Completion by step</h3>
        <p className="text-white/35 text-xs mb-5">
          How many learners have cleared each of the {COURSE_STEPS.length} steps — where the drop-off is.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.funnel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="label" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#374151', opacity: 0.3 }}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #374151', borderRadius: '8px', color: '#F3F4F6' }}
                formatter={(v) => [`${v} learner${v === 1 ? '' : 's'}`, 'Completed']}
                labelFormatter={(_, p) => {
                  const d = p?.[0]?.payload;
                  return d ? `${d.module} — ${d.title}` : '';
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={18}>
                {summary.funnel.map((f) => (
                  <Cell key={f.id} fill={f.type === 'quiz' ? '#F97316' : '#3B82F6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-4 text-[11px] text-white/40">
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#3B82F6]" /> Lesson</span>
          <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#F97316]" /> Checkpoint quiz</span>
          <span className="ml-auto">Peak {maxFunnel} learner{maxFunnel === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Learner table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold">Learners</h3>
            <p className="text-white/35 text-xs mt-0.5">
              {filtered.length} of {summary.totalLearners} shown · most recently active first
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="bg-[#0f1219] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {!filtered.length ? (
          <div className="px-6 py-12 text-center text-white/35 text-sm">
            {summary.totalLearners
              ? 'No learner matches that search.'
              : 'No learner has saved progress yet. Progress appears here once someone signs in and completes a step.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left px-6 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Learner</th>
                  <th className="text-left px-6 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Progress</th>
                  <th className="text-left px-6 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Steps</th>
                  <th className="text-left px-6 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Quizzes</th>
                  <th className="text-left px-6 py-3 text-xs text-white/30 uppercase tracking-wider font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={l.userId} className={`border-b border-white/5 last:border-b-0 ${i % 2 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="px-6 py-3.5">
                      <span className="text-white/85">{l.name || l.email || 'Unnamed learner'}</span>
                      {l.email && l.name && <span className="block text-[11px] text-white/35">{l.email}</span>}
                      {!l.email && !l.name && (
                        <span className="block text-[11px] text-white/25 font-mono">{l.userId.slice(0, 8)}…</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 min-w-[180px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[120px]">
                          <div
                            className={`h-full transition-all ${l.finished ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-emerald-500'}`}
                            style={{ width: `${l.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs tabular-nums ${l.finished ? 'text-emerald-400' : 'text-white/50'}`}>{l.pct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-white/55 tabular-nums">{l.stepsDone} / {COURSE_STEPS.length}</td>
                    <td className="px-6 py-3.5 text-white/55 tabular-nums">{l.quizzesPassed}</td>
                    <td className="px-6 py-3.5 text-white/45">{timeAgo(l.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-white/25 text-[11px] mt-6 leading-relaxed">
        Read-only. Guest (not signed-in) learners keep progress in memory only and never appear here.
      </p>
    </Shell>
  );
}
