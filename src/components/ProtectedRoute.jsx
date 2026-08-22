/* eslint-disable react/prop-types */
import { Navigate, useLocation } from 'react-router-dom'
import { useAppAuth } from '../context/AppAuthContext'

function CenteredMessage({ title, body }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <p className="text-slate-200 font-semibold text-lg mb-2">{title}</p>
        <p className="text-slate-400 text-sm">{body}</p>
      </div>
    </div>
  )
}

/**
 * Gate for a single route.
 *   <ProtectedRoute><Page/></ProtectedRoute>                  → any signed-in, approved role
 *   <ProtectedRoute roles={['admin']}><Page/></ProtectedRoute> → admin only, etc.
 * Not signed in       → redirect to /login
 * Signed in, pending  → "waiting for approval" message (no page content)
 * Signed in, rejected → "access denied" message
 * Wrong role          → redirect to /
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, role, status, loading } = useAppAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (status === 'pending') {
    return (
      <CenteredMessage
        title="Waiting for Admin approval"
        body="Your account has been created but hasn't been approved yet. Ask an Admin to approve it from the Approvals page, then sign in again."
      />
    )
  }

  if (status === 'rejected') {
    return (
      <CenteredMessage
        title="Account access denied"
        body="An Admin has denied this account. Contact your project Admin if you believe this is a mistake."
      />
    )
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
