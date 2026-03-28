import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { generatePin } from '../../utils/helpers'
import { Plus, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react'

export default function UsherManagement() {
  const { id } = useParams()
  const [ushers, setUshers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [showPins, setShowPins] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUshers() }, [id])

  async function fetchUshers() {
    const { data } = await supabase
      .from('ushers')
      .select(`*, tables(id, table_name, table_number), orders(count)`)
      .eq('event_id', id)
      .order('created_at')
    setUshers(data || [])
    setLoading(false)
  }

  async function addUsher(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    let pin = generatePin()
    // Check uniqueness
    const { data: existing } = await supabase.from('ushers').select('id').eq('event_id', id).eq('pin', pin)
    if (existing?.length) pin = generatePin()

    const { data } = await supabase.from('ushers').insert({
      event_id: id,
      name: name.trim(),
      pin,
    }).select('*, tables(id, table_name, table_number), orders(count)').single()

    if (data) setUshers(u => [...u, data])
    setName('')
    setAdding(false)
    setSaving(false)
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

  function togglePin(id) { setShowPins(p => ({ ...p, [id]: !p[id] })) }

  if (loading) return <OrganizerLayout><div className="text-center py-20 text-gray-400">Loading...</div></OrganizerLayout>

  return (
    <OrganizerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ushers</h1>
          <p className="text-gray-500 mt-1">{ushers.length} usher{ushers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Usher
        </button>
      </div>

      {/* Add Usher Form */}
      {adding && (
        <div className="card mb-6 border-2 border-green-dark/20">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Usher</h3>
          <form onSubmit={addUsher} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Usher Name</label>
              <input className="input-field" placeholder="Chidi Okafor" value={name}
                onChange={e => setName(e.target.value)} autoFocus required />
            </div>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-3">{saving ? 'Adding...' : 'Add Usher'}</button>
            <button type="button" onClick={() => setAdding(false)} className="btn-outline px-4 py-3">Cancel</button>
          </form>
          <p className="text-xs text-gray-400 mt-2">A 4-digit PIN will be automatically generated for this usher.</p>
        </div>
      )}

      {/* Ushers Info */}
      <div className="card mb-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Usher login:</strong> Direct ushers to <strong>/usher/login</strong> and give them their PIN. They select the event and enter their PIN to access their dashboard.
        </p>
      </div>

      {/* Ushers List */}
      {ushers.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="text-lg font-bold text-gray-600 mb-1">No ushers yet</h2>
          <p className="text-gray-400 text-sm">Add ushers and assign them to tables</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ushers.map(usher => (
            <div key={usher.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-dark text-white flex items-center justify-center font-bold text-lg">
                      {usher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{usher.name}</div>
                      <div className="text-sm text-gray-400">{usher.orders?.[0]?.count || 0} orders served</div>
                    </div>
                  </div>

                  {/* PIN */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-500 font-medium">PIN:</span>
                    <span className="font-mono text-lg font-bold text-green-dark tracking-widest">
                      {showPins[usher.id] ? usher.pin : '••••'}
                    </span>
                    <button onClick={() => togglePin(usher.id)} className="text-gray-400 hover:text-green-dark">
                      {showPins[usher.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                    <button onClick={() => regeneratePin(usher)} title="Regenerate PIN" className="text-gray-400 hover:text-gold">
                      <RefreshCw size={14}/>
                    </button>
                  </div>

                  {/* Assigned Tables */}
                  {usher.tables?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400">Tables:</span>
                      {usher.tables.map(t => (
                        <span key={t.id} className="text-xs bg-green-pale text-green-dark px-2 py-0.5 rounded-full font-medium">
                          {t.table_name || `Table ${t.table_number}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => deleteUsher(usher.id)} className="text-gray-300 hover:text-red-500 transition mt-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  )
}
