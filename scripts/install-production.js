#!/usr/bin/env node
/**
 * Instalação de produção: dependências na raiz, build do Vite, dependências em server/.
 * Funciona em Linux, macOS e Windows (Hostinger build, VPS, CI).
 *
 * Uso:
 *   npm run install:production
 *   npm run install:production -- --skip-env
 *   npm run install:production -- --base-url=https://seu-dominio.com
 *
 * Variável opcional: INSTALL_BASE_URL (se não passar --base-url)
 */

import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const serverDir = path.join(root, 'server')

function parseArgs(argv) {
  let skipEnv = false
  let baseUrl = (process.env.INSTALL_BASE_URL || '').trim()
  for (const a of argv) {
    if (a === '--skip-env') skipEnv = true
    else if (a.startsWith('--base-url=')) baseUrl = a.slice('--base-url='.length).trim()
  }
  baseUrl = baseUrl.replace(/\/$/, '')
  return { skipEnv, baseUrl }
}

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10)
  if (Number.isFinite(major) && major < 18) {
    console.error(`Node.js 18 ou superior é necessário. Versão atual: ${process.version}`)
    process.exit(1)
  }
}

function runNpm(title, npmArgv, cwd) {
  console.log(`\n[MEI Controle] ${title}\n`)
  let r
  if (process.platform === 'win32') {
    const line = ['npm', ...npmArgv].join(' ')
    r = spawnSync('cmd.exe', ['/d', '/s', '/c', line], { cwd, stdio: 'inherit', env: process.env })
  } else {
    r = spawnSync('npm', npmArgv, { cwd, stdio: 'inherit', env: process.env, shell: false })
  }
  if (r.error) {
    console.error(r.error)
    process.exit(1)
  }
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function ensureEnvFile({ skipEnv, baseUrl }) {
  if (skipEnv) {
    console.log('\n[MEI Controle] --skip-env: não criando nem alterando .env (use variáveis no painel da hospedagem).\n')
    return
  }
  const envPath = path.join(root, '.env')
  if (fs.existsSync(envPath)) {
    console.log('\n[MEI Controle] Arquivo .env já existe — mantido. Ajuste BASE_URL e JWT_SECRET se precisar.\n')
    return
  }
  const url = baseUrl || 'https://seu-dominio.com'
  const jwt = randomBytes(32).toString('base64')
  const body =
    `# Gerado por npm run install:production\n` +
    `# Edite conforme sua hospedagem (ou use variáveis no painel — elas têm prioridade sobre o arquivo).\n` +
    `NODE_ENV=production\n` +
    `PORT=3001\n` +
    `JWT_SECRET=${jwt}\n` +
    `BASE_URL=${url}\n` +
    `MERCADOPAGO_ACCESS_TOKEN=\n`
  fs.writeFileSync(envPath, body, 'utf8')
  console.log(`\n[MEI Controle] Criado .env com BASE_URL=${url}. Troque a senha do admin após o primeiro login.\n`)
}

function verifyArtifacts() {
  const distIndex = path.join(root, 'dist', 'index.html')
  if (!fs.existsSync(distIndex)) {
    console.error('\n[MEI Controle] Erro: dist/index.html não encontrado após o build. Verifique erros do Vite acima.\n')
    process.exit(1)
  }
  const serverNodeModules = path.join(serverDir, 'node_modules')
  if (!fs.existsSync(path.join(serverNodeModules, 'express'))) {
    console.error('\n[MEI Controle] Erro: dependências do servidor incompletas (server/node_modules).\n')
    process.exit(1)
  }
  console.log('\n[MEI Controle] Verificação: dist/ e server/node_modules OK.\n')
}

const { skipEnv, baseUrl } = parseArgs(process.argv.slice(2))

console.log('==========================================')
console.log('  MEI Controle — instalação (produção)')
console.log('==========================================')

checkNodeVersion()
console.log(`[OK] Node.js ${process.version}`)

runNpm('npm install (raiz)', ['install', '--no-fund', '--no-audit'], root)
runNpm('Build do frontend (Vite)', ['run', 'build'], root)
runNpm('npm install no servidor (--omit=dev)', ['install', '--omit=dev', '--no-fund', '--no-audit'], serverDir)

ensureEnvFile({ skipEnv, baseUrl })
verifyArtifacts()

console.log('==========================================')
console.log('  Instalação concluída')
console.log('==========================================')
console.log('Iniciar API + frontend estático: NODE_ENV=production node server/index.js')
console.log('SQLite: server/database/meipro.sqlite (criado na primeira execução)')
console.log('Admin padrão: admin@meicontrole.com / admin123 — altere em produção.')
console.log('')
