import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTables } from '../../hooks/useTables'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { QRCodeSVG } from 'qrcode.react'
import { TABLE_STATUS } from '../../utils/helpers'
import { Plus, Trash2, QrCode, Printer } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function TableManagement() {
  const { id } = useParams()
  const { tables, loading, setTables } = useTables(id)
  const [event, setEvent] = useState(null)
  const [ushers, setUshers] = useState([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ table_name: '', seats_count: 8 })

  useEffect(() => {
    supabase.from('events').select('*').eq('id', id).single().then(({ data }) => setEvent(data))
    supabase.from('ushers').select('id, name').eq('event_id', id).then(({ data }) => setUshers(data || []))
  }, [id])

  async function addTable(e) {
    e.preventDefault()
    const tableNumber = (tables.length + 1)
    const name = form.table_name.trim() || `Table ${tableNumber}`
    const qrUrl = `${APP_URL}/${event?.slug}/table/PLACEHOLDER`

    const { data } = await supabase.from('tables').insert({
      event_id: id,
      table_number: tableNumber,
      table_name: name,
      seats_count: Number(form.seats_count),
      status: 'empty',
    }).select().single()

    if (data) {
      // Update QR url with real ID
      const realQr = `${APP_URL}/${event?.slug}/table/${data.id}`
      await supabase.from('tables').update({ qr_url: realQr }).eq('id', data.id)
      setTables(t => [...t, { ...data, qr_url: realQr }])
    }
    setAdding(false)
    setForm({ table_name: '', seats_count: 8 })
  }

  async function deleteTable(tableId) {
    if (!confirm('Delete this table?')) return
    await supabase.from('tables').delete().eq('id', tableId)
    setTables(t => t.filter(tb => tb.id !== tableId))
  }

  async function assignUsher(tableId, usherId) {
    const val = usherId || null
    await supabase.from('tables').update({ usher_id: val }).eq('id', tableId)
    setTables(t => t.map(tb => tb.id === tableId
      ? { ...tb, usher_id: val, ushers: ushers.find(u => u.id === val) || null }
      : tb
    ))
  }

  if (loading) return <OrganizerLayout><div className="text-center py-20 text-gray-400">Loading...</div></OrganizerLayout>

  return (
    <OrganizerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
          <p className="text-gray-500 mt-1">{tables.length} table{tables.length !== 1 ? 's' : ''} configured</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/event/${id}/qrcodes`} className="btn-outline flex items-center gap-2 text-sm">
            <Printer size={16} /> Print QR Codes
          </Link>
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Add Table
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {Object.entries(TABLE_STATUS).map(([key, { label, color, dot }]) => (
          <div key={key} className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${dot}`} /> {label}
          </div>
        ))}
      </div>

      {/* Add Table Form */}
      {adding && (
        <div className="card mb-6 border-2 border-green-dark/20">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Table</h3>
          <form onSubmit={addTable} className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table Name (optional)</label>
              <input className="input-field w-48" placeholder={`Table ${tables.length + 1}`} value={form.table_name}
                onChange={e => setForm(f => ({ ...f, table_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
              <input className="input-field w-24" type="number" min="1" max="30" value={form.seats_count}
                onChange={e => setForm(f => ({ ...f, seats_count: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary text-sm px-5 py-2.5">Add</button>
              <button type="button" onClick={() => setAdding(false)} className="btn-outline text-sm px-4 py-2.5">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">🪑</div>
          <h2 className="text-lg font-bold text-gray-600 mb-1">No tables yet</h2>
          <p className="text-gray-400 text-sm">Add tables to generate QR codes for guests</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {tables.map(table => {
            const status = TABLE_STATUS[table.status] || TABLE_STATUS.empty
            const qrValue = table.qr_url || `${APP_URL}/${event?.slug}/table/${table.id}`
            return (
              <div key={table.id} className={`card p-5 border-2 ${table.status === 'ordered' ? 'border-yellow-300' : table.status === 'served' ? 'border-green-300' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg text-gray-900">{table.table_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                </div>

                <div className="flex justify-center my-3 bg-gray-50 rounded-xl p-3">
                  <QRCodeSVG value={qrValue} size={90} level="M" />
                </div>

                <div className="text-xs text-gray-400 text-center mb-3">{table.seats_count} seats</div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Assign Usher</label>
                  <select className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-dark"
                    value={table.usher_id || ''} onChange={e => assignUsher(table.id, e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {ushers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <button onClick={() => deleteTable(table.id)} className="mt-3 w-full text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-red-50 transition">
                  <Trash2 size={12} /> Delete table
                </button>
              </div>
            )
          })}
        </div>
      )}
    </OrganizerLayout>
  )
}
