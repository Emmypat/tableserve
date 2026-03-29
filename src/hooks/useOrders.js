import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useOrders(eventId, { usher_id } = {}) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) return

    async function fetchOrders() {
      setLoading(true)
      let q = supabase
        .from('orders')
        .select('*, tables(table_name, table_number)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
      if (usher_id) q = q.or(`usher_id.eq.${usher_id},usher_id.is.null`)
      const { data } = await q
      setOrders(data || [])
      setLoading(false)
    }

    fetchOrders()

    const channelName = usher_id ? `orders-usher-${usher_id}` : `orders-event-${eventId}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `event_id=eq.${eventId}` },
        payload => {
          supabase.from('orders').select('*, tables(table_name, table_number)').eq('id', payload.new.id).single()
            .then(({ data }) => {
              if (data) {
                const isRelevant = !usher_id || data.usher_id === usher_id || data.usher_id === null
                if (isRelevant) setOrders(prev => [data, ...prev])
              }
            })
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `event_id=eq.${eventId}` },
        payload => {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, usher_id])

  return { orders, loading, setOrders }
}
