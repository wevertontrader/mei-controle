import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  FileText,
  ShoppingCart,
  BarChart3,
  Bell,
  Timer,
  Store,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { dashboard } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { canAccessDashboardPath } from '../lib/sidebarAccess'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

const PERIODOS = [
  { value: 'mes', label: 'Este mês' },
  { value: 'mes_anterior', label: 'Mês passado' },
  { value: 'trimestre', label: 'Este trimestre' },
  { value: 'ano', label: 'Este ano' },
]

export default function VisaoGeral() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [periodo, setPeriodo] = useState('mes')

  const carregar = useCallback(async (opts = {}) => {
    const silent = !!opts.silent
    if (!silent) {
      setLoading(true)
      setErro('')
    }
    try {
      const res = await dashboard.visaoGeral({ periodo })
      setData(res)
    } catch (e) {
      if (!silent) {
        setErro(e.message)
        setData(null)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [periodo])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const fn = () => carregar({ silent: true })
    window.addEventListener('financeiro-atualizado', fn)
    return () => window.removeEventListener('financeiro-atualizado', fn)
  }, [carregar])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="p-6 lg:p-8">
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400">{erro}</div>
      </div>
    )
  }

  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const trialExpired = trialEndsAt && trialEndsAt < new Date()
  const trialDays = trialEndsAt ? Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)) : 0
  const mostrarCardTrial = user?.role !== 'super_admin' && !trialExpired && trialDays > 0

  const metrics = [
    { title: 'Receita Bruta', value: formatMoney(data?.receitaBruta), color: 'text-emerald-400', icon: TrendingUp, bgIcon: 'bg-emerald-500/20' },
    { title: 'Despesas', value: formatMoney(data?.despesas), color: 'text-red-400', icon: TrendingDown, bgIcon: 'bg-red-500/20' },
    { title: 'Lucro Líquido', value: formatMoney(data?.lucroLiquido), color: 'text-emerald-400', icon: DollarSign, bgIcon: 'bg-emerald-500/20' },
    { title: 'ROI', value: (data?.roi || 0).toFixed(2) + '%', color: 'text-emerald-400', icon: Percent, bgIcon: 'bg-emerald-500/20' },
    { title: 'Custos pendentes (no período)', value: formatMoney(data?.custosPendentes), color: 'text-amber-400', icon: FileText, bgIcon: 'bg-amber-500/20' },
    { title: `Superávit / dia útil (${data?.diasUteisPeriodo ?? '—'} dias)`, value: formatMoney(data?.superavitDiario), color: 'text-emerald-400', icon: Calendar, bgIcon: 'bg-emerald-500/20' },
    { title: 'Quantidade de Vendas', value: String(data?.quantidadeVendas || 0), color: 'text-slate-300', icon: ShoppingCart, bgIcon: 'bg-slate-500/20' },
    { title: 'Ticket Médio', value: formatMoney(data?.ticketMedio), color: 'text-slate-300', icon: BarChart3, bgIcon: 'bg-slate-500/20' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Visão Geral</h1>
        <p className="text-slate-400 mt-1">
          Resumo financeiro: <span className="text-slate-300">{data?.periodoLabel || 'Este mês'}</span>
          {data?.periodoInicio && data?.periodoFim ? (
            <span className="text-slate-500"> ({data.periodoInicio} a {data.periodoFim})</span>
          ) : null}
          .
        </p>
      </header>

      {mostrarCardTrial && (
        <div className="mb-6 rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/25 flex items-center justify-center shrink-0">
            <Timer className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Período de teste</p>
            <p className="text-sm text-emerald-400/95 mt-0.5">
              {trialDays} {trialDays === 1 ? 'dia restante' : 'dias restantes'} no seu trial. Assine um plano em Assinatura para continuar após o fim do período.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {canAccessDashboardPath(user, '/dashboard/vendas') && (
          <button
            type="button"
            onClick={() => navigate('/dashboard/vendas?pdv=1')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Store className="w-4 h-4 shrink-0" />
            Abrir PDV
          </button>
        )}
        <button type="button" onClick={carregar} className="p-2 rounded-lg bg-card-bg border border-card-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button type="button" className="p-2 rounded-lg bg-card-bg border border-card-border text-slate-400 hover:text-white hover:border-slate-500 transition-colors">
          <Filter className="w-4 h-4" />
        </button>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card-bg border border-card-border text-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.title} className="rounded-xl bg-card-bg border border-card-border p-4 hover:border-slate-600 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{m.title}</p>
                  <p className={`text-xl font-semibold ${m.color}`}>{m.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${m.bgIcon}`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-card-bg border border-amber-500/30 p-5 mb-8">
        <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          Lembretes MEI
        </h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>DAS vence todo dia 20</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Faturamento máximo: R$ 81.000/ano</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>DASN-SIMEI: declaração anual até 31/05</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Máximo 1 empregado permitido</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">•</span>
            <span>Pró-labore mínimo: salário mínimo vigente</span>
          </li>
        </ul>
      </div>

      <section className="rounded-xl bg-card-bg border border-card-border p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Resultados: Últimos 7 Dias</h2>
        <p className="text-sm text-slate-400 mb-6">Comparativo de receitas recebidas e despesas.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.graficoUltimos7Dias || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} labelStyle={{ color: '#e2e8f0' }} formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, '']} />
              <Legend wrapperStyle={{ paddingTop: 16 }} formatter={(value) => <span className="text-slate-400 text-sm">{value}</span>} />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
