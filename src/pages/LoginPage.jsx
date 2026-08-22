/**
 * LoginPage.jsx
 * =============
 * The single entry point into the research systems.
 *
 * Supports Google and email/password, because Google alone would exclude
 * anyone without a Google account and password alone would discard the
 * already-working Google flow.
 *
 * There is deliberately NO sign-up form. Accounts are created by an
 * administrator (see AdminUsersPage). Public sign-up should also be disabled
 * in the Supabase dashboard — otherwise the role model is bypassable by
 * self-registering. See access_control/README.md, manual step M3.
 */

import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0012 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 010-4.6V6.7H1.4a12 12 0 000 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 001.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, signInWithGoogle, signInWithPassword, requestPasswordReset } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'reset'

  // Where the user was heading before the guard intercepted them.
  const from = location.state?.from?.pathname || '/app';

  // Already signed in? Don't show a login form.
  if (!loading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const friendly = (message) => {
    const m = String(message || '');
    if (m.includes('Invalid login credentials')) {
      return 'That e-mail and password combination was not recognised.';
    }
    if (m.includes('Email not confirmed')) {
      return 'Your e-mail address has not been confirmed yet — check your inbox for the invitation.';
    }
    if (m.includes('provider is not enabled')) {
      return 'Google sign-in is not enabled on this deployment. Use your e-mail and password, or ask an administrator to enable it.';
    }
    if (m.includes('rate limit') || m.includes('Too many')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    return m || 'Sign-in failed. Please try again.';
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await signInWithPassword(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(friendly(err.message));
      return;
    }
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setError('');
    setNotice('');
    setBusy(true);
    const { error: err } = await signInWithGoogle(from);
    // On success the browser leaves for Google, so nothing below runs.
    if (err) {
      setBusy(false);
      setError(friendly(err.message));
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Enter your e-mail address first.');
      return;
    }
    setBusy(true);
    const { error: err } = await requestPasswordReset(email.trim());
    setBusy(false);
    // Deliberately the same message either way: confirming which addresses
    // exist would let anyone enumerate the system's users.
    setNotice('If that address has an account, a reset link is on its way.');
    if (err) console.error('[auth] reset failed:', err.message);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/">
            <span className="block text-xl font-bold tracking-wide text-blue-400">OAHRIS</span>
            <span className="hidden text-xs text-slate-400 sm:block">
              Osteoarchaeological Research Information System
            </span>
          </Link>
          <Link to="/" className="text-sm text-slate-400 transition hover:text-white">
            ← Back to the public site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h1 className="text-2xl font-bold text-white">Sign in</h1>
            <p className="mt-2 text-sm text-slate-400">
              Access to the research systems is restricted to authorised accounts.
            </p>

            {mode === 'password' ? (
              <>
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg bg-white px-5 py-3 font-semibold text-slate-800 transition hover:bg-white/90 disabled:opacity-60"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form onSubmit={handlePassword} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="you@institution.lk"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {busy ? 'Signing in…' : 'Sign in'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError('');
                    setNotice('');
                  }}
                  className="mt-4 w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
                >
                  Forgotten your password?
                </button>
              </>
            ) : (
              <form onSubmit={handleReset} className="mt-7 space-y-4">
                <p className="text-sm text-slate-400">
                  Enter your e-mail address and we will send a reset link.
                </p>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                  placeholder="you@institution.lk"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busy ? 'Sending…' : 'Send reset link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('password');
                    setError('');
                    setNotice('');
                  }}
                  className="w-full text-center text-xs text-slate-500 transition hover:text-slate-300"
                >
                  ← Back to sign in
                </button>
              </form>
            )}

            {error && (
              <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs leading-relaxed text-emerald-300">
                {notice}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            Accounts are created by an administrator — there is no public sign-up. If you need
            access, contact the project supervisor.
          </p>
        </div>
      </main>
    </div>
  );
}
