const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM produtos WHERE user_id = ? ORDER BY nome').all(req.user.empresaUserId)
  res.json(rows)
})

router.post('/', (req, res) => {
  const { nome, codigo, preco_custo, preco, estoque_atual, unidade } = req.body
  const r = db.prepare('INSERT INTO produtos (user_id, nome, codigo, preco_custo, preco, estoque_atual, unidade) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.empresaUserId, nome || '', codigo || '', preco_custo || 0, preco || 0, estoque_atual || 0, unidade || 'UN')
  const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/:id', (req, res) => {
  const { nome, codigo, preco_custo, preco, estoque_atual, unidade } = req.body
  db.prepare('UPDATE produtos SET nome = COALESCE(?, nome), codigo = COALESCE(?, codigo), preco_custo = COALESCE(?, preco_custo), preco = COALESCE(?, preco), estoque_atual = COALESCE(?, estoque_atual), unidade = COALESCE(?, unidade) WHERE id = ? AND user_id = ?')
    .run(nome, codigo, preco_custo, preco, estoque_atual, unidade, req.params.id, req.user.empresaUserId)
  const row = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM produtos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
  res.json({ ok: true })
})

module.exports = router
