require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./db')
const { authMiddleware } = require('./middleware/auth')

const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const financeiroRoutes = require('./routes/financeiro')
const clientesRoutes = require('./routes/clientes')
const produtosRoutes = require('./routes/produtos')
const estoqueRoutes = require('./routes/estoque')
const tarefasRoutes = require('./routes/tarefas')
const dashboardRoutes = require('./routes/dashboard')
const assinaturaRoutes = require('./routes/assinatura')

const app = express()
let PORT = parseInt(process.env.PORT, 10) || 3001
const isProduction = process.env.NODE_ENV === 'production'

const corsOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 'http://127.0.0.1:5176']
if (process.env.CORS_ORIGIN) corsOrigins.push(process.env.CORS_ORIGIN)
app.use(cors({ origin: corsOrigins, credentials: true }))
app.use(express.json())

// Rotas de Notas Fiscais e DAS diretamente em /api/dashboard/* (evita 404 do router)
app.get('/api/dashboard/notas-fiscais', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT n.*, c.nome as cliente_nome_join FROM notas_fiscais n
      LEFT JOIN clientes c ON n.cliente_id = c.id
      WHERE n.user_id = ? ORDER BY n.data DESC, n.id DESC
    `).all(req.user.id)
    res.json(rows.map(r => ({ ...r, cliente_nome: r.cliente_nome || r.cliente_nome_join || '-' })))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})
app.post('/api/dashboard/notas-fiscais', authMiddleware, (req, res) => {
  try {
    const { data, cliente_id, cliente_nome, descricao, valor, status } = req.body
    const year = new Date().getFullYear()
    const count = db.prepare('SELECT COUNT(*) as c FROM notas_fiscais WHERE user_id = ? AND numero LIKE ?').get(req.user.id, `NFS-${year}-%`)?.c || 0
    const numero = `NFS-${year}-${String(count + 1).padStart(3, '0')}`
    const dataStr = (data || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
    let nomeCliente = cliente_nome || ''
    if (cliente_id) {
      const c = db.prepare('SELECT nome FROM clientes WHERE id = ? AND user_id = ?').get(cliente_id, req.user.id)
      if (c) nomeCliente = c.nome
    }
    const r = db.prepare(`
      INSERT INTO notas_fiscais (user_id, numero, data, cliente_id, cliente_nome, descricao, status, valor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, numero, dataStr, cliente_id || null, nomeCliente, descricao || '', status || 'Pendente', parseFloat(valor) || 0)
    res.status(201).json(db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(r.lastInsertRowid))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})
app.patch('/api/dashboard/notas-fiscais/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body
  if (!['Pendente', 'Emitida', 'Cancelada'].includes(status)) return res.status(400).json({ error: 'Status inválido' })
  db.prepare('UPDATE notas_fiscais SET status = ? WHERE id = ? AND user_id = ?').run(status, req.params.id, req.user.id)
  res.json(db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(req.params.id) || {})
})
app.delete('/api/dashboard/notas-fiscais/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM notas_fiscais WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (r.changes === 0) return res.status(404).json({ error: 'Nota não encontrada' })
  res.json({ ok: true })
})

app.get('/api/dashboard/das-mensal', authMiddleware, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM das_mensal WHERE user_id = ? ORDER BY referencia DESC').all(req.user.id)
    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})
app.post('/api/dashboard/das-mensal', authMiddleware, (req, res) => {
  try {
    const { referencia, valor } = req.body
    const ref = (referencia || '').slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(ref)) return res.status(400).json({ error: 'Referência inválida (use YYYY-MM)' })
    const existe = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(req.user.id, ref)
    if (existe) return res.status(400).json({ error: 'Já existe DAS para esta referência' })
    const vencimento = `${ref}-20`
    const val = parseFloat(valor) || 66
    const r = db.prepare('INSERT INTO das_mensal (user_id, referencia, vencimento, valor) VALUES (?, ?, ?, ?)').run(req.user.id, ref, vencimento, val)
    res.status(201).json(db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(r.lastInsertRowid))
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
})
app.put('/api/dashboard/das-mensal/:id/pago', authMiddleware, (req, res) => {
  const dataPagamento = new Date().toISOString().slice(0, 10)
  db.prepare('UPDATE das_mensal SET pago = 1, data_pagamento = ? WHERE id = ? AND user_id = ?').run(dataPagamento, req.params.id, req.user.id)
  res.json(db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(req.params.id) || {})
})
app.delete('/api/dashboard/das-mensal/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM das_mensal WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (r.changes === 0) return res.status(404).json({ error: 'DAS não encontrado' })
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/financeiro', financeiroRoutes)
app.use('/api/clientes', clientesRoutes)
app.use('/api/produtos', produtosRoutes)
app.use('/api/estoque', estoqueRoutes)
app.use('/api/tarefas', tarefasRoutes)
app.use('/api/assinatura', assinaturaRoutes)

// Em produção: servir o frontend (React build) e fallback SPA
if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist')
  const fs = require('fs')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    app.use((req, res) => res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` }))
  }
} else {
  app.use((req, res) => res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` }))
}

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
    console.log(`Banco de dados: ${path.join(__dirname, 'database', 'meipro.sqlite')}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 3001) {
      console.log('Porta 3001 em uso. Tentando porta 3002...')
      startServer(3002)
    } else {
      throw err
    }
  })
}
startServer(PORT)
