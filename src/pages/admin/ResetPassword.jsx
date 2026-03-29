import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const WEDDING_NAME = import.meta.env.VITE_WEDDING_NAME || 'Bamai & Kazah'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)   // true once recovery session confirmed
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands on this page via the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      } else if (event === 'SIGNED_IN') {
        // also triggers on recovery redirect — treat as ready
        setReady(true)
      }
    })

    // If no event fires within 3s, the token may be missing/expired
    const timer = setTimeout(() => {
      setReady(r => { if (!r) { setInvalid(true) }; return r })
    }, 3000)

    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError('')
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/admin', { replace: true }), 2500)
    } catch (err) {
      setError(err.message || 'Could not update password.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-burgundy-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="label-gold mb-2" style={{ color: '#C4973B' }}>Wedding Management</div>
          <h1 className="font-serif text-3xl text-white mb-1">{WEDDING_NAME}</h1>
          <div className="w-12 h-0.5 bg-gold-warm mx-auto mt-3" />
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 shadow-2xl">

          {!ready && !invalid && (
            <div className="text-center py-6">
              <div className="w-8 h-8 border-4 border-gold-warm border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/60 text-sm">Verifying reset link…</p>
            </div>
          )}

          {invalid && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-serif text-xl text-white mb-2">Link expired</h2>
              <p className="text-white/60 text-sm mb-5">
                This reset link is invalid or has expired. Please request a new one.
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="bg-gold-warm hover:bg-gold-dark text-white text-sm font-semibold px-6 py-2.5 rounded-full transition"
              >
                Back to login
              </button>
            </div>
          )}

          {ready && !done && (
            <>
              <h2 className="font-serif text-xl text-white mb-2 text-center">Set New Password</h2>
              <p className="text-white/50 text-sm text-center mb-5">Choose a strong password for your admin account.</p>

              {error && (
                <div className="bg-red-900/40 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">New Password</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Confirm Password</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-warm hover:bg-gold-dark disabled:opacity-50 text-white font-semibold py-3 rounded-full transition"
                >
                  {loading ? 'Saving...' : 'Set Password'}
                </button>
              </form>
            </>
          )}

          {done && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="font-serif text-xl text-white mb-2">Password updated!</h2>
              <p className="text-white/60 text-sm">Redirecting you to login…</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
