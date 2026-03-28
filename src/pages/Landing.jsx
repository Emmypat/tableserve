import { Link } from 'react-router-dom'
import { CheckCircle, QrCode, Zap, Users, ClipboardList, Star } from 'lucide-react'

const features = [
  { icon: QrCode,        title: 'QR Code Menus',        desc: 'Generate unique QR codes for every table. Guests scan and order instantly — no paper menus needed.' },
  { icon: Zap,           title: 'Real-Time Orders',      desc: 'Orders appear on your ushers\' phones the second they\'re placed. No delays, no missed requests.' },
  { icon: Users,         title: 'Usher Management',      desc: 'Assign ushers to tables with auto-generated PINs. Track every served order per usher.' },
  { icon: ClipboardList, title: 'Full Order History',    desc: 'Every order logged with timestamps. Export to CSV or PDF for post-event reporting.' },
  { icon: Star,          title: 'Elegant Guest Experience', desc: 'A beautiful, mobile-first menu your guests will love. Individual or whole-table ordering modes.' },
  { icon: CheckCircle,   title: 'Live Table Status',     desc: 'See which tables are empty, waiting, or served — all updating in real time on your dashboard.' },
]

const plans = [
  {
    name: 'Basic',
    price: '₦30,000',
    color: 'border-gray-200',
    features: ['1 event', 'Up to 20 tables', '5 ushers', 'QR code menus', 'Real-time orders', 'Email support'],
  },
  {
    name: 'Standard',
    price: '₦60,000',
    color: 'border-gold',
    badge: 'Most Popular',
    features: ['3 events', 'Up to 50 tables', '15 ushers', 'Everything in Basic', 'CSV/PDF export', 'Priority support'],
  },
  {
    name: 'Premium',
    price: '₦100,000',
    color: 'border-green-dark',
    features: ['Unlimited events', 'Unlimited tables', 'Unlimited ushers', 'Everything in Standard', 'Custom branding', 'Dedicated support'],
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-green-dark">
            <span className="text-gold text-2xl">⬡</span> TableServe
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-green-dark transition">Login</Link>
            <Link to="/signup" className="btn-primary text-sm px-5 py-2.5 rounded-xl">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-dark via-green-mid to-green-light text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-gold/20 text-gold-light border border-gold/30 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            Built for Nigerian weddings & events
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Seamless food service<br />
            <span className="text-gold">for your event</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            TableServe turns every table into a smart ordering station.
            Guests scan, order, and get served — while you watch it all happen in real time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-gold hover:bg-gold-dark text-white font-bold px-8 py-4 rounded-2xl text-lg transition shadow-lg shadow-black/20">
              Start for Free
            </Link>
            <a href="#how-it-works" className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition">
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-dark/5 border-y border-green-dark/10 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[['500+', 'Events Served'], ['50k+', 'Orders Processed'], ['99.9%', 'Uptime']].map(([val, label]) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-green-dark">{val}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">From table setup to final service — all in one platform designed for Nigerian events.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:border-green-dark/20 hover:shadow-md transition group">
                <div className="w-12 h-12 rounded-xl bg-green-pale flex items-center justify-center mb-4 group-hover:bg-green-dark transition">
                  <Icon size={22} className="text-green-dark group-hover:text-white transition" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-green-dark text-white" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How it works</h2>
            <p className="text-white/70 text-lg">Set up in minutes, run seamlessly on the day.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create your event', desc: 'Add your event details and build your menu with photos and categories.' },
              { step: '02', title: 'Add tables & ushers', desc: 'Set up tables, assign ushers, and generate QR codes for printing.' },
              { step: '03', title: 'Guests scan & order', desc: 'Guests scan the QR at their table and place orders from the beautiful menu.' },
              { step: '04', title: 'Ushers get notified', desc: 'Ushers receive instant notifications on their phones and mark orders served.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center text-2xl font-black text-white mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple pricing</h2>
            <p className="text-gray-500 text-lg">No hidden fees. Pay once per event season.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 ${plan.color} ${plan.badge ? 'shadow-xl' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <div className="text-lg font-bold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-4xl font-extrabold text-green-dark mb-6">{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-green-light flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={`block text-center font-semibold py-3 rounded-xl transition ${plan.badge ? 'btn-gold' : 'btn-outline'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gold-pale border-t border-gold/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to upgrade your event?</h2>
          <p className="text-gray-600 mb-8">Join hundreds of Nigerian event organizers who trust TableServe for smooth, professional food service.</p>
          <Link to="/signup" className="btn-primary px-10 py-4 text-lg rounded-2xl inline-block">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-dark text-white/60 text-sm py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-2">
          <span className="text-gold text-xl">⬡</span> TableServe
        </div>
        <p>© {new Date().getFullYear()} TableServe. Built for Nigeria's finest events.</p>
      </footer>
    </div>
  )
}
