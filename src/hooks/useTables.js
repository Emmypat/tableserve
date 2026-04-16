import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTables(eventId) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) { setLoading(false); return }

    async function fetchTables() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('tables')
          .select('*, ushers(id, name)')
          .eq('event_id', eventId)
          .order('table_number', { ascending: true })
        setTables(data || [])
      } catch (e) {
        console.error('fetchTables error', e)
      } finally {
        setLoading(false)
      }
    }

    fetchTables()

    const channel = supabase
      .channel(`tables-event-${eventId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tables', filter: `event_id=eq.${eventId}` },
        payload => {
          setTables(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t))
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId])

  return { tables, loading, setTables }
}
