const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { requireSuperAdmin } = require('../middleware/adminAuth')

const router = express.Router()
router.use(authMiddleware)
router.use(requireSuperAdmin)

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

router.get('/empresas', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.nome, u.email, u.empresa, u.trial_ends_at, u.created_at,
      (SELECT COUNT(*) FROM entradas WHERE user_id = u.id) as qtd_entradas,
      (SELECT COUNT(*) FROM gastos WHERE user_id = u.id) as qtd_gastos,
      (SELECT COUNT(*) FROM clientes WHERE user_id = u.id) as qtd_clientes,
      (SELECT COUNT(*) FROM vendas WHERE user_id = u.id) as qtd_vendas
    FROM users u
    WHERE u.role = 'empresa'
    ORDER BY u.created_at DESC
  `).all()
  res.json(rows)
})

router.get('/empresas/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, nome, email, empresa, trial_ends_at, created_at FROM users WHERE id = ? AND role = 'empresa'
  `).get(req.params.id)
  if (!user) return res.status(404).json({ error: 'Empresa não encontrada' })
  const stats = {
    entradas: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ?').get(req.params.id)?.total || 0,
    gastos: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM gastos WHERE user_id = ?').get(req.params.id)?.total || 0,
    vendas: db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM vendas WHERE user_id = ?').get(req.params.id)?.total || 0,
    clientes: db.prepare('SELECT COUNT(*) as total FROM clientes WHERE user_id = ?').get(req.params.id)?.total || 0,
    produtos: db.prepare('SELECT COUNT(*) as total FROM produtos WHERE user_id = ?').get(req.params.id)?.total || 0,
  }
  res.json({ ...user, stats })
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
  const body = req.body || {}
  const keys = ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'BASE_URL', 'EVOLUTION_API_URL', 'EVOLUTION_API_KEY']
  keys.forEach(k => {
    if (k in body) {
      db.prepare(`
        INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, datetime('now'))
        ON CONFLICT(chave) DO UPDATE SET valor = ?, updated_at = datetime('now')
      `).run(k, body[k] || '', body[k] || '')
    }
  })
  const rows = db.prepare('SELECT chave, valor FROM configuracoes').all()
  const obj = {}
  rows.forEach(r => { obj[r.chave] = r.valor || '' })
  res.json(obj)
})

module.exports = router
