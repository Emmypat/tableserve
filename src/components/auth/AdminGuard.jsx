import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminGuard({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/admin" replace />
  return children
}
