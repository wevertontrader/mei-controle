const jwt = require('jsonwebtoken')
const db = require('../db')

const JWT_SECRET = process.env.JWT_SECRET || 'meipro-secret-2024'

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    let user
    try {
      user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at, role FROM users WHERE id = ?').get(payload.userId)
    } catch (_) {
      user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at FROM users WHERE id = ?').get(payload.userId)
    }
    if (user) user.role = user.email === 'admin@meicontrole.com' ? 'super_admin' : (user.role || 'empresa')
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })
    if ((user.role || 'empresa') !== 'super_admin') {
      const trialEndsAt = new Date(user.trial_ends_at)
      if (trialEndsAt < new Date()) {
        return res.status(403).json({ error: 'Período de teste expirado. Assine um plano para continuar.' })
      }
    }
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
