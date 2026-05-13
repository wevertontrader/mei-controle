const mail = require('./mail')
const { sendEvolutionText, normalizeWhatsappToNumber } = require('./evolutionSubscribers')

/**
 * Após cadastro de empresa: e-mail de boas-vindas (SMTP) e WhatsApp (Evolution), se configurados.
 */
async function notifyNewEmpresaAfterRegister({ nome, email, empresa, trialEndsAt, whatsapp }) {
  const results = { email: null, whatsapp: null }

  try {
    results.email = await mail.sendWelcomeSignupEmail({ to: email, nome, empresa, trialEndsAt })
  } catch (e) {
    console.error('[cadastro] e-mail boas-vindas:', e.message || e)
    results.email = { ok: false, error: e.message }
  }

  const toNumber = normalizeWhatsappToNumber(whatsapp)
  if (toNumber) {
    const trial = trialEndsAt
      ? new Date(trialEndsAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : ''
    const text =
      `Olá ${nome || 'Cliente'}! Bem-vindo(a) ao *MEI Controle*.\n` +
      `A empresa *${empresa || 'sua empresa'}* já pode usar o sistema.\n` +
      (trial ? `Seu teste gratuito vai até: ${trial}.\n` : '') +
      `Acesse pelo navegador com o e-mail que você cadastrou. Qualquer dúvida, estamos à disposição.`
    try {
      const r = await sendEvolutionText({ text, toNumber, override: null })
      results.whatsapp = r
      if (!r.ok && !r.skipped) console.error('[cadastro] WhatsApp boas-vindas:', r.error)
    } catch (e) {
      console.error('[cadastro] WhatsApp boas-vindas:', e.message || e)
      results.whatsapp = { ok: false, error: e.message }
    }
  }

  return results
}

module.exports = { notifyNewEmpresaAfterRegister }
