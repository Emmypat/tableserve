import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UsherProvider } from './context/UsherContext'
import AdminGuard from './components/auth/AdminGuard'
import UsherGuard from './components/auth/UsherGuard'

import Landing from './pages/Landing'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ResetPassword from './pages/admin/ResetPassword'
import UsherLogin from './pages/usher/UsherLogin'
import UsherDashboard from './pages/usher/UsherDashboard'
import GuestMenu from './pages/guest/GuestMenu'
import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <AuthProvider>
      <UsherProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/reset-password" element={<ResetPassword />} />
            <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

            {/* Usher */}
            <Route path="/usher/login"     element={<UsherLogin />} />
            <Route path="/usher/dashboard" element={<UsherGuard><UsherDashboard /></UsherGuard>} />

            {/* Guest */}
            <Route path="/table/:tableId" element={<ErrorBoundary><GuestMenu /></ErrorBoundary>} />
          </Routes>
        </BrowserRouter>
      </UsherProvider>
    </AuthProvider>
  )
}
