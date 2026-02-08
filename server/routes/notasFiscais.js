const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

function nextNumero(userId) {
  const year = new Date().getFullYear()
  const row = db.prepare(
    `SELECT COUNT(*) as c FROM notas_fiscais WHERE user_id = ? AND numero LIKE ?`
  ).get(userId, `NFS-${year}-%`)
  const n = (row?.c || 0) + 1
  return `NFS-${year}-${String(n).padStart(3, '0')}`
}

function list(req, res) {
  const rows = db.prepare(`
    SELECT n.*, c.nome as cliente_nome_join
    FROM notas_fiscais n
    LEFT JOIN clientes c ON n.cliente_id = c.id
    WHERE n.user_id = ?
    ORDER BY n.data DESC, n.id DESC
  `).all(req.user.id)
  const list = rows.map(r => ({
    ...r,
    cliente_nome: r.cliente_nome || r.cliente_nome_join || '-',
  }))
  res.json(list)
}
router.get('/', list)
router.get('', list)

router.post('/', (req, res) => {
  const { data, cliente_id, cliente_nome, descricao, valor, status } = req.body
  const numero = nextNumero(req.user.id)
  const dataStr = (data || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  const statusVal = status || 'Pendente'
  let nomeCliente = cliente_nome || ''
  if (cliente_id) {
    const c = db.prepare('SELECT nome FROM clientes WHERE id = ? AND user_id = ?').get(cliente_id, req.user.id)
    if (c) nomeCliente = c.nome
  }
  const r = db.prepare(`
    INSERT INTO notas_fiscais (user_id, numero, data, cliente_id, cliente_nome, descricao, status, valor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, numero, dataStr, cliente_id || null, nomeCliente, descricao || '', statusVal, parseFloat(valor) || 0)
  const row = db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.patch('/:id/status', (req, res) => {
  const { status } = req.body
  if (!['Pendente', 'Emitida', 'Cancelada'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' })
  }
  db.prepare('UPDATE notas_fiscais SET status = ? WHERE id = ? AND user_id = ?')
    .run(status, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  const r = db.prepare('DELETE FROM notas_fiscais WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (r.changes === 0) return res.status(404).json({ error: 'Nota não encontrada' })
  res.json({ ok: true })
})

module.exports = router
