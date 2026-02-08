const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

function formatDate(d) {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
}

router.get('/entradas', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, c.nome as cliente_nome FROM entradas e
    LEFT JOIN clientes c ON e.cliente_id = c.id
    WHERE e.user_id = ? ORDER BY e.data DESC
  `).all(req.user.id)
  res.json(rows)
})

router.post('/entradas', (req, res) => {
  const { valor, descricao, data, status, forma_pagamento, cliente_id } = req.body
  const dataStr = formatDate(data || new Date())
  const r = db.prepare(`
    INSERT INTO entradas (user_id, valor, descricao, data, status, forma_pagamento, cliente_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, valor, descricao || '', dataStr, status || 'Recebido', forma_pagamento || '', cliente_id || null)
  const row = db.prepare('SELECT e.*, c.nome as cliente_nome FROM entradas e LEFT JOIN clientes c ON e.cliente_id = c.id WHERE e.id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/entradas/:id', (req, res) => {
  const { valor, descricao, data, status, forma_pagamento, cliente_id } = req.body
  const dataStr = data ? formatDate(data) : null
  db.prepare(`
    UPDATE entradas SET valor = COALESCE(?, valor), descricao = COALESCE(?, descricao), data = COALESCE(?, data),
    status = COALESCE(?, status), forma_pagamento = COALESCE(?, forma_pagamento), cliente_id = ?
    WHERE id = ? AND user_id = ?
  `).run(valor, descricao, dataStr, status, forma_pagamento, cliente_id || null, req.params.id, req.user.id)
  const row = db.prepare('SELECT e.*, c.nome as cliente_nome FROM entradas e LEFT JOIN clientes c ON e.cliente_id = c.id WHERE e.id = ?').get(req.params.id)
  res.json(row || {})
})


router.delete('/entradas/:id', (req, res) => {
  db.prepare('DELETE FROM entradas WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

router.get('/gastos', (req, res) => {
  const rows = db.prepare('SELECT * FROM gastos WHERE user_id = ? ORDER BY data DESC').all(req.user.id)
  res.json(rows)
})

router.post('/gastos', (req, res) => {
  const { valor, descricao, categoria, data } = req.body
  const dataStr = formatDate(data || new Date())
  const r = db.prepare('INSERT INTO gastos (user_id, valor, descricao, categoria, data) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, valor, descricao || '', categoria || '', dataStr)
  const row = db.prepare('SELECT * FROM gastos WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/gastos/:id', (req, res) => {
  const { valor, descricao, categoria, data } = req.body
  const dataStr = data ? formatDate(data) : null
  db.prepare('UPDATE gastos SET valor = COALESCE(?, valor), descricao = COALESCE(?, descricao), categoria = COALESCE(?, categoria), data = COALESCE(?, data) WHERE id = ? AND user_id = ?')
    .run(valor, descricao, categoria, dataStr, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM gastos WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/gastos/:id', (req, res) => {
  db.prepare('DELETE FROM gastos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

router.get('/custos', (req, res) => {
  const rows = db.prepare('SELECT * FROM custos WHERE user_id = ? ORDER BY vencimento DESC').all(req.user.id)
  res.json(rows)
})

router.post('/custos', (req, res) => {
  const { valor, descricao, vencimento } = req.body
  const venc = formatDate(vencimento || new Date())
  const r = db.prepare('INSERT INTO custos (user_id, valor, descricao, vencimento) VALUES (?, ?, ?, ?)')
    .run(req.user.id, valor, descricao || '', venc)
  const row = db.prepare('SELECT * FROM custos WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/custos/:id/pago', (req, res) => {
  db.prepare('UPDATE custos SET pago = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM custos WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/custos/:id', (req, res) => {
  db.prepare('DELETE FROM custos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

router.get('/poupanca', (req, res) => {
  const rows = db.prepare('SELECT * FROM poupanca WHERE user_id = ? ORDER BY data DESC').all(req.user.id)
  res.json(rows)
})

router.post('/poupanca', (req, res) => {
  const { valor, descricao, data, tipo } = req.body
  const dataStr = formatDate(data || new Date())
  const r = db.prepare('INSERT INTO poupanca (user_id, valor, descricao, data, tipo) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, valor, descricao || '', dataStr, tipo || 'Poupança')
  const row = db.prepare('SELECT * FROM poupanca WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.delete('/poupanca/:id', (req, res) => {
  db.prepare('DELETE FROM poupanca WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

module.exports = router
