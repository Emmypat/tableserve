import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Clock, LogOut } from 'lucide-react'

export default function PendingApproval() {
  const { organizer, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-green-dark mb-8">
          <span className="text-gold text-3xl">⬡</span> TableServe
        </Link>

        <div className="card">
          <div className="w-16 h-16 bg-gold-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gold-dark" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Account pending approval</h1>
          <p className="text-gray-500 text-sm mb-1">
            Hi <strong>{organizer?.name || 'there'}</strong>, your account is under review.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            You'll be able to access your dashboard once approved. This usually takes less than 24 hours.
          </p>
          <button onClick={logout} className="flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-red-500 transition">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
