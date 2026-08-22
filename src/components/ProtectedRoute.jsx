/* eslint-disable react/prop-types */
import { Navigate, useLocation } from 'react-router-dom'
import { useAppAuth } from '../context/AppAuthContext'

/**
 * Gate for a single route.
 *   <ProtectedRoute><Page/></ProtectedRoute>                  → any signed-in role
 *   <ProtectedRoute roles={['admin']}><Page/></ProtectedRoute> → admin only, etc.
 * Not signed in  → redirect to /login
 * Wrong role     → redirect to /
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, role, loading } = useAppAuth()
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

  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
