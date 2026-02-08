const express = require('express')
const { MercadoPagoConfig, Preference } = require('mercadopago')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

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

    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN })
    const preference = new Preference(client)

    const body = {
      items: [
        {
          id: String(config.id),
          title: `MEI Controle - ${config.nome}`,
          description: `Assinatura ${config.nome} - Acesso completo ao sistema`,
          quantity: 1,
          unit_price: config.preco,
          currency_id: 'BRL',
        },
      ],
      payer: { email: user.email },
      external_reference: `${user.id}:${config.id}`,
      back_urls: {
        success: `${baseUrl}/dashboard/assinatura/sucesso`,
        failure: `${baseUrl}/dashboard/assinatura/erro`,
        pending: `${baseUrl}/dashboard/assinatura/pendente`,
      },
      auto_return: 'approved',
    }

    const result = await preference.create({ body })
    res.json({ init_point: result.init_point || result.sandbox_init_point, preference_id: result.id })
  } catch (e) {
    console.error('Erro Mercado Pago:', e)
    res.status(500).json({ error: e.message || 'Erro ao criar checkout' })
  }
})

router.post('/confirmar', (req, res) => {
  try {
    const { payment_id, external_reference, status } = req.body
    if (!external_reference) return res.status(400).json({ error: 'Referência inválida' })
    const parts = String(external_reference).split(':')
    const userId = parseInt(parts[0], 10)
    const planoId = parts[1] ? parseInt(parts[1], 10) : null
    if (!userId) return res.status(400).json({ error: 'Referência inválida' })

    let planoNome = null
    let dias = 0
    if (status === 'approved' && planoId) {
      const p = db.prepare('SELECT nome, dias FROM planos WHERE id = ?').get(planoId)
      if (p) {
        planoNome = p.nome
        dias = p.dias
      }
    }
    if (status === 'approved' && !planoNome) {
      planoNome = 'Plano Anual'
      dias = 365
    }
    const d = new Date()
    d.setDate(d.getDate() + dias)
    const trialEndsAt = d.toISOString()

    db.prepare('UPDATE users SET trial_ends_at = ?, plano = ? WHERE id = ? AND role = ?').run(
      trialEndsAt,
      planoNome,
      userId,
      'empresa'
    )
    res.json({ ok: true })
  } catch (e) {
    console.error('Erro ao confirmar:', e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
