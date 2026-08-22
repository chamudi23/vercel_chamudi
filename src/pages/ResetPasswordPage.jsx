/**
 * ResetPasswordPage.jsx
 * =====================
 * Where a password-reset link lands.
 *
 * Supabase puts the user into a temporary recovery session when they follow
 * the link, so `updateUser({ password })` works without the old password.
 * That session is what authorises the change — if the link has expired there
 * is no session and the form is refused, which is why this page checks for
 * one rather than assuming.
 *
 * Public route: the user is by definition not signed in normally here.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate('/app', { replace: true }), 2500);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err.message || 'Could not set the password. The link may have expired.');
      return;
    }
    setDone(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link to="/">
            <span className="block text-xl font-bold tracking-wide text-blue-400">OAHRIS</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          {done ? (
            <>
              <h1 className="text-xl font-bold text-white">Password updated</h1>
              <p className="mt-3 text-sm text-slate-400">
                Taking you to the research systems…
              </p>
            </>
          ) : loading ? (
            <p className="text-sm text-slate-400">Checking your link…</p>
          ) : !isAuthenticated ? (
            <>
              <h1 className="text-xl font-bold text-white">Link expired</h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                This reset link is no longer valid. Request a new one from the sign-in page.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white">Choose a new password</h1>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {busy ? 'Saving…' : 'Set password'}
                </button>
              </form>
              {error && (
                <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
