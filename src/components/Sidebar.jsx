import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Package,
  Settings,
  Calculator,
  Calendar,
  PlayCircle,
  FileText,
  Receipt,
  BarChart2,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, children: null },
  {
    label: 'Financeiro',
    icon: TrendingUp,
    children: [
      { path: '/dashboard/financeiro', label: 'Visão Geral' },
      { path: '/dashboard/financeiro/entradas', label: 'Entradas' },
      { path: '/dashboard/financeiro/gastos', label: 'Gastos' },
      { path: '/dashboard/financeiro/custos', label: 'Custos' },
      { path: '/dashboard/financeiro/poupanca', label: 'Poupança' },
    ],
  },
  {
    label: 'Clientes',
    icon: Users,
    children: [
      { path: '/dashboard/clientes', label: 'Visão Geral' },
      { path: '/dashboard/clientes/cadastro', label: 'Cadastro' },
      { path: '/dashboard/clientes/historico-vendas', label: 'Histórico de Vendas' },
    ],
  },
  {
    label: 'Produtos',
    icon: Package,
    children: [
      { path: '/dashboard/produtos', label: 'Visão Geral' },
      { path: '/dashboard/produtos/lista', label: 'Lista de Produtos' },
    ],
  },
  { path: '/dashboard/notas-fiscais', label: 'Notas Fiscais', icon: Receipt, children: null },
  {
    label: 'Estoque',
    icon: Settings,
    children: [
      { path: '/dashboard/estoque', label: 'Visão Geral' },
      { path: '/dashboard/estoque/movimentacoes', label: 'Movimentações' },
    ],
  },
  {
    label: 'Calculadora',
    icon: Calculator,
    children: [
      { path: '/dashboard/calculadora/precificacao', label: 'Precificação' },
      { path: '/dashboard/calculadora/pro-labore', label: 'Pró-labore' },
    ],
  },
  { path: '/dashboard/das-mensal', label: 'DAS Mensal', icon: BarChart2, children: null },
  { path: '/dashboard/tarefas', label: 'Tarefas', icon: Calendar, children: null },
  { path: '/dashboard/tutoriais', label: 'Tutoriais', icon: PlayCircle, children: null },
  {
    label: 'Assinatura',
    icon: FileText,
    children: [
      { path: '/dashboard/assinatura/planos', label: 'Planos e Pagamento' },
      { path: '/dashboard/assinatura/historico', label: 'Histórico' },
    ],
  },
  { path: '/dashboard/perfil', label: 'Perfil', icon: User, children: null },
]

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [expanded, setExpanded] = useState(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/financeiro')) return ['Financeiro']
    if (path.startsWith('/dashboard/clientes')) return ['Clientes']
    if (path.startsWith('/dashboard/produtos')) return ['Produtos']
    if (path.startsWith('/dashboard/estoque')) return ['Estoque']
    if (path.startsWith('/dashboard/calculadora')) return ['Calculadora']
    if (path.startsWith('/dashboard/assinatura')) return ['Assinatura']
    return []
  })

  const toggle = (label) => {
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    )
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const hasActiveChild = (children) =>
    children?.some((c) => isActive(c.path))

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const trialExpired = trialEndsAt && trialEndsAt < new Date()
  const trialDays = trialEndsAt ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <aside className="w-64 min-h-screen bg-sidebar-bg border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-30">
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          M
        </div>
        <span className="font-semibold text-lg text-white">MEI Controle</span>
      </div>

      {!trialExpired && trialDays > 0 && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
          <p className="text-xs text-emerald-400 font-medium">
            {trialDays} {trialDays === 1 ? 'dia' : 'dias'} de teste restante{trialDays !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = expanded.includes(item.label)
            const active = hasActiveChild(item.children)
            const Icon = item.icon
            return (
              <div key={item.label} className="mb-0.5">
                <button
                  onClick={() => toggle(item.label)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-sidebar-active text-blue-300'
                      : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  {item.children.map((child) => {
                    const hasChildPaths = item.children.some((c) => c.path !== child.path && c.path.startsWith(child.path + '/'))
                    return (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end={hasChildPaths}
                      className={({ isActive: active }) =>
                        `block py-2 pl-11 pr-3 text-sm rounded-lg mx-1 transition-colors ${
                          active
                            ? 'bg-sidebar-active text-blue-300'
                            : 'text-slate-400 hover:text-white hover:bg-sidebar-hover'
                        }`
                      }
                    >
                      {child.label}
                    </NavLink>
                  )})}
                </div>
              </div>
            )
          }
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: active }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  active
                    ? 'bg-sidebar-active text-blue-300'
                    : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-sm font-medium shrink-0">
            {(user?.nome || 'U')[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.nome || 'Usuário'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
