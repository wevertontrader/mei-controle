/** Alinhar com server/lib/permissions.js (chaves de API / sidebar). */
export const PERMISSION_KEYS = [
  'visao-geral',
  'financeiro',
  'clientes',
  'vendas',
  'estoque',
  'notas-fiscais',
  'calculadora',
  'das-mensal',
  'tarefas',
  'tutoriais',
  'assinatura',
  'perfil',
]

export const PERMISSION_LABELS = {
  'visao-geral': 'Visão Geral',
  financeiro: 'Financeiro',
  clientes: 'Clientes',
  vendas: 'Vendas (PDV e lista)',
  estoque: 'Estoque e produtos',
  'notas-fiscais': 'Notas Fiscais',
  calculadora: 'Calculadora',
  'das-mensal': 'DAS Mensal',
  tarefas: 'Tarefas',
  tutoriais: 'Tutoriais',
  assinatura: 'Assinatura',
  perfil: 'Perfil',
}

export function isDonoEmpresa(user) {
  if (!user || user.role === 'super_admin') return false
  return !user.owner_user_id && (user.role || 'empresa') === 'empresa'
}

export function routePermission(pathname) {
  const p = pathname.replace(/\/$/, '') || '/dashboard'
  if (p === '/dashboard') return 'visao-geral'
  if (p.startsWith('/dashboard/usuarios')) return 'usuarios'
  if (p.startsWith('/dashboard/financeiro')) return 'financeiro'
  if (p.startsWith('/dashboard/clientes')) return 'clientes'
  if (p.startsWith('/dashboard/vendas')) return 'vendas'
  if (p.startsWith('/dashboard/produtos') || p.startsWith('/dashboard/estoque')) return 'estoque'
  if (p.startsWith('/dashboard/notas-fiscais')) return 'notas-fiscais'
  if (p.startsWith('/dashboard/calculadora')) return 'calculadora'
  if (p.startsWith('/dashboard/das-mensal')) return 'das-mensal'
  if (p.startsWith('/dashboard/tarefas')) return 'tarefas'
  if (p.startsWith('/dashboard/tutoriais')) return 'tutoriais'
  if (p.startsWith('/dashboard/assinatura')) return 'assinatura'
  if (p.startsWith('/dashboard/perfil')) return 'perfil'
  return 'visao-geral'
}

export function canAccessDashboardPath(user, pathname) {
  if (!user) return false
  if (user.role === 'super_admin') return true
  if (isDonoEmpresa(user)) return true
  const key = routePermission(pathname)
  if (key === 'usuarios') return false
  const perms = Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : []
  return perms.includes(key)
}

export function firstAccessibleDashboardPath(user) {
  if (!user?.owner_user_id) return '/dashboard'
  const perms = Array.isArray(user.sidebar_permissions) ? user.sidebar_permissions : []
  const order = [
    ['visao-geral', '/dashboard'],
    ['financeiro', '/dashboard/financeiro'],
    ['clientes', '/dashboard/clientes'],
    ['vendas', '/dashboard/vendas'],
    ['estoque', '/dashboard/produtos'],
    ['notas-fiscais', '/dashboard/notas-fiscais'],
    ['calculadora', '/dashboard/calculadora/precificacao'],
    ['das-mensal', '/dashboard/das-mensal'],
    ['tarefas', '/dashboard/tarefas'],
    ['tutoriais', '/dashboard/tutoriais'],
    ['assinatura', '/dashboard/assinatura/planos'],
    ['perfil', '/dashboard/perfil'],
  ]
  for (const [k, path] of order) {
    if (perms.includes(k)) return path
  }
  return '/dashboard/perfil'
}
