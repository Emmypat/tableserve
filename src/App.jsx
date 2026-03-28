import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UsherProvider } from './context/UsherContext'
import OrganizerGuard from './components/auth/OrganizerGuard'
import UsherGuard from './components/auth/UsherGuard'

import Landing from './pages/Landing'
import Signup from './pages/Signup'
import Login from './pages/Login'
import PendingApproval from './pages/PendingApproval'
import Approvals from './pages/admin/Approvals'
import Dashboard from './pages/organizer/Dashboard'
import EventSetup from './pages/organizer/EventSetup'
import TableManagement from './pages/organizer/TableManagement'
import UsherManagement from './pages/organizer/UsherManagement'
import OrdersView from './pages/organizer/OrdersView'
import QRCodePrint from './pages/organizer/QRCodePrint'
import UsherLogin from './pages/usher/UsherLogin'
import UsherDashboard from './pages/usher/UsherDashboard'
import GuestMenu from './pages/guest/GuestMenu'

export default function App() {
  return (
    <AuthProvider>
      <UsherProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pending" element={<PendingApproval />} />
            <Route path="/admin/approvals" element={<Approvals />} />

            {/* Organizer (protected) */}
            <Route path="/dashboard" element={<OrganizerGuard><Dashboard /></OrganizerGuard>} />
            <Route path="/event/:id/setup"   element={<OrganizerGuard><EventSetup /></OrganizerGuard>} />
            <Route path="/event/:id/tables"  element={<OrganizerGuard><TableManagement /></OrganizerGuard>} />
            <Route path="/event/:id/ushers"  element={<OrganizerGuard><UsherManagement /></OrganizerGuard>} />
            <Route path="/event/:id/orders"  element={<OrganizerGuard><OrdersView /></OrganizerGuard>} />
            <Route path="/event/:id/qrcodes" element={<OrganizerGuard><QRCodePrint /></OrganizerGuard>} />

            {/* Usher */}
            <Route path="/usher/login"     element={<UsherLogin />} />
            <Route path="/usher/dashboard" element={<UsherGuard><UsherDashboard /></UsherGuard>} />

            {/* Guest — MUST be last (catch-all dynamic route) */}
            <Route path="/:eventSlug/table/:tableId" element={<GuestMenu />} />
          </Routes>
        </BrowserRouter>
      </UsherProvider>
    </AuthProvider>
  )
}
