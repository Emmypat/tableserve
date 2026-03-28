import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useOrders } from '../../hooks/useOrders'
import { useTables } from '../../hooks/useTables'
import { QRCodeSVG } from 'qrcode.react'
import { timeAgo, formatTime, exportCSV, generatePin, TABLE_STATUS } from '../../utils/helpers'
import {
  LogOut, ClipboardList, Table2, Utensils, Users, QrCode,
  Clock, CheckCircle2, Download, Plus, Trash2, Eye, EyeOff,
  RefreshCw, Save, Image, CheckCircle, XCircle, Printer,
} from 'lucide-react'

const APP_URL      = import.meta.env.VITE_APP_URL    || window.location.origin
const WEDDING_NAME = import.meta.env.VITE_WEDDING_NAME || 'Bamai & Kazah'
const CATEGORIES   = ['Starter', 'Main', 'Dessert', 'Drinks']
const EMPTY_ITEM   = { name: '', description: '', category: 'Main', available: true, photo_url: '' }
const TABS = [
  { key: 'orders',   label: 'Live Orders', icon: ClipboardList },
  { key: 'tables',   label: 'Tables',      icon: Table2 },
  { key: 'menu',     label: 'Menu',        icon: Utensils },
  { key: 'ushers',   label: 'Ushers',      icon: Users },
  { key: 'qrcodes',  label: 'QR Codes',    icon: QrCode },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Spinner() {
  return <div className="text-center py-20 text-brown-muted">Loading...</div>
}

function SectionHead({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-serif text-2xl text-brown">{title}</h2>
        {subtitle && <p className="text-brown-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ eventId }) {
  const { orders, loading } = useOrders(eventId)
  const [filter, setFilter] = useState({ status: '', table_id: '' })
  const [tables, setTables]   = useState([])

  useEffect(() => {
    if (eventId) supabase.from('tables').select('id, table_name').eq('event_id', eventId).then(({ data }) => setTables(data || []))
  }, [eventId])

  async function markServed(orderId, tableId) {
    await supabase.from('orders').update({ status: 'served', served_at: new Date().toISOString() }).eq('id', orderId)
    await supabase.from('tables').update({ status: 'served' }).eq('id', tableId)
  }

  const filtered = orders.filter(o => {
    if (filter.status && o.status !== filter.status) return false
    if (filter.table_id && o.table_id !== filter.table_id) return false
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
    exportCSV(rows, 'orders.csv')
  }

  return (
    <div>
      <SectionHead
        title="Live Orders"
        subtitle={`${pending} pending · ${served} served`}
        action={
          <button onClick={handleExport} className="btn-outline text-sm px-4 py-2 flex items-center gap-2">
            <Download size={15} /> Export CSV
          </button>
        }
      />

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
        {(filter.status || filter.table_id) && (
          <button onClick={() => setFilter({ status: '', table_id: '' })} className="text-sm text-burgundy hover:text-burgundy-mid">Clear</button>
        )}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div className="card text-center py-16 text-brown-muted">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p>No orders yet. They'll appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className={`card border-l-4 ${order.status === 'served' ? 'border-l-green-400' : 'border-l-gold-warm'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-serif font-bold text-xl text-brown">{order.tables?.table_name}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${order.status === 'served' ? 'bg-green-100 text-green-700' : 'bg-gold-pale text-gold-dark'}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-brown-muted capitalize">{order.order_type} order</span>
                    <span className="text-xs text-brown-muted">{timeAgo(order.created_at)}</span>
                  </div>
                  {order.guest_name && <p className="text-sm text-brown-muted mb-2">Guest: <strong className="text-brown">{order.guest_name}</strong></p>}
                  <div className="space-y-1">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-brown">
                        <span className="font-bold text-gold-warm">×{item.qty}</span>
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
                    className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-full font-semibold transition">
                    Mark Served
                  </button>
                )}
                {order.status === 'served' && order.served_at && (
                  <div className="text-xs text-green-600 flex-shrink-0">
                    <CheckCircle2 size={14} className="inline mr-1" />Served {formatTime(order.served_at)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tables Tab ───────────────────────────────────────────────────────────────
function TablesTab({ eventId }) {
  const { tables, loading, setTables } = useTables(eventId)
  const [ushers, setUshers]   = useState([])
  const [adding, setAdding]   = useState(false)
  const [form, setForm]       = useState({ table_name: '', seats_count: 8 })

  useEffect(() => {
    if (eventId) supabase.from('ushers').select('id, name').eq('event_id', eventId).then(({ data }) => setUshers(data || []))
  }, [eventId])

  async function addTable(e) {
    e.preventDefault()
    const tableNumber = tables.length + 1
    const name = form.table_name.trim() || `Table ${tableNumber}`
    const { data } = await supabase.from('tables').insert({
      event_id: eventId, table_number: tableNumber, table_name: name,
      seats_count: Number(form.seats_count), status: 'empty',
    }).select().single()
    if (data) {
      const qrUrl = `${APP_URL}/table/${data.id}`
      await supabase.from('tables').update({ qr_url: qrUrl }).eq('id', data.id)
      setTables(t => [...t, { ...data, qr_url: qrUrl }])
    }
    setAdding(false); setForm({ table_name: '', seats_count: 8 })
  }

  async function deleteTable(tableId) {
    if (!confirm('Delete this table?')) return
    await supabase.from('tables').delete().eq('id', tableId)
    setTables(t => t.filter(tb => tb.id !== tableId))
  }

  async function assignUsher(tableId, usherId) {
    const val = usherId || null
    await supabase.from('tables').update({ usher_id: val }).eq('id', tableId)
    setTables(t => t.map(tb => tb.id === tableId ? { ...tb, usher_id: val } : tb))
  }

  return (
    <div>
      <SectionHead
        title="Tables"
        subtitle={`${tables.length} tables configured`}
        action={
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus size={16} /> Add Table
          </button>
        }
      />

      {adding && (
        <div className="card mb-6 border-2 border-burgundy/20">
          <h3 className="font-semibold text-brown mb-4">Add New Table</h3>
          <form onSubmit={addTable} className="flex gap-4 flex-wrap items-end">
            <div>
              <label className="block text-sm font-medium text-brown-muted mb-1">Table Name (optional)</label>
              <input className="input-field w-44" placeholder={`Table ${tables.length + 1}`} value={form.table_name}
                onChange={e => setForm(f => ({ ...f, table_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-muted mb-1">Seats</label>
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

      {loading ? <Spinner /> : tables.length === 0 ? (
        <div className="card text-center py-16 text-brown-muted">
          <Table2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No tables yet. Add tables to generate QR codes.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(table => {
            const st = TABLE_STATUS[table.status] || TABLE_STATUS.empty
            const qr = table.qr_url || `${APP_URL}/table/${table.id}`
            return (
              <div key={table.id} className={`card p-4 border-2 ${table.status === 'ordered' ? 'border-gold/50' : table.status === 'served' ? 'border-green-300' : 'border-cream-border'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif font-bold text-brown">{table.table_name}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                </div>
                <div className="flex justify-center my-3 bg-cream rounded-xl p-2">
                  <QRCodeSVG value={qr} size={90} level="M" />
                </div>
                <div className="text-xs text-brown-muted text-center mb-3">{table.seats_count} seats</div>
                <select className="w-full text-sm border border-cream-border rounded-lg px-2 py-1.5 bg-white text-brown focus:outline-none focus:ring-1 focus:ring-burgundy/30"
                  value={table.usher_id || ''} onChange={e => assignUsher(table.id, e.target.value)}>
                  <option value="">— No usher —</option>
                  {ushers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button onClick={() => deleteTable(table.id)}
                  className="mt-2 w-full text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 py-1 rounded-lg hover:bg-red-50 transition">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Menu Tab ─────────────────────────────────────────────────────────────────
function MenuTab({ eventId }) {
  const [menuItems,      setMenuItems]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [editingItem,    setEditingItem]    = useState(null)
  const [itemForm,       setItemForm]       = useState(EMPTY_ITEM)
  const [saving,         setSaving]         = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [msg,            setMsg]            = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (!eventId) return
    supabase.from('menu_items').select('*').eq('event_id', eventId).order('sort_order').order('created_at')
      .then(({ data }) => { setMenuItems(data || []); setLoading(false) })
  }, [eventId])

  async function uploadPhoto(file) {
    setUploadingPhoto(true)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `menu-items/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('tableserve').upload(path, file, { upsert: true })
    if (error) { setUploadingPhoto(false); setMsg(`Upload failed: ${error.message}`); return null }
    const { data: { publicUrl } } = supabase.storage.from('tableserve').getPublicUrl(path)
    setUploadingPhoto(false)
    return publicUrl
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    e.target.value = ''
    const url = await uploadPhoto(file)
    if (url) setItemForm(f => ({ ...f, photo_url: url }))
  }

  async function saveItem() {
    if (!itemForm.name.trim()) return
    setSaving(true)
    if (editingItem === 'new') {
      const { data } = await supabase.from('menu_items').insert({ event_id: eventId, ...itemForm, sort_order: menuItems.length }).select().single()
      if (data) setMenuItems(m => [...m, data])
    } else {
      const { data } = await supabase.from('menu_items').update(itemForm).eq('id', editingItem).select().single()
      if (data) setMenuItems(m => m.map(i => i.id === editingItem ? data : i))
    }
    setEditingItem(null); setItemForm(EMPTY_ITEM); setSaving(false)
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this menu item?')) return
    await supabase.from('menu_items').delete().eq('id', itemId)
    setMenuItems(m => m.filter(i => i.id !== itemId))
  }

  async function toggleAvailable(item) {
    const { data } = await supabase.from('menu_items').update({ available: !item.available }).eq('id', item.id).select().single()
    if (data) setMenuItems(m => m.map(i => i.id === item.id ? data : i))
  }

  const grouped = CATEGORIES.reduce((acc, cat) => { acc[cat] = menuItems.filter(i => i.category === cat); return acc }, {})

  return (
    <div>
      <SectionHead
        title="Menu"
        subtitle={`${menuItems.length} items`}
        action={editingItem === null && (
          <button onClick={() => { setEditingItem('new'); setItemForm(EMPTY_ITEM) }}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus size={16} /> Add Item
          </button>
        )}
      />

      {msg && <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">{msg}</div>}

      {editingItem !== null && (
        <div className="card mb-6 border-2 border-burgundy/20">
          <h3 className="font-semibold text-brown mb-4">{editingItem === 'new' ? 'New Menu Item' : 'Edit Item'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brown-muted mb-1">Item Name *</label>
              <input className="input-field" placeholder="Jollof Rice" value={itemForm.name}
                onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-muted mb-1">Category</label>
              <select className="input-field" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brown-muted mb-1">Description</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Brief description..."
                value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-muted mb-1">Photo</label>
              <div className="flex items-center gap-3">
                {itemForm.photo_url && <img src={itemForm.photo_url} className="w-16 h-16 object-cover rounded-xl" alt="" />}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 border border-dashed border-cream-border px-4 py-2 rounded-xl text-sm text-brown-muted hover:border-burgundy hover:text-burgundy transition">
                  <Image size={16} />{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </button>
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-burgundy" checked={itemForm.available}
                  onChange={e => setItemForm(f => ({ ...f, available: e.target.checked }))} />
                <span className="text-sm text-brown">Available</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={saveItem} disabled={saving} className="btn-primary text-sm px-5 py-2.5">
              {saving ? 'Saving...' : 'Save Item'}
            </button>
            <button onClick={() => { setEditingItem(null); setItemForm(EMPTY_ITEM) }} className="btn-outline text-sm px-4 py-2.5">Cancel</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : menuItems.length === 0 && editingItem === null ? (
        <div className="card text-center py-16 text-brown-muted">
          <Utensils size={40} className="mx-auto mb-3 opacity-30" />
          <p>No menu items yet. Add your first item above.</p>
        </div>
      ) : (
        CATEGORIES.filter(cat => grouped[cat].length > 0).map(cat => (
          <div key={cat} className="mb-6">
            <h3 className="label-gold mb-3">{cat}</h3>
            <div className="space-y-2">
              {grouped[cat].map(item => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-cream transition group">
                  {item.photo_url
                    ? <img src={item.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                    : <div className="w-12 h-12 rounded-xl bg-gold-pale flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-brown text-sm">{item.name}</div>
                    {item.description && <div className="text-xs text-brown-muted truncate">{item.description}</div>}
                  </div>
                  <button onClick={() => toggleAvailable(item)}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition ${item.available ? 'text-green-600 bg-green-50' : 'text-brown-muted bg-cream'}`}>
                    {item.available ? <CheckCircle size={13}/> : <XCircle size={13}/>}
                    <span>{item.available ? 'Available' : 'Unavailable'}</span>
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingItem(item.id); setItemForm({ name: item.name, description: item.description || '', category: item.category, available: item.available, photo_url: item.photo_url || '' }) }}
                      className="p-1.5 text-brown-muted hover:text-burgundy"><Save size={14}/></button>
                    <button onClick={() => deleteItem(item.id)} className="p-1.5 text-brown-muted hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Ushers Tab ───────────────────────────────────────────────────────────────
function UshersTab({ eventId }) {
  const [ushers,   setUshers]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [adding,   setAdding]   = useState(false)
  const [name,     setName]     = useState('')
  const [showPins, setShowPins] = useState({})
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { fetchUshers() }, [eventId])

  async function fetchUshers() {
    if (!eventId) return
    const { data } = await supabase.from('ushers').select(`*, tables(id, table_name, table_number)`).eq('event_id', eventId).order('created_at')
    setUshers(data || [])
    setLoading(false)
  }

  async function addUsher(e) {
    e.preventDefault(); if (!name.trim()) return
    setSaving(true)
    const pin = generatePin()
    const { data } = await supabase.from('ushers').insert({ event_id: eventId, name: name.trim(), pin })
      .select(`*, tables(id, table_name, table_number)`).single()
    if (data) setUshers(u => [...u, data])
    setName(''); setAdding(false); setSaving(false)
  }

  async function regeneratePin(usher) {
    const pin = generatePin()
    await supabase.from('ushers').update({ pin }).eq('id', usher.id)
    setUshers(u => u.map(us => us.id === usher.id ? { ...us, pin } : us))
  }

  async function deleteUsher(usherId) {
    if (!confirm('Delete this usher?')) return
    await supabase.from('ushers').delete().eq('id', usherId)
    setUshers(u => u.filter(us => us.id !== usherId))
  }

  return (
    <div>
      <SectionHead
        title="Ushers"
        subtitle={`${ushers.length} registered`}
        action={
          <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Plus size={16} /> Add Usher
          </button>
        }
      />

      {adding && (
        <div className="card mb-6 border-2 border-burgundy/20">
          <form onSubmit={addUsher} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-brown-muted mb-1">Usher Name</label>
              <input className="input-field" placeholder="Chidi Okafor" value={name}
                onChange={e => setName(e.target.value)} autoFocus required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-3">{saving ? 'Adding...' : 'Add'}</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-outline px-4 py-3">Cancel</button>
          </form>
          <p className="text-xs text-brown-muted mt-2">A 4-digit PIN will be auto-generated.</p>
        </div>
      )}

      <div className="card mb-4 bg-gold-pale border border-gold/30">
        <p className="text-sm text-brown">
          Direct ushers to <strong>/usher/login</strong> — they enter their PIN to access their dashboard.
        </p>
      </div>

      {loading ? <Spinner /> : ushers.length === 0 ? (
        <div className="card text-center py-16 text-brown-muted">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No ushers yet. Add ushers and assign them to tables.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ushers.map(usher => (
            <div key={usher.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-burgundy text-white flex items-center justify-center font-bold font-serif text-lg">
                      {usher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-brown">{usher.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-brown-muted font-medium">PIN:</span>
                    <span className="font-mono text-xl font-bold text-burgundy tracking-widest">
                      {showPins[usher.id] ? usher.pin : '••••'}
                    </span>
                    <button onClick={() => setShowPins(p => ({ ...p, [usher.id]: !p[usher.id] }))} className="text-brown-muted hover:text-burgundy">
                      {showPins[usher.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                    <button onClick={() => regeneratePin(usher)} className="text-brown-muted hover:text-gold-warm">
                      <RefreshCw size={14}/>
                    </button>
                  </div>
                  {usher.tables?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs text-brown-muted">Tables:</span>
                      {usher.tables.map(t => (
                        <span key={t.id} className="text-xs bg-burgundy-pale text-burgundy px-2 py-0.5 rounded-full font-medium">
                          {t.table_name || `Table ${t.table_number}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteUsher(usher.id)} className="text-brown-muted/50 hover:text-red-500 transition mt-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── QR Codes Tab ─────────────────────────────────────────────────────────────
function QRCodesTab({ eventId }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return
    supabase.from('tables').select('*').eq('event_id', eventId).order('table_number')
      .then(({ data }) => { setTables(data || []); setLoading(false) })
  }, [eventId])

  function getQrUrl(table) { return table.qr_url || `${APP_URL}/table/${table.id}` }

  return (
    <div>
      <SectionHead
        title="QR Codes"
        subtitle={`${tables.length} tables`}
        action={
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5">
            <Printer size={16} /> Print All
          </button>
        }
      />

      {loading ? <Spinner /> : tables.length === 0 ? (
        <div className="card text-center py-16 text-brown-muted">
          <QrCode size={40} className="mx-auto mb-3 opacity-30" />
          <p>No tables yet. Add tables first.</p>
        </div>
      ) : (
        <div className="print-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {tables.map(table => (
            <div key={table.id} className="print-card bg-white border border-cream-border rounded-2xl p-5 text-center flex flex-col items-center gap-2">
              <div className="label-gold text-xs">{WEDDING_NAME}</div>
              <div className="font-serif font-bold text-xl text-brown">{table.table_name}</div>
              <div className="bg-cream rounded-xl p-3">
                <QRCodeSVG value={getQrUrl(table)} size={130} level="M" includeMargin />
              </div>
              <div className="text-xs text-brown-muted">Scan to order food</div>
              <div className="text-xs text-brown-muted/40">{table.seats_count} seats</div>
              <a href={getQrUrl(table)} target="_blank" rel="noopener noreferrer"
                className="no-print text-xs text-burgundy hover:underline">Test link</a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  const [tab, setTab]       = useState('orders')
  const [event, setEvent]   = useState(null)
  const [loadingEvent, setLoadingEvent] = useState(true)

  useEffect(() => {
    supabase.from('events').select('*').order('created_at').limit(1).single()
      .then(({ data }) => { setEvent(data); setLoadingEvent(false) })
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/admin')
  }

  if (loadingEvent) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-burgundy-deep text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <span className="font-serif font-bold text-xl">{WEDDING_NAME}</span>
            <span className="text-white/40 text-sm ml-3">Admin</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Tab nav */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                tab === key ? 'border-gold-warm text-white' : 'border-transparent text-white/50 hover:text-white/80'
              }`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'orders'  && <OrdersTab   eventId={event?.id} />}
        {tab === 'tables'  && <TablesTab   eventId={event?.id} />}
        {tab === 'menu'    && <MenuTab     eventId={event?.id} />}
        {tab === 'ushers'  && <UshersTab   eventId={event?.id} />}
        {tab === 'qrcodes' && <QRCodesTab  eventId={event?.id} />}
      </main>
    </div>
  )
}
