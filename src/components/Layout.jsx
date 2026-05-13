import { Outlet, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'
import { canAccessDashboardPath, firstAccessibleDashboardPath } from '../lib/sidebarAccess'

export default function Layout() {
  const { user } = useAuth()
  const location = useLocation()
  if (user && !canAccessDashboardPath(user, location.pathname)) {
    const to = firstAccessibleDashboardPath(user)
    return <Navigate to={to} replace />
  }
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-[#0d1117]">
        <Outlet />
      </main>
    </div>
  )
}
