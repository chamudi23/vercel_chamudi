/* ------------------------------------------------------------------ *
 *  Learner-progress admin — read-only queries
 *
 *  Backed by the `course_progress` and `course_admins` tables in the
 *  Skeletal Analysis Supabase project (see kgc_admin_setup.sql).
 *
 *  Access is enforced by Row-Level Security in the database, not here:
 *    - a normal learner's SELECT on course_progress returns only their row;
 *    - a user listed in course_admins matches the extra admin policy and
 *      receives every row.
 *  The checks in this file only decide what UI to show. Removing them would
 *  not reveal anyone else's data.
 *
 *  There is no insert/update/delete in this module — the dashboard cannot
 *  alter a learner's progress.
 * ------------------------------------------------------------------ */

import { supabase } from './skeletalSupabase';

/** Is this user on the admin allow-list? Returns false for signed-out users. */
export async function isCourseAdmin(userId) {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('course_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // 42P01 = table missing, i.e. kgc_admin_setup.sql has not been run yet.
    console.error('[admin] admin check failed:', error.message);
    return false;
  }
  return Boolean(data);
}

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
