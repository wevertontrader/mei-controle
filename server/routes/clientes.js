const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()
router.use(authMiddleware)

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM clientes WHERE user_id = ? ORDER BY nome').all(req.user.empresaUserId)
  res.json(rows)
})

router.post('/', (req, res) => {
  const { nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram } = req.body
  const r = db.prepare(`
    INSERT INTO clientes (user_id, nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.empresaUserId, nome || '', email || '', whatsapp || '', telefone || '', documento || '', endereco || '', nome_empresa || '', funcao || '', site || '', instagram || '')
  const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(r.lastInsertRowid)
  res.status(201).json(row)
})

router.get('/vendas', (req, res) => {
  try {
    const { q, data_inicio, data_fim, forma } = req.query
    const uid = req.user.empresaUserId
    let sql = `
      SELECT v.*, c.nome as cliente_nome,
      (
        SELECT GROUP_CONCAT(p.nome || ' ×' || m.quantidade, ' · ')
        FROM estoque_movimentacoes m
        INNER JOIN produtos p ON p.id = m.produto_id AND p.user_id = m.user_id
        WHERE m.user_id = v.user_id AND m.descricao = 'Venda #' || CAST(v.id AS TEXT)
      ) AS resumo_estoque,
      (
        SELECT e.descricao FROM entradas e
        WHERE e.user_id = v.user_id AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
        ORDER BY e.id DESC LIMIT 1
      ) AS descricao_caixa,
      (
        SELECT e.forma_pagamento FROM entradas e
        WHERE e.user_id = v.user_id AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
        ORDER BY e.id DESC LIMIT 1
      ) AS forma_caixa,
      (
        SELECT TRIM(COALESCE(
          NULLIF(TRIM(IFNULL(v.forma_pagamento, '')), ''),
          NULLIF(TRIM((
            SELECT e.forma_pagamento FROM entradas e
            WHERE e.user_id = v.user_id AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
            ORDER BY e.id DESC LIMIT 1
          )), ''),
          CASE
            WHEN instr(IFNULL(v.descricao, ''), ' · Pag.: ') > 0 THEN
              TRIM(substr(v.descricao, instr(v.descricao, ' · Pag.: ') + length(' · Pag.: ')))
            WHEN instr(IFNULL(v.descricao, ''), ' - Pag.: ') > 0 THEN
              TRIM(substr(v.descricao, instr(v.descricao, ' - Pag.: ') + length(' - Pag.: ')))
            WHEN lower(substr(trim(IFNULL(v.descricao, '')), 1, 6)) = 'pag.:' THEN
              TRIM(substr(trim(v.descricao), 7))
            ELSE NULL
          END
        ))
      ) AS forma_exibicao
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.user_id = ?
    `
    const params = [uid]
    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`
      sql += ` AND (
        LOWER(IFNULL(c.nome, '')) LIKE LOWER(?)
        OR LOWER(IFNULL(v.descricao, '')) LIKE LOWER(?)
        OR LOWER(IFNULL(v.forma_pagamento, '')) LIKE LOWER(?)
        OR LOWER(IFNULL(v.itens_json, '')) LIKE LOWER(?)
        OR EXISTS (
          SELECT 1 FROM entradas e
          WHERE e.user_id = v.user_id
          AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
          AND LOWER(IFNULL(e.forma_pagamento, '')) LIKE LOWER(?)
        )
      )`
      params.push(like, like, like, like, like)
    }
    if (data_inicio && String(data_inicio).length >= 10) {
      sql += ' AND substr(trim(COALESCE(v.data, \'\')), 1, 10) >= ?'
      params.push(String(data_inicio).slice(0, 10))
    }
    if (data_fim && String(data_fim).length >= 10) {
      sql += ' AND substr(trim(COALESCE(v.data, \'\')), 1, 10) <= ?'
      params.push(String(data_fim).slice(0, 10))
    }
    if (forma && String(forma).trim()) {
      const f = String(forma).trim()
      sql += ` AND (
        v.forma_pagamento = ?
        OR EXISTS (
          SELECT 1 FROM entradas e
          WHERE e.user_id = v.user_id
          AND e.descricao LIKE 'Venda #' || CAST(v.id AS TEXT) || '%'
          AND e.forma_pagamento = ?
        )
        OR v.descricao LIKE ?
        OR v.descricao LIKE ?
        OR v.descricao LIKE ?
      )`
      params.push(f, f, `% · Pag.: ${f}%`, `% - Pag.: ${f}%`, `Pag.: ${f}%`)
    }
    sql += ' ORDER BY v.data DESC, v.id DESC'
    const rows = db.prepare(sql).all(...params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/vendas', (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {}
    const {
      cliente_id,
      valor: valorBody,
      data,
      descricao,
      forma_pagamento,
      formaPagamento,
      itens: itensBody,
      items,
      linhas,
      registrar_caixa: registrarCaixaRaw,
      atualizar_estoque: atualizarEstoqueRaw,
    } = body
    const itens = itensBody ?? items ?? linhas

    const registrarCaixa =
      registrarCaixaRaw !== false &&
      registrarCaixaRaw !== 0 &&
      String(registrarCaixaRaw || '').toLowerCase() !== 'false'
    const atualizarEstoque =
      atualizarEstoqueRaw !== false &&
      atualizarEstoqueRaw !== 0 &&
      String(atualizarEstoqueRaw || '').toLowerCase() !== 'false'

    const rawData = data != null ? String(data).trim() : ''
    let dataStr
    if (!rawData) {
      dataStr = db.prepare(`SELECT datetime('now', 'localtime') AS d`).get().d
    } else if (rawData.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(rawData)) {
      dataStr = rawData
    } else {
      const normalized = rawData.includes('T') ? rawData : rawData.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
      const parsed = new Date(normalized)
      if (!Number.isNaN(parsed.getTime())) {
        const y = parsed.getFullYear()
        const mo = String(parsed.getMonth() + 1).padStart(2, '0')
        const da = String(parsed.getDate()).padStart(2, '0')
        const h = String(parsed.getHours()).padStart(2, '0')
        const mi = String(parsed.getMinutes()).padStart(2, '0')
        const se = String(parsed.getSeconds()).padStart(2, '0')
        dataStr = `${y}-${mo}-${da} ${h}:${mi}:${se}`
      } else {
        dataStr = rawData.slice(0, 10)
      }
    }
    const candidatosForma = [
      forma_pagamento,
      formaPagamento,
      body.forma,
      body.payment_method,
      body.meio_pagamento,
    ]
    const formaRaw = candidatosForma.find((x) => x != null && String(x).trim() !== '')
    const forma = (formaRaw && String(formaRaw).trim()) || 'PIX'
    const uid = req.user.empresaUserId

    let valorTotal = Number(valorBody) || 0
    let itensSnapshot = []
    let descricaoFinal = (descricao && String(descricao).trim()) || ''

    let itensArr = []
    if (Array.isArray(itens)) {
      itensArr = itens
    } else if (itens && typeof itens === 'object' && !Array.isArray(itens)) {
      itensArr = Object.values(itens).filter((x) => x && typeof x === 'object')
    } else if (typeof itens === 'string' && itens.trim()) {
      try {
        const parsed = JSON.parse(itens)
        if (Array.isArray(parsed)) itensArr = parsed
      } catch (_) {
        /* ignora JSON inválido */
      }
    }

    if (itensArr.length > 0) {
      valorTotal = 0
      for (const raw of itensArr) {
        const pid = Number(raw.produto_id ?? raw.produtoId ?? raw.product_id ?? raw.id)
        const qtd = Math.max(1, Math.floor(Number(raw.quantidade ?? raw.qty ?? raw.quantity) || 0))
        if (!pid) return res.status(400).json({ error: 'Item de venda inválido (produto)' })
        const p = db.prepare('SELECT id, nome, preco, estoque_atual FROM produtos WHERE id = ? AND user_id = ?').get(pid, uid)
        if (!p) return res.status(400).json({ error: `Produto #${pid} não encontrado` })
        if (atualizarEstoque && p.estoque_atual < qtd) {
          return res.status(400).json({ error: `Estoque insuficiente para "${p.nome}" (disponível: ${p.estoque_atual})` })
        }
        const precoUnit = Number(p.preco) || 0
        const subtotal = precoUnit * qtd
        valorTotal += subtotal
        itensSnapshot.push({
          produto_id: p.id,
          nome: p.nome,
          quantidade: qtd,
          preco_unit: precoUnit,
          subtotal,
        })
      }
      if (!descricaoFinal) {
        descricaoFinal = itensSnapshot.map((i) => `${i.nome} x${i.quantidade}`).join(', ')
      }
    }

    if (valorTotal <= 0 || !Number.isFinite(valorTotal)) {
      return res.status(400).json({ error: 'Informe um valor válido ou itens da venda com preços corretos' })
    }

    const itensJson = itensSnapshot.length ? JSON.stringify(itensSnapshot) : null

    const valorGravar = Math.round(Number(valorTotal) * 100) / 100
    const tx = db.transaction(() => {
      const r = db.prepare(`
        INSERT INTO vendas (user_id, cliente_id, valor, data, descricao, forma_pagamento, itens_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uid, cliente_id || null, valorGravar, dataStr, descricaoFinal, forma, itensJson)
      const vendaId = r.lastInsertRowid

      db.prepare(
        `UPDATE vendas SET forma_pagamento = ?, itens_json = ? WHERE id = ? AND user_id = ?`
      ).run(forma, itensJson, vendaId, uid)

      if (atualizarEstoque && itensSnapshot.length) {
        const insMov = db.prepare(`
          INSERT INTO estoque_movimentacoes (user_id, produto_id, quantidade, tipo, descricao, data)
          VALUES (?, ?, ?, 'saida', ?, ?)
        `)
        const updEst = db.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ? AND user_id = ?')
        for (const item of itensSnapshot) {
          insMov.run(uid, item.produto_id, item.quantidade, `Venda #${vendaId}`, dataStr)
          const prod = db.prepare('SELECT estoque_atual FROM produtos WHERE id = ? AND user_id = ?').get(item.produto_id, uid)
          if (prod) {
            const novo = Math.max(0, prod.estoque_atual - item.quantidade)
            updEst.run(novo, item.produto_id, uid)
          }
        }
      }

      if (registrarCaixa) {
        const entDesc = `Venda #${vendaId}${descricaoFinal ? ` — ${descricaoFinal}` : ''}`
        db.prepare(`
          INSERT INTO entradas (user_id, valor, descricao, data, status, forma_pagamento, cliente_id)
          VALUES (?, ?, ?, ?, 'Recebido', ?, ?)
        `).run(uid, valorGravar, entDesc, dataStr, forma, cliente_id || null)
      }

      return vendaId
    })

    const vendaId = tx()
    const row = db.prepare(`
      SELECT v.*, c.nome as cliente_nome FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = ?
    `).get(vendaId)
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/:id', (req, res) => {
  const { nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram } = req.body
  db.prepare(`
    UPDATE clientes SET nome = COALESCE(?, nome), email = COALESCE(?, email), whatsapp = COALESCE(?, whatsapp), telefone = COALESCE(?, telefone),
    documento = COALESCE(?, documento), endereco = COALESCE(?, endereco), nome_empresa = COALESCE(?, nome_empresa), funcao = COALESCE(?, funcao),
    site = COALESCE(?, site), instagram = COALESCE(?, instagram) WHERE id = ? AND user_id = ?
  `).run(nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram, req.params.id, req.user.empresaUserId)
  const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id)
  res.json(row || {})
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM clientes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.empresaUserId)
  res.json({ ok: true })
})

module.exports = router
