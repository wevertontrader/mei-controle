const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')
const { uploadLogoMiddleware, unlinkStoredLogo } = require('../lib/logoStorage')
const { notifyNewEmpresaAfterRegister } = require('../lib/signupNotifications')
const mail = require('../lib/mail')
const { parseSidebarPermissions } = require('../lib/permissions')

const router = express.Router()

const ME_USER_COLUMNS =
  'id, nome, email, empresa, trial_ends_at, role, owner_user_id, sidebar_permissions, cpf, whatsapp, cnpj, logotipo, logotipo_pdv, plano'

function pickPdvLogo(r) {
  if (!r) return ''
  const a = r.logotipo_pdv != null && String(r.logotipo_pdv).trim()
  const b = r.logotipo != null && String(r.logotipo).trim()
  return a || b || ''
}

function buildMeUserPayload(row) {
  if (!row) return null
  const role = row.email === 'admin@meicontrole.com' ? 'super_admin' : (row.role || 'empresa')
  let trialEffective = row.trial_ends_at
  if ((row.role || '') === 'colaborador' && row.owner_user_id) {
    const ownerTrial = db.prepare('SELECT trial_ends_at FROM users WHERE id = ?').get(row.owner_user_id)
    if (ownerTrial?.trial_ends_at) trialEffective = ownerTrial.trial_ends_at
  }
  let pdvEmpresa = row.empresa || ''
  let pdvSource = row
  if (row.owner_user_id) {
    const ownerBranding = db
      .prepare('SELECT empresa, logotipo, logotipo_pdv FROM users WHERE id = ?')
      .get(row.owner_user_id)
    if (ownerBranding) {
      pdvEmpresa = ownerBranding.empresa || pdvEmpresa
      pdvSource = ownerBranding
    }
  }
  const pdv_logo_url = pickPdvLogo(pdvSource)
  return {
    ...row,
    role,
    trial_ends_at: trialEffective,
    sidebar_permissions: parseSidebarPermissions(row.sidebar_permissions),
    pdv_logo_url,
    pdv_empresa_nome: pdvEmpresa,
  }
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, empresa, whatsapp } = req.body
    if (!nome || !email || !senha || !empresa) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' })
    }
    const hash = await bcrypt.hash(senha, 10)
    const trialEndsAt = addDays(new Date(), 3)
    const whatsNorm = String(whatsapp || '').trim().slice(0, 32)
    const result = db.prepare(`
      INSERT INTO users (nome, email, senha, empresa, trial_ends_at, whatsapp) VALUES (?, ?, ?, ?, ?, ?)
    `).run(nome, email, hash, empresa, trialEndsAt, whatsNorm)
    const user = db.prepare('SELECT id, nome, email, empresa, trial_ends_at, whatsapp FROM users WHERE id = ?')
      .get(result.lastInsertRowid)
    user.role = 'empresa'
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    setImmediate(() => {
      notifyNewEmpresaAfterRegister({
        nome,
        email,
        empresa,
        trialEndsAt,
        whatsapp: whatsNorm,
      }).catch((e) => console.error('[register] notificações pós-cadastro:', e))
    })
    res.json({ user, token, trialEndsAt })
  } catch (e) {
    if (e.message?.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' })
    }
    res.status(500).json({ error: e.message })
  }
})

router.post('/forgot-password', async (req, res) => {
  const generic = {
    ok: true,
    message: 'Se existir uma conta com este e-mail, você receberá um link para redefinir a senha.',
  }
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Informe o e-mail' })
    const user = db.prepare('SELECT id, nome, email, role FROM users WHERE LOWER(email) = ?').get(email)
    if (!user || user.role === 'super_admin') return res.json(generic)

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?').run(
      token,
      expires,
      user.id,
    )

    const base = mail.publicAppUrl()
    const resetUrl = `${base.replace(/\/$/, '')}/redefinir-senha?token=${encodeURIComponent(token)}`
    const r = await mail.sendPasswordResetEmail({ to: user.email, nome: user.nome, resetUrl })
    if (r.skipped) {
      console.warn('[forgot-password] SMTP não configurado — e-mail de recuperação não enviado')
    }
    return res.json(generic)
  } catch (e) {
    console.error('[forgot-password]', e)
    return res.status(500).json({ error: 'Não foi possível processar o pedido. Tente mais tarde.' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const senha = String(req.body?.senha || '')
    if (!token || !senha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' })
    if (senha.length < 6) return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' })

    const row = db.prepare(
      'SELECT id, password_reset_expires FROM users WHERE password_reset_token = ? AND role != ?',
    ).get(token, 'super_admin')
    if (!row?.password_reset_expires || new Date(row.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Link inválido ou expirado. Solicite uma nova redefinição de senha.' })
    }

    const hash = await bcrypt.hash(senha, 10)
    db.prepare(
      'UPDATE users SET senha = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
    ).run(hash, row.id)
    res.json({ ok: true, message: 'Senha alterada. Você já pode entrar com a nova senha.' })
  } catch (e) {
    console.error('[reset-password]', e)
    res.status(500).json({ error: e.message || 'Erro ao redefinir senha' })
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
    let trialEndsAtResponse = user.trial_ends_at
    if (user.role !== 'super_admin') {
      let trialRef = user.trial_ends_at
      if ((user.role || '') === 'colaborador' && user.owner_user_id) {
        const owner = db.prepare('SELECT trial_ends_at FROM users WHERE id = ?').get(user.owner_user_id)
        if (owner?.trial_ends_at) trialRef = owner.trial_ends_at
      }
      trialEndsAtResponse = trialRef
      if (new Date(trialRef) < new Date()) {
        return res.status(403).json({ error: 'Período de teste expirado. Assine um plano para continuar.' })
      }
    }
    const { senha: _, ...safeUser } = user
    safeUser.role = user.email === 'admin@meicontrole.com' ? 'super_admin' : (safeUser.role || 'empresa')
    safeUser.sidebar_permissions = parseSidebarPermissions(safeUser.sidebar_permissions)
    const rowMe = db.prepare(`SELECT ${ME_USER_COLUMNS} FROM users WHERE id = ?`).get(user.id)
    const userOut = rowMe ? buildMeUserPayload(rowMe) : { ...safeUser, pdv_logo_url: '', pdv_empresa_nome: safeUser.empresa || '' }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ user: userOut, token, trialEndsAt: trialEndsAtResponse })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  const row = db.prepare(`SELECT ${ME_USER_COLUMNS} FROM users WHERE id = ?`).get(req.user.id)
  if (!row) return res.status(401).json({ error: 'Usuário não encontrado' })
  res.json({ user: buildMeUserPayload(row) })
})

router.post('/me/logotipo', authMiddleware, (req, res, next) => {
  req.logoUserId = req.user.id
  req.logoFilePrefix = 'logo'
  next()
}, uploadLogoMiddleware, (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie a imagem no campo "logo".' })
    const prevLogo = db.prepare('SELECT logotipo FROM users WHERE id = ?').get(req.user.id)
    if (prevLogo?.logotipo) unlinkStoredLogo(prevLogo.logotipo)
    const publicPath = `/uploads/logos/${req.file.filename}`
    db.prepare('UPDATE users SET logotipo = ? WHERE id = ?').run(publicPath, req.user.id)
    const row = db.prepare(`SELECT ${ME_USER_COLUMNS} FROM users WHERE id = ?`).get(req.user.id)
    res.json({ user: buildMeUserPayload(row) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/me/logotipo-pdv', authMiddleware, (req, res, next) => {
  if (req.user.owner_user_id) {
    return res.status(403).json({ error: 'Apenas o administrador da empresa pode definir a logo do PDV.' })
  }
  req.logoUserId = req.user.id
  req.logoFilePrefix = 'pdv'
  next()
}, uploadLogoMiddleware, (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie a imagem no campo "logo".' })
    const prevPdv = db.prepare('SELECT logotipo_pdv FROM users WHERE id = ?').get(req.user.id)
    if (prevPdv?.logotipo_pdv) unlinkStoredLogo(prevPdv.logotipo_pdv)
    const publicPath = `/uploads/logos/${req.file.filename}`
    db.prepare('UPDATE users SET logotipo_pdv = ? WHERE id = ?').run(publicPath, req.user.id)
    const row = db.prepare(`SELECT ${ME_USER_COLUMNS} FROM users WHERE id = ?`).get(req.user.id)
    res.json({ user: buildMeUserPayload(row) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/me/senha', authMiddleware, async (req, res) => {
  try {
    const { senhaAtual, senhaNova } = req.body
    if (!senhaAtual || !senhaNova) {
      return res.status(400).json({ error: 'Informe a senha atual e a nova senha' })
    }
    if (String(senhaNova).length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' })
    }
    const row = db.prepare('SELECT senha FROM users WHERE id = ?').get(req.user.id)
    if (!row?.senha) return res.status(400).json({ error: 'Não foi possível alterar a senha' })
    const ok = await bcrypt.compare(senhaAtual, row.senha)
    if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' })
    const hash = await bcrypt.hash(String(senhaNova), 10)
    db.prepare('UPDATE users SET senha = ? WHERE id = ?').run(hash, req.user.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

router.put('/me', authMiddleware, (req, res) => {
  try {
    const isColaborador = !!req.user.owner_user_id
    const current = db.prepare('SELECT logotipo, logotipo_pdv FROM users WHERE id = ?').get(req.user.id)
    const { nome, empresa, cpf, whatsapp, cnpj, logotipo, logotipo_pdv, plano } = req.body
    const updates = []
    const values = []
    if (nome !== undefined) { updates.push('nome = ?'); values.push(nome) }
    if (!isColaborador) {
      if (empresa !== undefined) { updates.push('empresa = ?'); values.push(empresa) }
      if (cpf !== undefined) { updates.push('cpf = ?'); values.push(cpf) }
      if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp) }
      if (cnpj !== undefined) { updates.push('cnpj = ?'); values.push(cnpj) }
      if (plano !== undefined) { updates.push('plano = ?'); values.push(plano) }
      if (logotipo_pdv !== undefined) {
        const newVal = logotipo_pdv == null ? '' : String(logotipo_pdv).trim()
        if (current?.logotipo_pdv && current.logotipo_pdv !== newVal) {
          unlinkStoredLogo(current.logotipo_pdv)
        }
        updates.push('logotipo_pdv = ?')
        values.push(newVal)
      }
    }
    if (logotipo !== undefined) {
      const newVal = logotipo == null ? '' : String(logotipo).trim()
      if (current?.logotipo && current.logotipo !== newVal) {
        unlinkStoredLogo(current.logotipo)
      }
      updates.push('logotipo = ?')
      values.push(newVal)
    }
    if (req.body.email !== undefined) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(req.body.email, req.user.id)
      if (existing) return res.status(400).json({ error: 'Este e-mail já está em uso' })
      updates.push('email = ?')
      values.push(req.body.email)
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' })
    values.push(req.user.id)
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    const row = db.prepare(`SELECT ${ME_USER_COLUMNS} FROM users WHERE id = ?`).get(req.user.id)
    res.json({ user: buildMeUserPayload(row) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
