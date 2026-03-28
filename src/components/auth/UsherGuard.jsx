import { Navigate } from 'react-router-dom'
import { useUsher } from '../../context/UsherContext'

export default function UsherGuard({ children }) {
  const { usher } = useUsher()
  if (!usher) return <Navigate to="/usher/login" replace />
  return children
}
