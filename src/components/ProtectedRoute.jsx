import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/**
 * ProtectedRoute
 * Wraps any route that requires the user to be authenticated.
 * If not logged in → redirect to /login, preserving the intended path
 * in `location.state` so we can redirect back after login.
 */
export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location  = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
