import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Settings, Table2, Users, ClipboardList, QrCode, LogOut, ChevronRight } from 'lucide-react'

export default function OrganizerLayout({ children }) {
  const { organizer, logout } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const eventLinks = id ? [
    { to: `/event/${id}/setup`,   icon: Settings,       label: 'Event Setup' },
    { to: `/event/${id}/tables`,  icon: Table2,         label: 'Tables' },
    { to: `/event/${id}/ushers`,  icon: Users,          label: 'Ushers' },
    { to: `/event/${id}/orders`,  icon: ClipboardList,  label: 'Orders' },
    { to: `/event/${id}/qrcodes`, icon: QrCode,         label: 'QR Codes' },
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Nav */}
      <header className="bg-green-dark text-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-gold text-2xl">⬡</span> TableServe
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
            }>
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            {eventLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
              }>
                <Icon size={16} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-white/70">{organizer?.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
        {/* Mobile event nav */}
        {eventLinks.length > 0 && (
          <div className="md:hidden overflow-x-auto border-t border-white/10">
            <div className="flex gap-1 px-4 py-2 min-w-max">
              {eventLinks.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} className={({ isActive }) =>
                  `flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
                }>
                  <Icon size={14} /> {label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
