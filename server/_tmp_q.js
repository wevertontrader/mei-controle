const db = require('better-sqlite3')(require('path').join(__dirname, 'database', 'meipro.sqlite'))
const rows = db.prepare(`
  SELECT id, descricao, forma_pagamento, valor, data
  FROM vendas ORDER BY id DESC LIMIT 8
`).all()
console.log(JSON.stringify(rows, null, 2))
