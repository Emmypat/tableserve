import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const WEDDING_NAME = import.meta.env.VITE_WEDDING_NAME || 'Bamai & Kazah'

export default function AdminLogin() {
  const { login, session, requestPasswordReset } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState('login') // 'login' | 'forgot' | 'sent'
  const [form, setForm] = useState({ email: '', password: '' })
  const [resetEmail, setResetEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) navigate('/admin/dashboard', { replace: true })
  }, [session])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/admin/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally { setLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(resetEmail)
      setView('sent')
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-burgundy-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="label-gold mb-2" style={{ color: '#C4973B' }}>Wedding Management</div>
          <h1 className="font-serif text-3xl text-white mb-1">{WEDDING_NAME}</h1>
          <div className="w-12 h-0.5 bg-gold-warm mx-auto mt-3" />
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-7 shadow-2xl">

          {view === 'login' && (
            <>
              <h2 className="font-serif text-xl text-white mb-5 text-center">Admin Login</h2>

              {error && (
                <div className="bg-red-900/40 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                    type="email"
                    placeholder="admin@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-warm hover:bg-gold-dark disabled:opacity-50 text-white font-semibold py-3 rounded-full transition mt-2"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <button
                onClick={() => { setView('forgot'); setError('') }}
                className="w-full text-center text-white/40 hover:text-white/70 text-sm mt-4 transition"
              >
                Forgot password?
              </button>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h2 className="font-serif text-xl text-white mb-2 text-center">Reset Password</h2>
              <p className="text-white/50 text-sm text-center mb-5">
                Enter your admin email and we'll send a reset link.
              </p>

              {error && (
                <div className="bg-red-900/40 border border-red-400/30 text-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                  <input
                    className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-gold-warm/50 focus:border-gold-warm transition"
                    type="email"
                    placeholder="admin@example.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-warm hover:bg-gold-dark disabled:opacity-50 text-white font-semibold py-3 rounded-full transition"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <button
                onClick={() => { setView('login'); setError('') }}
                className="w-full text-center text-white/40 hover:text-white/70 text-sm mt-4 transition"
              >
                ← Back to login
              </button>
            </>
          )}

          {view === 'sent' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="font-serif text-xl text-white mb-2">Check your email</h2>
              <p className="text-white/60 text-sm mb-6">
                A password reset link has been sent to <strong className="text-white/80">{resetEmail}</strong>.
                Click the link in the email to set a new password.
              </p>
              <button
                onClick={() => { setView('login'); setError(''); setResetEmail('') }}
                className="text-white/40 hover:text-white/70 text-sm transition"
              >
                ← Back to login
              </button>
            </div>
          )}
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
