import { useAuth } from '../context/AuthContext'

export default function AssinaturaHistorico() {
  const { user } = useAuth()
  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const trialExpired = trialEndsAt && trialEndsAt < new Date()

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Histórico de Assinatura</h1>
        <p className="text-slate-400 mt-1">Veja o histórico da sua assinatura.</p>
      </header>
      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        <div className="p-6">
          <h2 className="font-semibold text-white mb-4">Status atual</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-card-border">
              <span className="text-slate-400">Período</span>
              <span className="text-white font-medium">{trialExpired ? 'Expirado' : 'Período de teste'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-card-border">
              <span className="text-slate-400">Data de término do teste</span>
              <span className="text-white">{trialEndsAt ? trialEndsAt.toLocaleDateString('pt-BR') : '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400">Próxima cobrança</span>
              <span className="text-slate-500">—</span>
            </div>
          </div>
          {trialExpired && (
            <div className="mt-4 p-4 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <p className="text-amber-400 text-sm font-medium">Seu período de teste expirou.</p>
              <p className="text-slate-400 text-sm mt-1">Assine um plano para continuar usando o sistema.</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 rounded-xl bg-card-bg border border-card-border p-6">
        <h2 className="font-semibold text-white mb-4">Histórico de faturas</h2>
        <p className="text-slate-500 text-sm">Nenhuma fatura registrada ainda.</p>
      </div>
    </div>
  )
}
