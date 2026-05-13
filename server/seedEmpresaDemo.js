/**
 * Cadastra empresa de demonstração + dados financeiros no mês corrente (dashboard).
 * Execute na pasta server: node seedEmpresaDemo.js
 * Login: demo@meidemo.com.br / Demo@123
 */
const db = require('./db')
const bcrypt = require('bcryptjs')

const EMAIL = 'demo@meidemo.com.br'
const SENHA = 'Demo@123'

function ymd(y, m0, day) {
  const m = String(m0 + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function hojeNoMes() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const dia = now.getDate()
  const ultimoDia = new Date(y, m + 1, 0).getDate()
  return { y, m, dia, ultimoDia }
}

function diaMes(y, m, dia) {
  const ultimo = new Date(y, m + 1, 0).getDate()
  return ymd(y, m, Math.min(Math.max(1, dia), ultimo))
}

async function run() {
  await db.init()
  const hash = await bcrypt.hash(SENHA, 10)
  const planoRow = db.prepare("SELECT id, nome FROM planos WHERE slug = 'mensal' AND ativo = 1 LIMIT 1").get()
  const planoId = planoRow?.id ?? null
  const planoNome = planoRow?.nome ?? 'Mensal'
  const proxPag = new Date()
  proxPag.setMonth(proxPag.getMonth() + 1)
  proxPag.setDate(5)
  const yProx = proxPag.getFullYear()
  const mProx = proxPag.getMonth()
  const dProx = proxPag.getDate()
  const proximoPagamento = ymd(yProx, mProx, dProx)
  /** Fim do dia civil (UTC) do vencimento — mesma data YMD que proximo_pagamento na listagem */
  const trialEnds = `${proximoPagamento}T23:59:59.999Z`

  let row = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL)
  if (!row) {
    const r = db.prepare(`
      INSERT INTO users (nome, email, senha, empresa, trial_ends_at, role, whatsapp, cnpj, plano_id, proximo_pagamento, plano)
      VALUES (?, ?, ?, ?, ?, 'empresa', ?, ?, ?, ?, ?)
    `).run(
      'Carlos Mendes',
      EMAIL,
      hash,
      'Padaria Forno Mineiro — ME',
      trialEnds,
      '11988776655',
      '12.345.678/0001-90',
      planoId,
      proximoPagamento,
      planoNome
    )
    row = { id: r.lastInsertRowid }
    console.log('Empresa demo criada:', EMAIL, '/', SENHA)
  } else {
    db.prepare(`
      UPDATE users SET nome = ?, senha = ?, empresa = ?, trial_ends_at = ?, whatsapp = ?, cnpj = ?,
      plano_id = ?, proximo_pagamento = ?, plano = ?
      WHERE id = ?
    `).run(
      'Carlos Mendes',
      hash,
      'Padaria Forno Mineiro — ME',
      trialEnds,
      '11988776655',
      '12.345.678/0001-90',
      planoId,
      proximoPagamento,
      planoNome,
      row.id
    )
    console.log('Empresa demo atualizada (senha redefinida):', EMAIL, '/', SENHA)
  }

  const uid = row.id

  db.prepare('DELETE FROM estoque_movimentacoes WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM vendas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM tarefas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM poupanca WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM custos WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM gastos WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM entradas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM clientes WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM produtos WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM notas_fiscais WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM das_mensal WHERE user_id = ?').run(uid)

  const ins = db.prepare.bind(db)

  const clientes = [
    { nome: 'Mercado Bom Preço', email: 'compras@bompreco.com', whatsapp: '1133445566', nome_empresa: 'Bom Preço LTDA', documento: '11.222.333/0001-44' },
    { nome: 'Distribuidora Trigo Sul', email: 'pedidos@trigosul.com.br', whatsapp: '4833221100', nome_empresa: 'Trigo Sul ME', documento: '22.333.444/0001-55' },
    { nome: 'Padaria do Zé (parceiro)', email: 'ze@email.com', whatsapp: '11999887766', documento: '333.444.555-66' },
    { nome: 'Café da Esquina', email: 'contato@cafedaesquina.com', whatsapp: '11977665544', nome_empresa: 'Esquina Gastronomia', documento: '44.555.666/0001-77' },
    { nome: 'Consumidor final', email: '', whatsapp: '11955443322', documento: '' },
  ]
  const insCliente = ins(`
    INSERT INTO clientes (user_id, nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  clientes.forEach((c) =>
    insCliente.run(uid, c.nome, c.email || '', c.whatsapp, '', c.documento || '', '', c.nome_empresa || '', '', '', '')
  )
  const clienteIds = db.prepare('SELECT id FROM clientes WHERE user_id = ? ORDER BY id ASC').all(uid).map((r) => r.id)

  const produtos = [
    { nome: 'Pão francês (kg)', codigo: 'PF-001', preco_custo: 8.5, preco: 14.9, estoque: 120 },
    { nome: 'Bolo de cenoura (un)', codigo: 'BC-02', preco_custo: 12, preco: 28, estoque: 24 },
    { nome: 'Café expresso', codigo: 'CF-01', preco_custo: 1.2, preco: 5, estoque: 500 },
    { nome: 'Salgados mistos (cx)', codigo: 'SG-10', preco_custo: 45, preco: 89.9, estoque: 15 },
  ]
  const insProduto = ins('INSERT INTO produtos (user_id, nome, codigo, preco_custo, preco, estoque_atual, unidade) VALUES (?, ?, ?, ?, ?, ?, ?)')
  produtos.forEach((p) => insProduto.run(uid, p.nome, p.codigo, p.preco_custo, p.preco, p.estoque, 'UN'))
  const produtoIds = db.prepare('SELECT id FROM produtos WHERE user_id = ? ORDER BY id ASC').all(uid).map((r) => r.id)

  const { y, m, dia: diaHoje, ultimoDia } = hojeNoMes()
  const insEntrada = ins('INSERT INTO entradas (user_id, valor, descricao, data, status, forma_pagamento, cliente_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const insGasto = ins('INSERT INTO gastos (user_id, valor, descricao, categoria, data) VALUES (?, ?, ?, ?, ?)')
  const insVenda = ins('INSERT INTO vendas (user_id, cliente_id, valor, data, descricao) VALUES (?, ?, ?, ?, ?)')

  const descEntradas = [
    'Venda balcão — pães e salgados',
    'Encomenda festa — 200 salgados',
    'Fornecimento café — cliente corporativo',
    'Delivery iFood — repasse',
    'Venda torta aniversário',
    'Contrato padaria escola (quinzenal)',
  ]
  const descGastos = [
    { v: 420, d: 'Farinha de trigo (saco 50kg)', c: 'Matéria-prima' },
    { v: 189.9, d: 'Margarina profissional', c: 'Matéria-prima' },
    { v: 265, d: 'Gás GLP — troca botijão', c: 'Utilidades' },
    { v: 310, d: 'Energia elétrica', c: 'Utilidades' },
    { v: 99.9, d: 'Internet fibra', c: 'Administrativo' },
    { v: 145, d: 'Embalagens e sacolas', c: 'Administrativo' },
    { v: 78.5, d: 'Transporte — combustível', c: 'Transporte' },
    { v: 350, d: 'Manutenção forno elétrico', c: 'Manutenção' },
  ]

  for (let d = 1; d <= diaHoje; d++) {
    const dataStr = diaMes(y, m, d)
    if (d % 2 === 1) {
      const idx = d % descEntradas.length
      const valor = 180 + (d * 37) % 900 + (idx * 50)
      const cli = clienteIds[idx % clienteIds.length]
      insEntrada.run(uid, valor, descEntradas[idx], dataStr, d % 5 === 0 ? 'Pendente' : 'Recebido', d % 3 === 0 ? 'PIX' : 'Cartão', cli)
    }
    if (d % 3 === 0) {
      const g = descGastos[d % descGastos.length]
      insGasto.run(uid, g.v + (d % 7) * 5, g.d, g.c, dataStr)
    }
    if (d % 4 === 1) {
      const v = 320 + (d * 41) % 1500
      insVenda.run(uid, clienteIds[d % clienteIds.length], v, dataStr, `Venda dia ${d} — balcão e encomendas`)
    }
  }

  const insCusto = ins('INSERT INTO custos (user_id, valor, descricao, vencimento, pago) VALUES (?, ?, ?, ?, ?)')
  insCusto.run(uid, 71.6, 'DAS MEI', diaMes(y, m, Math.min(20, diaHoje)), 0)
  insCusto.run(uid, 2200, 'Aluguel ponto comercial', diaMes(y, m, Math.min(10, diaHoje)), diaHoje >= 10 ? 1 : 0)
  insCusto.run(uid, 89.9, 'Contador — honorários', diaMes(y, m, Math.min(28, diaHoje)), 0)

  const insPoupanca = ins('INSERT INTO poupanca (user_id, valor, descricao, data, tipo) VALUES (?, ?, ?, ?, ?)')
  insPoupanca.run(uid, 500, 'Reserva máquina nova', diaMes(y, m, Math.max(1, diaHoje - 2)), 'Reserva')

  const insTarefa = ins('INSERT INTO tarefas (user_id, titulo, descricao, data_limite, hora, tipo, concluida) VALUES (?, ?, ?, ?, ?, ?, ?)')
  insTarefa.run(uid, 'Pagar DAS', 'DAS vence dia 20', diaMes(y, m, 20), '09:00', 'Financeiro', 0)
  insTarefa.run(uid, 'Reposição farinha', 'Pedido Trigo Sul', diaMes(y, m, Math.min(diaHoje + 1, ultimoDia)), '08:30', 'Trabalho', 0)
  insTarefa.run(uid, 'Higienização forno', 'Checklist semanal', diaMes(y, m, Math.max(1, diaHoje - 3)), '07:00', 'Trabalho', 1)

  const insMov = ins('INSERT INTO estoque_movimentacoes (user_id, produto_id, quantidade, tipo, descricao, data) VALUES (?, ?, ?, ?, ?, ?)')
  const updProduto = ins('UPDATE produtos SET estoque_atual = ? WHERE id = ? AND user_id = ?')
  const movs = [
    { produto_id: produtoIds[0], qtd: 40, tipo: 'saida', descricao: 'Produção pão do dia', data: diaMes(y, m, diaHoje) },
    { produto_id: produtoIds[1], qtd: 6, tipo: 'saida', descricao: 'Venda bolos', data: diaMes(y, m, Math.max(1, diaHoje - 1)) },
    { produto_id: produtoIds[2], qtd: 200, tipo: 'saida', descricao: 'Consumo café', data: diaMes(y, m, Math.max(1, diaHoje - 2)) },
    { produto_id: produtoIds[0], qtd: 100, tipo: 'entrada', descricao: 'Compra farinha — entrada estoque', data: diaMes(y, m, Math.max(1, diaHoje - 4)) },
  ]
  movs.forEach((mv) => {
    insMov.run(uid, mv.produto_id, mv.qtd, mv.tipo, mv.descricao, mv.data)
    const p = db.prepare('SELECT estoque_atual FROM produtos WHERE id = ? AND user_id = ?').get(mv.produto_id, uid)
    if (p) {
      const novo = mv.tipo === 'entrada' ? p.estoque_atual + mv.qtd : Math.max(0, p.estoque_atual - mv.qtd)
      updProduto.run(novo, mv.produto_id, uid)
    }
  })

  const refMes = `${y}-${String(m + 1).padStart(2, '0')}`
  const existeDas = db.prepare('SELECT id FROM das_mensal WHERE user_id = ? AND referencia = ?').get(uid, refMes)
  if (!existeDas) {
    db.prepare('INSERT INTO das_mensal (user_id, referencia, vencimento, valor, pago) VALUES (?, ?, ?, ?, 0)').run(
      uid,
      refMes,
      `${refMes}-20`,
      71.6
    )
  }

  console.log(`Dados do mês ${refMes} inseridos para user_id=${uid}. Use o painel com esta conta.`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
