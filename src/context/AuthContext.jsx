import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authClient } from '../lib/supabaseClients';
import { getMyProfile } from '../lib/profiles';

const AuthContext = createContext(null);

/**
 * Application-wide authentication and role state.
 *
 * There is exactly ONE identity provider (`authClient`, the shared OAHRIS
 * project), because a Supabase JWT is only valid on the project that issued
 * it. Every module's data access is governed by this session.
 *
 * Exposes:
 *   user        the auth user, or null
 *   profile     the row from public.profiles (role, status, name), or null
 *   role        'admin' | 'researcher' | 'student' | null
 *   loading     true until BOTH the session and the profile have resolved
 *   isAdmin / canWrite / isActive   convenience predicates
 *
 * ── These predicates are NOT security ───────────────────────────────────
 * They decide what the interface renders. Access itself is enforced by
 * Row-Level Security in the database, because the anon key is public and
 * anyone can query the API directly. A check bypassed here still meets a
 * database that refuses the operation.
 *
 * Dashboard setup (one time, see access_control/README.md):
 *   Authentication → Providers → Email, and Google if used
 *   Authentication → URL Configuration → add every deployed origin to the
 *   Redirect URLs allow-list
 *
 * The OAuth callback lands on a client-side route, so a static host must
 * rewrite all paths to index.html or the callback 404s — see vercel.json /
 * public/_redirects.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  /* ---------------------------- session ---------------------------- */
  useEffect(() => {
    let active = true;

    // Resolves any stored session and completes an OAuth redirect (exchanging
    // the ?code= / #access_token= in the URL, then cleaning the address bar).
    authClient.auth
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
        if (active) setSessionLoading(false);
      });

    const { data: sub } = authClient.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setSessionLoading(false); // the redirect can resolve after getSession settles
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  /* ---------------------------- profile ---------------------------- */
  const userId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    const row = await getMyProfile(userId);
    setProfile(row);
    setProfileLoading(false);
  }, [userId]);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      return undefined;
    }
    setProfileLoading(true);
    getMyProfile(userId).then((row) => {
      if (!active) return;
      setProfile(row);
      setProfileLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  /* ---------------------------- actions ---------------------------- */

  /**
   * Google sign-in.
   * @param {string} [returnTo] path to return to; defaults to the current page.
   */
  const signInWithGoogle = useCallback(async (returnTo) => {
    // Guard: also wired directly to onClick handlers, which would otherwise
    // pass a click event in as `returnTo`.
    const path =
      typeof returnTo === 'string' && returnTo.startsWith('/')
        ? returnTo
        : `${window.location.pathname}${window.location.search}`;

    const { error } = await authClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${path}`,
        // Always offer the account chooser; otherwise Google silently reuses
        // whichever account the browser holds and the user cannot switch.
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setAuthError(error);
    return { error };
  }, []);

  const signInWithPassword = useCallback(async (email, password) => {
    const { error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error);
    return { error };
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    const { error } = await authClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (password) => {
    const { error } = await authClient.auth.updateUser({ password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authClient.auth.signOut();
    } catch (err) {
      // A stale/expired session makes signOut throw; the local session must
      // still be dropped or the user appears permanently signed in.
      console.error('[auth] sign-out failed:', err?.message || err);
    }
    setSession(null);
    setProfile(null);
  }, []);

  /* ---------------------------- derived ---------------------------- */
  const value = useMemo(() => {
    const user = session?.user ?? null;
    const status = profile?.status ?? null;
    // Two status vocabularies coexist in this database: 'active' from this
    // project, and 'approved' from the earlier approval workflow (PR #25)
    // whose schema is still deployed. Both mean "may use the system", and
    // current_user_role() in SQL treats them identically — the two must agree
    // or a user the database accepts would appear role-less in the UI.
    const usable = status === 'active' || status === 'approved';
    const role = usable ? profile.role : null;

    return {
      session,
      user,
      profile,
      role,
      // Wait for the profile too: routing on a half-known role would flash the
      // wrong screen or bounce an admin to the 403 page.
      loading: sessionLoading || profileLoading,
      authError,
      isAuthenticated: Boolean(user),
      isActive: Boolean(role),
      status,
      // Blocked by an administrator, vs still awaiting approval — the guards
      // show different screens because the user's next step differs.
      isSuspended: status === 'suspended' || status === 'rejected',
      isPending: status === 'pending',
      isAdmin: role === 'admin',
      isResearcher: role === 'researcher',
      isStudent: role === 'student',
      canWrite: role === 'admin' || role === 'researcher',
      // True when signed in but no profile row exists — usually means
      // 01_identity_and_roles.sql has not been run yet.
      missingProfile: Boolean(user) && !profileLoading && !profile,
      signInWithGoogle,
      signInWithPassword,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile,
    };
  }, [
    session,
    profile,
    sessionLoading,
    profileLoading,
    authError,
    signInWithGoogle,
    signInWithPassword,
    requestPasswordReset,
    updatePassword,
    signOut,
    refreshProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/** Convenience for conditional rendering: const { canWrite } = useRole() */
export function useRole() {
  const { role, isAdmin, isResearcher, isStudent, canWrite, isActive } = useAuth();
  return { role, isAdmin, isResearcher, isStudent, canWrite, isActive };
}
