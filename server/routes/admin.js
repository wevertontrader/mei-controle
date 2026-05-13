const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireSuperAdmin } = require('../middleware/adminAuth')
const { uploadLogoMiddleware, unlinkStoredLogo } = require('../lib/logoStorage')
const { sendWhatsappTestMessage } = require('../lib/evolutionSubscribers')

const router = express.Router()
router.use(authMiddleware)
router.use(requireSuperAdmin)

function getEmpresaAdmin(id) {
  const user = db.prepare(`
    SELECT u.id, u.nome, u.email, u.empresa, u.trial_ends_at, u.created_at,
      u.cpf, u.whatsapp, u.cnpj, u.logotipo, u.plano, u.plano_id, u.proximo_pagamento,
      p.nome AS plano_catalogo_nome, p.slug AS plano_catalogo_slug
    FROM users u
    LEFT JOIN planos p ON p.id = u.plano_id
    WHERE u.id = ? AND u.role = 'empresa'
  `).get(id)
  if (!user) return null
  const stats = {
    entradas: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ?').get(id)?.total || 0,
    gastos: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM gastos WHERE user_id = ?').get(id)?.total || 0,
    vendas: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM vendas WHERE user_id = ?').get(id)?.total || 0,
    clientes: db.prepare('SELECT COUNT(*) as total FROM clientes WHERE user_id = ?').get(id)?.total || 0,
    produtos: db.prepare('SELECT COUNT(*) as total FROM produtos WHERE user_id = ?').get(id)?.total || 0,
  }
  return { ...user, stats }
}

router.get('/stats', (req, res) => {
  const totalUsuarios = db.prepare('SELECT COUNT(*) as total FROM users WHERE role = ?').get('empresa')?.total || 0
  const totalEntradas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas').get()?.total || 0
  const totalGastos = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM gastos').get()?.total || 0
  const totalVendas = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM vendas').get()?.total || 0
  const totalClientes = db.prepare('SELECT COUNT(*) as total FROM clientes').get()?.total || 0
  const totalProdutos = db.prepare('SELECT COUNT(*) as total FROM produtos').get()?.total || 0
  res.json({
    totalUsuarios,
    totalEntradas,
    totalGastos,
    totalVendas,
    totalClientes,
    totalProdutos,
  })
})

// Planos e Configurações (antes de rotas com :id)
router.get('/planos', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM planos ORDER BY preco ASC').all()
    res.json(rows.map(r => ({ ...r, features: r.features ? JSON.parse(r.features) : [] })))
  } catch (e) {
    console.error('Erro ao listar planos:', e)
    res.status(500).json({ error: e.message })
  }
})

router.get('/tutoriais', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tutoriais ORDER BY ordem ASC, id ASC').all()
    res.json(rows)
  } catch (e) {
    console.error('Erro ao listar tutoriais (admin):', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/tutoriais', (req, res) => {
  try {
    const { titulo, descricao, url_video, icon, ordem, ativo } = req.body || {}
    const t = String(titulo || '').trim()
    if (!t) return res.status(400).json({ error: 'Título é obrigatório' })
    const ic = String(icon || 'book-open').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'book-open'
    const ord = parseInt(ordem, 10)
    const o = Number.isFinite(ord) ? ord : 0
    const ativoVal = ativo === false || ativo === 0 ? 0 : 1
    const id = db
      .prepare(
        `INSERT INTO tutoriais (titulo, descricao, url_video, icon, ordem, ativo)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        t,
        String(descricao || '').trim(),
        String(url_video || '').trim() || null,
        ic,
        o,
        ativoVal,
      ).lastInsertRowid
    const row = db.prepare('SELECT * FROM tutoriais WHERE id = ?').get(id)
    res.status(201).json(row)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/tutoriais/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const current = db.prepare('SELECT * FROM tutoriais WHERE id = ?').get(id)
    if (!current) return res.status(404).json({ error: 'Tutorial não encontrado' })
    const { titulo, descricao, url_video, icon, ordem, ativo } = req.body || {}
    const t = titulo !== undefined ? String(titulo).trim() : current.titulo
    if (!t) return res.status(400).json({ error: 'Título é obrigatório' })
    let ic = current.icon || 'book-open'
    if (icon !== undefined) {
      ic = String(icon || 'book-open').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'book-open'
    }
    const desc = descricao !== undefined ? String(descricao).trim() : (current.descricao || '')
    const url =
      url_video !== undefined
        ? (String(url_video).trim() || null)
        : current.url_video
    const ordRaw = ordem !== undefined ? parseInt(ordem, 10) : current.ordem
    const o = Number.isFinite(ordRaw) ? ordRaw : 0
    const a = ativo != null ? (ativo ? 1 : 0) : current.ativo
    db.prepare(
      `UPDATE tutoriais SET titulo = ?, descricao = ?, url_video = ?, icon = ?, ordem = ?, ativo = ? WHERE id = ?`,
    ).run(t, desc, url, ic, o, a, id)
    res.json(db.prepare('SELECT * FROM tutoriais WHERE id = ?').get(id))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.delete('/tutoriais/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const r = db.prepare('DELETE FROM tutoriais WHERE id = ?').run(id)
  if (r.changes === 0) return res.status(404).json({ error: 'Tutorial não encontrado' })
  res.json({ ok: true })
})

router.get('/configuracoes', (req, res) => {
  try {
    const rows = db.prepare('SELECT chave, valor FROM configuracoes').all()
    const obj = {}
    rows.forEach(r => { obj[r.chave] = r.valor || '' })
    res.json(obj)
  } catch (e) {
    console.error('Erro ao carregar configurações:', e)
    res.status(500).json({ error: e.message })
  }
})

router.post('/whatsapp-test-assinantes', async (req, res) => {
  try {
    const telefone = String(req.body?.telefone || req.body?.numero || '').trim()
    if (!telefone) return res.status(400).json({ error: 'Informe o número que receberá a mensagem de teste.' })
    const override = {}
    const url = String(req.body?.EVOLUTION_API_URL ?? '').trim()
    const inst = String(req.body?.EVOLUTION_INSTANCIA_ASSINANTES ?? '').trim()
    const keyInst = String(req.body?.EVOLUTION_APIKEY_ASSINANTES ?? '').trim()
    const keyGeral = String(req.body?.EVOLUTION_API_KEY ?? '').trim()
    const pathPfx = String(req.body?.EVOLUTION_API_PATH_PREFIX ?? '').trim()
    if (url) override.EVOLUTION_API_URL = url
    if (inst) override.EVOLUTION_INSTANCIA_ASSINANTES = inst
    if (keyInst) override.EVOLUTION_APIKEY_ASSINANTES = keyInst
    if (keyGeral) override.EVOLUTION_API_KEY = keyGeral
    if (pathPfx) override.EVOLUTION_API_PATH_PREFIX = pathPfx
    const r = await sendWhatsappTestMessage(telefone, Object.keys(override).length ? override : null)
    if (!r.ok) {
      const clientErr = r.skipped || /inválido|Preencha a URL/i.test(r.error || '')
      return res.status(clientErr ? 400 : 502).json({ error: r.error || 'Não foi possível enviar o teste.' })
    }
    res.json({ ok: true, message: 'Mensagem de teste enviada. Verifique o WhatsApp do número informado.' })
  } catch (e) {
    console.error('[admin whatsapp-test]', e)
    let msg = e?.message || 'Erro interno ao testar WhatsApp.'
    if (/^fetch failed$/i.test(msg) || /^typeerror:\s*fetch failed$/i.test(msg)) {
      msg =
        'O Node não conseguiu abrir conexão HTTP com a Evolution API. Teste: (1) URL com http://127.0.0.1:PORTA em vez de localhost; ' +
        '(2) Evolution rodando e porta correta; (3) firewall. Veja o stack no terminal do servidor.'
    }
    res.status(500).json({ error: msg })
  }
})

router.get('/empresas', (req, res) => {
  const qRaw = String(req.query.q || req.query.busca || '').trim()
  const qLower = qRaw.toLowerCase()
  let page = parseInt(req.query.page, 10) || 1
  let limit = parseInt(req.query.limit, 10) || 12
  if (page < 1) page = 1
  if (limit < 1) limit = 12
  if (limit > 50) limit = 50
  const offset = (page - 1) * limit

  const pattern = qLower ? `%${qLower}%` : null
  const searchSql = pattern
    ? ` AND (
        LOWER(COALESCE(u.nome,'')) LIKE ? OR
        LOWER(COALESCE(u.email,'')) LIKE ? OR
        LOWER(COALESCE(u.empresa,'')) LIKE ?
      )`
    : ''

  const countSql = `
    SELECT COUNT(*) as total FROM users u
    WHERE u.role = 'empresa'${searchSql}
  `
  const dataSql = `
    SELECT u.id, u.nome, u.email, u.empresa, u.trial_ends_at, u.created_at,
      u.plano,
      p.nome AS plano_catalogo_nome,
      (SELECT COUNT(*) FROM entradas WHERE user_id = u.id) as qtd_entradas,
      (SELECT COUNT(*) FROM gastos WHERE user_id = u.id) as qtd_gastos,
      (SELECT COUNT(*) FROM clientes WHERE user_id = u.id) as qtd_clientes,
      (SELECT COUNT(*) FROM vendas WHERE user_id = u.id) as qtd_vendas
    FROM users u
    LEFT JOIN planos p ON p.id = u.plano_id
    WHERE u.role = 'empresa'${searchSql}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `

  const countArgs = pattern ? [pattern, pattern, pattern] : []
  const total = db.prepare(countSql).get(...countArgs)?.total || 0
  const dataArgs = pattern ? [pattern, pattern, pattern, limit, offset] : [limit, offset]
  const rows = db.prepare(dataSql).all(...dataArgs)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  res.json({
    items: rows,
    total,
    page,
    limit,
    totalPages,
  })
})

router.get('/empresas/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const data = getEmpresaAdmin(id)
  if (!data) return res.status(404).json({ error: 'Empresa não encontrada' })
  res.json(data)
})

router.post('/empresas/:id/logotipo', (req, res, next) => {
  const id = parseInt(req.params.id, 10)
  if (!id) return res.status(400).json({ error: 'ID inválido' })
  const empresa = db.prepare(`SELECT id FROM users WHERE id = ? AND role = 'empresa'`).get(id)
  if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' })
  req.logoUserId = id
  next()
}, uploadLogoMiddleware, (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie a imagem no campo "logo".' })
    const id = parseInt(req.params.id, 10)
    const row = db.prepare('SELECT logotipo FROM users WHERE id = ?').get(id)
    if (row?.logotipo) unlinkStoredLogo(row.logotipo)
    const publicPath = `/uploads/logos/${req.file.filename}`
    db.prepare(`UPDATE users SET logotipo = ? WHERE id = ? AND role = 'empresa'`).run(publicPath, id)
    res.json(getEmpresaAdmin(id))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})

router.put('/empresas/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const row = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'empresa'`).get(id)
    if (!row) return res.status(404).json({ error: 'Empresa não encontrada' })

    const {
      nome, email, senha, empresa, trial_ends_at, proximo_pagamento, plano_id,
      cpf, whatsapp, cnpj, logotipo,
    } = req.body || {}

    if (email !== undefined && String(email).trim() !== row.email) {
      const ex = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?').get(String(email).trim(), id)
      if (ex) return res.status(400).json({ error: 'Este e-mail já está em uso' })
    }

    if (senha !== undefined && senha !== null && String(senha).length > 0) {
      if (String(senha).length < 6) return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' })
    }

    let planoNome = row.plano
    let planoIdVal = row.plano_id
    if ('plano_id' in (req.body || {})) {
      const raw = req.body.plano_id
      if (raw === null || raw === '' || raw === undefined || raw === 'none') {
        planoIdVal = null
        planoNome = null
      } else {
        const pid = parseInt(raw, 10)
        if (Number.isNaN(pid)) return res.status(400).json({ error: 'Plano inválido' })
        const p = db.prepare('SELECT id, nome FROM planos WHERE id = ?').get(pid)
        if (!p) return res.status(400).json({ error: 'Plano não encontrado' })
        planoIdVal = p.id
        planoNome = p.nome
      }
    }

    let proxPag = row.proximo_pagamento
    if ('proximo_pagamento' in (req.body || {})) {
      const v = req.body.proximo_pagamento
      if (v === null || v === '') proxPag = null
      else {
        const s = String(v).slice(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return res.status(400).json({ error: 'Data do próximo pagamento inválida' })
        proxPag = s
      }
    }

    const updates = []
    const values = []
    if (nome !== undefined) { updates.push('nome = ?'); values.push(String(nome).trim() || row.nome) }
    if (empresa !== undefined) { updates.push('empresa = ?'); values.push(String(empresa).trim() || row.empresa) }
    if (email !== undefined) { updates.push('email = ?'); values.push(String(email).trim()) }
    if (trial_ends_at !== undefined) {
      const t = new Date(trial_ends_at)
      if (Number.isNaN(t.getTime())) return res.status(400).json({ error: 'Data de término do acesso (trial) inválida' })
      updates.push('trial_ends_at = ?')
      values.push(t.toISOString())
    }
    if ('plano_id' in (req.body || {})) {
      updates.push('plano_id = ?')
      values.push(planoIdVal)
      updates.push('plano = ?')
      values.push(planoNome)
    }
    if ('proximo_pagamento' in (req.body || {})) {
      updates.push('proximo_pagamento = ?')
      values.push(proxPag)
    }
    if (cpf !== undefined) { updates.push('cpf = ?'); values.push(cpf || '') }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp || '') }
    if (cnpj !== undefined) { updates.push('cnpj = ?'); values.push(cnpj || '') }
    if (logotipo !== undefined) {
      const newVal = logotipo == null ? '' : String(logotipo).trim()
      if (row.logotipo && row.logotipo !== newVal) {
        unlinkStoredLogo(row.logotipo)
      }
      updates.push('logotipo = ?')
      values.push(newVal)
    }

    if (senha !== undefined && senha !== null && String(senha).length > 0) {
      updates.push('senha = ?')
      values.push(await bcrypt.hash(String(senha), 10))
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' })

    values.push(id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role = 'empresa'`).run(...values)

    const data = getEmpresaAdmin(id)
    res.json(data)
  } catch (e) {
    console.error(e)
    if (e.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Este e-mail já está em uso' })
    }
    res.status(500).json({ error: e.message })
  }
})

router.put('/empresas/:id/trial', (req, res) => {
  const { dias } = req.body
  const d = new Date()
  d.setDate(d.getDate() + (dias || 3))
  const trialEndsAt = d.toISOString()
  db.prepare('UPDATE users SET trial_ends_at = ? WHERE id = ? AND role = ?').run(trialEndsAt, req.params.id, 'empresa')
  const user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at FROM users WHERE id = ?').get(req.params.id)
  res.json(user || {})
})

router.post('/planos', (req, res) => {
  const { nome, slug, preco, dias, periodo, features, destaque, economia } = req.body
  if (!nome || !slug || preco == null || !dias || !periodo) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, slug, preco, dias, periodo' })
  }
  const id = db.prepare(`
    INSERT INTO planos (nome, slug, preco, dias, periodo, features, destaque, economia)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nome, slug, preco, dias, periodo, JSON.stringify(features || []), destaque ? 1 : 0, economia || null).lastInsertRowid
  const row = db.prepare('SELECT * FROM planos WHERE id = ?').get(id)
  res.status(201).json({ ...row, features: row.features ? JSON.parse(row.features) : [] })
})

router.put('/planos/:id', (req, res) => {
  const { nome, slug, preco, dias, periodo, features, destaque, economia, ativo } = req.body
  const id = parseInt(req.params.id, 10)
  const current = db.prepare('SELECT * FROM planos WHERE id = ?').get(id)
  if (!current) return res.status(404).json({ error: 'Plano não encontrado' })
  db.prepare(`
    UPDATE planos SET
      nome = ?, slug = ?, preco = ?, dias = ?, periodo = ?,
      features = ?, destaque = ?, economia = ?, ativo = ?
    WHERE id = ?
  `).run(
    nome ?? current.nome,
    slug ?? current.slug,
    preco ?? current.preco,
    dias ?? current.dias,
    periodo ?? current.periodo,
    features != null ? JSON.stringify(features) : current.features,
    destaque ? 1 : 0,
    economia ?? current.economia,
    ativo != null ? (ativo ? 1 : 0) : current.ativo,
    id
  )
  const row = db.prepare('SELECT * FROM planos WHERE id = ?').get(id)
  res.json({ ...row, features: row.features ? JSON.parse(row.features) : [] })
})

router.delete('/planos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const r = db.prepare('DELETE FROM planos WHERE id = ?').run(id)
  if (r.changes === 0) return res.status(404).json({ error: 'Plano não encontrado' })
  res.json({ ok: true })
})

router.put('/configuracoes', (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}
    const allowed = new Set([
      'CONTACT_EMAIL', 'CONTACT_PHONE', 'CONTACT_WHATSAPP',
      'MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'MERCADOPAGO_WEBHOOK_URL', 'BASE_URL',
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_FROM_NAME',
      'EVOLUTION_API_URL', 'EVOLUTION_API_KEY',
      'EVOLUTION_INSTANCIA_ASSINANTES', 'EVOLUTION_APIKEY_ASSINANTES',
      'EVOLUTION_API_PATH_PREFIX',
      'MSG_WHATSAPP_BOAS_VINDAS', 'MSG_WHATSAPP_PAGAMENTO_CONFIRMADO',
    ])
    const upsert = db.prepare(`
      INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(chave) DO UPDATE SET valor = ?, updated_at = datetime('now')
    `)

    for (const [k, rawVal] of Object.entries(body)) {
      if (!allowed.has(k)) continue
      let val = rawVal != null ? String(rawVal) : ''
      if (k === 'SMTP_PASS' && !val.trim()) {
        const cur = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(k)
        if (cur?.valor) continue
      }
      upsert.run(k, val, val)
    }

    const rows = db.prepare('SELECT chave, valor FROM configuracoes').all()
    const obj = {}
    rows.forEach((r) => {
      obj[r.chave] = r.valor || ''
    })
    res.json(obj)
  } catch (e) {
    console.error('[admin configuracoes]', e)
    res.status(500).json({ error: e.message || 'Erro ao salvar configurações' })
  }
})

module.exports = router
