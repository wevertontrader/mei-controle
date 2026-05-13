/**
 * Seed do banco: insere 3 itens de exemplo para cada tipo de cadastro.
 * Execute: node seed.js (dentro da pasta server)
 */
const db = require('./db')
const bcrypt = require('bcryptjs')

/** Referência do mês corrente (datas alinhadas ao dashboard “Este mês”). */
function mesRef() {
  const now = new Date()
  const y = now.getFullYear()
  const mo = now.getMonth()
  const dia = now.getDate()
  const ultimo = new Date(y, mo + 1, 0).getDate()
  return { y, m: mo, dia, ultimo }
}

function diaMes(ref, d) {
  const day = Math.min(Math.max(1, d), ref.ultimo)
  return `${ref.y}-${String(ref.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function refDia(ref, delta) {
  return diaMes(ref, ref.dia + delta)
}

async function run() {
  await db.init()
  let user = db.prepare("SELECT id FROM users WHERE role = 'empresa' OR role IS NULL ORDER BY id LIMIT 1").get()
  if (!user) {
    const hash = await bcrypt.hash('teste123', 10)
    const trialEnds = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const r = db.prepare(
      "INSERT INTO users (nome, email, senha, empresa, trial_ends_at, role) VALUES (?, ?, ?, ?, ?, 'empresa')"
    ).run('Empresa Teste', 'teste@meicontrole.com', hash, 'MEI Teste Ltda', trialEnds)
    user = { id: r.lastInsertRowid }
    console.log('Usuário de teste criado: teste@meicontrole.com / teste123')
  }
  const uid = user.id
  const ref = mesRef()
  console.log(`Inserindo dados para user_id=${uid} (mês ${ref.y}-${String(ref.m + 1).padStart(2, '0')})...`)

  // Remove dados existentes do usuário (ordem por FKs)
  db.prepare('DELETE FROM estoque_movimentacoes WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM vendas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM tarefas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM poupanca WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM custos WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM gastos WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM entradas WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM clientes WHERE user_id = ?').run(uid)
  db.prepare('DELETE FROM produtos WHERE user_id = ?').run(uid)
  console.log('  Dados anteriores removidos.')

  const ins = db.prepare.bind(db)

  // 3 Clientes
  const clientesData = [
    { nome: 'João Silva', email: 'joao@email.com', whatsapp: '11999991111', nome_empresa: 'Silva Comércio', documento: '123.456.789-00' },
    { nome: 'Maria Santos', email: 'maria@email.com', whatsapp: '11988882222', nome_empresa: 'Santos Serviços', documento: '987.654.321-00' },
    { nome: 'Pedro Oliveira', email: 'pedro@email.com', whatsapp: '11977773333', endereco: 'Rua das Flores, 100', funcao: 'Comprador' },
  ]
  const insCliente = ins(`
    INSERT INTO clientes (user_id, nome, email, whatsapp, telefone, documento, endereco, nome_empresa, funcao, site, instagram)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  clientesData.forEach((c) =>
    insCliente.run(uid, c.nome, c.email, c.whatsapp, '', c.documento || '', c.endereco || '', c.nome_empresa || '', c.funcao || '', '', '')
  )
  const clienteIds = db.prepare('SELECT id FROM clientes WHERE user_id = ? ORDER BY id DESC LIMIT 3').all(uid).map((r) => r.id).reverse()
  console.log('  3 clientes inseridos')

  // 3 Produtos
  const produtosData = [
    { nome: 'Produto A', codigo: 'PROD-001', preco_custo: 10, preco: 25, estoque: 50 },
    { nome: 'Produto B', codigo: 'PROD-002', preco_custo: 15, preco: 35, estoque: 30 },
    { nome: 'Produto C', codigo: 'PROD-003', preco_custo: 8, preco: 20, estoque: 100 },
  ]
  const insProduto = ins('INSERT INTO produtos (user_id, nome, codigo, preco_custo, preco, estoque_atual, unidade) VALUES (?, ?, ?, ?, ?, ?, ?)')
  produtosData.forEach((p) => insProduto.run(uid, p.nome, p.codigo, p.preco_custo, p.preco, p.estoque, 'UN'))
  const produtoIds = db.prepare('SELECT id FROM produtos WHERE user_id = ? ORDER BY id DESC LIMIT 3').all(uid).map((r) => r.id).reverse()
  console.log('  3 produtos inseridos')

  // 3 Entradas
  const entradasData = [
    { valor: 500, descricao: 'Venda serviço consultoria', data: refDia(ref, 0), status: 'Recebido', forma: 'PIX', cliente_id: clienteIds[0] },
    { valor: 1200, descricao: 'Venda produto lote', data: refDia(ref, -2), status: 'Recebido', forma: 'Transferência', cliente_id: clienteIds[1] },
    { valor: 350, descricao: 'Serviço de manutenção', data: refDia(ref, -5), status: 'Pendente', forma: 'Dinheiro', cliente_id: clienteIds[2] },
  ]
  const insEntrada = ins('INSERT INTO entradas (user_id, valor, descricao, data, status, forma_pagamento, cliente_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
  entradasData.forEach((e) => insEntrada.run(uid, e.valor, e.descricao, e.data, e.status, e.forma, e.cliente_id))
  console.log('  3 entradas inseridas')

  // 3 Gastos
  const gastosData = [
    { valor: 150, descricao: 'Material de escritório', categoria: 'Administrativo', data: refDia(ref, 0) },
    { valor: 280, descricao: 'Energia elétrica', categoria: 'Utilidades', data: refDia(ref, -3) },
    { valor: 95, descricao: 'Combustível', categoria: 'Transporte', data: refDia(ref, -7) },
  ]
  const insGasto = ins('INSERT INTO gastos (user_id, valor, descricao, categoria, data) VALUES (?, ?, ?, ?, ?)')
  gastosData.forEach((g) => insGasto.run(uid, g.valor, g.descricao, g.categoria, g.data))
  console.log('  3 gastos inseridos')

  // 3 Custos
  const custosData = [
    { valor: 89.90, descricao: 'DAS - MEI', vencimento: diaMes(ref, Math.min(20, ref.ultimo)), pago: 0 },
    { valor: 150, descricao: 'Aluguel', vencimento: diaMes(ref, Math.min(10, ref.ultimo)), pago: 0 },
    { valor: 45, descricao: 'Internet', vencimento: diaMes(ref, Math.min(15, ref.ultimo)), pago: 1 },
  ]
  const insCusto = ins('INSERT INTO custos (user_id, valor, descricao, vencimento, pago) VALUES (?, ?, ?, ?, ?)')
  custosData.forEach((c) => insCusto.run(uid, c.valor, c.descricao, c.vencimento, c.pago))
  console.log('  3 custos inseridos')

  // 3 Poupança
  const poupancaData = [
    { valor: 200, descricao: 'Reserva de emergência', data: refDia(ref, 0), tipo: 'Reserva' },
    { valor: 500, descricao: 'Aplicação CDB', data: refDia(ref, -1), tipo: 'Investimento' },
    { valor: 150, descricao: 'Meta férias', data: refDia(ref, -10), tipo: 'Poupança' },
  ]
  const insPoupanca = ins('INSERT INTO poupanca (user_id, valor, descricao, data, tipo) VALUES (?, ?, ?, ?, ?)')
  poupancaData.forEach((p) => insPoupanca.run(uid, p.valor, p.descricao, p.data, p.tipo))
  console.log('  3 poupança inseridos')

  // 3 Vendas (vinculadas a clientes)
  const vendasData = [
    { cliente_id: clienteIds[0], valor: 800, data: refDia(ref, 0), descricao: 'Venda produto A - 10 un' },
    { cliente_id: clienteIds[1], valor: 1200, data: refDia(ref, -1), descricao: 'Serviço completo' },
    { cliente_id: clienteIds[2], valor: 450, data: refDia(ref, -4), descricao: 'Venda produto B - 5 un' },
  ]
  const insVenda = ins('INSERT INTO vendas (user_id, cliente_id, valor, data, descricao) VALUES (?, ?, ?, ?, ?)')
  vendasData.forEach((v) => insVenda.run(uid, v.cliente_id, v.valor, v.data, v.descricao))
  console.log('  3 vendas inseridas')

  // 3 Tarefas
  const tarefasData = [
    { titulo: 'Pagar DAS', descricao: 'Pagamento do DAS até dia 20', data: refDia(ref, 7), hora: '10:00', tipo: 'Financeiro' },
    { titulo: 'Reunião com cliente', descricao: 'Apresentar proposta', data: refDia(ref, 2), hora: '14:30', tipo: 'Trabalho' },
    { titulo: 'Organizar estoque', descricao: 'Fazer inventário mensal', data: refDia(ref, 5), hora: null, tipo: 'Trabalho', concluida: 1 },
  ]
  const insTarefa = ins('INSERT INTO tarefas (user_id, titulo, descricao, data_limite, hora, tipo, concluida) VALUES (?, ?, ?, ?, ?, ?, ?)')
  tarefasData.forEach((t) => insTarefa.run(uid, t.titulo, t.descricao, t.data, t.hora, t.tipo, t.concluida || 0))
  console.log('  3 tarefas inseridas')

  // 3 Movimentações de estoque
  const movData = [
    { produto_id: produtoIds[0], qtd: 20, tipo: 'entrada', descricao: 'Compra fornecedor', data: refDia(ref, 0) },
    { produto_id: produtoIds[1], qtd: 5, tipo: 'saida', descricao: 'Venda cliente', data: refDia(ref, -1) },
    { produto_id: produtoIds[2], qtd: 50, tipo: 'entrada', descricao: 'Reposição estoque', data: refDia(ref, -3) },
  ]
  const insMov = ins('INSERT INTO estoque_movimentacoes (user_id, produto_id, quantidade, tipo, descricao, data) VALUES (?, ?, ?, ?, ?, ?)')
  const updProduto = ins('UPDATE produtos SET estoque_atual = ? WHERE id = ? AND user_id = ?')
  movData.forEach((m) => {
    insMov.run(uid, m.produto_id, m.qtd, m.tipo, m.descricao, m.data)
    const p = db.prepare('SELECT estoque_atual FROM produtos WHERE id = ? AND user_id = ?').get(m.produto_id, uid)
    if (p) {
      const q = m.qtd
      const novo = m.tipo === 'entrada' ? p.estoque_atual + q : Math.max(0, p.estoque_atual - q)
      updProduto.run(novo, m.produto_id, uid)
    }
  })
  console.log('  3 movimentações de estoque inseridas')

  console.log('\nSeed concluído! teste@meicontrole.com / teste123 — ou rode npm run seed:demo para empresa demo enxuta.')
}

run().catch((e) => {
  console.error('Erro no seed:', e)
  process.exit(1)
})
