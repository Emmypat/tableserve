import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useOrders } from '../../hooks/useOrders'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { timeAgo, formatTime, exportCSV } from '../../utils/helpers'
import { Download, Filter, Clock, CheckCircle2 } from 'lucide-react'

const STATUS_STYLE = {
  pending: 'bg-yellow-100 text-yellow-700',
  served:  'bg-green-100 text-green-700',
}

export default function OrdersView() {
  const { id } = useParams()
  const { orders, loading } = useOrders(id)
  const [tables, setTables] = useState([])
  const [ushers, setUshers] = useState([])
  const [filter, setFilter] = useState({ status: '', table_id: '', usher_id: '' })

  useEffect(() => {
    supabase.from('tables').select('id, table_name').eq('event_id', id).then(({ data }) => setTables(data || []))
    supabase.from('ushers').select('id, name').eq('event_id', id).then(({ data }) => setUshers(data || []))
  }, [id])

  async function markServed(orderId, tableId) {
    await supabase.from('orders').update({ status: 'served', served_at: new Date().toISOString() }).eq('id', orderId)
    await supabase.from('tables').update({ status: 'served' }).eq('id', tableId)
  }

  const filtered = orders.filter(o => {
    if (filter.status && o.status !== filter.status) return false
    if (filter.table_id && o.table_id !== filter.table_id) return false
    if (filter.usher_id && o.usher_id !== filter.usher_id) return false
    return true
  })

  const pending = filtered.filter(o => o.status === 'pending').length
  const served  = filtered.filter(o => o.status === 'served').length

  function handleExport() {
    const rows = filtered.map(o => ({
      table: o.tables?.table_name || '',
      guest: o.guest_name || 'Guest',
      type: o.order_type,
      items: JSON.stringify(o.items),
      special_requests: o.special_requests || '',
      status: o.status,
      time: o.created_at,
    }))
    exportCSV(rows, `orders-${id}.csv`)
  }

  return (
    <OrganizerLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Orders</h1>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span className="flex items-center gap-1 text-yellow-600"><Clock size={14}/>{pending} pending</span>
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={14}/>{served} served</span>
          </div>
        </div>
        <button onClick={handleExport} className="btn-outline flex items-center gap-2 text-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select className="input-field w-auto text-sm" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="served">Served</option>
        </select>
        <select className="input-field w-auto text-sm" value={filter.table_id} onChange={e => setFilter(f => ({ ...f, table_id: e.target.value }))}>
          <option value="">All Tables</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.table_name}</option>)}
        </select>
        <select className="input-field w-auto text-sm" value={filter.usher_id} onChange={e => setFilter(f => ({ ...f, usher_id: e.target.value }))}>
          <option value="">All Ushers</option>
          {ushers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {(filter.status || filter.table_id || filter.usher_id) && (
          <button onClick={() => setFilter({ status: '', table_id: '', usher_id: '' })} className="text-sm text-red-400 hover:text-red-600">Clear filters</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <h2 className="text-lg font-bold text-gray-600 mb-1">No orders yet</h2>
          <p className="text-gray-400 text-sm">Orders will appear here in real time as guests place them</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className={`card border-l-4 ${order.status === 'served' ? 'border-l-green-400' : 'border-l-yellow-400'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-lg text-gray-900">
                      {order.tables?.table_name || `Table`}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[order.status]}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400 capitalize">{order.order_type} order</span>
                    <span className="text-xs text-gray-400">{timeAgo(order.created_at)}</span>
                  </div>

                  {order.guest_name && (
                    <p className="text-sm text-gray-600 mb-2">Guest: <strong>{order.guest_name}</strong></p>
                  )}

                  {/* Items */}
                  <div className="space-y-1">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="font-semibold text-green-dark">×{item.qty}</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>

                  {order.special_requests && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-sm text-red-700">
                      ⚠ Special: {order.special_requests}
                    </div>
                  )}
                </div>

                {order.status === 'pending' && (
                  <button onClick={() => markServed(order.id, order.table_id)}
                    className="flex-shrink-0 bg-green-dark text-white text-sm px-4 py-2 rounded-xl hover:bg-green-mid transition font-semibold">
                    Mark Served
                  </button>
                )}
                {order.status === 'served' && order.served_at && (
                  <div className="text-xs text-green-600 flex-shrink-0 text-right">
                    <CheckCircle2 size={14} className="inline mr-1"/>
                    Served {formatTime(order.served_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  )
}
