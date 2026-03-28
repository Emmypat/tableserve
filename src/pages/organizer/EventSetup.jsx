import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { Plus, Edit2, Trash2, Image, CheckCircle, XCircle, Save } from 'lucide-react'

const CATEGORIES = ['Starter', 'Main', 'Dessert', 'Drinks']
const STATUS_OPTIONS = ['draft', 'active', 'completed']

const EMPTY_ITEM = { name: '', description: '', category: 'Main', available: true, photo_url: '' }

export default function EventSetup() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // null | 'new' | item_id
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const [{ data: ev }, { data: items }] = await Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('menu_items').select('*').eq('event_id', id).order('sort_order').order('created_at'),
    ])
    setEvent(ev)
    setMenuItems(items || [])
    setLoading(false)
  }

  async function saveEvent(e) {
    e.preventDefault()
    setSavingEvent(true)
    await supabase.from('events').update({
      name: event.name, date: event.date, venue: event.venue, status: event.status,
    }).eq('id', id)
    setMsg('Event details saved!')
    setTimeout(() => setMsg(''), 3000)
    setSavingEvent(false)
  }

  async function uploadPhoto(file) {
    setUploadingPhoto(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `menu-items/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('tableserve').upload(path, file, { upsert: true })
    if (error) {
      setUploadingPhoto(false)
      setMsg(`Photo upload failed: ${error.message}`)
      setTimeout(() => setMsg(''), 5000)
      return null
    }
    const { data: { publicUrl } } = supabase.storage.from('tableserve').getPublicUrl(path)
    setUploadingPhoto(false)
    return publicUrl
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be re-selected
    e.target.value = ''
    const url = await uploadPhoto(file)
    if (url) setItemForm(f => ({ ...f, photo_url: url }))
  }

  async function saveItem() {
    if (!itemForm.name.trim()) return
    setSaving(true)
    if (editingItem === 'new') {
      const { data } = await supabase.from('menu_items').insert({
        event_id: id,
        ...itemForm,
        sort_order: menuItems.length,
      }).select().single()
      if (data) setMenuItems(m => [...m, data])
    } else {
      const { data } = await supabase.from('menu_items')
        .update(itemForm).eq('id', editingItem).select().single()
      if (data) setMenuItems(m => m.map(i => i.id === editingItem ? data : i))
    }
    setEditingItem(null)
    setItemForm(EMPTY_ITEM)
    setSaving(false)
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this menu item?')) return
    await supabase.from('menu_items').delete().eq('id', itemId)
    setMenuItems(m => m.filter(i => i.id !== itemId))
  }

  async function toggleAvailable(item) {
    const { data } = await supabase.from('menu_items')
      .update({ available: !item.available }).eq('id', item.id).select().single()
    if (data) setMenuItems(m => m.map(i => i.id === item.id ? data : i))
  }

  function startEdit(item) {
    setEditingItem(item.id)
    setItemForm({ name: item.name, description: item.description || '', category: item.category, available: item.available, photo_url: item.photo_url || '' })
  }

  if (loading) return <OrganizerLayout><div className="text-center py-20 text-gray-400">Loading...</div></OrganizerLayout>

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = menuItems.filter(i => i.category === cat)
    return acc
  }, {})

  return (
    <OrganizerLayout>
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Setup</h1>
          <p className="text-gray-500 mt-1">Configure event details and manage the menu.</p>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm ${msg.startsWith('Photo upload failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <CheckCircle size={16}/>{msg}
          </div>
        )}

        {/* Event Details */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Event Details</h2>
          <form onSubmit={saveEvent} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input className="input-field" value={event.name} onChange={e => setEvent(ev => ({ ...ev, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input className="input-field" type="date" value={event.date || ''} onChange={e => setEvent(ev => ({ ...ev, date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input className="input-field" placeholder="Venue name" value={event.venue || ''} onChange={e => setEvent(ev => ({ ...ev, venue: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="input-field" value={event.status} onChange={e => setEvent(ev => ({ ...ev, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={savingEvent} className="btn-primary flex items-center gap-2">
                <Save size={16} />{savingEvent ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        </div>

        {/* Menu Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Menu Items ({menuItems.length})</h2>
            {editingItem === null && (
              <button onClick={() => { setEditingItem('new'); setItemForm(EMPTY_ITEM) }} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Plus size={16} /> Add Item
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {editingItem !== null && (
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">{editingItem === 'new' ? 'New Menu Item' : 'Edit Item'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                  <input className="input-field" placeholder="Jollof Rice" value={itemForm.name}
                    onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="input-field" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="input-field resize-none" rows={2} placeholder="Brief description..."
                    value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <div className="flex items-center gap-3">
                    {itemForm.photo_url && <img src={itemForm.photo_url} className="w-16 h-16 object-cover rounded-xl" alt="" />}
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 border border-dashed border-gray-300 px-4 py-2 rounded-xl text-sm text-gray-500 hover:border-green-dark hover:text-green-dark transition">
                      <Image size={16} />{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-green-dark" checked={itemForm.available}
                      onChange={e => setItemForm(f => ({ ...f, available: e.target.checked }))} />
                    <span className="text-sm text-gray-700">Available</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveItem} disabled={saving} className="btn-primary text-sm px-5 py-2.5">{saving ? 'Saving...' : 'Save Item'}</button>
                <button onClick={() => { setEditingItem(null); setItemForm(EMPTY_ITEM) }} className="btn-outline text-sm px-4 py-2.5">Cancel</button>
              </div>
            </div>
          )}

          {/* Menu by Category */}
          {menuItems.length === 0 && editingItem === null ? (
            <div className="text-center py-10 text-gray-400">No menu items yet. Add your first item above.</div>
          ) : (
            CATEGORIES.filter(cat => groupedItems[cat].length > 0).map(cat => (
              <div key={cat} className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{cat}</h3>
                <div className="space-y-2">
                  {groupedItems[cat].map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition group">
                      {item.photo_url
                        ? <img src={item.photo_url} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />
                        : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{item.name}</div>
                        {item.description && <div className="text-xs text-gray-400 truncate">{item.description}</div>}
                      </div>
                      <button onClick={() => toggleAvailable(item)} title="Toggle availability"
                        className={`text-sm flex items-center gap-1 px-2 py-1 rounded-lg transition ${item.available ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}`}>
                        {item.available ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                        <span className="text-xs">{item.available ? 'Available' : 'Unavailable'}</span>
                      </button>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-green-dark"><Edit2 size={15}/></button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </OrganizerLayout>
  )
}
