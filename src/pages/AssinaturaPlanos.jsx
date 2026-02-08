import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assinatura } from '../api/client'
import { Check } from 'lucide-react'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function AssinaturaPlanos() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [planos, setPlanos] = useState([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [loading, setLoading] = useState(null)
  const [erro, setErro] = useState('')
  const pago = searchParams.get('pago') === '1'

  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const trialExpired = trialEndsAt && trialEndsAt < new Date()
  const trialDays = trialEndsAt ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : 0

  useEffect(() => {
    assinatura.planos()
      .then(setPlanos)
      .catch(() => setPlanos([]))
      .finally(() => setLoadingPlanos(false))
  }, [])

  async function handleAssinar(planoId) {
    setLoading(planoId)
    setErro('')
    try {
      const { init_point } = await assinatura.checkout(planoId)
      if (init_point) window.location.href = init_point
      else setErro('Não foi possível abrir o checkout.')
    } catch (e) {
      setErro(e.message || 'Erro ao processar. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Planos e Pagamento</h1>
        <p className="text-slate-400 mt-1">Escolha o plano ideal para o seu negócio.</p>
      </header>

      {pago && (
        <div className="mb-8 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
          <p className="text-emerald-400 font-medium">Pagamento confirmado! Sua assinatura foi ativada com sucesso.</p>
        </div>
      )}

      {erro && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
          <p className="text-red-400">{erro}</p>
        </div>
      )}

      {!trialExpired && trialDays > 0 && (
        <div className="mb-8 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
          <p className="text-emerald-400 font-medium">
            Você tem {trialDays} {trialDays === 1 ? 'dia' : 'dias'} de teste restante{trialDays !== 1 ? 's' : ''}.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Aproveite para conhecer todas as funcionalidades antes de assinar.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {loadingPlanos ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Carregando planos...</div>
        ) : planos.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Nenhum plano disponível no momento.</div>
        ) : (
        planos.map((plano) => (
          <div
            key={plano.id}
            className={`rounded-xl border p-6 transition-colors ${
              plano.destaque
                ? 'bg-blue-500/10 border-blue-500/50'
                : 'bg-card-bg border-card-border'
            }`}
          >
            {plano.economia && (
              <span className="inline-block px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                {plano.economia}
              </span>
            )}
            <h2 className="text-xl font-semibold text-white mb-1">{plano.nome}</h2>
            <p className="text-3xl font-bold text-white mb-1">{formatMoney(plano.preco)}<span className="text-lg font-normal text-slate-400">/{plano.periodo}</span></p>
            <ul className="space-y-2 mt-4 mb-6">
              {(plano.features || []).map((f) => (
                <li key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleAssinar(plano.id)}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                plano.destaque
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-card-bg border border-card-border text-slate-300 hover:text-white hover:border-slate-500'
              }`}
            >
              {loading === plano.id ? 'Abrindo checkout...' : 'Assinar com Mercado Pago'}
            </button>
          </div>
        ))
        )}
      </div>
      <p className="mt-6 text-slate-500 text-sm">Pagamento seguro via Mercado Pago. Suas credenciais nunca são armazenadas.</p>
    </div>
  )
}
