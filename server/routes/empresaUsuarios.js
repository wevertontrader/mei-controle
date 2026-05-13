const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { PERMISSION_KEYS, parseSidebarPermissions } = require('../lib/permissions')

const router = express.Router()

function requireDonoEmpresa(req, res, next) {
  const u = req.user
  if (!u || u.role === 'super_admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  if (u.owner_user_id) {
    return res.status(403).json({ error: 'Apenas o administrador da empresa pode gerenciar usuários.' })
  }
  if ((u.role || 'empresa') !== 'empresa') {
    return res.status(403).json({ error: 'Apenas o administrador da empresa pode gerenciar usuários.' })
  }
  next()
}

router.use(authMiddleware, requireDonoEmpresa)

router.get('/colaboradores', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, nome, email, empresa, role, owner_user_id, sidebar_permissions, created_at
         FROM users WHERE owner_user_id = ? AND role = 'colaborador' ORDER BY nome`,
      )
      .all(req.user.id)
    const list = rows.map((r) => ({
      ...r,
      sidebar_permissions: parseSidebarPermissions(r.sidebar_permissions),
    }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/colaboradores', async (req, res) => {
  try {
    const { nome, email, senha, sidebar_permissions: permsBody } = req.body
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' })
    }
    if (String(senha).length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
    }
    const owner = db
      .prepare('SELECT id, empresa, trial_ends_at FROM users WHERE id = ? AND role = ? AND owner_user_id IS NULL')
      .get(req.user.id, 'empresa')
    if (!owner) return res.status(403).json({ error: 'Conta inválida' })

    let perms = Array.isArray(permsBody) ? permsBody.map(String) : []
    perms = [...new Set(perms)].filter((k) => PERMISSION_KEYS.includes(k) && k !== 'usuarios')
    if (perms.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos uma página de acesso' })
    }

    const hash = await bcrypt.hash(String(senha), 10)
    const emailNorm = String(email).trim().toLowerCase()
    const result = db
      .prepare(
        `INSERT INTO users (nome, email, senha, empresa, trial_ends_at, role, owner_user_id, sidebar_permissions)
         VALUES (?, ?, ?, ?, ?, 'colaborador', ?, ?)`,
      )
      .run(
        String(nome).trim(),
        emailNorm,
        hash,
        owner.empresa,
        owner.trial_ends_at,
        owner.id,
        JSON.stringify(perms),
      )
    const row = db
      .prepare('SELECT id, nome, email, empresa, role, owner_user_id, sidebar_permissions, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid)
    res.status(201).json({
      ...row,
      sidebar_permissions: parseSidebarPermissions(row.sidebar_permissions),
    })
  } catch (e) {
    if (e.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' })
    }
    res.status(500).json({ error: e.message })
  }
})

router.put('/colaboradores/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!id) return res.status(400).json({ error: 'ID inválido' })
    const existing = db
      .prepare('SELECT id FROM users WHERE id = ? AND owner_user_id = ? AND role = ?')
      .get(id, req.user.id, 'colaborador')
    if (!existing) return res.status(404).json({ error: 'Colaborador não encontrado' })

    const { nome, email, senha, sidebar_permissions: permsBody } = req.body
    const updates = []
    const values = []

    if (nome !== undefined) {
      updates.push('nome = ?')
      values.push(String(nome).trim())
    }
    if (email !== undefined) {
      const emailNorm = String(email).trim().toLowerCase()
      const clash = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(emailNorm, id)
      if (clash) return res.status(400).json({ error: 'Este e-mail já está em uso' })
      updates.push('email = ?')
      values.push(emailNorm)
    }
    if (senha !== undefined && String(senha).trim().length > 0) {
      if (String(senha).length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
      }
      const hash = await bcrypt.hash(String(senha), 10)
      updates.push('senha = ?')
      values.push(hash)
    }
    if (permsBody !== undefined) {
      let perms = Array.isArray(permsBody) ? permsBody.map(String) : []
      perms = [...new Set(perms)].filter((k) => PERMISSION_KEYS.includes(k) && k !== 'usuarios')
      if (perms.length === 0) {
        return res.status(400).json({ error: 'Selecione ao menos uma página de acesso' })
      }
      updates.push('sidebar_permissions = ?')
      values.push(JSON.stringify(perms))
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    }
    values.push(id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const row = db
      .prepare('SELECT id, nome, email, empresa, role, owner_user_id, sidebar_permissions, created_at FROM users WHERE id = ?')
      .get(id)
    res.json({
      ...row,
      sidebar_permissions: parseSidebarPermissions(row.sidebar_permissions),
    })
  } catch (e) {
    if (e.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Este e-mail já está em uso' })
    }
    res.status(500).json({ error: e.message })
  }
})

router.delete('/colaboradores/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!id) return res.status(400).json({ error: 'ID inválido' })
    const r = db
      .prepare('DELETE FROM users WHERE id = ? AND owner_user_id = ? AND role = ?')
      .run(id, req.user.id, 'colaborador')
    if (r.changes === 0) return res.status(404).json({ error: 'Colaborador não encontrado' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router