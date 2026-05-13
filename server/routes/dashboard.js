const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

/** Data civil local (YYYY-MM-DD), alinhada ao que o front grava em vendas/entradas */
function formatDateLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYmd(s) {
  const [y, m, day] = String(s).split('-').map(Number)
  return new Date(y, m - 1, day)
}

function resolvePeriodo(periodo) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const p = String(periodo || 'mes').toLowerCase().replace(/-/g, '_')

  if (p === 'mes_anterior') {
    const pm = m === 0 ? 11 : m - 1
    const py = m === 0 ? y - 1 : y
    const inicio = new Date(py, pm, 1)
    const fim = new Date(py, pm + 1, 0)
    return { inicioStr: formatDateLocal(inicio), fimStr: formatDateLocal(fim), label: 'Mês passado' }
  }
  if (p === 'trimestre') {
    const q = Math.floor(m / 3)
    const inicio = new Date(y, q * 3, 1)
    const fim = new Date(y, q * 3 + 3, 0)
    return { inicioStr: formatDateLocal(inicio), fimStr: formatDateLocal(fim), label: 'Este trimestre' }
  }
  if (p === 'ano') {
    return { inicioStr: `${y}-01-01`, fimStr: `${y}-12-31`, label: 'Este ano' }
  }
  const inicio = new Date(y, m, 1)
  const fim = new Date(y, m + 1, 0)
  return { inicioStr: formatDateLocal(inicio), fimStr: formatDateLocal(fim), label: 'Este mês' }
}

function diasUteisEntre(inicioStr, fimStr) {
  let a = parseYmd(inicioStr)
  let b = parseYmd(fimStr)
  if (a > b) {
    const t = a
    a = b
    b = t
  }
  let n = 0
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) n += 1
  }
  return Math.max(1, n)
}

router.get('/visao-geral', authMiddleware, (req, res) => {
  try {
  const userId = req.user.empresaUserId
  const periodoRaw = req.query.periodo
  const { inicioStr, fimStr, label: periodoLabel } = resolvePeriodo(periodoRaw)
  const hojeStr = formatDateLocal(new Date())
  const fimEfetivo = fimStr > hojeStr ? hojeStr : fimStr
  const inicioEfetivo = inicioStr > fimEfetivo ? fimEfetivo : inicioStr

  const receitasEntradas =
    db
      .prepare(
        `SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ? AND data BETWEEN ? AND ?`
      )
      .get(userId, inicioStr, fimStr)?.total || 0

  /** Vendas sem lançamento correspondente em entradas (ex.: fluxo antigo ou sem caixa) */
  const receitasVendasSemEntrada =
    db
      .prepare(
        `SELECT COALESCE(SUM(v.valor), 0) as total FROM vendas v
         WHERE v.user_id = ? AND v.data BETWEEN ? AND ?
         AND NOT EXISTS (
           SELECT 1 FROM entradas e
           WHERE e.user_id = v.user_id
           AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
         )`
      )
      .get(userId, inicioStr, fimStr)?.total || 0

  const receitas = receitasEntradas + receitasVendasSemEntrada

  const despesas = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM gastos WHERE user_id = ? AND data BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)?.total || 0

  const custosPendentes = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM custos WHERE user_id = ? AND pago = 0
    AND vencimento BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)?.total || 0

  const vendas = db.prepare(`
    SELECT COUNT(*) as qtd, COALESCE(SUM(valor), 0) as total FROM vendas WHERE user_id = ? AND data BETWEEN ? AND ?
  `).get(userId, inicioStr, fimStr)

  const qtdVendas = vendas?.qtd || 0
  const lucro = receitas - despesas
  const roi = receitas > 0 ? ((lucro / receitas) * 100) : 0
  const ticketMedio = qtdVendas > 0 ? vendas.total / qtdVendas : 0

  const diasUteis = diasUteisEntre(inicioEfetivo, fimEfetivo)
  const superavitDiario = diasUteis > 0 ? (lucro - custosPendentes) / diasUteis : 0

  const ultimos7Dias = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dataStr = formatDateLocal(d)
    const dia = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
    const recEnt =
      db.prepare('SELECT COALESCE(SUM(valor), 0) as total FROM entradas WHERE user_id = ? AND data = ?').get(userId, dataStr)?.total || 0
    const recVendaOrfa =
      db
        .prepare(
          `SELECT COALESCE(SUM(v.valor), 0) as total FROM vendas v
           WHERE v.user_id = ? AND v.data = ?
           AND NOT EXISTS (
             SELECT 1 FROM entradas e
             WHERE e.user_id = v.user_id
             AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
           )`
        )
        .get(userId, dataStr)?.total || 0
    const rec = recEnt + recVendaOrfa
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
    periodo: periodoRaw || 'mes',
    periodoLabel,
    periodoInicio: inicioStr,
    periodoFim: fimStr,
    diasUteisPeriodo: diasUteis,
  })
  } catch (e) {
    console.error('Dashboard error:', e)
    res.status(500).json({ error: e.message || 'Erro ao carregar dashboard' })
  }
})

// DAS Mensal (rotas aqui para evitar 404 no mount /api/das-mensal)
const VALOR_DAS_PADRAO = 66.00

router.get('/das-mensal', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM das_mensal WHERE user_id = ? ORDER BY referencia DESC').all(req.user.empresaUserId)
  res.json(rows)
})

router.post('/das-mensal', authMiddleware, (req, res) => {
  const { referencia, valor } = req.body
  const ref = (referencia || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(ref)) {
    return res.status(400).json({ error: 'Referência inválida (use YYYY-MM)' })
  }
  const vencimento = `${ref}-20`
  const existe = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(req.user.empresaUserId, ref)
  if (existe) return res.status(400).json({ error: 'Já existe DAS para esta referência' })
  const val = parseFloat(valor) || VALOR_DAS_PADRAO
  const r = db.prepare('INSERT INTO das_mensal (user_id, referencia, vencimento, valor) VALUES (?, ?, ?, ?)')
    .run(req.user.empresaUserId, ref, vencimento, val)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.put('/das-mensal/:id/pago', authMiddleware, (req, res) => {
  const dataPagamento = new Date().toISOString().slice(0, 10)
  db.prepare('UPDATE das_mensal SET pago = 1, data_pagamento = ? WHERE id = ? AND user_id = ?')
    .run(dataPagamento, req.params.id, req.user.empresaUserId)
  const row = db.prepare('SELECT * FROM das_mensal WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/das-mensal/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM das_mensal WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
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
  `).all(req.user.empresaUserId)
  const list = rows.map(r => ({
    ...r,
    cliente_nome: r.cliente_nome || r.cliente_nome_join || '-',
  }))
  res.json(list)
})

router.post('/notas-fiscais', authMiddleware, (req, res) => {
  const { data, cliente_id, cliente_nome, descricao, valor, status } = req.body
  const numero = nextNumeroNotas(req.user.empresaUserId)
  const dataStr = (data || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  const statusVal = status || 'Pendente'
  let nomeCliente = cliente_nome || ''
  if (cliente_id) {
    const c = db.prepare('SELECT nome FROM clientes WHERE id = ? AND user_id = ?').get(cliente_id, req.user.empresaUserId)
    if (c) nomeCliente = c.nome
  }
  const r = db.prepare(`
    INSERT INTO notas_fiscais (user_id, numero, data, cliente_id, cliente_nome, descricao, status, valor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.empresaUserId, numero, dataStr, cliente_id || null, nomeCliente, descricao || '', statusVal, parseFloat(valor) || 0)
  const row = db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.patch('/notas-fiscais/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body
  if (!['Pendente', 'Emitida', 'Cancelada'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido' })
  }
  db.prepare('UPDATE notas_fiscais SET status = ? WHERE id = ? AND user_id = ?')
    .run(status, req.params.id, req.user.empresaUserId)
  const row = db.prepare('SELECT * FROM notas_fiscais WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/notas-fiscais/:id', authMiddleware, (req, res) => {
  const r = db.prepare('DELETE FROM notas_fiscais WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
  if (r.changes === 0) return res.status(404).json({ error: 'Nota não encontrada' })
  res.json({ ok: true })
})

module.exports = router
