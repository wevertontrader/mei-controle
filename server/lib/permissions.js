/** Chaves de permissão da sidebar / API (colaboradores). */
const PERMISSION_KEYS = [
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

function parseSidebarPermissions(raw) {
  if (raw == null || raw === '') return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Caminho da API (sem query) → chave de permissão; null = não exige permissão de colaborador. */
function apiPathToPermission(urlPath) {
  const u = String(urlPath || '').split('?')[0]
  if (u.startsWith('/api/auth/')) return null
  if (u.startsWith('/api/admin')) return null
  if (u.startsWith('/api/empresa/')) return null
  if (u.startsWith('/api/public/')) return null
  if (u.startsWith('/api/dashboard/visao-geral')) return 'visao-geral'
  if (u.startsWith('/api/dashboard/notas-fiscais')) return 'notas-fiscais'
  if (u.startsWith('/api/dashboard/das-mensal')) return 'das-mensal'
  if (u.startsWith('/api/dashboard/tutoriais')) return 'tutoriais'
  if (u.startsWith('/api/financeiro')) return 'financeiro'
  if (u.startsWith('/api/clientes/vendas')) return 'vendas'
  if (u.startsWith('/api/clientes')) return 'clientes'
  if (u.startsWith('/api/produtos')) return 'estoque'
  if (u.startsWith('/api/estoque')) return 'estoque'
  if (u.startsWith('/api/tarefas')) return 'tarefas'
  if (u.startsWith('/api/assinatura')) return 'assinatura'
  return null
}

module.exports = { PERMISSION_KEYS, parseSidebarPermissions, apiPathToPermission }
