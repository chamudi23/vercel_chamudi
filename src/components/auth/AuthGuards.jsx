/* eslint-disable react/prop-types */
/**
 * AuthGuards.jsx
 * ==============
 * Route-level gates: <RequireAuth> and <RequireRole>.
 *
 * ── What these do and do not do ─────────────────────────────────────────
 * They control what the interface SHOWS. They are not the security boundary
 * and must never be relied on as one. The Supabase anon key ships inside the
 * JavaScript bundle, so anyone can query the REST API directly and never
 * execute this code at all.
 *
 * The security boundary is Row-Level Security in the database
 * (access_control/02_rls_lockdown.sql). Every rule these guards express is
 * also enforced there — a student who edits the bundle to reach
 * /specimens/add still meets a database that refuses the insert.
 *
 * Treat a guard failing as a UX bug; treat an RLS policy failing as an
 * incident.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ------------------------------------------------------------------ */
/*  Shared screens                                                     */
/* ------------------------------------------------------------------ */

function Centered({ children }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">{children}</div>
    </div>
  );
}

function Spinner({ label }) {
  return (
    <Centered>
      <svg className="mx-auto h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
    </Centered>
  );
}

/** Signed in, but the account has been suspended by an administrator. */
function SuspendedScreen({ email, onSignOut }) {
  return (
    <Centered>
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-8">
        <h1 className="text-xl font-bold text-white">Account suspended</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          The account <span className="text-white">{email}</span> has been suspended and cannot
          access the research systems. Please contact an administrator.
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </Centered>
  );
}

/**
 * Signed in, but no `profiles` row exists.
 * In practice this means 01_identity_and_roles.sql has not been run, or the
 * handle_new_user trigger did not fire for this account.
 */
function MissingProfileScreen({ email, onSignOut }) {
  return (
    <Centered>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-8 text-left">
        <h1 className="text-center text-xl font-bold text-white">No role assigned</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          <span className="text-white">{email}</span> is signed in but has no profile, so no
          permissions could be determined. Access is denied by default.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          If you are setting the system up, this usually means{' '}
          <code className="text-emerald-300">access_control/01_identity_and_roles.sql</code> has
          not been run yet.
        </p>
        <button
          onClick={onSignOut}
          className="mt-6 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </Centered>
  );
}

/** Signed in with a valid role, but not one this route allows. */
export function ForbiddenScreen({ roles = [], role }) {
  return (
    <Centered>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-bold text-white">Not available to your account</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          This area is limited to{' '}
          <span className="text-white">{roles.join(' and ')}</span> accounts. You are signed in as
          a <span className="text-white">{role || 'guest'}</span>.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          If you believe you should have access, ask an administrator to change your role.
        </p>
        <a
          href="/app"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Back to the research systems
        </a>
      </div>
    </Centered>
  );
}

/* ------------------------------------------------------------------ */
/*  Guards                                                             */
/* ------------------------------------------------------------------ */

/**
 * Requires an authenticated, active account.
 * Sends unauthenticated visitors to /login, remembering where they were
 * heading so sign-in can return them there.
 */
export function RequireAuth({ children }) {
  const { loading, isAuthenticated, isActive, isSuspended, missingProfile, user, signOut } =
    useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your access…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (isSuspended) {
    return <SuspendedScreen email={user?.email} onSignOut={signOut} />;
  }
  if (missingProfile || !isActive) {
    return <MissingProfileScreen email={user?.email} onSignOut={signOut} />;
  }
  return children;
}

/**
 * Requires one of the listed roles. Implies RequireAuth.
 *
 * <RequireRole roles={['admin', 'researcher']}>…</RequireRole>
 */
export function RequireRole({ roles, children }) {
  const { loading, isAuthenticated, isActive, isSuspended, missingProfile, role, user, signOut } =
    useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your access…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (isSuspended) {
    return <SuspendedScreen email={user?.email} onSignOut={signOut} />;
  }
  if (missingProfile || !isActive) {
    return <MissingProfileScreen email={user?.email} onSignOut={signOut} />;
  }
  if (!roles.includes(role)) {
    return <ForbiddenScreen roles={roles} role={role} />;
  }
  return children;
}

/** Roles permitted to create or edit catalogue records. */
export const CURATOR_ROLES = ['admin', 'researcher'];
/** Roles permitted to administer users. */
export const ADMIN_ROLES = ['admin'];

/**
 * Conditional rendering helper for write actions inside a page.
 *
 *   <Can write><button>Add specimen</button></Can>
 *   <Can admin>…</Can>
 */
export function Can({ write, admin, children, fallback = null }) {
  const { canWrite, isAdmin } = useAuth();
  if (admin) return isAdmin ? children : fallback;
  if (write) return canWrite ? children : fallback;
  return children;
}
