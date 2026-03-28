import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUsher } from '../../context/UsherContext'

export default function UsherLogin() {
  const { loginUsher, usher } = useUsher()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [form, setForm] = useState({ event_id: '', pin: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usher) navigate('/usher/dashboard', { replace: true })
    supabase.from('events').select('id, name, date').eq('status', 'active').order('date').then(({ data }) => setEvents(data || []))
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!form.event_id) { setError('Please select your event'); return }
    if (form.pin.length !== 4) { setError('PIN must be 4 digits'); return }

    setLoading(true)
    const { data, error: qErr } = await supabase
      .from('ushers')
      .select('id, name, event_id, events(name, slug)')
      .eq('event_id', form.event_id)
      .eq('pin', form.pin)
      .single()

    if (qErr || !data) {
      setError('Invalid PIN. Please check with your coordinator.')
      setLoading(false)
      return
    }

    loginUsher({
      id: data.id,
      name: data.name,
      event_id: data.event_id,
      event_name: data.events?.name,
      event_slug: data.events?.slug,
    })
    navigate('/usher/dashboard')
  }

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setForm(f => ({ ...f, pin: val }))
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-2xl text-white mb-6">
            <span className="text-gold text-3xl">⬡</span> TableServe
          </div>
          <h1 className="text-2xl font-bold text-white">Usher Login</h1>
          <p className="text-gray-400 mt-1">Enter your event and PIN</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
          {error && (
            <div className="bg-red-900/50 text-red-300 border border-red-700/50 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Event</label>
              <select
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold/50"
                value={form.event_id}
                onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))}
                required
              >
                <option value="">— Choose your event —</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
              {events.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No active events found. Ask your coordinator.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your 4-Digit PIN</label>
              <input
                className="w-full bg-gray-700 border border-gray-600 text-white text-center text-4xl font-mono tracking-[0.5em] rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder-gray-600"
                type="tel"
                inputMode="numeric"
                placeholder="••••"
                value={form.pin}
                onChange={handlePinInput}
                maxLength={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || form.pin.length !== 4}
              className="w-full bg-gold hover:bg-gold-dark disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition"
            >
              {loading ? 'Verifying...' : 'Start Shift'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-700 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-300">Organizer? Login here →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
