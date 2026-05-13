/**
 * SQLite via sql.js (WASM) — sem módulo nativo; compatível com Hostinger / GLIBC antigo.
 * É necessário await require('./db').init() antes de carregar rotas que usam o banco.
 */
const path = require('path')
const fs = require('fs')

const dbDir = path.join(__dirname, 'database')
const dbPath = path.join(dbDir, 'meipro.sqlite')

let sqlDb = null
let txDepth = 0

function persist() {
  if (!sqlDb || txDepth > 0) return
  try {
    fs.mkdirSync(dbDir, { recursive: true })
    fs.writeFileSync(dbPath, Buffer.from(sqlDb.export()))
  } catch (e) {
    console.error('[db] Falha ao gravar meipro.sqlite:', e.message)
  }
}

function lastInsertRowid() {
  const st = sqlDb.prepare('SELECT last_insert_rowid() AS lid')
  try {
    st.step()
    const row = st.get()
    return row && row.length ? Number(row[0]) : 0
  } finally {
    st.free()
  }
}

function makePrepare(sql) {
  return {
    get(...params) {
      const stmt = sqlDb.prepare(sql)
      try {
        if (params.length) stmt.bind(params)
        if (!stmt.step()) return undefined
        return stmt.getAsObject()
      } finally {
        stmt.free()
      }
    },
    all(...params) {
      const stmt = sqlDb.prepare(sql)
      const rows = []
      try {
        if (params.length) stmt.bind(params)
        while (stmt.step()) rows.push(stmt.getAsObject())
        return rows
      } finally {
        stmt.free()
      }
    },
    run(...params) {
      const stmt = sqlDb.prepare(sql)
      try {
        if (params.length) stmt.bind(params)
        stmt.step()
        const changes = sqlDb.getRowsModified()
        const lid = lastInsertRowid()
        persist()
        return { changes, lastInsertRowid: lid }
      } finally {
        stmt.free()
      }
    },
  }
}

function bootstrapSchema(db) {
  try {
    db.pragma('journal_mode = WAL')
  } catch (_) {
    /* sql.js pode ignorar WAL */
  }
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      empresa TEXT NOT NULL,
      trial_ends_at TEXT NOT NULL,
      role TEXT DEFAULT 'empresa',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS entradas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      status TEXT DEFAULT 'Recebido',
      forma_pagamento TEXT,
      cliente_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      categoria TEXT,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS custos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      vencimento TEXT NOT NULL,
      pago INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS poupanca (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      valor REAL NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      tipo TEXT DEFAULT 'Poupança',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT,
      email TEXT,
      whatsapp TEXT,
      telefone TEXT,
      documento TEXT,
      endereco TEXT,
      nome_empresa TEXT,
      funcao TEXT,
      site TEXT,
      instagram TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cliente_id INTEGER,
      valor REAL NOT NULL,
      data TEXT NOT NULL,
      descricao TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      codigo TEXT,
      preco_custo REAL DEFAULT 0,
      preco REAL NOT NULL,
      estoque_atual INTEGER DEFAULT 0,
      unidade TEXT DEFAULT 'UN',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id)
    );

    CREATE TABLE IF NOT EXISTS tarefas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT,
      data_limite TEXT,
      concluida INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_entradas_user_data ON entradas(user_id, data);
    CREATE INDEX IF NOT EXISTS idx_gastos_user_data ON gastos(user_id, data);
    CREATE INDEX IF NOT EXISTS idx_custos_user ON custos(user_id);
    CREATE INDEX IF NOT EXISTS idx_vendas_user_data ON vendas(user_id, data);

    CREATE TABLE IF NOT EXISTS planos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      preco REAL NOT NULL,
      dias INTEGER NOT NULL,
      periodo TEXT NOT NULL,
      features TEXT,
      destaque INTEGER DEFAULT 0,
      economia TEXT,
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notas_fiscais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      numero TEXT NOT NULL,
      data TEXT NOT NULL,
      cliente_id INTEGER,
      cliente_nome TEXT,
      descricao TEXT,
      status TEXT DEFAULT 'Pendente',
      valor REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    CREATE TABLE IF NOT EXISTS das_mensal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      referencia TEXT NOT NULL,
      vencimento TEXT NOT NULL,
      valor REAL DEFAULT 0,
      pago INTEGER DEFAULT 0,
      data_pagamento TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tutoriais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      url_video TEXT,
      icon TEXT DEFAULT 'book-open',
      ordem INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'empresa'`)
  } catch (_) {}
  const clienteCols = ['whatsapp', 'nome_empresa', 'funcao', 'site', 'instagram']
  try {
    db.exec(`ALTER TABLE produtos ADD COLUMN preco_custo REAL DEFAULT 0`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE entradas ADD COLUMN status TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE poupanca ADD COLUMN tipo TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE entradas ADD COLUMN forma_pagamento TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE entradas ADD COLUMN cliente_id INTEGER`)
  } catch (_) {}
  clienteCols.forEach((col) => {
    try {
      db.exec(`ALTER TABLE clientes ADD COLUMN ${col} TEXT`)
    } catch (_) {}
  })
  try {
    db.exec(`ALTER TABLE tarefas ADD COLUMN hora TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE tarefas ADD COLUMN tipo TEXT DEFAULT 'Trabalho'`)
  } catch (_) {}
  const userPerfilCols = ['cpf', 'whatsapp', 'cnpj', 'logotipo', 'plano']
  userPerfilCols.forEach((col) => {
    try {
      db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT`)
    } catch (_) {}
  })
  try {
    db.exec(`ALTER TABLE users ADD COLUMN plano_id INTEGER`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN proximo_pagamento TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN password_reset_token TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN password_reset_expires TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE vendas ADD COLUMN forma_pagamento TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE vendas ADD COLUMN itens_json TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN owner_user_id INTEGER REFERENCES users(id)`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN sidebar_permissions TEXT`)
  } catch (_) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN logotipo_pdv TEXT`)
  } catch (_) {}

  const superAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@meicontrole.com')
  if (!superAdmin) {
    const bcrypt = require('bcryptjs')
    const hash = bcrypt.hashSync('admin123', 10)
    const trialEnds = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    db.prepare(`
      INSERT INTO users (nome, email, senha, empresa, trial_ends_at, role) VALUES (?, ?, ?, ?, ?, ?)
    `).run('Super Admin', 'admin@meicontrole.com', hash, 'Sistema', trialEnds, 'super_admin')
  } else {
    db.prepare("UPDATE users SET role = 'super_admin' WHERE email = ?").run('admin@meicontrole.com')
  }

  const planosCount = db.prepare('SELECT COUNT(*) as c FROM planos').get()?.c || 0
  if (planosCount === 0) {
    db.prepare(`
      INSERT INTO planos (nome, slug, preco, dias, periodo, features, destaque, economia) VALUES
      ('Mensal', 'mensal', 29.90, 30, 'mês', '["Acesso completo ao sistema","Suporte por e-mail","Backup automático"]', 0, NULL),
      ('Anual', 'anual', 249.90, 365, 'ano', '["Tudo do plano Mensal","12 meses pelo preço de 10","Prioridade no suporte"]', 1, 'Economize 2 meses')
    `).run()
  }

  const tutoriaisCount = db.prepare('SELECT COUNT(*) as c FROM tutoriais').get()?.c || 0
  const tutoriaisJaSemeado = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get('tutoriais_default_seeded')
  if (tutoriaisCount === 0 && !tutoriaisJaSemeado?.valor) {
    db.prepare(`
      INSERT INTO tutoriais (titulo, descricao, url_video, icon, ordem, ativo) VALUES
      ('Primeiros passos no MEI Controle', 'Conheça a interface e como registrar suas primeiras entradas e gastos.', NULL, 'book-open', 1, 1),
      ('Financeiro completo', 'Aprenda a usar Entradas, Gastos, Custos e Poupança.', NULL, 'trending-up', 2, 1),
      ('Cadastro de clientes e vendas', 'Como cadastrar clientes e registrar vendas.', NULL, 'users', 3, 1),
      ('Produtos e estoque', 'Gestão de produtos e movimentações de estoque.', NULL, 'package', 4, 1)
    `).run()
    db.prepare(`
      INSERT INTO configuracoes (chave, valor, updated_at) VALUES ('tutoriais_default_seeded', '1', datetime('now'))
      ON CONFLICT(chave) DO UPDATE SET valor = '1', updated_at = datetime('now')
    `).run()
  }
}

const facade = {
  prepare: () => {
    throw new Error('Banco não inicializado. Aguarde await require("./db").init().')
  },
  exec: () => {
    throw new Error('Banco não inicializado.')
  },
  pragma: () => {
    throw new Error('Banco não inicializado.')
  },
  transaction: () => {
    throw new Error('Banco não inicializado.')
  },
}

let initDone = false

facade.init = async function initDb() {
  if (initDone) return
  initDone = true

  const sqljsPkg = require('sql.js')
  const initSqlJs = typeof sqljsPkg === 'function' ? sqljsPkg : sqljsPkg.default
  const SQL = await initSqlJs()

  fs.mkdirSync(dbDir, { recursive: true })
  let buf = null
  if (fs.existsSync(dbPath)) {
    buf = new Uint8Array(fs.readFileSync(dbPath))
  }
  sqlDb = buf ? new SQL.Database(buf) : new SQL.Database()

  facade.prepare = (sql) => makePrepare(sql)
  facade.exec = (sql) => {
    try {
      sqlDb.exec(sql)
    } catch (e) {
      sqlDb.run(sql)
    }
    persist()
  }
  facade.pragma = (pragmaStr) => {
    const p = String(pragmaStr).trim()
    try {
      sqlDb.run(`PRAGMA ${p}`)
      persist()
    } catch (_) {
      /* journal_mode etc. */
    }
  }
  facade.transaction = (fn) => {
    return () => {
      sqlDb.run('BEGIN')
      txDepth += 1
      try {
        fn()
        sqlDb.run('COMMIT')
      } catch (e) {
        try {
          sqlDb.run('ROLLBACK')
        } catch (_) {}
        throw e
      } finally {
        txDepth -= 1
      }
      persist()
    }
  }

  bootstrapSchema(facade)
  persist()

  process.once('SIGINT', () => {
    persist()
    process.exit(0)
  })
  process.once('SIGTERM', () => {
    persist()
    process.exit(0)
  })

  console.log('[db] SQLite (sql.js) pronto —', dbPath)
}

module.exports = facade
