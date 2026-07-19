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
      if (user) {
        supabase
          .from('course_progress')
          .upsert({ user_id: user.id, completed: value, updated_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) console.error('[course] save failed:', error.message);
          });
      }
      return value;
    });
  };

  return { completed, setCompleted, syncing };
}
