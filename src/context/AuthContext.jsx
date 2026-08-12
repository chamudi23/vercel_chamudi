import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/skeletalSupabase';

const AuthContext = createContext(null);

/**
 * Authentication context backed by Supabase Auth (Google OAuth).
 *
 * Setup required in the Supabase dashboard (one time):
 *   Authentication → Providers → Google → enable, paste Google OAuth
 *   Client ID + Secret, and add your app URL to the redirect allow-list.
 * See KgcCourse login screen / README for full steps.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get any existing session (also handles the OAuth redirect hash on return)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Return to the course after Google sends the user back.
        redirectTo: `${window.location.origin}/skeletal/knowledge/course`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
