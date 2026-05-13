const express = require('express')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { notifySubscriberAfterApprovedPayment } = require('../lib/evolutionSubscribers')
const mail = require('../lib/mail')

const router = express.Router()

function getConfig(chave) {
  const envVal = process.env[chave]
  if (envVal != null && envVal !== '') return envVal
  try {
    const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)
    return row?.valor || ''
  } catch (_) {
    return ''
  }
}

const BASE_URL_DEFAULT = 'http://localhost:5173'

/** URL completa do webhook (HTTPS público). Opcional: se vazio, tenta origin de BASE_URL + /api/assinatura/webhook */
function resolveWebhookUrlForDocs() {
  const explicit = String(getConfig('MERCADOPAGO_WEBHOOK_URL') || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')
  const base = String(getConfig('BASE_URL') || '').trim()
  if (!base || /localhost|127\.0\.0\.1/i.test(base)) return ''
  try {
    const u = new URL(base)
    return `${u.origin}/api/assinatura/webhook`
  } catch (_) {
    return ''
  }
}

function resolveNotificationUrlForPreference() {
  return resolveWebhookUrlForDocs() || undefined
}

/** Resposta da API MP pode usar snake_case ou camelCase. */
function pickPreferenceCheckoutUrl(result, accessToken) {
  if (!result || typeof result !== 'object') return ''
  const prod = result.init_point || result.initPoint || ''
  const sandbox = result.sandbox_init_point || result.sandboxInitPoint || ''
  const isTest = /^TEST-/i.test(String(accessToken || '').trim())
  if (isTest) return sandbox || prod
  return prod || sandbox
}

function urlsPermitemAutoReturn(urls) {
  return urls.every((u) => {
    try {
      const parsed = new URL(u)
      if (parsed.protocol === 'https:') return true
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true
      return false
    } catch (_) {
      return false
    }
  })
}

function mercadoPagoApiErrorMessage(e) {
  if (e == null) return 'Erro ao criar checkout'
  if (typeof e === 'string') return e
  if (typeof e.message === 'string' && e.message.trim()) return e.message.trim()
  if (Array.isArray(e.cause)) {
    const msgs = e.cause.map((c) => (c && (c.description || c.message)) || '').filter(Boolean)
    if (msgs.length) return msgs.join(' ')
  }
  if (Array.isArray(e.errors)) {
    const msgs = e.errors
      .map((x) => (typeof x === 'string' ? x : x?.message || x?.description || ''))
      .filter(Boolean)
    if (msgs.length) return msgs.join(' ')
  }
  if (typeof e.error === 'string' && e.error) return e.error
  try {
    return JSON.stringify(e).slice(0, 500)
  } catch (_) {
    return 'Erro ao criar checkout'
  }
}

/**
 * Ativa assinatura após pagamento aprovado (mesma lógica do POST /confirmar e do webhook).
 * @returns {{ planoNome: string|null, notificacao: object }}
 */
async function applyApprovedSubscription(userId, planoId) {
  let planoNome = null
  let dias = 0
  if (planoId) {
    const p = db.prepare('SELECT nome, dias FROM planos WHERE id = ?').get(planoId)
    if (p) {
      planoNome = p.nome
      dias = p.dias
    }
  }
  if (!planoNome) {
    planoNome = 'Plano Anual'
    dias = 365
  }
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const trialEndsAt = d.toISOString()
  const py = d.getFullYear()
  const pm = d.getMonth()
  const pd = d.getDate()
  const proximoPagamento = `${py}-${String(pm + 1).padStart(2, '0')}-${String(pd).padStart(2, '0')}`

  db.prepare(
    'UPDATE users SET trial_ends_at = ?, proximo_pagamento = ?, plano = ?, plano_id = ? WHERE id = ? AND role = ?'
  ).run(trialEndsAt, proximoPagamento, planoNome, planoId || null, userId, 'empresa')

  let notificacao = { ok: true }
  if (planoNome) {
    try {
      notificacao = await notifySubscriberAfterApprovedPayment(userId, planoNome)
    } catch (e) {
      console.error('[WhatsApp assinantes]', e)
      notificacao = { ok: false, error: e.message }
    }
  }

  const urow = db.prepare('SELECT email, nome, empresa FROM users WHERE id = ?').get(userId)
  if (urow?.email) {
    try {
      await mail.sendSubscriptionRenewedEmail({
        to: urow.email,
        nome: urow.nome,
        empresa: urow.empresa,
        planoNome,
        proximoPagamento,
      })
    } catch (e) {
      console.error('[assinatura] e-mail renovação:', e.message || e)
    }
  }

  return { planoNome, notificacao }
}

/** Mercado Pago → servidor (sem JWT). Notificações de pagamento aprovado. */
router.post('/webhook', async (req, res) => {
  try {
    const token = getConfig('MERCADOPAGO_ACCESS_TOKEN')
    if (!token) {
      console.warn('[MP webhook] MERCADOPAGO_ACCESS_TOKEN não configurado')
      return res.status(200).send('OK')
    }

    let paymentId = null
    const b = req.body
    const q = req.query || {}
    if (b && typeof b === 'object') {
      if (b.type === 'payment' && b.data && (b.data.id != null || b.data.id === 0)) {
        paymentId = String(b.data.id)
      }
      if (!paymentId && b.topic === 'payment' && b.id != null) paymentId = String(b.id)
      if (!paymentId && String(b.action || '').toLowerCase().includes('payment') && b.data?.id != null) {
        paymentId = String(b.data.id)
      }
    }
    if (!paymentId && String(q.topic || '') === 'payment' && q.id != null) paymentId = String(q.id)

    if (!paymentId || paymentId === 'undefined' || paymentId === 'null') {
      return res.status(200).send('OK')
    }

    const client = new MercadoPagoConfig({ accessToken: token })
    const paymentApi = new Payment(client)
    const pay = await paymentApi.get({ id: paymentId })
    const st = String(pay?.status || '').toLowerCase()
    if (st !== 'approved') {
      return res.status(200).send('OK')
    }

    const ext = String(pay?.external_reference || '').trim()
    if (!ext) {
      console.log('[MP webhook] pagamento sem external_reference:', paymentId)
      return res.status(200).send('OK')
    }
    const parts = ext.split(':')
    const userId = parseInt(parts[0], 10)
    const planoId = parts[1] ? parseInt(parts[1], 10) : null
    if (!userId) {
      console.log('[MP webhook] external_reference inválido:', ext)
      return res.status(200).send('OK')
    }

    const { planoNome } = await applyApprovedSubscription(userId, planoId)
    console.log('[MP webhook] assinatura ativada user=%s plano=%s payment=%s', userId, planoNome, paymentId)
  } catch (e) {
    console.error('[MP webhook]', e.message || e)
  }
  return res.status(200).send('OK')
})

router.use(authMiddleware)

router.get('/planos', (req, res) => {
  const rows = db.prepare('SELECT * FROM planos WHERE ativo = 1 ORDER BY preco ASC').all()
  res.json(rows.map(r => ({
    id: r.slug,
    nome: r.nome,
    preco: r.preco,
    periodo: r.periodo,
    dias: r.dias,
    features: r.features ? JSON.parse(r.features) : [],
    destaque: !!r.destaque,
    economia: r.economia,
  })))
})

router.post('/checkout', async (req, res) => {
  try {
    if (req.user.owner_user_id) {
      return res.status(403).json({ error: 'Apenas o administrador da empresa pode assinar um plano.' })
    }
    const MP_ACCESS_TOKEN = getConfig('MERCADOPAGO_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      return res.status(503).json({ error: 'Pagamento temporariamente indisponível. Configure as credenciais do Mercado Pago em Configurações.' })
    }
    let baseUrl = (getConfig('BASE_URL') || process.env.BASE_URL || BASE_URL_DEFAULT).toString().replace(/\/$/, '')
    if (!baseUrl || baseUrl === 'undefined') baseUrl = BASE_URL_DEFAULT
    const { plano } = req.body
    const planoRow = db.prepare('SELECT * FROM planos WHERE slug = ? AND ativo = 1').get(plano || 'anual')
    const config = planoRow || db.prepare('SELECT * FROM planos WHERE ativo = 1 ORDER BY preco DESC LIMIT 1').get()
    if (!config) {
      return res.status(400).json({ error: 'Nenhum plano disponível. Cadastre planos em Admin > Planos.' })
    }
    const user = req.user
    const email = String(user.email || '').trim()
    if (!email) {
      return res.status(400).json({ error: 'Cadastre um e-mail válido no perfil antes de assinar.' })
    }

    const unitPrice = Math.round(Number(config.preco) * 100) / 100
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ error: 'Preço do plano inválido. Ajuste o plano em Admin > Planos.' })
    }

    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN })
    const preference = new Preference(client)

    const back_urls = {
      success: `${baseUrl}/dashboard/assinatura/sucesso`,
      failure: `${baseUrl}/dashboard/assinatura/erro`,
      pending: `${baseUrl}/dashboard/assinatura/pendente`,
    }

    const body = {
      items: [
        {
          id: String(config.id),
          title: `MEI Controle - ${config.nome}`,
          description: `Assinatura ${config.nome} - Acesso completo ao sistema`,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: 'BRL',
        },
      ],
      payer: { email },
      external_reference: `${user.id}:${config.id}`,
      back_urls,
    }

    if (urlsPermitemAutoReturn(Object.values(back_urls))) {
      body.auto_return = 'approved'
    }

    const notif = resolveNotificationUrlForPreference()
    if (notif) body.notification_url = notif

    const result = await preference.create({ body })
    const init_point = pickPreferenceCheckoutUrl(result, MP_ACCESS_TOKEN)
    if (!init_point) {
      console.error(
        '[MP checkout] preferência sem URL:',
        result?.id,
        result ? Object.keys(result).slice(0, 30) : 'sem corpo',
      )
      return res.status(502).json({
        error:
          'O Mercado Pago não retornou o link do checkout. Confira o access token, o plano e a BASE_URL (HTTPS em produção).',
      })
    }
    res.json({ init_point, preference_id: result.id })
  } catch (e) {
    console.error('Erro Mercado Pago:', e)
    res.status(500).json({ error: mercadoPagoApiErrorMessage(e) })
  }
})

async function resolvePaymentApproved(body) {
  const { payment_id, status, collection_status } = body
  const raw = String(status || collection_status || '').toLowerCase()
  if (raw === 'approved') return { approved: true, source: 'query' }

  const pid = payment_id ? String(payment_id).trim() : ''
  const token = getConfig('MERCADOPAGO_ACCESS_TOKEN')
  if (pid && token) {
    try {
      const client = new MercadoPagoConfig({ accessToken: token })
      const paymentApi = new Payment(client)
      const data = await paymentApi.get({ id: pid })
      const st = String(data?.status || '').toLowerCase()
      if (st === 'approved') return { approved: true, source: 'api' }
    } catch (e) {
      console.error('[MP] consulta pagamento:', e.message || e)
    }
  }

  return { approved: false, source: 'none' }
}

router.post('/confirmar', async (req, res) => {
  try {
    const { payment_id, external_reference, status, collection_status } = req.body
    if (!external_reference) return res.status(400).json({ error: 'Referência inválida' })
    const parts = String(external_reference).split(':')
    const userId = parseInt(parts[0], 10)
    const planoId = parts[1] ? parseInt(parts[1], 10) : null
    if (!userId) return res.status(400).json({ error: 'Referência inválida' })

    const { approved } = await resolvePaymentApproved(req.body)

    if (!approved) {
      return res.json({
        ok: false,
        message:
          'Pagamento ainda não consta como aprovado. Se você já concluiu o pagamento, aguarde alguns instantes e recarregue a página ou verifique no Mercado Pago.',
      })
    }

    const { planoNome, notificacao } = await applyApprovedSubscription(userId, planoId)
    res.json({ ok: true, plano: planoNome, notificacao })
  } catch (e) {
    console.error('Erro ao confirmar:', e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = router