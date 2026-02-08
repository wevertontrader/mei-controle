const { authMiddleware } = require('./auth')

function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Acesso restrito ao super administrador' })
  }
  next()
}

module.exports = { requireSuperAdmin }
