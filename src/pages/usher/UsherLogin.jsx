import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUsher } from '../../context/UsherContext'

const WEDDING_NAME = import.meta.env.VITE_WEDDING_NAME || 'Bamai & Kazah'

export default function UsherLogin() {
  const { loginUsher, usher } = useUsher()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usher) navigate('/usher/dashboard', { replace: true })
  }, [])

  function handlePinInput(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (pin.length !== 4) { setError('PIN must be 4 digits'); return }

    setLoading(true)
    const { data, error: qErr } = await supabase
      .from('ushers')
      .select('id, name, event_id')
      .eq('pin', pin)
      .single()

    if (qErr || !data) {
      setError('Invalid PIN. Please check with your coordinator.')
      setLoading(false)
      return
    }

    loginUsher({ id: data.id, name: data.name, event_id: data.event_id })
    navigate('/usher/dashboard')
  }

  return (
    <div className="min-h-screen bg-burgundy-deep flex items-center justify-center px-4">
      <div className="w-full max-w-xs">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="label-gold mb-2" style={{ color: '#C4973B' }}>Wedding Reception</div>
          <h1 className="font-serif text-3xl text-white mb-1">{WEDDING_NAME}</h1>
          <div className="w-12 h-0.5 bg-gold-warm mx-auto mt-3" />
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 shadow-2xl">
          <h2 className="font-serif text-xl text-white mb-1 text-center">Usher Login</h2>
          <p className="text-white/50 text-sm text-center mb-6">Enter your 4-digit PIN</p>

          {error && (
            <div className="bg-red-900/40 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                className="w-full bg-white/10 border border-white/20 text-white text-center text-4xl font-mono tracking-[0.6em] rounded-xl px-4 py-5 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                type="tel"
                inputMode="numeric"
                placeholder="••••"
                value={pin}
                onChange={handlePinInput}
                maxLength={4}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-gold-warm hover:bg-gold-dark disabled:opacity-50 text-white font-semibold py-4 rounded-full text-lg transition mt-2"
            >
              {loading ? 'Verifying...' : 'Start Shift'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/30 hover:text-white/60 text-xs transition">
            ← Back to wedding page
          </Link>
        </div>
      </div>
    </div>
  )
}
