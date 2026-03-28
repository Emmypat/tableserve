import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, XCircle, Clock, LogOut } from 'lucide-react'

const ADMIN_EMAIL = 'patkatech@gmail.com'

const STATUS_STYLES = {
  pending:  'bg-yellow-50 text-yellow-700 border border-yellow-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-red-50 text-red-600 border border-red-200',
}

export default function Approvals() {
  const { session, logout } = useAuth()
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const isAdmin = session?.user?.email === ADMIN_EMAIL

  useEffect(() => {
    if (isAdmin) fetchAll()
  }, [isAdmin])

  async function fetchAll() {
    const { data } = await supabase
      .from('organizers')
      .select('*')
      .order('created_at', { ascending: false })
    setOrganizers(data || [])
    setLoading(false)
  }

  async function setStatus(id, status) {
    setUpdating(id)
    await supabase.from('organizers').update({ status }).eq('id', id)
    setOrganizers(list => list.map(o => o.id === id ? { ...o, status } : o))
    setUpdating(null)
  }

  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const pending  = organizers.filter(o => o.status === 'pending')
  const approved = organizers.filter(o => o.status === 'approved')
  const rejected = organizers.filter(o => o.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Approvals</h1>
            <p className="text-gray-500 text-sm mt-1">{pending.length} pending review</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition">
            <LogOut size={15} /> Sign out
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-bold text-yellow-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock size={14} /> Pending ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map(o => (
                    <OrganizerCard key={o.id} o={o} updating={updating} onApprove={() => setStatus(o.id, 'approved')} onReject={() => setStatus(o.id, 'rejected')} />
                  ))}
                </div>
              </section>
            )}

            {/* Approved */}
            {approved.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle size={14} /> Approved ({approved.length})
                </h2>
                <div className="space-y-3">
                  {approved.map(o => (
                    <OrganizerCard key={o.id} o={o} updating={updating} onReject={() => setStatus(o.id, 'rejected')} />
                  ))}
                </div>
              </section>
            )}

            {/* Rejected */}
            {rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <XCircle size={14} /> Rejected ({rejected.length})
                </h2>
                <div className="space-y-3">
                  {rejected.map(o => (
                    <OrganizerCard key={o.id} o={o} updating={updating} onApprove={() => setStatus(o.id, 'approved')} />
                  ))}
                </div>
              </section>
            )}

            {organizers.length === 0 && (
              <div className="text-center py-20 text-gray-400">No signups yet.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function OrganizerCard({ o, updating, onApprove, onReject }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-green-pale flex items-center justify-center text-green-dark font-bold text-sm flex-shrink-0">
        {o.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 text-sm">{o.name}</div>
        <div className="text-xs text-gray-400">{o.email} {o.phone ? `· ${o.phone}` : ''}</div>
        <div className="text-xs text-gray-300 mt-0.5">{new Date(o.created_at).toLocaleString()}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_STYLES[o.status]}`}>
        {o.status}
      </span>
      <div className="flex gap-2 flex-shrink-0">
        {onApprove && (
          <button onClick={onApprove} disabled={updating === o.id}
            className="text-xs bg-green-dark text-white px-3 py-1.5 rounded-lg hover:bg-green-mid transition disabled:opacity-50">
            Approve
          </button>
        )}
        {onReject && (
          <button onClick={onReject} disabled={updating === o.id}
            className="text-xs border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
            Reject
          </button>
        )}
      </div>
    </div>
  )
}
