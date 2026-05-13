import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Package,
  Calculator,
  Calendar,
  PlayCircle,
  FileText,
  Receipt,
  BarChart2,
  User,
  UserCog,
  LogOut,
  ChevronDown,
  ShoppingCart,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isDonoEmpresa } from '../lib/sidebarAccess'

const menuItemsDef = [
  { permission: 'visao-geral', path: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard, children: null },
  {
    permission: 'financeiro',
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
    permission: 'clientes',
    label: 'Clientes',
    icon: Users,
    children: [
      { path: '/dashboard/clientes', label: 'Visão Geral' },
      { path: '/dashboard/clientes/cadastro', label: 'Cadastro' },
    ],
  },
  {
    permission: 'vendas',
    label: 'Vendas',
    icon: ShoppingCart,
    children: [{ path: '/dashboard/vendas', label: 'Lista de vendas' }],
  },
  {
    permission: 'estoque',
    label: 'Estoque',
    icon: Package,
    children: [
      { path: '/dashboard/produtos', label: 'Produtos — visão' },
      { path: '/dashboard/produtos/lista', label: 'Lista de produtos' },
      { path: '/dashboard/estoque', label: 'Estoque — visão' },
      { path: '/dashboard/estoque/movimentacoes', label: 'Movimentações' },
    ],
  },
  { permission: 'notas-fiscais', path: '/dashboard/notas-fiscais', label: 'Notas Fiscais', icon: Receipt, children: null },
  {
    permission: 'calculadora',
    label: 'Calculadora',
    icon: Calculator,
    children: [
      { path: '/dashboard/calculadora/precificacao', label: 'Precificação' },
      { path: '/dashboard/calculadora/pro-labore', label: 'Pró-labore' },
    ],
  },
  { permission: 'das-mensal', path: '/dashboard/das-mensal', label: 'DAS Mensal', icon: BarChart2, children: null },
  { permission: 'tarefas', path: '/dashboard/tarefas', label: 'Tarefas', icon: Calendar, children: null },
  { permission: 'tutoriais', path: '/dashboard/tutoriais', label: 'Tutoriais', icon: PlayCircle, children: null },
  {
    permission: 'assinatura',
    label: 'Assinatura',
    icon: FileText,
    children: [
      { path: '/dashboard/assinatura/planos', label: 'Planos e Pagamento' },
      { path: '/dashboard/assinatura/historico', label: 'Histórico' },
    ],
  },
  { permission: 'perfil', path: '/dashboard/perfil', label: 'Perfil', icon: User, children: null },
  { ownerOnly: true, path: '/dashboard/usuarios', label: 'Usuários', icon: UserCog, children: null },
]

function filterMenuForUser(user, items) {
  if (!user) return []
  const owner = isDonoEmpresa(user)
  const perms = Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : []
  const out = []
  for (const item of items) {
    if (item.ownerOnly) {
      if (owner) out.push(item)
      continue
    }
    if (item.children) {
      const perm = item.permission
      if (!owner && !perms.includes(perm)) continue
      out.push(item)
      continue
    }
    if (owner || perms.includes(item.permission)) out.push(item)
  }
  return out
}

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [logoErro, setLogoErro] = useState(false)

  const menuItems = useMemo(() => filterMenuForUser(user, menuItemsDef), [user])

  useEffect(() => {
    setLogoErro(false)
  }, [user?.logotipo])
  const [expanded, setExpanded] = useState(() => {
    const path = location.pathname
    if (path.startsWith('/dashboard/financeiro')) return ['Financeiro']
    if (path.startsWith('/dashboard/clientes')) return ['Clientes']
    if (path.startsWith('/dashboard/vendas')) return ['Vendas']
    if (path.startsWith('/dashboard/produtos') || path.startsWith('/dashboard/estoque')) return ['Estoque']
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

  return (
    <aside className="w-64 h-dvh max-h-screen flex flex-col fixed left-0 top-0 z-30 bg-sidebar-bg border-r border-sidebar-border overflow-hidden">
      <div className="p-4 flex items-center gap-2 border-b border-sidebar-border shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          M
        </div>
        <span className="font-semibold text-lg text-white">MEI Controle</span>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2 overscroll-contain">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = expanded.includes(item.label)
            const active = hasActiveChild(item.children)
            const Icon = item.icon
            return (
              <div key={item.label} className="mb-0.5">
                <button
                  type="button"
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

      <div className="p-3 border-t border-sidebar-border shrink-0 bg-sidebar-bg">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-2">
          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 text-sm font-medium shrink-0 overflow-hidden border border-sidebar-border">
            {user?.logotipo && !logoErro ? (
              <img
                src={user.logotipo}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setLogoErro(true)}
              />
            ) : (
              <span aria-hidden>{(user?.nome || 'U')[0]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.nome || 'Usuário'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
            {user?.owner_user_id ? (
              <p className="text-[10px] text-slate-500 mt-0.5">Colaborador</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
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
