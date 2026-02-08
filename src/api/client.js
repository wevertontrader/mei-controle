let API_URL = import.meta.env.VITE_API_URL || '/api'
if (API_URL && !API_URL.endsWith('/api') && API_URL.startsWith('http')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api'
}

function getToken() {
  return localStorage.getItem('token')
}

export async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const base = (API_URL || '/api').replace(/\/$/, '')
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${base}${path}`
  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando (porta 3001).')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error || data?.message || (res.status === 401 ? 'Sessão expirada. Faça login novamente.' : res.status >= 500 ? 'Servidor indisponível. Tente novamente.' : `Erro na requisição (${res.status})`)
    throw new Error(msg)
  }
  return data
}

export const auth = {
  login: (email, senha) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  register: (dados) => api('/auth/register', { method: 'POST', body: JSON.stringify(dados) }),
  me: () => api('/auth/me'),
  updatePerfil: (dados) => api('/auth/me', { method: 'PUT', body: JSON.stringify(dados) }),
}

export const admin = {
  stats: () => api('/admin/stats'),
  empresas: () => api('/admin/empresas'),
  empresa: (id) => api(`/admin/empresas/${id}`),
  estenderTrial: (id, dias) => api(`/admin/empresas/${id}/trial`, { method: 'PUT', body: JSON.stringify({ dias }) }),
  planos: {
    list: () => api('/admin/planos'),
    create: (d) => api('/admin/planos', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => api(`/admin/planos/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => api(`/admin/planos/${id}`, { method: 'DELETE' }),
  },
  configuracoes: {
    get: () => api('/admin/configuracoes'),
    update: (d) => api('/admin/configuracoes', { method: 'PUT', body: JSON.stringify(d) }),
  },
}

export const dashboard = {
  visaoGeral: () => api('/dashboard/visao-geral'),
}

export const financeiro = {
  entradas: {
    list: () => api('/financeiro/entradas'),
    create: (d) => api('/financeiro/entradas', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => api(`/financeiro/entradas/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => api(`/financeiro/entradas/${id}`, { method: 'DELETE' }),
  },
  gastos: {
    list: () => api('/financeiro/gastos'),
    create: (d) => api('/financeiro/gastos', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => api(`/financeiro/gastos/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => api(`/financeiro/gastos/${id}`, { method: 'DELETE' }),
  },
  custos: {
    list: () => api('/financeiro/custos'),
    create: (d) => api('/financeiro/custos', { method: 'POST', body: JSON.stringify(d) }),
    pago: (id) => api(`/financeiro/custos/${id}/pago`, { method: 'PUT' }),
    delete: (id) => api(`/financeiro/custos/${id}`, { method: 'DELETE' }),
  },
  poupanca: {
    list: () => api('/financeiro/poupanca'),
    create: (d) => api('/financeiro/poupanca', { method: 'POST', body: JSON.stringify(d) }),
    delete: (id) => api(`/financeiro/poupanca/${id}`, { method: 'DELETE' }),
  },
}

export const clientes = {
  list: () => api('/clientes'),
  create: (d) => api('/clientes', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => api(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id) => api(`/clientes/${id}`, { method: 'DELETE' }),
  vendas: {
    list: () => api('/clientes/vendas'),
    create: (d) => api('/clientes/vendas', { method: 'POST', body: JSON.stringify(d) }),
  },
}

export const produtos = {
  list: () => api('/produtos'),
  create: (d) => api('/produtos', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => api(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id) => api(`/produtos/${id}`, { method: 'DELETE' }),
}

export const estoque = {
  movimentacoes: {
    list: () => api('/estoque/movimentacoes'),
    create: (d) => api('/estoque/movimentacoes', { method: 'POST', body: JSON.stringify(d) }),
  },
}

export const assinatura = {
  planos: () => api('/assinatura/planos'),
  checkout: (plano) => api('/assinatura/checkout', { method: 'POST', body: JSON.stringify({ plano }) }),
  confirmar: (dados) => api('/assinatura/confirmar', { method: 'POST', body: JSON.stringify(dados) }),
}

export const tarefas = {
  list: () => api('/tarefas'),
  create: (d) => api('/tarefas', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => api(`/tarefas/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  delete: (id) => api(`/tarefas/${id}`, { method: 'DELETE' }),
}

export const notasFiscais = {
  list: () => api('/dashboard/notas-fiscais'),
  create: (d) => api('/dashboard/notas-fiscais', { method: 'POST', body: JSON.stringify(d) }),
  updateStatus: (id, status) => api(`/dashboard/notas-fiscais/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => api(`/dashboard/notas-fiscais/${id}`, { method: 'DELETE' }),
}

export const dasMensal = {
  list: () => api('/dashboard/das-mensal'),
  create: (d) => api('/dashboard/das-mensal', { method: 'POST', body: JSON.stringify(d) }),
  marcarPago: (id) => api(`/dashboard/das-mensal/${id}/pago`, { method: 'PUT' }),
  delete: (id) => api(`/dashboard/das-mensal/${id}`, { method: 'DELETE' }),
}
