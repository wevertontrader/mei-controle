const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

router.get('/visao-geral', authMiddleware, (req, res) => {
  try {
  const userId = req.user.id
  const hoje = formatDate(new Date())
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const fimMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  const inicioStr = formatDate(inicioMes)
  const fimStr = formatDate(fimMes)

  const receitas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ? AND data BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)?.total || 0

  const despesas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM gastos WHERE user_id = ? AND data BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)?.total || 0

  const custosPendentes = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM custos WHERE user_id = ? AND pago = 0
  `).get(userId)?.total || 0

  const vendas = db.prepare(`
    SELECT COUNT(*) as qtd, COALESCE(SUM(valor), 0) as total FROM vendas WHERE user_id = ? AND data BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)

  const qtdVendas = vendas?.qtd || 0
  const lucro = receitas - despesas
  const roi = receitas > 0 ? ((lucro / receitas) * 100) : 0
  const ticketMedio = qtdVendas > 0 ? vendas.total / qtdVendas : 0

  const diasUteis = 22
  const superavitDiario = diasUteis > 0 ? (lucro - custosPendentes) / diasUteis : 0

  const ultimos7Dias = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dataStr = formatDate(d)
    const dia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
    const rec = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ? AND data = ?')
      .get(userId, dataStr)?.total || 0
    const desp = db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM gastos WHERE user_id = ? AND data = ?')
      .get(userId, dataStr)?.total || 0
    ultimos7Dias.push({ name: dia, receitas: rec, despesas: desp })
  }

  res.json({
    receitaBruta: receitas,
    despesas,
    lucroLiquido: lucro,
    roi,
    custosPendentes,
    superavitDiario,
    quantidadeVendas: qtdVendas,
    ticketMedio,
    graficoUltimos7Dias: ultimos7Dias,
  })
  } catch (e) {
    console.error('Dashboard error:', e)
    res.status(500).json({ error: e.message || 'Erro ao carregar dashboard' })
  }
})

// DAS Mensal (rotas aqui para evitar 404 no mount /api/das-mensal)
const VALOR_DAS_PADRAO = 66.00

router.get('/das-mensal', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM das_mensal WHERE user_id = ? ORDER BY referencia DESC').all(req.user.id)
  res.json(rows)
})

router.post('/das-mensal', authMiddleware, (req, res) => {
  const { referencia, valor } = req.body
  const ref = (referencia || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(ref)) {
    return res.status(400).json({ error: 'Referência inválida (use YYYY-MM)' })
  }
  const vencimento = `${ref}-20`
  const existe = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(req.user.id, ref)
  if (existe) return res.status(400).json({ error: 'Já existe DAS para esta referência' })
  const val = parseFloat(valor) || VALOR_DAS_PADRAO
  const r = db.prepare('INSERT INTO das_mensal (user_id, referencia, vencimento, valor) VALUES (?, ?, ?, ?)')
    .run(req.user.id, ref, vencimento, val)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/das-mensal/:id/pago', authMiddleware, (req, res) => {
  const dataPagamento = new Date().toISOString().slice(0, 10)
  db.prepare('UPDATE das_mensal SET pago = 1, data_pagamento = ? WHERE id = ? AND user_id = ?')
    .run(dataPagamento, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/das-mensal/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM das_mensal WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (r.changes === 0) return res.status(404).json({ error: 'DAS não encontrado' })
  res.json({ ok: true })
})

// Notas Fiscais (rotas aqui para evitar 404 no mount /api/notas-fiscais)
function nextNumeroNotas(userId) {
  const year = new Date().getFullYear()
  const row = db.prepare(
    'SELECT COUNT(*) as c FROM notas_fiscais WHERE user_id = ? AND numero LIKE ?'
  ).get(userId, `NFS-${year}-%`)
  return `NFS-${year}-${String((row?.c || 0) + 1).padStart(3, '0')}`
}

router.get('/notas-fiscais', authMiddleware, (req, res) => {
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
})

router.post('/notas-fiscais', authMiddleware, (req, res) => {
  const { data, cliente_id, cliente_nome, descricao, valor, status } = req.body
  const numero = nextNumeroNotas(req.user.id)
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

router.patch('/notas-fiscais/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body
  if (!['Pendente', 'Emitida', 'Cancelada'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' })
  }
  db.prepare('UPDATE notas_fiscais SET status = ? WHERE id = ? AND user_id = ?')
    .run(status, req.params.id, req.user.id)
  const row = db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/notas-fiscais/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM notas_fiscais WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  if (r.changes === 0) return res.status(404).json({ error: 'Nota não encontrada' })
  res.json({ ok: true })
})

module.exports = router
