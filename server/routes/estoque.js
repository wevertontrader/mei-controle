const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

function formatDate(d) {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10)
}

router.get('/movimentacoes', (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.nome as produto_nome FROM estoque_movimentacoes m
    JOIN produtos p ON m.produto_id = p.id
    WHERE m.user_id = ? ORDER BY m.data DESC
  `).all(req.user.empresaUserId)
  res.json(rows)
})

router.post('/movimentacoes', (req, res) => {
  const { produto_id, quantidade, tipo, descricao, data } = req.body
  const dataStr = formatDate(data || new Date())
  const r = db.prepare('INSERT INTO estoque_movimentacoes (user_id, produto_id, quantidade, tipo, descricao, data) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.empresaUserId, produto_id, quantidade, tipo || 'entrada', descricao || '', dataStr)

  const qtd = Number(quantidade)
  const produto = db.prepare('SELECT estoque_atual FROM produtos WHERE id = ? AND user_id = ?').get(produto_id, req.user.empresaUserId)
  if (produto) {
    const novoEstoque = (tipo === 'entrada') ? produto.estoque_atual + qtd : Math.max(0, produto.estoque_atual - qtd)
    db.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ? AND user_id = ?').run(novoEstoque, produto_id, req.user.empresaUserId)
  }

  const row = db.prepare('SELECT m.*, p.nome as produto_nome FROM estoque_movimentacoes m JOIN produtos p ON m.produto_id = p.id WHERE m.id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

module.exports = router
