const db = require('../db')
const http = require('http')
const https = require('https')
const { URL } = require('url')

function cfg(chave) {
  const envVal = process.env[chave]
  if (envVal != null && String(envVal).trim() !== '') return String(envVal).trim()
  try {
    const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)
    return (row?.valor || '').trim()
  } catch (_) {
    return ''
  }
}

/** Valores do formulário admin no teste (evita depender só do que está salvo no banco). */
function cfgMerged(chave, override) {
  if (override && typeof override === 'object') {
    const raw = override[chave]
    if (raw != null && String(raw).trim() !== '') return String(raw).trim()
  }
  return cfg(chave)
}

/**
 * Credenciais Evolution: corpo da requisição / painel > banco > .env
 * (o `cfg()` global faz env > banco, o que fazia o .env “ganhar” e ignorar o salvo no admin).
 */
function cfgEvolution(chave, override) {
  if (override && typeof override === 'object') {
    const raw = override[chave]
    if (raw != null && String(raw).trim() !== '') return String(raw).trim()
  }
  try {
    const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)
    const v = (row?.valor || '').trim()
    if (v) return v
  } catch (_) {
    /* ignora */
  }
  const envVal = process.env[chave]
  if (envVal != null && String(envVal).trim() !== '') return String(envVal).trim()
  return ''
}

/** Remove sufixos comuns colados por engano na URL da API. */
function normalizeEvolutionBase(raw) {
  let b = String(raw).replace(/\/$/, '').trim()
  b = b.replace(/\/manager\/?$/i, '')
  b = b.replace(/\/dashboard\/?$/i, '')
  b = b.replace(/\/web\/?$/i, '')
  try {
    const u = new URL(b)
    if (u.hostname === 'localhost' || u.hostname === '::1') {
      u.hostname = '127.0.0.1'
      b = u.toString().replace(/\/$/, '')
    }
  } catch (_) {
    /* mantém b */
  }
  return b
}

/** Dígitos 55 + DDD + número (WhatsApp BR comum) */
function normalizeWhatsappToNumber(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length < 10 || d.length > 13) return null
  if (d.startsWith('55')) return d
  if (d.length >= 10 && d.length <= 11) return `55${d}`
  return d
}

function applyTemplate(tpl, vars) {
  let s = String(tpl || '')
  Object.entries(vars).forEach(([k, v]) => {
    s = s.split(`{${k}}`).join(v != null ? String(v) : '')
  })
  return s
}

const { inspect } = require('util')

/** Mensagem útil em pt-BR para falhas do fetch (Node/undici) à Evolution API */
function explainEvolutionFetchError(err, baseUrl, requestUrl) {
  const hint = (baseUrl && String(baseUrl).trim()) || 'a Evolution API'
  const rota = requestUrl ? ` Detalhe técnico: tentativa POST ${requestUrl}` : ''

  const parts = []
  function walk(e, depth) {
    if (!e || depth > 14) return
    if (typeof e === 'string') {
      parts.push(e)
      return
    }
    if (e instanceof Error || (e && typeof e === 'object' && 'message' in e)) {
      if (e.message) parts.push(String(e.message))
      if (e.code) parts.push(String(e.code))
      if (e.errno != null && e.errno !== '') parts.push(String(e.errno))
      if (e.syscall) parts.push(String(e.syscall))
    }
    if (Array.isArray(e?.errors)) {
      for (const sub of e.errors) walk(sub, depth + 1)
    }
    if (e?.cause) walk(e.cause, depth + 1)
  }
  walk(err, 0)

  let deepStr = ''
  try {
    deepStr = inspect(err, { depth: 10 }).toLowerCase()
  } catch (_) {
    /* ignora */
  }

  const blob = `${parts.join(' ')} ${deepStr}`.toLowerCase()

  const suffixo = `${rota} Confirme na documentação da Evolution se o endpoint é /message/sendText/{instância} (API v2).`

  if (blob.includes('econnrefused') || blob.includes('connection refused')) {
    return `Conexão recusada ao acessar ${hint}. A Evolution não aceitou conexão nessa porta (serviço parado, porta errada ou firewall).${suffixo}`
  }
  if (blob.includes('enotfound') || blob.includes('getaddrinfo') || blob.includes('name not known')) {
    let host = ''
    try {
      host = new URL(String(baseUrl).trim()).hostname
    } catch (_) {
      /* ignora */
    }
    const dnsHint = host
      ? ` O subdomínio «${host}» não existe na internet (NXDOMAIN) ou o DNS ainda não propagou: crie um registro A ou CNAME para esse nome no painel do domínio (ex.: Cloudflare/Registro.br) apontando para o servidor onde a Evolution roda. No PowerShell: nslookup ${host}`
      : ' Crie um registro DNS (A ou CNAME) para o hostname da API ou corrija o endereço.'
    return (
      `Não foi possível resolver o hostname em ${hint}.${dnsHint} ` +
      `Confira também erros de digitação (ex.: evolution vs evolucao).${suffixo}`
    )
  }
  if (blob.includes('certificate') || blob.includes('ssl') || blob.includes('tls') || blob.includes('unable to verify')) {
    return `Falha de certificado SSL ao conectar em ${hint}. Em local, use http://127.0.0.1:PORTA ou corrija o certificado. Se a Evolution usa HTTPS com certificado interno, defina EVOLUTION_TLS_INSECURE=1 no .env (apenas ambiente de desenvolvimento).${suffixo}`
  }
  if (blob.includes('wrong version number') || blob.includes('ssl routines')) {
    return `Protocolo incompatível com ${hint}. Muitas vezes a Evolution está em HTTP e a URL foi configurada como https:// (ou o contrário). Ajuste o esquema na URL base.${suffixo}`
  }
  if (
    blob.includes('etimedout') ||
    blob.includes('timeout') ||
    blob.includes('und_err_connect_timeout') ||
    blob.includes('connect timeout')
  ) {
    return `Tempo esgotado ao conectar em ${hint}. Rede, firewall ou Evolution não responde.${suffixo}`
  }
  if (blob.includes('econnreset') || blob.includes('connection reset')) {
    return `Conexão encerrada por ${hint}. URL base errada (ex.: painel em vez da API), proxy ou Evolution reiniciando.${suffixo}`
  }
  if (blob.includes('epipe') || blob.includes('eai_again')) {
    return `Erro de rede (${hint}). Tente 127.0.0.1 em vez de localhost ou verifique DNS.${suffixo}`
  }

  const msgTop = String(err?.message || '').trim()
  if (
    blob.includes('fetch failed') ||
    msgTop.toLowerCase() === 'fetch failed' ||
    msgTop.toLowerCase().includes('fetch failed')
  ) {
    return `Não foi possível completar a conexão HTTP com ${hint}.${suffixo} Em Windows/Laragon: teste no navegador só valida o seu PC; este teste parte do Node. Use URL que o processo node.exe alcance (mesma máquina: http://127.0.0.1:PORTA). Se a Evolution estiver em Docker/WSL, use o IP/host adequado (ex.: host.docker.internal).`
  }

  if (msgTop && msgTop.toLowerCase() !== 'fetch failed') {
    return `${msgTop}${rota ? ` —${rota}` : ''}`
  }
  return `Falha de rede ao chamar a Evolution API (${hint}).${suffixo}`
}

/**
 * HTTP com preferência IPv4 (evita ::1 quando a API só escuta em IPv4 — comum com localhost no Windows).
 * @param {{ urlStr: string, method?: string, headers?: object, bodyUtf8?: string|null, timeoutMs: number }} opts
 */
function httpRequestIPv4({ urlStr, method = 'GET', headers = {}, bodyUtf8 = null, timeoutMs }) {
  const u = new URL(urlStr)
  const isHttps = u.protocol === 'https:'
  const lib = isHttps ? https : http
  const hdrs = { ...headers }
  const payload = bodyUtf8 != null ? Buffer.from(bodyUtf8, 'utf8') : null
  if (payload) hdrs['Content-Length'] = String(payload.length)

  const reqOpts = {
    hostname: u.hostname,
    port: u.port || (isHttps ? 443 : 80),
    path: `${u.pathname}${u.search}`,
    method,
    headers: hdrs,
    family: 4,
  }
  if (
    isHttps &&
    (process.env.EVOLUTION_TLS_INSECURE === '1' || String(process.env.EVOLUTION_TLS_INSECURE).toLowerCase() === 'true')
  ) {
    reqOpts.rejectUnauthorized = false
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(reqOpts, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8')
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          text: async () => txt,
        })
      })
    })
    const timer = setTimeout(() => {
      req.destroy(new Error('Timeout ao conectar'))
    }, timeoutMs)
    req.on('error', (e) => {
      clearTimeout(timer)
      reject(e)
    })
    req.on('close', () => clearTimeout(timer))
    if (payload) req.write(payload)
    req.end()
  })
}

function httpPostJsonIPv4(urlStr, headers, bodyUtf8, timeoutMs) {
  return httpRequestIPv4({
    urlStr,
    method: 'POST',
    headers,
    bodyUtf8,
    timeoutMs,
  })
}

/**
 * Evolution API v2 — POST /message/sendText/{instance}
 * @param {{ probeReachability?: boolean }} [options]
 * @returns {{ ok: boolean, error?: string, skipped?: boolean }}
 */
async function sendEvolutionText({ text, toNumber, override = null }, options = {}) {
  const probeReachability = Boolean(options.probeReachability)
  let base = normalizeEvolutionBase(cfgEvolution('EVOLUTION_API_URL', override))
  const instance = cfgEvolution('EVOLUTION_INSTANCIA_ASSINANTES', override)
  const apiKey =
    cfgEvolution('EVOLUTION_APIKEY_ASSINANTES', override) || cfgEvolution('EVOLUTION_API_KEY', override)
  const pathPrefix = (cfgEvolution('EVOLUTION_API_PATH_PREFIX', override) || '').replace(/\/$/, '')

  if (!base || !instance || !apiKey || !toNumber || !text) {
    return { ok: false, skipped: true }
  }
  if (!/^https?:\/\//i.test(base)) {
    return {
      ok: false,
      error: 'EVOLUTION_API_URL deve começar com http:// ou https:// (ex.: http://127.0.0.1:8080).',
    }
  }

  if (probeReachability) {
    const healthUrl = `${base}/`
    try {
      const h = await httpRequestIPv4({
        urlStr: healthUrl,
        method: 'GET',
        headers: { Accept: 'application/json' },
        timeoutMs: 12000,
      })
      if (!h.ok) {
        const bodyH = (await h.text().catch(() => '')) || ''
        return {
          ok: false,
          error:
            `A URL base respondeu HTTP ${h.status} em GET / (esperado 200 da Evolution). ` +
            `Use a raiz da API (ex.: http://127.0.0.1:8080), sem /manager — detalhe: ${bodyH.slice(0, 200)}`,
        }
      }
    } catch (e) {
      let msg
      try {
        msg = explainEvolutionFetchError(e, base, healthUrl)
      } catch (_) {
        msg = `Não foi possível alcançar ${base}. Confirme se a Evolution está ligada e acessível pelo Node nesta máquina.`
      }
      console.error('[Evolution API] GET / (teste de alcance):', msg, e?.cause || e)
      return {
        ok: false,
        error:
          msg +
          ' Se o navegador abre o painel mas o teste falha, a URL do painel (/manager) não é a mesma da API na porta HTTP.',
      }
    }
  }

  const body = JSON.stringify({ number: toNumber, text })
  const headers = {
    'Content-Type': 'application/json',
    apikey: apiKey,
  }

  const encInst = encodeURIComponent(instance)
  const instSegs = encInst === instance ? [encInst] : [encInst, instance]

  const pathCandidates = []
  for (const seg of instSegs) {
    if (pathPrefix) pathCandidates.push(`${pathPrefix}/message/sendText/${seg}`)
    pathCandidates.push(`/message/sendText/${seg}`)
    pathCandidates.push(`/api/message/sendText/${seg}`)
  }
  const uniquePaths = [...new Set(pathCandidates)]

  let lastHttpError = null
  let triedUrl = ''

  for (const pathPart of uniquePaths) {
    const url = `${base}${pathPart}`
    triedUrl = url
    try {
      const res = await httpPostJsonIPv4(url, headers, body, 25000)
      if (res.ok) return { ok: true }

      const errText = (await res.text().catch(() => '')) || ''
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error:
            `HTTP ${res.status}: Evolution rejeitou a API Key ou a instância "${instance}". ` +
            `Use a mesma chave do painel da Evolution e o nome exato da instância (não o ID). ` +
            errText.slice(0, 160),
        }
      }
      lastHttpError = `HTTP ${res.status}: ${errText.slice(0, 200)}`
      if (res.status !== 404) {
        return { ok: false, error: lastHttpError }
      }
    } catch (e) {
      if (String(e?.message || '').includes('Timeout')) {
        lastHttpError = 'Timeout (25s) nesta rota.'
        continue
      }
      let msg
      try {
        msg = explainEvolutionFetchError(e, base, url)
      } catch (_) {
        msg = `Falha ao contactar ${base || 'a Evolution API'}. Verifique a URL e o terminal do servidor (log [Evolution API]).`
      }
      lastHttpError = msg
      console.error('[Evolution API] POST falhou:', msg, e?.cause || e)
      continue
    }
  }

  return {
    ok: false,
    error:
      (lastHttpError?.includes?.('HTTP')
        ? lastHttpError
        : lastHttpError ||
          `Nenhuma rota de envio respondeu com sucesso na URL base (${base}). Última URL tentada: ${triedUrl}.`) +
      ' Confira o nome exato da instância no Manager, prefixo global (EVOLUTION_API_PATH_PREFIX) e API key global ou token da instância. Valores salvos no admin têm prioridade sobre .env.',
  }
}

const DEFAULT_BOAS_VINDAS =
  'Olá {nome}! Bem-vindo(a) ao MEI Controle. A empresa *{empresa}* já pode usar o sistema. Qualquer dúvida, fale conosco por aqui.'

const DEFAULT_PAGAMENTO =
  'Olá {nome}! Confirmamos o pagamento do plano *{plano}* para *{empresa}*. Obrigado por manter sua assinatura no MEI Controle.'

/**
 * Envia WhatsApp ao assinante após pagamento aprovado (Mercado Pago).
 * Usa whatsapp cadastrado no perfil do usuário.
 */
async function notifySubscriberAfterApprovedPayment(userId, planoNome) {
  const user = db.prepare('SELECT id, nome, empresa, whatsapp FROM users WHERE id = ? AND role = ?').get(userId, 'empresa')
  if (!user?.whatsapp) return { skipped: true, reason: 'sem_whatsapp' }

  const toNumber = normalizeWhatsappToNumber(user.whatsapp)
  if (!toNumber) return { skipped: true, reason: 'whatsapp_invalido' }

  const vars = {
    nome: user.nome || 'Cliente',
    empresa: user.empresa || '',
    plano: planoNome || 'Plano',
    data: new Date().toLocaleDateString('pt-BR'),
  }

  const boasRaw = cfg('MSG_WHATSAPP_BOAS_VINDAS')
  let msgBoas = ''
  if (boasRaw === '-') {
    msgBoas = ''
  } else {
    msgBoas = applyTemplate(boasRaw || DEFAULT_BOAS_VINDAS, vars).trim()
  }

  const pagRaw = cfg('MSG_WHATSAPP_PAGAMENTO_CONFIRMADO')
  let msgPag = ''
  if (pagRaw === '-') {
    msgPag = ''
  } else {
    msgPag = applyTemplate(pagRaw || DEFAULT_PAGAMENTO, vars).trim()
  }

  if (!msgBoas && !msgPag) return { skipped: true, reason: 'mensagens_desativadas' }

  const results = []

  if (msgBoas) {
    const r1 = await sendEvolutionText({ text: msgBoas, toNumber }, {})
    results.push({ step: 'boas_vindas', ...r1 })
    if (!r1.ok && !r1.skipped) console.error('[Evolution] boas-vindas:', r1.error)
  }

  if (msgPag && msgPag !== msgBoas) {
    const r2 = await sendEvolutionText({ text: msgPag, toNumber }, {})
    results.push({ step: 'pagamento', ...r2 })
    if (!r2.ok && !r2.skipped) console.error('[Evolution] pagamento:', r2.error)
  }

  return { results }
}

async function sendWhatsappTestMessage(rawPhone, override = null) {
  const toNumber = normalizeWhatsappToNumber(rawPhone)
  if (!toNumber) {
    return { ok: false, error: 'Número inválido. Informe DDD + número (ex.: 11999998888) ou com código 55.' }
  }
  const text =
    `[MEI Controle — teste]\n` +
    `Esta é uma mensagem de teste da instância de notificações aos assinantes.\n` +
    `Data/hora: ${new Date().toLocaleString('pt-BR')}`
  const r = await sendEvolutionText({ text, toNumber, override }, { probeReachability: true })
  if (r.skipped) {
    return {
      ok: false,
      error:
        'Preencha a URL da Evolution, o nome da instância de assinantes e a API Key (da instância ou geral) em Configurações.',
    }
  }
  return r
}

module.exports = {
  notifySubscriberAfterApprovedPayment,
  sendEvolutionText,
  normalizeWhatsappToNumber,
  sendWhatsappTestMessage,
}
