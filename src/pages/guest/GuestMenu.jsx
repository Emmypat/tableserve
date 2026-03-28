import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ShoppingCart, Plus, Minus, CheckCircle, AlertCircle, Users, User } from 'lucide-react'

const CATEGORIES = ['Starter', 'Main', 'Dessert', 'Drinks']

export default function GuestMenu() {
  const { eventSlug, tableId } = useParams()
  const [event, setEvent] = useState(null)
  const [table, setTable] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Order state
  const [mode, setMode] = useState('individual') // 'individual' | 'table'
  const [guestName, setGuestName] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [quantities, setQuantities] = useState({}) // { item_id: qty }
  const [specialRequests, setSpecialRequests] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [orderSummary, setOrderSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      // Fetch event by slug
      const { data: ev } = await supabase
        .from('events').select('*').eq('slug', eventSlug).single()
      if (!ev) { setNotFound(true); setLoading(false); return }

      // Fetch table
      const { data: tb } = await supabase
        .from('tables').select('*, ushers(id)').eq('id', tableId).eq('event_id', ev.id).single()
      if (!tb) { setNotFound(true); setLoading(false); return }

      // Fetch menu
      const { data: items } = await supabase
        .from('menu_items').select('*').eq('event_id', ev.id).eq('available', true).order('sort_order').order('created_at')

      setEvent(ev)
      setTable(tb)
      setMenuItems(items || [])
      setLoading(false)
    }
    load()
  }, [eventSlug, tableId])

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
        event_id: event.id,
        table_id: tableId,
        usher_id: table.ushers?.id || null,
        guest_name: guestName.trim() || null,
        order_type: mode,
        items: cartItems,
        special_requests: specialRequests.trim() || null,
        status: 'pending',
      })
      if (insertError) throw insertError

      // Update table status to ordered
      await supabase.from('tables').update({ status: 'ordered' }).eq('id', tableId)

      setOrderSummary(cartItems)
      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit order. Please try again.')
    } finally { setSubmitting(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 text-center">
      <div>
        <AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-700 mb-2">Table not found</h1>
        <p className="text-gray-400 text-sm">This QR code may be invalid or the event has ended.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm w-full">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Received!</h1>
        <p className="text-gray-500 mb-6">Your usher will serve you shortly. Sit tight! 😊</p>

        {/* Order Summary */}
        <div className="bg-gold-pale border border-gold/30 rounded-2xl p-5 text-left mb-6">
          <h3 className="font-bold text-gray-800 mb-3">Your Order</h3>
          {orderSummary?.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gold/20 last:border-0">
              <span className="text-gray-700">{item.name}</span>
              <span className="font-bold text-gold-dark">×{item.qty}</span>
            </div>
          ))}
          {specialRequests && (
            <div className="mt-3 text-sm text-gray-500">
              <span className="font-medium">Special request:</span> {specialRequests}
            </div>
          )}
        </div>

        {/* Wait indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          Estimated wait: 10–15 minutes
        </div>

        <button
          onClick={() => { setSubmitted(false); setQuantities({}); setGuestName(''); setSpecialRequests('') }}
          className="mt-6 text-sm text-gray-400 hover:text-gray-600"
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
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-dark to-green-mid text-white px-6 pt-10 pb-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-gold/80 text-sm font-medium uppercase tracking-widest mb-2">{event.name}</div>
          <h1 className="text-3xl font-extrabold mb-1">{table.table_name}</h1>
          <p className="text-white/60 text-sm">{table.seats_count} seats · Scan, order, enjoy 🎉</p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-6">
        {/* Order Mode */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 mb-6">
          <button
            onClick={() => setMode('individual')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              mode === 'individual' ? 'bg-green-dark text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User size={16}/> Individual Order
          </button>
          <button
            onClick={() => setMode('table')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition ${
              mode === 'table' ? 'bg-green-dark text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users size={16}/> Table Order
          </button>
        </div>

        {/* Individual: name input */}
        {mode === 'individual' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
            <input
              className="input-field"
              placeholder="e.g. Amina"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
            />
          </div>
        )}

        {/* Table: guest count */}
        {mode === 'table' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests at Table</label>
            <input
              className="input-field w-32"
              type="number"
              min="1"
              max="30"
              value={guestCount}
              onChange={e => setGuestCount(Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 mt-1">Ordering for the whole table</p>
          </div>
        )}

        {/* Menu by Category */}
        {CATEGORIES.filter(cat => groupedItems[cat]?.length > 0).map(cat => (
          <div key={cat} className="mb-8">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
              {cat}
            </h2>
            <div className="space-y-4">
              {groupedItems[cat].map(item => (
                <div key={item.id} className="flex gap-4 items-start">
                  {/* Photo */}
                  {item.photo_url ? (
                    <img src={item.photo_url} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm" alt={item.name} />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gold-pale flex items-center justify-center text-3xl flex-shrink-0">🍽️</div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900">{item.name}</div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-0.5 leading-snug">{item.description}</p>
                    )}

                    {/* Quantity control */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => setQty(item.id, -1)}
                        disabled={!quantities[item.id]}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-bold text-gray-900 text-lg">
                        {quantities[item.id] || 0}
                      </span>
                      <button
                        onClick={() => setQty(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-green-dark hover:bg-green-mid text-white flex items-center justify-center transition"
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
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>The menu hasn't been set up yet.</p>
          </div>
        )}

        {/* Special Requests */}
        {cartCount > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (optional)</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="e.g. No pepper, extra sauce, allergy info..."
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sticky Cart / Submit */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-xl px-4 py-4 z-20">
          <div className="max-w-xl mx-auto">
            {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full bg-gold hover:bg-gold-dark active:bg-gold-dark text-white font-bold py-4 rounded-2xl text-lg transition shadow-lg shadow-gold/30 flex items-center justify-center gap-3"
            >
              <ShoppingCart size={20} />
              {submitting ? 'Placing order...' : `Place Order (${cartCount} item${cartCount !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
