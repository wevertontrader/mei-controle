import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen bg-[#0d1117]">
        <Outlet />
      </main>
    </div>
  )
}
