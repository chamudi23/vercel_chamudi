import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/skeletalSupabase';

const AuthContext = createContext(null);

/**
 * Authentication context backed by Supabase Auth (Google OAuth).
 *
 * Setup required in the Supabase dashboard (one time):
 *   Authentication → Providers → Google → enable, paste Google OAuth
 *   Client ID + Secret.
 *   Authentication → URL Configuration → set the Site URL and add every
 *   deployed origin to the Redirect URLs allow-list (e.g.
 *   http://localhost:5173/** and https://<your-app>.vercel.app/**).
 *
 * NOTE: the OAuth callback lands on a client-side route
 * (/skeletal/knowledge/course by default). A static host must rewrite all
 * paths to index.html or that callback 404s and the sign-in silently fails
 * — see vercel.json / public/_redirects.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    // Resolve any existing session. supabase-js also completes the OAuth
    // redirect here (it exchanges the ?code= / #access_token= it finds in the
    // URL and then cleans the address bar).
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(error);
        setSession(data?.session ?? null);
      })
      .catch((err) => {
        // Never leave the UI stuck on "loading" because the network failed.
        if (active) setAuthError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setLoading(false); // the redirect can resolve after getSession() settles
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /**
   * Start Google sign-in.
   *
   * @param {string} [returnTo] path to come back to after Google. Defaults to
   *        the page the user is currently on, so sign-in works from anywhere
   *        (the course, the learner-progress dashboard, …) instead of always
   *        dumping the user back on the course.
   */
  const signInWithGoogle = useCallback(async (returnTo) => {
    // Guard: this is also wired directly to onClick handlers, which would
    // otherwise pass a click event in as `returnTo`.
    const path =
      typeof returnTo === 'string' && returnTo.startsWith('/')
        ? returnTo
        : `${window.location.pathname}${window.location.search}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${path}`,
        // Always offer the account chooser, otherwise Google silently reuses
        // whichever account the browser is already signed into and the user
        // has no way to switch.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setAuthError(error);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // A stale/expired session makes signOut throw; the local session must
      // still be dropped or the user appears permanently signed in.
      console.error('[auth] sign-out failed:', err?.message || err);
    }
    setSession(null);
  }, []);

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ session, user, loading, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
