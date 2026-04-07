import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'
import type { Role } from '../../types'
import { PageSkeleton } from './page-skeleton'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: Role[]
}) {
  const { user, loading, role } = useAuth()

  if (loading) {
    return <PageSkeleton />
  }

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
