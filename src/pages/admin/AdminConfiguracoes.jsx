import { useState, useEffect } from 'react'
import { CreditCard, MessageCircle } from 'lucide-react'
import { admin } from '../../api/client'

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    MERCADOPAGO_ACCESS_TOKEN: '',
    MERCADOPAGO_PUBLIC_KEY: '',
    BASE_URL: '',
    EVOLUTION_API_URL: '',
    EVOLUTION_API_KEY: '',
  })

  useEffect(() => {
    admin.configuracoes.get()
      .then((data) => {
        setConfig(data)
        setForm({
          MERCADOPAGO_ACCESS_TOKEN: data.MERCADOPAGO_ACCESS_TOKEN || '',
          MERCADOPAGO_PUBLIC_KEY: data.MERCADOPAGO_PUBLIC_KEY || '',
          BASE_URL: data.BASE_URL || 'http://localhost:5173',
          EVOLUTION_API_URL: data.EVOLUTION_API_URL || '',
          EVOLUTION_API_KEY: data.EVOLUTION_API_KEY || '',
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
    admin.configuracoes.update(form)
      .then(() => {
        setSucesso('Configurações salvas com sucesso.')
      })
      .catch((e) => setErro(e.message))
      .finally(() => setSalvando(false))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Configurações</h1>
        <p className="text-slate-400 mt-1">Defina as credenciais dos serviços integrados.</p>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
      {sucesso && <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">{sucesso}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Mercado Pago
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Configure o token de acesso para processar pagamentos. Obtenha em{' '}
            <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
              mercadopago.com.br/developers
            </a>
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Access Token</label>
              <input
                type="password"
                value={form.MERCADOPAGO_ACCESS_TOKEN}
                onChange={(e) => setForm({ ...form, MERCADOPAGO_ACCESS_TOKEN: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="APP_USR-..."
                autoComplete="off"
              />
              {config.MERCADOPAGO_ACCESS_TOKEN && !form.MERCADOPAGO_ACCESS_TOKEN && (
                <p className="text-xs text-slate-500 mt-1">Configurado (deixe em branco para manter)</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Public Key (opcional)</label>
              <input
                type="password"
                value={form.MERCADOPAGO_PUBLIC_KEY}
                onChange={(e) => setForm({ ...form, MERCADOPAGO_PUBLIC_KEY: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="APP_USR-..."
                autoComplete="off"
              />
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
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="flex items-center gap-2 font-semibold text-white mb-4">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            Evolution API
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Credenciais para integração com WhatsApp (disponível em breve).
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
              <label className="block text-sm text-slate-400 mb-1">API Key</label>
              <input
                type="password"
                value={form.EVOLUTION_API_KEY}
                onChange={(e) => setForm({ ...form, EVOLUTION_API_KEY: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                placeholder="Sua API Key"
                autoComplete="off"
              />
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
    </div>
  )
}
