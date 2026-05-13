import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, CreditCard, BookOpen, Settings, LogOut, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AdminSidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-30">
      <div className="p-4 flex items-center gap-2 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-lg">
          <Shield className="w-5 h-5" />
        </div>
        <span className="font-semibold text-lg text-white">Super Admin</span>
      </div>

      <nav className="flex-1 py-4 px-2">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive ? 'bg-amber-600/30 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/admin/empresas"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive ? 'bg-amber-600/30 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Building2 className="w-5 h-5" />
          Empresas
        </NavLink>
        <NavLink
          to="/admin/planos"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive ? 'bg-amber-600/30 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <CreditCard className="w-5 h-5" />
          Planos
        </NavLink>
        <NavLink
          to="/admin/tutoriais"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive ? 'bg-amber-600/30 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <BookOpen className="w-5 h-5" />
          Tutoriais
        </NavLink>
        <NavLink
          to="/admin/configuracoes"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive ? 'bg-amber-600/30 text-amber-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Configurações
        </NavLink>
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-10 h-10 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400 font-semibold shrink-0">
            {(user?.nome || 'A')[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.nome || 'Super Admin'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
