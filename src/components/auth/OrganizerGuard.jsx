import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function OrganizerGuard({ children }) {
  const { session, loading, isApproved, isPending, isRejected } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-dark border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <Navigate to="/login" replace />
  if (isPending || isRejected) return <Navigate to="/pending" replace />
  if (!isApproved) return <Navigate to="/pending" replace />

  return children
}
