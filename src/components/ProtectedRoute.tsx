/**
 * Email Portal Protected Route Component
 * Wrapper for routes that require authentication
 */
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, token, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Check authentication status on mount
    if (token && !isAuthenticated) {
      checkAuth()
    }
  }, [token, isAuthenticated, checkAuth])

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}