const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM clientes WHERE user_id = ? ORDER BY nome').all(req.user.id)
  res.json(rows)
})

router.post('/', (req, res) => {
  const { nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram } = req.body
  const r = db.prepare(`
    INSERT INTO clientes (user_id, nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, nome || '', email || '', whatsapp || '', telefone || '', documento || '', endereco || '', nome_empresa || '', funcao || '', site || '', instagram || '')
  const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/:id', (req, res) => {
  const { nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram } = req.body
  db.prepare(`
    UPDATE clientes SET nome = COALESCE(?, nome), email = COALESCE(?, email), whatsapp = COALESCE(?, whatsapp), telefone = COALESCE(?, telefone),
    documento = COALESCE(?, documento), endereco = COALESCE(?, endereco), nome_empresa = COALESCE(?, nome_empresa), funcao = COALESCE(?, funcao),
    site = COALESCE(?, site), instagram = COALESCE(?, instagram) WHERE id = ? AND user_id = ?
  `).run(nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clientes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

router.get('/vendas', (req, res) => {
  const rows = db.prepare(`
    SELECT v.*, c.nome as cliente_nome FROM vendas v
    LEFT JOIN clientes c ON v.cliente_id = c.id
    WHERE v.user_id = ? ORDER BY v.data DESC
  `).all(req.user.id)
  res.json(rows)
})

router.post('/vendas', (req, res) => {
  const { cliente_id, valor, data, descricao } = req.body
  const dataStr = data ? data.slice(0, 10) : new Date().toISOString().slice(0, 10)
  const r = db.prepare('INSERT INTO vendas (user_id, cliente_id, valor, data, descricao) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, cliente_id || null, valor, dataStr, descricao || '')
  const row = db.prepare('SELECT * FROM vendas WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

module.exports = router
