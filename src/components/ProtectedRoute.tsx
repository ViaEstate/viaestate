import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('admin' | 'broker' | 'private_user')[]
  redirectTo?: string
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Show loading ONLY on initial load (when we have no user data at all)
  // This prevents blocking the UI when switching tabs or on token refresh
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check role-based access if specified
  if (allowedRoles && profile) {
    const hasAccess = allowedRoles.includes(profile.role)
    
    if (!hasAccess) {
      console.warn('Access denied - user role:', profile.role)
      return <Navigate to="/" replace />
    }
  }

  // User is authenticated and authorized
  return <>{children}</>
}

export default ProtectedRoute