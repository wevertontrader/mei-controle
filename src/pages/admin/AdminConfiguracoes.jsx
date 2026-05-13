import { useState, useEffect } from 'react'
import { CreditCard, MessageCircle, Eye, EyeOff, Send, Phone, Mail } from 'lucide-react'
import { admin } from '../../api/client'

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [modalTesteWhatsapp, setModalTesteWhatsapp] = useState(false)
  const [telefoneTesteWhatsapp, setTelefoneTesteWhatsapp] = useState('')
  const [testandoWhatsapp, setTestandoWhatsapp] = useState(false)
  const [msgTesteWhatsapp, setMsgTesteWhatsapp] = useState('')

  const [form, setForm] = useState({
    CONTACT_EMAIL: '',
    CONTACT_PHONE: '',
    CONTACT_WHATSAPP: '',
    MERCADOPAGO_ACCESS_TOKEN: '',
    MERCADOPAGO_PUBLIC_KEY: '',
    MERCADOPAGO_WEBHOOK_URL: '',
    BASE_URL: '',
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_SECURE: '',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_FROM: '',
    SMTP_FROM_NAME: 'MEI Controle',
    EVOLUTION_API_URL: '',
    EVOLUTION_API_KEY: '',
    EVOLUTION_INSTANCIA_ASSINANTES: '',
    EVOLUTION_APIKEY_ASSINANTES: '',
    EVOLUTION_API_PATH_PREFIX: '',
    MSG_WHATSAPP_BOAS_VINDAS: '',
    MSG_WHATSAPP_PAGAMENTO_CONFIRMADO: '',
  })

  const [mostrar, setMostrar] = useState({
    MERCADOPAGO_ACCESS_TOKEN: false,
    MERCADOPAGO_PUBLIC_KEY: false,
    EVOLUTION_API_KEY: false,
    EVOLUTION_APIKEY_ASSINANTES: false,
    SMTP_PASS: false,
  })

  function alternarCampo(chave) {
    setMostrar((m) => ({ ...m, [chave]: !m[chave] }))
  }

  useEffect(() => {
    admin.configuracoes
      .get()
      .then((data) => {
        setConfig(data)
        setForm({
          CONTACT_EMAIL: data.CONTACT_EMAIL || '',
          CONTACT_PHONE: data.CONTACT_PHONE || '',
          CONTACT_WHATSAPP: data.CONTACT_WHATSAPP || '',
          MERCADOPAGO_ACCESS_TOKEN: data.MERCADOPAGO_ACCESS_TOKEN || '',
          MERCADOPAGO_PUBLIC_KEY: data.MERCADOPAGO_PUBLIC_KEY || '',
          MERCADOPAGO_WEBHOOK_URL: data.MERCADOPAGO_WEBHOOK_URL || '',
          BASE_URL: data.BASE_URL || 'http://localhost:5173',
          SMTP_HOST: data.SMTP_HOST || '',
          SMTP_PORT: data.SMTP_PORT || '587',
          SMTP_SECURE: data.SMTP_SECURE || '',
          SMTP_USER: data.SMTP_USER || '',
          SMTP_PASS: data.SMTP_PASS || '',
          SMTP_FROM: data.SMTP_FROM || '',
          SMTP_FROM_NAME: data.SMTP_FROM_NAME || 'MEI Controle',
          EVOLUTION_API_URL: data.EVOLUTION_API_URL || '',
          EVOLUTION_API_KEY: data.EVOLUTION_API_KEY || '',
          EVOLUTION_INSTANCIA_ASSINANTES: data.EVOLUTION_INSTANCIA_ASSINANTES || '',
          EVOLUTION_APIKEY_ASSINANTES: data.EVOLUTION_APIKEY_ASSINANTES || '',
          EVOLUTION_API_PATH_PREFIX: data.EVOLUTION_API_PATH_PREFIX || '',
          MSG_WHATSAPP_BOAS_VINDAS: data.MSG_WHATSAPP_BOAS_VINDAS || '',
          MSG_WHATSAPP_PAGAMENTO_CONFIRMADO: data.MSG_WHATSAPP_PAGAMENTO_CONFIRMADO || '',
        })
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setSalvando(true)
    const payload = {
      ...form,
      CONTACT_EMAIL: form.CONTACT_EMAIL != null ? String(form.CONTACT_EMAIL) : '',
      CONTACT_PHONE: form.CONTACT_PHONE != null ? String(form.CONTACT_PHONE) : '',
      CONTACT_WHATSAPP: form.CONTACT_WHATSAPP != null ? String(form.CONTACT_WHATSAPP) : '',
    }
    admin.configuracoes
      .update(payload)
      .then((data) => {
        setSucesso('Configurações salvas com sucesso.')
        setConfig(data)
        setForm((prev) => {
          const next = { ...prev }
          for (const key of Object.keys(prev)) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              next[key] = data[key] == null ? '' : String(data[key])
            }
          }
          return next
        })
      })
      .catch((e) => setErro(e.message))
      .finally(() => setSalvando(false))
  }

  async function enviarTesteWhatsapp() {
    setMsgTesteWhatsapp('')
    const tel = telefoneTesteWhatsapp.trim()
    if (!tel) {
      setMsgTesteWhatsapp('Informe o número com DDD.')
      return
    }
    setTestandoWhatsapp(true)
    try {
      await admin.testWhatsappAssinantes(tel, {
        EVOLUTION_API_URL: form.EVOLUTION_API_URL,
        EVOLUTION_INSTANCIA_ASSINANTES: form.EVOLUTION_INSTANCIA_ASSINANTES,
        EVOLUTION_APIKEY_ASSINANTES: form.EVOLUTION_APIKEY_ASSINANTES,
        EVOLUTION_API_KEY: form.EVOLUTION_API_KEY,
        EVOLUTION_API_PATH_PREFIX: form.EVOLUTION_API_PATH_PREFIX,
      })
      setMsgTesteWhatsapp('Mensagem enviada. Verifique o WhatsApp.')
      setTimeout(() => {
        setModalTesteWhatsapp(false)
        setTelefoneTesteWhatsapp('')
        setMsgTesteWhatsapp('')
      }, 2000)
    } catch (e) {
      setMsgTesteWhatsapp(e.message || 'Falha no teste.')
    } finally {
      setTestandoWhatsapp(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Configurações</h1>
        <p className="text-slate-400 mt-1">Defina as credenciais dos serviços integrados.</p>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
      {sucesso && <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">{sucesso}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            Contato na página inicial
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            E-mail e telefone aparecem no rodapé da landing. O WhatsApp abre o aplicativo Web ou celular no número
            informado (use DDD + número, com ou sem formatação).
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail de contato</label>
              <input
                type="email"
                value={form.CONTACT_EMAIL}
                onChange={(e) => setForm({ ...form, CONTACT_EMAIL: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="contato@seudominio.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Telefone (exibido no rodapé)</label>
              <input
                type="tel"
                value={form.CONTACT_PHONE}
                onChange={(e) => setForm({ ...form, CONTACT_PHONE: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="(11) 3456-7890"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">WhatsApp (número do botão flutuante)</label>
              <input
                type="tel"
                value={form.CONTACT_WHATSAPP}
                onChange={(e) => setForm({ ...form, CONTACT_WHATSAPP: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="5511999998888 ou (11) 99999-8888"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500 mt-1">
                Se ficar em branco, o sistema tenta usar o <strong className="text-slate-400">telefone</strong> acima
                para o link do WhatsApp. O link usa o código 55 se faltar.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Mercado Pago
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Configure o token de acesso para processar pagamentos. Obtenha em{' '}
            <a
              href="https://www.mercadopago.com.br/developers"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline"
            >
              mercadopago.com.br/developers
            </a>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Access Token</label>
              <div className="relative">
                <input
                  type={mostrar.MERCADOPAGO_ACCESS_TOKEN ? 'text' : 'password'}
                  value={form.MERCADOPAGO_ACCESS_TOKEN}
                  onChange={(e) => setForm({ ...form, MERCADOPAGO_ACCESS_TOKEN: e.target.value })}
                  className="w-full px-4 py-2 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="APP_USR-..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => alternarCampo('MERCADOPAGO_ACCESS_TOKEN')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  aria-label={mostrar.MERCADOPAGO_ACCESS_TOKEN ? 'Ocultar Access Token' : 'Mostrar Access Token'}
                  title={mostrar.MERCADOPAGO_ACCESS_TOKEN ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrar.MERCADOPAGO_ACCESS_TOKEN ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {config.MERCADOPAGO_ACCESS_TOKEN && !form.MERCADOPAGO_ACCESS_TOKEN && (
                <p className="text-xs text-slate-500 mt-1">Configurado (deixe em branco para manter)</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Public Key (opcional)</label>
              <div className="relative">
                <input
                  type={mostrar.MERCADOPAGO_PUBLIC_KEY ? 'text' : 'password'}
                  value={form.MERCADOPAGO_PUBLIC_KEY}
                  onChange={(e) => setForm({ ...form, MERCADOPAGO_PUBLIC_KEY: e.target.value })}
                  className="w-full px-4 py-2 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="APP_USR-..."
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => alternarCampo('MERCADOPAGO_PUBLIC_KEY')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  aria-label={mostrar.MERCADOPAGO_PUBLIC_KEY ? 'Ocultar Public Key' : 'Mostrar Public Key'}
                  title={mostrar.MERCADOPAGO_PUBLIC_KEY ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrar.MERCADOPAGO_PUBLIC_KEY ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">URL base (redirect após pagamento)</label>
              <input
                type="url"
                value={form.BASE_URL}
                onChange={(e) => setForm({ ...form, BASE_URL: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="http://localhost:5173"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">URL do webhook (opcional)</label>
              <input
                type="url"
                value={form.MERCADOPAGO_WEBHOOK_URL}
                onChange={(e) => setForm({ ...form, MERCADOPAGO_WEBHOOK_URL: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="https://seu-dominio.com/api/assinatura/webhook"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                No Mercado Pago (Sua aplicação → Webhooks ou URL de notificação), use a mesma URL pública HTTPS do
                backend, terminando em{' '}
                <code className="text-slate-400">/api/assinatura/webhook</code> — exemplo:{' '}
                <code className="text-slate-400">https://api.seudominio.com.br/api/assinatura/webhook</code>. Se o
                front e a API estiverem no mesmo domínio (proxy em <code className="text-slate-400">/api</code>), pode
                deixar este campo em branco: o checkout enviará automaticamente{' '}
                <code className="text-slate-400">{'{origem da URL base}'}/api/assinatura/webhook</code> (não funciona
                com localhost). Eventos: pagamentos aprovados.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
            <Mail className="w-5 h-5 text-sky-400" />
            E-mail (SMTP)
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Usado para boas-vindas no cadastro, recuperação de senha e aviso de renovação de assinatura. A URL base
            acima (Mercado Pago) também define os links nos e-mails.
          </p>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Servidor (host)</label>
                <input
                  type="text"
                  value={form.SMTP_HOST}
                  onChange={(e) => setForm({ ...form, SMTP_HOST: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="smtp.seudominio.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Porta</label>
                <input
                  type="text"
                  value={form.SMTP_PORT}
                  onChange={(e) => setForm({ ...form, SMTP_PORT: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="587 ou 465"
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">TLS seguro (465)</label>
              <select
                value={form.SMTP_SECURE}
                onChange={(e) => setForm({ ...form, SMTP_SECURE: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              >
                <option value="">Automático (465 = SSL)</option>
                <option value="0">Não (STARTTLS em 587)</option>
                <option value="1">Sim (SSL direto, típico porta 465)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Usuário SMTP</label>
              <input
                type="text"
                value={form.SMTP_USER}
                onChange={(e) => setForm({ ...form, SMTP_USER: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="usuario@seudominio.com"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha SMTP</label>
              <div className="relative">
                <input
                  type={mostrar.SMTP_PASS ? 'text' : 'password'}
                  value={form.SMTP_PASS}
                  onChange={(e) => setForm({ ...form, SMTP_PASS: e.target.value })}
                  className="w-full px-4 py-2 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => alternarCampo('SMTP_PASS')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
                  aria-label={mostrar.SMTP_PASS ? 'Ocultar senha SMTP' : 'Mostrar senha SMTP'}
                >
                  {mostrar.SMTP_PASS ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {config.SMTP_PASS && !form.SMTP_PASS && (
                <p className="text-xs text-slate-500 mt-1">Configurado (deixe em branco para manter)</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-mail remetente (From)</label>
                <input
                  type="email"
                  value={form.SMTP_FROM}
                  onChange={(e) => setForm({ ...form, SMTP_FROM: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="noreply@seudominio.com"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome do remetente</label>
                <input
                  type="text"
                  value={form.SMTP_FROM_NAME}
                  onChange={(e) => setForm({ ...form, SMTP_FROM_NAME: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="MEI Controle"
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Sem SMTP configurado, o cadastro e o Mercado Pago seguem funcionando, mas não serão enviados e-mails de
              boas-vindas, recuperação de senha ou renovação. WhatsApp de boas-vindas no cadastro usa a Evolution
              (abaixo), se o número for informado no formulário de cadastro.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            Evolution API (URL geral)
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            URL base da sua Evolution (sem barra no final). Usada também para os envios aos assinantes abaixo.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">URL da API</label>
              <input
                type="url"
                value={form.EVOLUTION_API_URL}
                onChange={(e) => setForm({ ...form, EVOLUTION_API_URL: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="https://sua-evolution-api.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">API Key (geral)</label>
              <div className="relative">
                <input
                  type={mostrar.EVOLUTION_API_KEY ? 'text' : 'password'}
                  value={form.EVOLUTION_API_KEY}
                  onChange={(e) => setForm({ ...form, EVOLUTION_API_KEY: e.target.value })}
                  className="w-full px-4 py-2 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Chave global da Evolution"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => alternarCampo('EVOLUTION_API_KEY')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  aria-label={mostrar.EVOLUTION_API_KEY ? 'Ocultar API Key' : 'Mostrar API Key'}
                  title={mostrar.EVOLUTION_API_KEY ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrar.EVOLUTION_API_KEY ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prefixo do path (opcional)</label>
              <input
                type="text"
                value={form.EVOLUTION_API_PATH_PREFIX}
                onChange={(e) => setForm({ ...form, EVOLUTION_API_PATH_PREFIX: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="Ex.: vazio OU /v1 OU /api — conforme sua instalação"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500 mt-1">
                Só preencha se a Evolution estiver atrás de um prefixo (ex. rota base{' '}
                <code className="text-slate-400">/v1/message/sendText/...</code>). Deixe vazio na maioria dos casos.
              </p>
            </div>
            <p className="text-xs text-amber-400/90 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2">
              <strong className="text-amber-200">Credenciais no painel</strong> têm prioridade sobre variáveis{' '}
              <code className="text-slate-300">EVOLUTION_*</code> no arquivo <code className="text-slate-300">.env</code>{' '}
              do servidor. Se ainda houver URL ou chave antiga no .env, ela era aplicada antes e podia ignorar o que você
              salvou aqui — isso já foi corrigido no backend.
            </p>
            <p className="text-xs text-slate-500">
              HTTPS com certificado inválido: defina <code className="text-slate-400">EVOLUTION_TLS_INSECURE=1</code> no{' '}
              <code className="text-slate-400">.env</code> do servidor (apenas desenvolvimento).
            </p>
          </div>

          <h2 className="flex items-center gap-2 font-semibold text-white mb-4 mt-8">
            <MessageCircle className="w-5 h-5 text-sky-400" />
            WhatsApp — assinantes (instância dedicada)
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Instância e chave usadas para avisar clientes por WhatsApp quando o pagamento do plano for confirmado no
            Mercado Pago. O número de destino é o <strong className="text-slate-300">WhatsApp cadastrado no perfil</strong>{' '}
            da empresa. Se a API key da instância ficar em branco, o sistema tenta usar a API Key geral acima.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da instância (Evolution)</label>
              <input
                type="text"
                value={form.EVOLUTION_INSTANCIA_ASSINANTES}
                onChange={(e) => setForm({ ...form, EVOLUTION_INSTANCIA_ASSINANTES: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="ex: meicontrole-vendas"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">API Key desta instância</label>
              <div className="relative">
                <input
                  type={mostrar.EVOLUTION_APIKEY_ASSINANTES ? 'text' : 'password'}
                  value={form.EVOLUTION_APIKEY_ASSINANTES}
                  onChange={(e) => setForm({ ...form, EVOLUTION_APIKEY_ASSINANTES: e.target.value })}
                  className="w-full px-4 py-2 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Deixe em branco para usar a API Key geral"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => alternarCampo('EVOLUTION_APIKEY_ASSINANTES')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  aria-label={mostrar.EVOLUTION_APIKEY_ASSINANTES ? 'Ocultar API Key da instância' : 'Mostrar API Key da instância'}
                  title={mostrar.EVOLUTION_APIKEY_ASSINANTES ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrar.EVOLUTION_APIKEY_ASSINANTES ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {config.EVOLUTION_APIKEY_ASSINANTES && !form.EVOLUTION_APIKEY_ASSINANTES && (
                <p className="text-xs text-slate-500 mt-1">Configurado (deixe em branco para manter)</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMsgTesteWhatsapp('')
                  setModalTesteWhatsapp(true)
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-sky-500/50 text-sky-300 hover:bg-sky-500/10 text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Testar conexão WhatsApp
              </button>
              <p className="text-xs text-slate-500">
                Envia uma mensagem de teste usando a URL, instância e chaves{' '}
                <strong className="text-slate-400">como preenchidos acima</strong> (não precisa salvar o
                formulário antes). A chamada parte do <strong className="text-slate-400">servidor</strong> (Node){' '}
                até a Evolution — use URL que o backend alcance (ex.: 127.0.0.1, host Docker, IP da rede).
              </p>
            </div>

            <div className="pt-2 border-t border-card-border space-y-3">
              <p className="text-xs text-slate-500">
                Nos textos abaixo use as variáveis: <code className="text-slate-400">{'{nome}'}</code>,{' '}
                <code className="text-slate-400">{'{empresa}'}</code>, <code className="text-slate-400">{'{plano}'}</code>,{' '}
                <code className="text-slate-400">{'{data}'}</code>. Para <strong>não enviar</strong> uma das duas
                mensagens, preencha apenas com <code className="text-slate-400">-</code> (hífen).
              </p>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Mensagem de boas-vindas (após pagamento aprovado)</label>
                <textarea
                  value={form.MSG_WHATSAPP_BOAS_VINDAS}
                  onChange={(e) => setForm({ ...form, MSG_WHATSAPP_BOAS_VINDAS: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white text-sm resize-y min-h-[96px]"
                  placeholder="Vazio = texto padrão do sistema. '-' = não enviar esta mensagem."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Mensagem de confirmação de pagamento / mensalidade</label>
                <textarea
                  value={form.MSG_WHATSAPP_PAGAMENTO_CONFIRMADO}
                  onChange={(e) => setForm({ ...form, MSG_WHATSAPP_PAGAMENTO_CONFIRMADO: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white text-sm resize-y min-h-[96px]"
                  placeholder="Vazio = texto padrão do sistema. '-' = não enviar esta mensagem."
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium"
        >
          {salvando ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>

      {modalTesteWhatsapp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-teste-wa"
            className="w-full max-w-md rounded-xl bg-slate-900 border border-card-border shadow-xl p-6"
          >
            <h3 id="titulo-teste-wa" className="text-lg font-semibold text-white mb-2">
              Testar WhatsApp (notificações)
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Digite o número com DDD (ex.: <span className="text-slate-300">11999998888</span>) ou com 55. Esse número
              receberá uma mensagem de teste.
            </p>
            <label className="block text-sm text-slate-400 mb-1">Número do WhatsApp</label>
            <input
              type="tel"
              value={telefoneTesteWhatsapp}
              onChange={(e) => setTelefoneTesteWhatsapp(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white mb-3"
              placeholder="11999998888"
              autoComplete="tel"
            />
            {msgTesteWhatsapp && (
              <p
                className={`text-sm mb-4 ${msgTesteWhatsapp.includes('enviada') ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {msgTesteWhatsapp}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalTesteWhatsapp(false)
                  setMsgTesteWhatsapp('')
                }}
                className="px-4 py-2 rounded-lg border border-card-border text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={testandoWhatsapp}
                onClick={enviarTesteWhatsapp}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium"
              >
                {testandoWhatsapp ? 'Enviando...' : 'Enviar teste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
