const path = require('path')
const http = require('http')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
require('dotenv').config({ path: path.join(__dirname, '.env') })

async function main() {
  const db = require('./db')
  await db.init()

  const express = require('express')
  const cors = require('cors')
  const fs = require('fs')
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
  const empresaUsuariosRoutes = require('./routes/empresaUsuarios')

  const app = express()
  const isProduction = process.env.NODE_ENV === 'production'

  const corsOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
  ]
  if (process.env.CORS_ORIGIN) {
    String(process.env.CORS_ORIGIN)
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((o) => corsOrigins.push(o))
  }
  app.use(cors({ origin: corsOrigins, credentials: true }))

  const uploadsRoot = path.join(__dirname, 'uploads')
  const logosDir = path.join(uploadsRoot, 'logos')
  if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true })
  app.use('/uploads', express.static(uploadsRoot))

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  function buildWhatsappMeUrl(fromDigits) {
    let d = String(fromDigits || '').replace(/\D/g, '')
    if (d.length < 10) return ''
    if (!d.startsWith('55')) d = `55${d}`
    return `https://wa.me/${d}`
  }

  /** Dados de contato exibidos na página inicial (sem autenticação). */
  app.get('/api/public/contato', (req, res) => {
    try {
      const getVal = (chave) => {
        try {
          const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)
          return String(row?.valor || '').trim()
        } catch {
          return ''
        }
      }
      let email = getVal('CONTACT_EMAIL') || String(process.env.PUBLIC_CONTACT_EMAIL || '').trim()
      let phone = getVal('CONTACT_PHONE') || String(process.env.PUBLIC_CONTACT_PHONE || '').trim()
      let whatsRaw = getVal('CONTACT_WHATSAPP') || String(process.env.PUBLIC_CONTACT_WHATSAPP || '').trim()

      let whatsappUrl = buildWhatsappMeUrl(whatsRaw)
      if (!whatsappUrl && phone) whatsappUrl = buildWhatsappMeUrl(phone)

      res.json({ email, phone, whatsappUrl })
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  app.get('/api/dashboard/notas-fiscais', authMiddleware, (req, res) => {
    try {
      const rows = db
        .prepare(
          `
      SELECT n.*, c.nome as cliente_nome_join FROM notas_fiscais n
      LEFT JOIN clientes c ON n.cliente_id = c.id
      WHERE n.user_id = ? ORDER BY n.data DESC, n.id DESC
    `,
        )
        .all(req.user.empresaUserId)
      res.json(rows.map((r) => ({ ...r, cliente_nome: r.cliente_nome || r.cliente_nome_join || '-' })))
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })
  app.post('/api/dashboard/notas-fiscais', authMiddleware, (req, res) => {
    try {
      const { data, cliente_id, cliente_nome, descricao, valor, status } = req.body
      const year = new Date().getFullYear()
      const count =
        db.prepare('SELECT COUNT(*) as c FROM notas_fiscais WHERE user_id = ? AND numero LIKE ?').get(req.user.empresaUserId, `NFS-${year}-%`)?.c || 0
      const numero = `NFS-${year}-${String(count + 1).padStart(3, '0')}`
      const dataStr = (data || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
      let nomeCliente = cliente_nome || ''
      if (cliente_id) {
        const c = db.prepare('SELECT nome FROM clientes WHERE id = ? AND user_id = ?').get(cliente_id, req.user.empresaUserId)
        if (c) nomeCliente = c.nome
      }
      const r = db
        .prepare(
          `
      INSERT INTO notas_fiscais (user_id, numero, data, cliente_id, cliente_nome, descricao, status, valor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        )
        .run(
          req.user.empresaUserId,
          numero,
          dataStr,
          cliente_id || null,
          nomeCliente,
          descricao || '',
          status || 'Pendente',
          parseFloat(valor) || 0,
        )
      res.status(201).json(db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(r.lastInsertRowid))
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })
  app.patch('/api/dashboard/notas-fiscais/:id/status', authMiddleware, (req, res) => {
    const { status } = req.body
    if (!['Pendente', 'Emitida', 'Cancelada'].includes(status)) return res.status(400).json({ error: 'Status inválido' })
    db.prepare('UPDATE notas_fiscais SET status = ? WHERE id = ? AND user_id = ?').run(status, req.params.id, req.user.empresaUserId)
    res.json(db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(req.params.id) || {})
  })
  app.delete('/api/dashboard/notas-fiscais/:id', authMiddleware, (req, res) => {
    const r = db.prepare('DELETE FROM notas_fiscais WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
    if (r.changes === 0) return res.status(404).json({ error: 'Nota não encontrada' })
    res.json({ ok: true })
  })

  app.get('/api/dashboard/das-mensal', authMiddleware, (req, res) => {
    try {
      const rows = db.prepare('SELECT * FROM das_mensal WHERE user_id = ? ORDER BY referencia DESC').all(req.user.empresaUserId)
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
      const existe = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(req.user.empresaUserId, ref)
      if (existe) return res.status(400).json({ error: 'Já existe DAS para esta referência' })
      const vencimento = `${ref}-20`
      const val = parseFloat(valor) || 66
      const r = db
        .prepare('INSERT INTO das_mensal (user_id, referencia, vencimento, valor) VALUES (?, ?, ?, ?)')
        .run(req.user.empresaUserId, ref, vencimento, val)
      res.status(201).json(db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(r.lastInsertRowid))
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })
  app.put('/api/dashboard/das-mensal/:id/pago', authMiddleware, (req, res) => {
    const dataPagamento = new Date().toISOString().slice(0, 10)
    db.prepare('UPDATE das_mensal SET pago = 1, data_pagamento = ? WHERE id = ? AND user_id = ?').run(dataPagamento, req.params.id, req.user.empresaUserId)
    res.json(db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(req.params.id) || {})
  })
  app.delete('/api/dashboard/das-mensal/:id', authMiddleware, (req, res) => {
    const r = db.prepare('DELETE FROM das_mensal WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
    if (r.changes === 0) return res.status(404).json({ error: 'DAS não encontrado' })
    res.json({ ok: true })
  })

  app.get('/api/dashboard/tutoriais', authMiddleware, (req, res) => {
    try {
      const rows = db
        .prepare(
          `SELECT id, titulo, descricao, url_video, icon, ordem
         FROM tutoriais WHERE ativo = 1 ORDER BY ordem ASC, id ASC`,
        )
        .all()
      res.json(rows)
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: e.message })
    }
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/financeiro', financeiroRoutes)
  app.use('/api/clientes', clientesRoutes)
  app.use('/api/produtos', produtosRoutes)
  app.use('/api/estoque', estoqueRoutes)
  app.use('/api/tarefas', tarefasRoutes)
  app.use('/api/empresa', empresaUsuariosRoutes)
  app.use('/api/assinatura', assinaturaRoutes)

  if (isProduction) {
    const distPath = path.join(__dirname, '..', 'dist')
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
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

  const PREFERRED_PORT = parseInt(process.env.PORT, 10) || 3001
  const PORT_FALLBACK_RANGE = 35

  async function startServer() {
    for (let i = 0; i <= PORT_FALLBACK_RANGE; i++) {
      const port = PREFERRED_PORT + i
      const server = http.createServer(app)

      const result = await new Promise((resolve) => {
        const onError = (err) => {
          server.removeListener('listening', onListening)
          resolve({ ok: false, err })
        }
        const onListening = () => {
          server.removeListener('error', onError)
          resolve({ ok: true })
        }
        server.once('error', onError)
        server.once('listening', onListening)
        server.listen(port)
      })

      if (result.ok) {
        if (!isProduction) {
          try {
            const portFile = path.join(__dirname, '..', '.dev-server-port')
            fs.writeFileSync(portFile, String(port), 'utf8')
            console.log(`(dev) Proxy do Vite usará a porta ${port} — arquivo .dev-server-port atualizado.`)
          } catch (e) {
            console.warn('(dev) Não foi possível gravar .dev-server-port:', e.message)
          }
        }
        if (i > 0) {
          console.log(`Porta ${PREFERRED_PORT} ocupada — servidor em http://localhost:${port}`)
          console.log('O Vite lê .dev-server-port a cada requisição; basta manter npm run dev aberto (ou reinicie o Vite uma vez).')
        } else {
          console.log(`Servidor rodando em http://localhost:${port}`)
        }
        console.log(`Banco de dados: ${path.join(__dirname, 'database', 'meipro.sqlite')}`)
        return
      }

      await new Promise((r) => server.close(r)).catch(() => {})

      const { err } = result
      if (err.code !== 'EADDRINUSE') {
        console.error(err)
        process.exit(1)
      }
      if (i === 0) console.log(`Porta ${port} em uso. Procurando porta livre...`)
    }

    console.error(
      `Nenhuma porta livre entre ${PREFERRED_PORT} e ${PREFERRED_PORT + PORT_FALLBACK_RANGE}. ` +
        'Feche o outro processo (outra janela com npm run server) ou defina PORT= no .env.',
    )
    console.error('No PowerShell: Get-NetTCPConnection -LocalPort 3001,3002 | Select-Object LocalPort,OwningProcess')
    process.exit(1)
  }

  await startServer()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
