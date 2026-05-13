let API_URL = import.meta.env.VITE_API_URL || '/api'
if (API_URL && !API_URL.endsWith('/api') && API_URL.startsWith('http')) {
  API_URL = API_URL.replace(/\/$/, '') + '/api'
}

function getToken() {
  return localStorage.getItem('token')
}

function parseResponseBody(raw, status) {
  if (!raw || !raw.trim()) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const t = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return { error: t.slice(0, 280) || `Resposta inválida (${status})` }
  }
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
    const raw = String(e?.message || e || '')
    const isFetchFailed =
      /fetch failed/i.test(raw) ||
      /failed to fetch/i.test(raw) ||
      /networkerror/i.test(raw) ||
      /load failed/i.test(raw)
    if (isFetchFailed && typeof API_URL === 'string' && API_URL.startsWith('/')) {
      throw new Error(
        'Não foi possível falar com o backend pelo proxy do Vite. Suba o servidor (npm run server), ' +
          'atualize a página e confira se existe o arquivo .dev-server-port na raiz do projeto (porta atual do Node).',
      )
    }
    if (isFetchFailed) {
      throw new Error(
        `Não foi possível conectar em ${url.split('?')[0]}. ` +
          `Com VITE_API_URL absoluto, a porta precisa ser a do servidor (veja o console ao rodar npm run server).`,
      )
    }
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando (porta 3001).')
  }
  const raw = await res.text()
  const data = parseResponseBody(raw, res.status)
  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (res.status === 401 ? 'Sessão expirada. Faça login novamente.' : res.status >= 500 ? 'Servidor indisponível. Tente novamente.' : `Erro na requisição (${res.status})`)
    throw new Error(msg)
  }
  return data
}

async function apiUpload(endpoint, formData) {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const base = (API_URL || '/api').replace(/\/$/, '')
  const pathPart = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${base}${pathPart}`
  let res
  try {
    res = await fetch(url, { method: 'POST', body: formData, headers })
  } catch (e) {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando (porta 3001).')
  }
  const raw = await res.text()
  const data = parseResponseBody(raw, res.status)
  if (!res.ok) {
    const msg =
      data?.error ||
      data?.message ||
      (res.status === 401 ? 'Sessão expirada. Faça login novamente.' : res.status >= 500 ? 'Servidor indisponível. Tente novamente.' : `Erro na requisição (${res.status})`)
    throw new Error(msg)
  }
  return data
}

/** GET /public/contato sem Authorization (rota pública; token às vezes quebra CORS/cache em landing). */
export async function getPublicContato() {
  const base = (API_URL || '/api').replace(/\/$/, '')
  const res = await fetch(`${base}/public/contato`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  const raw = await res.text()
  const data = parseResponseBody(raw, res.status)
  if (!res.ok) {
    const msg = data?.error || data?.message || `Erro na requisição (${res.status})`
    throw new Error(msg)
  }
  return data
}

/** Rotas públicas (sem token). */
export const publicApi = {
  contato: () => getPublicContato(),
}

export const auth = {
  login: (email, senha) => api('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) }),
  register: (dados) => api('/auth/register', { method: 'POST', body: JSON.stringify(dados) }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, senha) =>
    api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, senha }) }),
  me: () => api('/auth/me'),
  updatePerfil: (dados) => api('/auth/me', { method: 'PUT', body: JSON.stringify(dados) }),
  uploadLogotipo: (file) => {
    const fd = new FormData()
    fd.append('logo', file)
    return apiUpload('/auth/me/logotipo', fd)
  },
  uploadLogotipoPdv: (file) => {
    const fd = new FormData()
    fd.append('logo', file)
    return apiUpload('/auth/me/logotipo-pdv', fd)
  },
  alterarSenha: ({ senhaAtual, senhaNova }) =>
    api('/auth/me/senha', { method: 'PUT', body: JSON.stringify({ senhaAtual, senhaNova }) }),
}

export const admin = {
  stats: () => api('/admin/stats'),
  empresas: (params = {}) => {
    const usp = new URLSearchParams()
    if (params.q) usp.set('q', params.q)
    if (params.page != null && params.page !== '') usp.set('page', String(params.page))
    if (params.limit != null && params.limit !== '') usp.set('limit', String(params.limit))
    const qs = usp.toString()
    return api(qs ? `/admin/empresas?${qs}` : '/admin/empresas')
  },
  empresa: (id) => api(`/admin/empresas/${id}`),
  updateEmpresa: (id, dados) => api(`/admin/empresas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  uploadLogotipoEmpresa: (id, file) => {
    const fd = new FormData()
    fd.append('logo', file)
    return apiUpload(`/admin/empresas/${id}/logotipo`, fd)
  },
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
  testWhatsappAssinantes: (telefone, evolutionCfg = null) =>
    api('/admin/whatsapp-test-assinantes', {
      method: 'POST',
      body: JSON.stringify(
        evolutionCfg && typeof evolutionCfg === 'object'
          ? { telefone, ...evolutionCfg }
          : { telefone }
      ),
    }),
  tutoriais: {
    list: () => api('/admin/tutoriais'),
    create: (d) => api('/admin/tutoriais', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => api(`/admin/tutoriais/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => api(`/admin/tutoriais/${id}`, { method: 'DELETE' }),
  },
}

export const dashboard = {
  visaoGeral: (params = {}) => {
    const usp = new URLSearchParams()
    if (params.periodo) usp.set('periodo', String(params.periodo))
    const qs = usp.toString()
    return api(qs ? `/dashboard/visao-geral?${qs}` : '/dashboard/visao-geral')
  },
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
    list: (params = {}) => {
      const usp = new URLSearchParams()
      if (params.q) usp.set('q', params.q)
      if (params.data_inicio) usp.set('data_inicio', params.data_inicio)
      if (params.data_fim) usp.set('data_fim', params.data_fim)
      if (params.forma) usp.set('forma', params.forma)
      const qs = usp.toString()
      return api(qs ? `/clientes/vendas?${qs}` : '/clientes/vendas')
    },
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

export const empresaUsuarios = {
  colaboradores: {
    list: () => api('/empresa/colaboradores'),
    create: (d) => api('/empresa/colaboradores', { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => api(`/empresa/colaboradores/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id) => api(`/empresa/colaboradores/${id}`, { method: 'DELETE' }),
  },
}

export const assinatura = {
  planos: () => api('/assinatura/planos'),
  checkout: (plano) => api('/assinatura/checkout', { method: 'POST', body: JSON.stringify({ plano }) }),
  confirmar: (dados) => api('/assinatura/confirmar', { method: 'POST', body: JSON.stringify(dados) }),
}

export const tutoriais = {
  list: () => api('/dashboard/tutoriais'),
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
