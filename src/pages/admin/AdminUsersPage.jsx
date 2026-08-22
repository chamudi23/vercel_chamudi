/**
 * AdminUsersPage.jsx
 * ==================
 * Admin-only user management: invite researchers and students, change roles,
 * suspend accounts.
 *
 * Route: /admin/users  (wrapped in <RequireRole roles={['admin']}>)
 *
 * Enforcement lives in the database, not here:
 *   - listing returns only the caller's own row unless they are an admin
 *     (profiles_select_admin policy);
 *   - role and status changes are rejected for non-admins by the
 *     guard_profile_update() trigger;
 *   - creating an account requires the service_role key, which is held by the
 *     admin-users Edge Function and never reaches the browser. That function
 *     re-verifies the caller is an admin from their JWT.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  listProfiles,
  setUserRole,
  setUserStatus,
  inviteUser,
} from '../../lib/profiles';

const ROLE_BADGE = {
  admin: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  researcher: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  student: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

function InviteDialog({ open, onClose, onDone }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('invite'); // 'invite' | 'password'
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'password' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    const { error: err } = await inviteUser({
      email: email.trim(),
      fullName: fullName.trim(),
      role,
      mode,
      password,
    });
    setBusy(false);
    if (err) {
      setError(
        String(err.message).includes('Function not found')
          ? 'The admin-users Edge Function is not deployed. See access_control/README.md step M5.'
          : err.message
      );
      return;
    }
    setEmail('');
    setFullName('');
    setPassword('');
    onDone(
      mode === 'invite'
        ? `Invitation sent to ${email.trim()}.`
        : `Account created for ${email.trim()}.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-7">
        <h2 className="text-lg font-bold text-white">Add a user</h2>
        <p className="mt-1 text-sm text-slate-400">
          The account is created immediately with the role you choose.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder="name@institution.lk"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
              placeholder="A. N. Perera"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-slate-400">
              Role *
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${
                    role === r
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">{ROLE_LABELS[r]}</span>
                    <span className="block text-xs text-slate-400">{ROLE_DESCRIPTIONS[r]}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
            <div className="flex gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === 'invite'}
                  onChange={() => setMode('invite')}
                />
                <span className="text-slate-200">E-mail an invitation</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  checked={mode === 'password'}
                  onChange={() => setMode('password')}
                />
                <span className="text-slate-200">Set a password now</span>
              </label>
            </div>
            {mode === 'invite' ? (
              <p className="mt-2 text-xs text-slate-500">
                They receive a link and choose their own password. Requires working e-mail
                delivery on the Supabase project.
              </p>
            ) : (
              <>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  placeholder="Temporary password (min 8 characters)"
                />
                <p className="mt-2 text-xs text-amber-400/80">
                  You must pass this password to the user yourself. Ask them to change it after
                  first sign-in.
                </p>
              </>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {busy ? 'Working…' : mode === 'invite' ? 'Send invitation' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { rows: data, error: err } = await listProfiles();
    if (err) setError(err.message);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchRole = filterRole === 'all' || r.role === filterRole;
      const matchText =
        !q ||
        (r.email || '').toLowerCase().includes(q) ||
        (r.full_name || '').toLowerCase().includes(q);
      return matchRole && matchText;
    });
  }, [rows, search, filterRole]);

  const counts = useMemo(
    () =>
      ROLES.reduce(
        (acc, r) => ({ ...acc, [r]: rows.filter((x) => x.role === r).length }),
        {}
      ),
    [rows]
  );

  const changeRole = async (row, role) => {
    setError('');
    setNotice('');
    // Guard against an admin removing their own last privileges by accident.
    if (row.user_id === me?.id && role !== 'admin') {
      const remaining = rows.filter((r) => r.role === 'admin' && r.user_id !== row.user_id).length;
      if (remaining === 0) {
        setError('You are the only administrator. Promote someone else before changing your own role.');
        return;
      }
      if (!window.confirm('This removes your own administrator access. Continue?')) return;
    }
    const { error: err } = await setUserRole(row.user_id, role);
    if (err) {
      setError(err.message);
      return;
    }
    setNotice(`${row.email} is now a ${ROLE_LABELS[role].toLowerCase()}.`);
    load();
  };

  const toggleStatus = async (row) => {
    setError('');
    setNotice('');
    const next = row.status === 'active' ? 'suspended' : 'active';
    if (row.user_id === me?.id && next === 'suspended') {
      setError('You cannot suspend your own account.');
      return;
    }
    if (next === 'suspended' && !window.confirm(`Suspend ${row.email}? They lose access immediately.`)) {
      return;
    }
    const { error: err } = await setUserStatus(row.user_id, next);
    if (err) {
      setError(err.message);
      return;
    }
    setNotice(`${row.email} is now ${next}.`);
    load();
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <button
        onClick={() => navigate('/app')}
        className="mb-8 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        ← Back to the research systems
      </button>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-400/80">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length} account{rows.length === 1 ? '' : 's'} ·{' '}
            {ROLES.map((r) => `${counts[r] || 0} ${ROLE_LABELS[r].toLowerCase()}`).join(' · ')}
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          + Add user
        </button>
      </div>

      {notice && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or e-mail…"
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-400">Loading users…</div>
        ) : !filtered.length ? (
          <div className="px-6 py-16 text-center text-sm text-slate-400">
            {rows.length ? 'No user matches that search.' : 'No users yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {['User', 'Role', 'Status', 'Added', ''].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.user_id}
                    className={`border-b border-white/5 last:border-b-0 ${i % 2 ? 'bg-white/[0.01]' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-white/90">{r.full_name || '—'}</span>
                      <span className="block text-xs text-slate-500">{r.email}</span>
                      {r.user_id === me?.id && (
                        <span className="mt-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                          you
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={r.role}
                        onChange={(e) => changeRole(r, e.target.value)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none ${ROLE_BADGE[r.role]}`}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role} className="bg-slate-900 text-white">
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          r.status === 'active'
                            ? 'text-xs text-emerald-400'
                            : 'text-xs text-amber-400'
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {r.created_at ? String(r.created_at).slice(0, 10) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleStatus(r)}
                        disabled={r.user_id === me?.id}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-30"
                      >
                        {r.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-500">
        Suspension takes effect immediately — a suspended account keeps its session but is denied
        by every database policy. Role changes apply on the user&apos;s next request.
      </p>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onDone={(msg) => {
          setNotice(msg);
          load();
        }}
      />
    </div>
  );
}
