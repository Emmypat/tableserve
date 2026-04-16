import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ShoppingCart, Plus, Minus, CheckCircle, AlertCircle } from 'lucide-react'

const WEDDING_NAME  = import.meta.env.VITE_WEDDING_NAME  || 'Bamai & Kazah'
const WEDDING_DATE  = import.meta.env.VITE_WEDDING_DATE  || '11 April 2026'
const CATEGORIES    = ['Starter', 'Main', 'Dessert', 'Drinks']

export default function GuestMenu() {
  const { tableId } = useParams()
  const [table, setTable] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [eventId, setEventId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [guestName, setGuestName] = useState('')
  const [quantities, setQuantities] = useState({})
  const [specialRequests, setSpecialRequests] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderSummary, setOrderSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Fetch the single event
        const { data: ev, error: evErr } = await supabase
          .from('events').select('id').order('created_at').limit(1).single()
        if (evErr) throw new Error('Event error: ' + evErr.message)
        if (!ev) { setNotFound(true); setLoading(false); return }

        // Fetch table
        const { data: tb, error: tbErr } = await supabase
          .from('tables').select('*, ushers(id)').eq('id', tableId).eq('event_id', ev.id).single()
        if (tbErr && tbErr.code !== 'PGRST116') throw new Error('Table error: ' + tbErr.message)
        if (!tb) { setNotFound(true); setLoading(false); return }

        // Fetch menu
        const { data: items, error: menuErr } = await supabase
          .from('menu_items').select('*').eq('event_id', ev.id).eq('available', true).order('sort_order').order('created_at')
        if (menuErr) throw new Error('Menu error: ' + menuErr.message)

        setEventId(ev.id)
        setTable(tb)
        setMenuItems(items || [])
        setLoading(false)
      } catch (err) {
        setLoadError(err.message)
        setLoading(false)
      }
    }
    load()
  }, [tableId])

  function setQty(itemId, delta) {
    setQuantities(q => {
      const current = q[itemId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [itemId]: _, ...rest } = q
        return rest
      }
      return { ...q, [itemId]: next }
    })
  }

  const cartItems = menuItems
    .filter(item => quantities[item.id] > 0)
    .map(item => ({ menu_item_id: item.id, name: item.name, qty: quantities[item.id] }))

  const cartCount = Object.values(quantities).reduce((a, b) => a + b, 0)

  async function submitOrder() {
    if (cartItems.length === 0) { setError('Please select at least one item.'); return }
    setError('')
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('orders').insert({
        event_id: eventId,
        table_id: tableId,
        usher_id: table.ushers?.id || null,
        guest_name: guestName.trim() || null,
        order_type: 'individual',
        items: cartItems,
        special_requests: specialRequests.trim() || null,
        status: 'pending',
      })
      if (insertError) throw insertError
      await supabase.from('tables').update({ status: 'ordered' }).eq('id', tableId)
      setOrderSummary(cartItems)
      setSubmitted(true)
    } catch {
      setError('Failed to submit order. Please try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-burgundy border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
      <div>
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h1 className="font-serif text-xl text-brown mb-2">Could not load menu</h1>
        <p className="text-brown-muted text-sm mb-4">Please ask your usher for help.</p>
        <code className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg block">{loadError}</code>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 text-center">
      <div>
        <AlertCircle size={48} className="text-brown-muted/30 mx-auto mb-4" />
        <h1 className="font-serif text-xl text-brown mb-2">Table not found</h1>
        <p className="text-brown-muted text-sm">This QR code may be invalid. Please ask an usher for help.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full">
        <div className="w-20 h-20 rounded-full bg-burgundy-pale flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-burgundy" />
        </div>
        <h1 className="font-serif text-2xl text-brown mb-2">Order Received!</h1>
        <p className="text-brown-muted mb-6">Your usher will bring your food shortly.</p>

        <div className="bg-white border border-cream-border rounded-2xl p-5 text-left mb-6 shadow-sm">
          <div className="label-gold mb-3">Your Order</div>
          {orderSummary?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-cream-border last:border-0">
              <span className="text-brown">{item.name}</span>
              <span className="font-bold text-gold-warm">×{item.qty}</span>
            </div>
          ))}
          {specialRequests && (
            <div className="mt-3 text-sm text-brown-muted">
              <span className="font-medium">Note:</span> {specialRequests}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-brown-muted">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gold-warm animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          Estimated wait: 10–15 minutes
        </div>

        <button
          onClick={() => { setSubmitted(false); setQuantities({}); setGuestName(''); setSpecialRequests('') }}
          className="mt-8 text-sm text-brown-muted hover:text-brown transition"
        >
          Place another order
        </button>
      </div>
    </div>
  )

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = menuItems.filter(i => i.category === cat)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Header */}
      <div className="bg-burgundy-deep text-white px-4 pt-8 pb-6 sm:px-6 sm:pt-10 sm:pb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(212,175,55,0.3) 40px, rgba(212,175,55,0.3) 41px)' }} />
        <div className="relative max-w-xl mx-auto text-center">
          <div className="label-gold mb-2" style={{ color: '#C4973B' }}>{WEDDING_DATE}</div>
          <h1 className="font-serif text-3xl font-bold text-white mb-1">{WEDDING_NAME}</h1>
          <div className="w-10 h-0.5 bg-gold-warm mx-auto my-3" />
          <div className="text-xl font-bold text-gold-light">{table.table_name}</div>
          <p className="text-white/50 text-sm mt-1">Select your items below</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {/* Guest Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-brown mb-1.5">Your Name (optional)</label>
          <input
            className="w-full bg-white border border-cream-border text-brown rounded-xl px-4 py-3 placeholder-brown-muted/40 focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy/50 transition"
            placeholder="e.g. Amina"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
          />
        </div>

        {/* Menu by Category */}
        {CATEGORIES.filter(cat => groupedItems[cat]?.length > 0).map(cat => (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-bold text-brown-muted uppercase tracking-widest mb-4 border-b border-cream-border pb-2">
              {cat}
            </h2>
            <div className="space-y-4">
              {groupedItems[cat].map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start bg-white rounded-2xl p-4 border border-cream-border shadow-sm">
                  {item.photo_url ? (
                    <img src={item.photo_url} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" alt={item.name} />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-burgundy-pale flex items-center justify-center text-3xl flex-shrink-0">🍽️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brown">{item.name}</div>
                    {item.description && (
                      <p className="text-sm text-brown-muted mt-0.5 leading-snug">{item.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => setQty(item.id, -1)}
                        disabled={!quantities[item.id]}
                        className="w-10 h-10 rounded-full bg-cream border border-cream-border hover:bg-cream-border disabled:opacity-30 flex items-center justify-center transition"
                      >
                        <Minus size={14} className="text-brown"/>
                      </button>
                      <span className="w-8 text-center font-bold text-brown text-lg">
                        {quantities[item.id] || 0}
                      </span>
                      <button
                        onClick={() => setQty(item.id, 1)}
                        className="w-10 h-10 rounded-full bg-burgundy hover:bg-burgundy-mid text-white flex items-center justify-center transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {menuItems.length === 0 && (
          <div className="text-center py-16 text-brown-muted">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="font-serif text-lg">Menu coming soon</p>
          </div>
        )}

        {/* Special Requests */}
        {cartCount > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-brown mb-1.5">Special Requests (optional)</label>
            <textarea
              className="w-full bg-white border border-cream-border text-brown rounded-xl px-4 py-3 placeholder-brown-muted/40 focus:outline-none focus:ring-2 focus:ring-burgundy/30 focus:border-burgundy/50 transition resize-none"
              rows={2}
              placeholder="e.g. No pepper, extra sauce, allergy info…"
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-cream-border py-5 text-center mt-6">
        <p className="text-xs tracking-widest uppercase font-semibold text-amber-600/60">
          Powered by Yerima Shettima
        </p>
      </footer>

      {/* Sticky Cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-border shadow-xl px-4 py-4 z-20">
          <div className="max-w-xl mx-auto">
            {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full bg-burgundy hover:bg-burgundy-mid disabled:opacity-50 active:bg-burgundy-deep text-white font-bold py-4 rounded-full text-lg transition shadow-lg flex items-center justify-center gap-3"
            >
              <ShoppingCart size={20} />
              {submitting ? 'Placing order…' : `Place Order · ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
