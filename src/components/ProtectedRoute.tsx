import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { UserRole } from '../types'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const session = useAuthStore((state) => state.session)
  const hasRole = useAuthStore((state) => state.hasRole)
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
