import { Link } from 'react-router-dom'
import { QrCode, Utensils, Clock } from 'lucide-react'

const WEDDING_NAME   = import.meta.env.VITE_WEDDING_NAME   || 'Bamai & Kazah'
const WEDDING_DATE   = import.meta.env.VITE_WEDDING_DATE   || '11 April 2026'
const WEDDING_VENUE  = import.meta.env.VITE_WEDDING_VENUE  || 'Epitome Event Center, Barnawa Kaduna'

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream font-sans">

      {/* Hero */}
      <div className="bg-burgundy-deep text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(212,175,55,0.3) 40px, rgba(212,175,55,0.3) 41px)' }} />
        <div className="relative max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="label-gold mb-4">Wedding Reception</div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-3 text-white">
            {WEDDING_NAME}
          </h1>
          <div className="gold-divider mt-4 mb-6" />
          <p className="text-gold-light text-lg mb-1">{WEDDING_DATE}</p>
          <p className="text-white/60 text-sm">{WEDDING_VENUE}</p>
        </div>
      </div>

      {/* Gold bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold-warm to-transparent" />

      {/* Welcome section */}
      <div className="max-w-2xl mx-auto px-6 py-14 text-center">
        <div className="label-gold mb-3">Welcome</div>
        <h2 className="font-serif text-3xl text-brown mb-4">Enjoy the Celebration</h2>
        <p className="text-brown-muted leading-relaxed mb-10">
          Scan the QR code on your table to browse the menu and place your order.
          Your usher will bring your food directly to you.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { icon: QrCode,    title: 'Scan & Order',     desc: 'Use the QR code on your table' },
            { icon: Utensils,  title: 'Choose Your Meal', desc: 'Browse the full menu' },
            { icon: Clock,     title: 'Served at Table',  desc: 'Your usher brings it to you' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-cream-border rounded-2xl p-4 shadow-sm text-center">
              <div className="w-10 h-10 rounded-full bg-burgundy-pale flex items-center justify-center mx-auto mb-3">
                <Icon size={18} className="text-burgundy" />
              </div>
              <div className="font-semibold text-brown text-sm mb-1">{title}</div>
              <div className="text-xs text-brown-muted">{desc}</div>
            </div>
          ))}
        </div>

        {/* QR hint */}
        <div className="bg-white border border-cream-border rounded-2xl p-8 shadow-sm mb-6">
          <div className="w-16 h-16 bg-burgundy-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} className="text-burgundy" />
          </div>
          <h3 className="font-serif text-xl text-brown mb-2">Find Your Table QR Code</h3>
          <p className="text-brown-muted text-sm leading-relaxed">
            Each table has a unique QR code card. Point your phone camera at the code to open the menu and place your order.
          </p>
        </div>

        <div className="gold-divider mb-6" />
        <p className="text-brown-muted text-sm italic font-serif">
          "May your day be as beautiful as your love story."
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-cream-border py-6 text-center">
        <p className="text-xs text-brown-muted/50 mb-2">
          TableServe · {WEDDING_NAME} · {WEDDING_DATE}
        </p>
        <Link to="/admin" className="text-xs text-brown-muted/30 hover:text-brown-muted transition">
          Admin Login
        </Link>
      </footer>
    </div>
  )
}
