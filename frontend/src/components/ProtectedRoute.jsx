import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Sparkle } from 'phosphor-react'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-mute text-sm flex items-center gap-2">
          <Sparkle size={16} className="text-cyan animate-glow" weight="duotone" />
          Loading…
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && !profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
