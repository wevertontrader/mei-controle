const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router({ mergeParams: true })
router.use(authMiddleware)

const VALOR_DAS_PADRAO = 66.00

function list(req, res) {
  const rows = db.prepare(`
    SELECT * FROM das_mensal WHERE user_id = ? ORDER BY referencia DESC
  `).all(req.user.empresaUserId)
  res.json(rows)
}

router.get('/', list)
router.get('', list)

router.post('/', (req, res) => {
  const { referencia, valor } = req.body
  const ref = (referencia || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(ref)) {
    return res.status(400).json({ error: 'Referência inválida (use YYYY-MM)' })
  }
  const vencimento = `${ref}-20`
  const existe = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(req.user.empresaUserId, ref)
  if (existe) return res.status(400).json({ error: 'Já existe DAS para esta referência' })
  const val = parseFloat(valor) || VALOR_DAS_PADRAO
  const r = db.prepare(`
    INSERT INTO das_mensal (user_id, referencia, vencimento, valor) VALUES (?, ?, ?, ?)
  `).run(req.user.empresaUserId, ref, vencimento, val)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/:id/pago', (req, res) => {
  const dataPagamento = new Date().toISOString().slice(0, 10)
  db.prepare('UPDATE das_mensal SET pago = 1, data_pagamento = ? WHERE id = ? AND user_id = ?')
    .run(dataPagamento, req.params.id, req.user.empresaUserId)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  const r = db.prepare('DELETE FROM das_mensal WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
  if (r.changes === 0) return res.status(404).json({ error: 'DAS não encontrado' })
  res.json({ ok: true })
})

module.exports = router
