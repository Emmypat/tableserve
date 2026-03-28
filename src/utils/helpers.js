import { format, formatDistanceToNow } from 'date-fns'

/** Generate a URL-safe slug from event name */
export function generateSlug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

/** Generate a zero-padded 4-digit PIN */
export function generatePin() {
  return String(Math.floor(Math.random() * 9000) + 1000)
}

/** Format Nigerian naira */
export function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`
}

/** Format date for display */
export function formatDate(date) {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

/** Relative time ago */
export function timeAgo(date) {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

/** Format time only */
export function formatTime(date) {
  if (!date) return ''
  return format(new Date(date), 'h:mm a')
}

/** Table status → display config */
export const TABLE_STATUS = {
  empty:   { label: 'Empty',   color: 'bg-gray-100 text-gray-500',   dot: 'bg-gray-400'   },
  ordered: { label: 'Ordered', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  served:  { label: 'Served',  color: 'bg-green-100 text-green-700',  dot: 'bg-green-500'  },
}

/** Export array to CSV and trigger download */
export function exportCSV(data, filename) {
  if (!data.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Play a soft ping notification sound */
export function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch (_) {}
}

/** Vibrate device if supported */
export function vibrate() {
  if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
}
