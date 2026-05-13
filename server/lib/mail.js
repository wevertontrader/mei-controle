const nodemailer = require('nodemailer')
const db = require('../db')

function cfg(chave) {
  const envVal = process.env[chave]
  if (envVal != null && String(envVal).trim() !== '') return String(envVal).trim()
  try {
    const row = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get(chave)
    return (row?.valor || '').trim()
  } catch (_) {
    return ''
  }
}

function publicAppUrl() {
  const u = (cfg('BASE_URL') || process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
  return u
}

function isSmtpConfigured() {
  return Boolean(cfg('SMTP_HOST') && cfg('SMTP_FROM') && cfg('SMTP_USER'))
}

function createTransport() {
  const host = cfg('SMTP_HOST')
  const port = parseInt(cfg('SMTP_PORT') || '587', 10) || 587
  const secure =
    cfg('SMTP_SECURE') === '1' ||
    String(cfg('SMTP_SECURE')).toLowerCase() === 'true' ||
    port === 465
  const opts = {
    host,
    port,
    secure,
  }
  const user = cfg('SMTP_USER')
  const pass = cfg('SMTP_PASS')
  if (user || pass) {
    opts.auth = { user: user || '', pass: pass || '' }
  }
  return nodemailer.createTransport(opts)
}

async function sendMail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) {
    return { skipped: true, reason: 'smtp_nao_configurado' }
  }
  if (!to || !String(to).includes('@')) {
    return { skipped: true, reason: 'email_invalido' }
  }
  const fromName = cfg('SMTP_FROM_NAME') || 'MEI Controle'
  const fromAddr = cfg('SMTP_FROM')
  const from = `${fromName} <${fromAddr}>`
  const transporter = createTransport()
  await transporter.sendMail({
    from,
    to: String(to).trim(),
    subject,
    text: text || undefined,
    html: html || undefined,
  })
  return { ok: true }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sendWelcomeSignupEmail({ to, nome, empresa, trialEndsAt }) {
  const base = publicAppUrl()
  const trial = trialEndsAt
    ? new Date(trialEndsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—'
  const subject = `Bem-vindo(a) ao MEI Controle — ${empresa || 'sua empresa'}`
  const text =
    `Olá, ${nome}!\n\n` +
    `Sua conta foi criada com sucesso para a empresa "${empresa}".\n` +
    `Você tem período de teste até ${trial}.\n\n` +
    `Acesse o painel: ${base}/login\n\n` +
    `— MEI Controle`
  const html = `
    <p>Olá, <strong>${escapeHtml(nome)}</strong>,</p>
    <p>Sua conta foi criada com sucesso para <strong>${escapeHtml(empresa)}</strong>.</p>
    <p>Seu período de teste vai até <strong>${escapeHtml(trial)}</strong>.</p>
    <p><a href="${escapeHtml(base)}/login">Entrar no MEI Controle</a></p>
    <p style="color:#666;font-size:12px">— MEI Controle</p>
  `
  return sendMail({ to, subject, text, html })
}

async function sendPasswordResetEmail({ to, nome, resetUrl }) {
  const subject = 'Redefinição de senha — MEI Controle'
  const text =
    `Olá, ${nome || 'usuário(a)'}\n\n` +
    `Recebemos um pedido para redefinir a senha da sua conta no MEI Controle.\n` +
    `Use o link abaixo (válido por 1 hora):\n\n${resetUrl}\n\n` +
    `Se você não pediu isso, ignore este e-mail.\n\n` +
    `— MEI Controle`
  const html = `
    <p>Olá, <strong>${escapeHtml(nome || 'usuário(a)')}</strong>,</p>
    <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
    <p><a href="${escapeHtml(resetUrl)}">Redefinir minha senha</a> <span style="color:#666">(válido por 1 hora)</span></p>
    <p style="color:#666;font-size:12px">Se você não pediu, ignore este e-mail.</p>
    <p style="color:#666;font-size:12px">— MEI Controle</p>
  `
  return sendMail({ to, subject, text, html })
}

async function sendSubscriptionRenewedEmail({ to, nome, empresa, planoNome, proximoPagamento }) {
  const base = publicAppUrl()
  const subject = `Assinatura renovada — ${planoNome || 'MEI Controle'}`
  let prox = '—'
  if (proximoPagamento && /^\d{4}-\d{2}-\d{2}/.test(String(proximoPagamento))) {
    const d = new Date(String(proximoPagamento).slice(0, 10) + 'T12:00:00')
    if (!isNaN(d.getTime())) prox = d.toLocaleDateString('pt-BR')
  }
  const text =
    `Olá, ${nome}!\n\n` +
    `Confirmamos o pagamento e a renovação da assinatura (${planoNome || 'plano'}) para ${empresa || 'sua empresa'}.\n` +
    `Próximo vencimento: ${prox}.\n\n` +
    `Acesse: ${base}/dashboard\n\n` +
    `— MEI Controle`
  const html = `
    <p>Olá, <strong>${escapeHtml(nome)}</strong>,</p>
    <p>Confirmamos o pagamento e a <strong>renovação da assinatura</strong>
    (${escapeHtml(planoNome || 'plano')}) para <strong>${escapeHtml(empresa || 'sua empresa')}</strong>.</p>
    <p>Próximo vencimento: <strong>${escapeHtml(prox)}</strong>.</p>
    <p><a href="${escapeHtml(base)}/dashboard">Abrir o painel</a></p>
    <p style="color:#666;font-size:12px">— MEI Controle</p>
  `
  return sendMail({ to, subject, text, html })
}

module.exports = {
  cfg,
  isSmtpConfigured,
  sendMail,
  sendWelcomeSignupEmail,
  sendPasswordResetEmail,
  sendSubscriptionRenewedEmail,
  publicAppUrl,
}
