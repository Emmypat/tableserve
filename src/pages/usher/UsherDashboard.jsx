import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useUsher } from '../../context/UsherContext'
import { useOrders } from '../../hooks/useOrders'
import { playPing, vibrate, timeAgo, formatTime } from '../../utils/helpers'
import { LogOut, Clock, CheckCheck, Bell } from 'lucide-react'

export default function UsherDashboard() {
  const { usher, logoutUsher } = useUsher()
  const navigate = useNavigate()
  const { orders, setOrders } = useOrders(usher?.event_id, { usher_id: usher?.id })
  const [newOrderIds, setNewOrderIds] = useState(new Set())
  const prevOrderCount = useRef(0)

  // Notify on new orders
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
      // Clear glow after 6s
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gold text-xl">⬡</span>
              <span className="font-bold text-lg">TableServe</span>
            </div>
            <div className="text-sm text-gray-400">{usher?.name} · {usher?.event_name}</div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
            <LogOut size={16}/> Logout
          </button>
        </div>
      </header>

      {/* Summary Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock size={16} className="text-yellow-400"/>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-400">{pending.length}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCheck size={16} className="text-green-400"/>
            </div>
            <div>
              <div className="text-2xl font-black text-green-400">{completed.length}</div>
              <div className="text-xs text-gray-400">Served</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Pending Orders */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell size={16} className="text-yellow-400"/> Pending Orders
            </h2>
            <div className="space-y-4">
              {pending.map(order => (
                <div key={order.id}
                  className={`bg-gray-800 rounded-2xl p-5 border-2 border-yellow-500/50 ${newOrderIds.has(order.id) ? 'order-new' : ''}`}>
                  {/* Table & Time */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-3xl font-black text-yellow-400">
                        {order.tables?.table_name || 'Table'}
                      </div>
                      {order.guest_name && (
                        <div className="text-gray-300 text-sm mt-0.5">Guest: <strong>{order.guest_name}</strong></div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{timeAgo(order.created_at)}</div>
                      <div className="text-xs text-gray-400 capitalize mt-0.5">{order.order_type} order</div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-700/50 rounded-xl px-3 py-2">
                        <span className="text-white font-medium">{item.name}</span>
                        <span className="text-yellow-400 font-bold text-lg">×{item.qty}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special Requests */}
                  {order.special_requests && (
                    <div className="bg-red-900/40 border border-red-500/30 rounded-xl px-4 py-2.5 mb-4">
                      <span className="text-red-400 font-bold text-sm">⚠ Special Request: </span>
                      <span className="text-red-200 text-sm">{order.special_requests}</span>
                    </div>
                  )}

                  {/* Mark Served Button */}
                  <button
                    onClick={() => markServed(order)}
                    className="w-full bg-green-500 hover:bg-green-400 active:bg-green-600 text-white font-black text-xl py-4 rounded-2xl transition shadow-lg shadow-green-900/50"
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
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-300 mb-1">All caught up!</h2>
            <p className="text-gray-500">Waiting for new orders...</p>
          </div>
        )}

        {/* Completed Orders */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCheck size={16}/> Completed ({completed.length})
            </h2>
            <div className="space-y-2">
              {completed.map(order => (
                <div key={order.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-bold text-gray-400">{order.tables?.table_name}</div>
                    <div className="text-xs text-gray-600">{order.items?.map(i => `${i.name} ×${i.qty}`).join(', ')}</div>
                  </div>
                  <div className="text-xs text-green-600">
                    Served {formatTime(order.served_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
