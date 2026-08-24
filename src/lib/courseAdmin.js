/* ------------------------------------------------------------------ *
 *  Learner-progress admin — read-only queries
 *
 *  Backed by the `course_progress` table
 *  (see access_control/03_consolidate_skeletal.sql).
 *
 *  Access is enforced by Row-Level Security in the database, not here:
 *    - a normal learner's SELECT on course_progress returns only their row;
 *    - a user whose profile role is 'admin' matches the additional
 *      course_progress_select_admin policy and receives every row.
 *
 *  The standalone `course_admins` allow-list this module used to consult is
 *  retired — `role = 'admin'` in public.profiles is the single notion of
 *  administrator across the system. Whether the caller is an admin is read
 *  from AuthContext; this file only fetches.
 *
 *  There is no insert/update/delete in this module — the dashboard cannot
 *  alter a learner's progress.
 * ------------------------------------------------------------------ */

import { supabase } from './skeletalSupabase';

/**
 * Every learner's progress, most recently active first.
 * RLS decides how many rows come back.
 *
 * @returns {Promise<{ rows: object[], error: Error|null }>}
 */
export async function getAllLearnerProgress() {
  const { data, error } = await supabase
    .from('course_progress')
    .select('user_id, completed, learner_email, learner_name, updated_at')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[admin] learner progress read failed:', error.message);
    return { rows: [], error };
  }

  return {
    rows: (data || []).map((r) => ({
      userId: r.user_id,
      name: r.learner_name || null,
      email: r.learner_email || null,
      completed: Array.isArray(r.completed) ? r.completed : [],
      lastActive: r.updated_at || null,
    })),
    error: null,
  };
}

/**
 * Roll a learner list up into the figures the dashboard shows.
 *
 * @param {object[]} learners  from getAllLearnerProgress()
 * @param {object[]} steps     COURSE_STEPS (ordered lessons + quizzes)
 */
export function summariseProgress(learners, steps) {
  const stepIds = steps.map((s) => s.id);
  const quizIds = steps.filter((s) => s.type === 'quiz').map((s) => s.id);
  const total = steps.length || 1;

  const enriched = learners.map((l) => {
    // Ignore ids from an older course revision so percentages stay sane.
    const done = l.completed.filter((id) => stepIds.includes(id));
    const quizzes = done.filter((id) => quizIds.includes(id));
    return {
      ...l,
      stepsDone: done.length,
      quizzesPassed: quizzes.length,
      pct: Math.round((done.length / total) * 100),
      finished: done.length === stepIds.length,
    };
  });

  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeThisWeek = enriched.filter(
    (l) => l.lastActive && new Date(l.lastActive).getTime() >= week
  ).length;

  const funnel = steps.map((s, i) => ({
    id: s.id,
    label: `${i + 1}`,
    title: s.title,
    module: s.moduleTitle,
    type: s.type,
    count: enriched.filter((l) => l.completed.includes(s.id)).length,
  }));

  return {
    learners: enriched,
    totalLearners: enriched.length,
    finished: enriched.filter((l) => l.finished).length,
    inProgress: enriched.filter((l) => !l.finished && l.stepsDone > 0).length,
    notStarted: enriched.filter((l) => l.stepsDone === 0).length,
    activeThisWeek,
    avgPct: enriched.length
      ? Math.round(enriched.reduce((a, l) => a + l.pct, 0) / enriched.length)
      : 0,
    funnel,
  };
}
