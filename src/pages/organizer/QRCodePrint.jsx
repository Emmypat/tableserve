import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import OrganizerLayout from '../../components/layout/OrganizerLayout'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, Download } from 'lucide-react'

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin

export default function QRCodePrint() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('events').select('*').eq('id', id).single(),
      supabase.from('tables').select('*').eq('event_id', id).order('table_number'),
    ]).then(([{ data: ev }, { data: tbs }]) => {
      setEvent(ev)
      setTables(tbs || [])
      setLoading(false)
    })
  }, [id])

  function getQrUrl(table) {
    return table.qr_url || `${APP_URL}/${event?.slug}/table/${table.id}`
  }

  if (loading) return <OrganizerLayout><div className="text-center py-20 text-gray-400">Loading...</div></OrganizerLayout>

  return (
    <OrganizerLayout>
      {/* Controls (hidden on print) */}
      <div className="no-print flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Codes</h1>
          <p className="text-gray-500 mt-1">{event?.name} — {tables.length} tables</p>
        </div>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer size={18} /> Print All QR Codes
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="no-print card text-center py-16">
          <p className="text-gray-400">No tables yet. Add tables first.</p>
        </div>
      ) : (
        <div className="print-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map(table => (
            <div key={table.id} className="print-card bg-white border border-gray-200 rounded-2xl p-5 text-center flex flex-col items-center gap-3">
              {/* Event name */}
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{event?.name}</div>

              {/* Table name */}
              <div className="text-xl font-extrabold text-green-dark">{table.table_name}</div>

              {/* QR Code */}
              <div className="bg-gray-50 rounded-xl p-3">
                <QRCodeSVG
                  value={getQrUrl(table)}
                  size={140}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* Instruction */}
              <div className="text-xs text-gray-400">Scan to view menu & order</div>

              {/* Seats */}
              <div className="text-xs text-gray-300">{table.seats_count} seats</div>

              {/* Individual download link (hidden on print) */}
              <a
                href={getQrUrl(table)}
                target="_blank"
                rel="noopener noreferrer"
                className="no-print text-xs text-green-dark hover:underline mt-1 flex items-center gap-1"
              >
                <Download size={12}/> Test link
              </a>
            </div>
          ))}
        </div>
      )}
    </OrganizerLayout>
  )
}
