const jwt = require('jsonwebtoken')
const db = require('../db')
const { parseSidebarPermissions, apiPathToPermission } = require('../lib/permissions')

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
      user = db
        .prepare(
          'SELECT id, nome, email, empresa, trial_ends_at, role, owner_user_id, sidebar_permissions FROM users WHERE id = ?',
        )
        .get(payload.userId)
    } catch (_) {
      user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at, role FROM users WHERE id = ?').get(payload.userId)
    }
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado' })

    const role =
      user.email === 'admin@meicontrole.com' ? 'super_admin' : user.role || 'empresa'
    user.role = role

    const ownerId = user.owner_user_id != null ? Number(user.owner_user_id) : null
    user.empresaUserId = role === 'colaborador' && ownerId ? ownerId : user.id

    const permsRaw = user.sidebar_permissions
    user.sidebar_permissions = parseSidebarPermissions(permsRaw)

    if (role !== 'super_admin') {
      let trialEndsAt = user.trial_ends_at
      if (role === 'colaborador' && ownerId) {
        const owner = db.prepare('SELECT trial_ends_at FROM users WHERE id = ?').get(ownerId)
        if (owner?.trial_ends_at) trialEndsAt = owner.trial_ends_at
      }
      if (new Date(trialEndsAt) < new Date()) {
        return res.status(403).json({ error: 'Período de teste expirado. Assine um plano para continuar.' })
      }
    }

    if (role === 'colaborador' && ownerId) {
      const perm = apiPathToPermission(req.originalUrl || '')
      if (perm && !user.sidebar_permissions.includes(perm)) {
        return res.status(403).json({ error: 'Sem permissão para esta área' })
      }
    }

    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
