const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM tarefas WHERE user_id = ? ORDER BY data_limite ASC, id DESC').all(req.user.id)
  res.json(rows)
})

router.post('/', (req, res) => {
  const { titulo, descricao, data_limite, hora, tipo } = req.body
  const dataStr = data_limite ? data_limite.slice(0, 10) : null
  const tituloVal = titulo || descricao || ''
  const r = db.prepare('INSERT INTO tarefas (user_id, titulo, descricao, data_limite, hora, tipo) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, tituloVal, descricao || '', dataStr, hora || null, tipo || 'Trabalho')
  const row = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/:id', (req, res) => {
  const { titulo, descricao, data_limite, hora, tipo, concluida } = req.body
  const dataStr = data_limite ? data_limite.slice(0, 10) : null
  db.prepare('UPDATE tarefas SET titulo = COALESCE(?, titulo), descricao = COALESCE(?, descricao), data_limite = COALESCE(?, data_limite), hora = COALESCE(?, hora), tipo = COALESCE(?, tipo), concluida = COALESCE(?, concluida) WHERE id = ? AND user_id = ?')
    .run(titulo, descricao, dataStr, hora, tipo, concluida, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM tarefas WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM tarefas WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ ok: true })
})

module.exports = router
