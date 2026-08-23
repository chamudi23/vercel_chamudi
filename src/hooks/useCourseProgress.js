import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/skeletalSupabase';

/**
 * Course progress, stored entirely in Supabase (no browser storage).
 *
 * - Signed in  → progress is loaded from and saved to the `course_progress`
 *   table (keyed by auth user id), so it follows the learner across devices.
 * - Signed out (guest) → progress is kept in memory only for the session and
 *   is NOT persisted anywhere. Sign in to save it.
 *
 * Returns: { completed, setCompleted, syncing }
 *   setCompleted accepts an array or an updater (prev => next), like useState.
 */
/** Has this session already proved the identity columns are missing? */
let identityColumnsMissing = false;

/**
 * Save progress, stamping the learner's name/email so the admin
 * learner-progress dashboard can show a person instead of a bare UUID.
 *
 * Those two columns are added by kgc_admin_setup.sql. If that migration has
 * not been run, PostgREST rejects the write with PGRST204 ("column not found
 * in schema cache") — so fall back to the original payload rather than
 * letting a learner's progress silently fail to save.
 */
async function saveProgress(user, completed) {
  const base = {
    user_id: user.id,
    completed,
    updated_at: new Date().toISOString(),
  };

  if (!identityColumnsMissing) {
    const meta = user.user_metadata || {};
    const { error } = await supabase.from('course_progress').upsert({
      ...base,
      learner_email: user.email || null,
      learner_name: meta.full_name || meta.name || null,
    });
    if (!error) return;

    const missingColumn = error.code === 'PGRST204' || error.code === '42703';
    if (!missingColumn) {
      console.error('[course] save failed:', error.message);
      return;
    }
    // Remember, so every later save skips straight to the fallback.
    identityColumnsMissing = true;
    console.warn('[course] learner_email/learner_name not present — run kgc_admin_setup.sql to enable the learner-progress dashboard');
  }

  const { error } = await supabase.from('course_progress').upsert(base);
  if (error) console.error('[course] save failed:', error.message);
}

export function useCourseProgress(user) {
  const [completed, setCompletedState] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const loadedForUser = useRef(null);

  // Load from Supabase whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setCompletedState([]); // guest: in-memory only
        loadedForUser.current = null;
        return;
      }
      if (loadedForUser.current === user.id) return;

      setSyncing(true);
      const { data, error } = await supabase
        .from('course_progress')
        .select('completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cancelled) {
        if (error) console.error('[course] load failed:', error.message);
        setCompletedState(!error && Array.isArray(data?.completed) ? data.completed : []);
        loadedForUser.current = user.id;
        setSyncing(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persist every update to Supabase (only when signed in).
  const setCompleted = (next) => {
    setCompletedState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      if (user) saveProgress(user, value);
      return value;
    });
  };

  return { completed, setCompleted, syncing };
}
