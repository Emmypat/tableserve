import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { generateSlug } from '../../utils/helpers'
import { Plus, Calendar, Table2, ChevronRight, Trash2 } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

const STATUS_STYLE = {
  draft:     'bg-gray-100 text-gray-600',
  active:    'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function Dashboard() {
  const { session, organizer } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', date: '', venue: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [session])

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, tables(count)')
      .eq('organizer_id', session.user.id)
      .order('created_at', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  async function createEvent(e) {
    e.preventDefault()
    if (!newEvent.name.trim()) return
    setCreating(true)
    setError('')
    try {
      const slug = generateSlug(newEvent.name)
      const { data, error } = await supabase.from('events').insert({
        organizer_id: session.user.id,
        name: newEvent.name.trim(),
        date: newEvent.date || null,
        venue: newEvent.venue || null,
        slug,
        status: 'draft',
      }).select().single()
      if (error) throw error
      navigate(`/event/${data.id}/setup`)
    } catch (err) {
      setError(err.message)
    } finally { setCreating(false) }
  }

  async function deleteEvent(id) {
    if (!confirm('Delete this event and all its data? This cannot be undone.')) return
    await supabase.from('events').delete().eq('id', id)
    setEvents(ev => ev.filter(e => e.id !== id))
  }

  return (
    <OrganizerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-500 mt-1">Welcome back, {organizer?.name} 👋</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> New Event
        </button>
      </div>

      {/* Create Event Form */}
      {showForm && (
        <div className="card mb-8 border-2 border-green-dark/20">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Event</h2>
          {error && <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>}
          <form onSubmit={createEvent} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input className="input-field" placeholder="Bello & Amina Wedding" value={newEvent.name}
                onChange={e => setNewEvent(n => ({ ...n, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input className="input-field" type="date" value={newEvent.date}
                onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input className="input-field" placeholder="Eko Hotel, Lagos" value={newEvent.venue}
                onChange={e => setNewEvent(n => ({ ...n, venue: e.target.value }))} />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating...' : 'Create & Set Up Event'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No events yet</h2>
          <p className="text-gray-400 mb-6">Create your first event to get started</p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} /> Create Event
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event.id} className="card hover:shadow-md transition group">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[event.status] || STATUS_STYLE.draft}`}>
                  {event.status}
                </span>
                <button onClick={() => deleteEvent(event.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition">
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{event.name}</h3>
              <div className="space-y-1 text-sm text-gray-500 mb-4">
                {event.date && <div className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(event.date)}</div>}
                {event.venue && <div className="text-gray-400 text-xs truncate">{event.venue}</div>}
                <div className="flex items-center gap-1.5"><Table2 size={14} />{event.tables?.[0]?.count || 0} tables</div>
              </div>
              <Link to={`/event/${event.id}/setup`}
                className="flex items-center justify-between text-green-dark font-semibold text-sm hover:text-green-mid transition">
                Manage Event <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  )
}
