import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUsher } from '../../context/UsherContext'
import { useOrders } from '../../hooks/useOrders'
import { playPing, vibrate, timeAgo, formatTime } from '../../utils/helpers'
import { LogOut, Clock, CheckCheck, Bell } from 'lucide-react'

const WEDDING_NAME = import.meta.env.VITE_WEDDING_NAME || 'Bamai & Kazah'

export default function UsherDashboard() {
  const { usher, logoutUsher } = useUsher()
  const navigate = useNavigate()
  const { orders, setOrders } = useOrders(usher?.event_id)
  const [newOrderIds, setNewOrderIds] = useState(new Set())
  const prevOrderCount = useRef(0)

  useEffect(() => {
    if (orders.length > prevOrderCount.current && prevOrderCount.current > 0) {
      const newIds = orders.slice(0, orders.length - prevOrderCount.current).map(o => o.id)
      playPing()
      vibrate()
      setNewOrderIds(ids => {
        const next = new Set(ids)
        newIds.forEach(id => next.add(id))
        return next
      })
      setTimeout(() => setNewOrderIds(new Set()), 6000)
    }
    prevOrderCount.current = orders.length
  }, [orders.length])

  async function markServed(order) {
    const now = new Date().toISOString()
    await supabase.from('orders').update({ status: 'served', served_at: now }).eq('id', order.id)
    await supabase.from('tables').update({ status: 'served' }).eq('id', order.table_id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'served', served_at: now } : o))
  }

  function handleLogout() {
    logoutUsher()
    navigate('/usher/login')
  }

  const pending   = orders.filter(o => o.status === 'pending')
  const completed = orders.filter(o => o.status === 'served')

  return (
    <div className="min-h-screen bg-cream text-brown">

      {/* Header */}
      <header className="bg-burgundy-deep text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-serif text-lg font-semibold">{WEDDING_NAME}</div>
            <div className="text-white/60 text-xs mt-0.5">{usher?.name} · Usher</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition"
          >
            <LogOut size={16}/> End Shift
          </button>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="bg-white border-b border-cream-border px-4 py-3 shadow-sm">
        <div className="max-w-2xl mx-auto flex gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-pale flex items-center justify-center">
              <Clock size={18} className="text-gold-warm"/>
            </div>
            <div>
              <div className="text-3xl font-black text-gold-warm leading-none">{pending.length}</div>
              <div className="text-xs text-brown-muted">Pending</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-burgundy-pale flex items-center justify-center">
              <CheckCheck size={18} className="text-burgundy"/>
            </div>
            <div>
              <div className="text-3xl font-black text-burgundy leading-none">{completed.length}</div>
              <div className="text-xs text-brown-muted">Served</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Pending Orders */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-brown-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell size={14} className="text-gold-warm"/> Pending Orders
            </h2>
            <div className="space-y-4">
              {pending.map(order => (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-5 border-2 border-gold-warm/40 shadow-sm ${newOrderIds.has(order.id) ? 'order-new' : ''}`}
                >
                  {/* Table & Time */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-2xl sm:text-4xl font-black text-burgundy leading-none">
                        {order.tables?.table_name || 'Table'}
                      </div>
                      {order.guest_name && (
                        <div className="text-brown-muted text-sm mt-1">
                          Guest: <strong className="text-brown">{order.guest_name}</strong>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-brown-muted">{timeAgo(order.created_at)}</div>
                      <div className="text-xs text-brown-muted/60 capitalize mt-0.5">{order.order_type} order</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-cream rounded-xl px-4 py-2.5">
                        <span className="font-semibold text-brown">{item.name}</span>
                        <span className="text-gold-warm font-black text-xl">×{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special Requests */}
                  {order.special_requests && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
                      <span className="text-red-600 font-bold text-sm">⚠ Note: </span>
                      <span className="text-red-700 text-sm">{order.special_requests}</span>
                    </div>
                  )}

                  {/* Mark Served Button */}
                  <button
                    onClick={() => markServed(order)}
                    className="w-full bg-burgundy hover:bg-burgundy-mid active:bg-burgundy-deep text-white font-black text-xl py-5 rounded-2xl transition shadow-md"
                  >
                    ✓ Mark as Served
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Pending */}
        {pending.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-burgundy-pale flex items-center justify-center mx-auto mb-4">
              <CheckCheck size={36} className="text-burgundy"/>
            </div>
            <h2 className="font-serif text-xl text-brown mb-1">All caught up!</h2>
            <p className="text-brown-muted text-sm">Waiting for new orders…</p>
          </div>
        )}

        {/* Completed Orders */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-brown-muted/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCheck size={14}/> Completed ({completed.length})
            </h2>
            <div className="space-y-2">
              {completed.map(order => (
                <div key={order.id} className="bg-white/60 rounded-xl p-4 border border-cream-border flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-bold text-brown-muted">{order.tables?.table_name}</div>
                    <div className="text-xs text-brown-muted/60">{order.items?.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
                  </div>
                  <div className="text-xs text-burgundy-light">
                    Served {formatTime(order.served_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-cream-border py-5 text-center">
        <p className="text-xs tracking-widest uppercase font-semibold text-amber-600/60">
          Powered by Yerima Shettima
        </p>
      </footer>
    </div>
  )
}
