const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, empresa } = req.body
    if (!nome || !email || !senha || !empresa) {
      return res.status(400).json({ error: 'Preencha todos os campos' })
    }
    const hash = await bcrypt.hash(senha, 10)
    const trialEndsAt = addDays(new Date(), 3)
    const result = db.prepare(`
      INSERT INTO users (nome, email, senha, empresa, trial_ends_at) VALUES (?, ?, ?, ?, ?)
    `).run(nome, email, hash, empresa, trialEndsAt)
    const user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid)
    user.role = 'empresa'
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ user, token, trialEndsAt })
  } catch (e) {
    if (e.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' })
    }
    res.status(500).json({ error: e.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body
    if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha obrigatórios' })
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos' })
    const ok = await bcrypt.compare(senha, user.senha)
    if (!ok) return res.status(401).json({ error: 'E-mail ou senha inválidos' })
    if (user.role !== 'super_admin') {
      const trialEndsAt = new Date(user.trial_ends_at)
      if (trialEndsAt < new Date()) {
        return res.status(403).json({ error: 'Período de teste expirado. Assine um plano para continuar.' })
      }
    }
    const { senha: _, ...safeUser } = user
    safeUser.role = user.email === 'admin@meicontrole.com' ? 'super_admin' : (safeUser.role || 'empresa')
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ user: safeUser, token, trialEndsAt: user.trial_ends_at })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  const role = req.user.email === 'admin@meicontrole.com' ? 'super_admin' : (req.user.role || 'empresa')
  const user = { ...req.user, role }
  res.json({ user })
})

router.put('/me', authMiddleware, (req, res) => {
  try {
    const { nome, empresa, cpf, whatsapp, cnpj, logotipo, plano } = req.body
    const updates = []
    const values = []
    if (nome !== undefined) { updates.push('nome = ?'); values.push(nome) }
    if (empresa !== undefined) { updates.push('empresa = ?'); values.push(empresa) }
    if (cpf !== undefined) { updates.push('cpf = ?'); values.push(cpf) }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp) }
    if (cnpj !== undefined) { updates.push('cnpj = ?'); values.push(cnpj) }
    if (logotipo !== undefined) { updates.push('logotipo = ?'); values.push(logotipo) }
    if (plano !== undefined) { updates.push('plano = ?'); values.push(plano) }
    if (req.body.email !== undefined) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(req.body.email, req.user.id)
      if (existing) return res.status(400).json({ error: 'Este e-mail já está em uso' })
      updates.push('email = ?')
      values.push(req.body.email)
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    values.push(req.user.id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at, role, cpf, whatsapp, cnpj, logotipo, plano FROM users WHERE id = ?').get(req.user.id)
    const { senha: _, ...safeUser } = user
    res.json({ user: { ...safeUser, role: safeUser.role || 'empresa' } })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
