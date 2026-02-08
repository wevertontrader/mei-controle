import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react'
import { financeiro } from '../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function FinanceiroVisao() {
  const [entradas, setEntradas] = useState([])
  const [gastos, setGastos] = useState([])
  const [custos, setCustos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([
      financeiro.entradas.list(),
      financeiro.gastos.list(),
      financeiro.custos.list(),
    ])
      .then(([e, g, c]) => {
        setEntradas(e || [])
        setGastos(g || [])
        setCustos(c || [])
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalEntradas = entradas.reduce((s, i) => s + (i.valor || 0), 0)
  const totalGastos = gastos.reduce((s, i) => s + (i.valor || 0), 0)
  const lucroLiquido = totalEntradas - totalGastos
  const custosPendentes = custos.filter((c) => !c.pago).reduce((s, i) => s + (i.valor || 0), 0)

  const entradasRecentes = [...entradas]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 10)

  const cards = [
    {
      title: 'Receita Bruta',
      desc: 'Total de entradas registradas.',
      icon: TrendingUp,
      value: formatMoney(totalEntradas),
      color: 'text-emerald-400',
      bgIcon: 'bg-emerald-500/20',
    },
    {
      title: 'Despesas',
      desc: 'Total de gastos registrados.',
      icon: TrendingDown,
      value: formatMoney(totalGastos),
      color: 'text-red-400',
      bgIcon: 'bg-red-500/20',
    },
    {
      title: 'Lucro Líquido',
      desc: 'Receita menos despesas.',
      icon: DollarSign,
      value: formatMoney(lucroLiquido),
      color: lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400',
      bgIcon: lucroLiquido >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20',
    },
    {
      title: 'Custos Pendentes',
      desc: 'Valor total de custos a pagar.',
      icon: FileText,
      value: formatMoney(custosPendentes),
      color: 'text-amber-400',
      bgIcon: 'bg-amber-500/20',
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Visão Geral do Financeiro</h1>
        <p className="text-slate-400 mt-1">
          Acompanhe os indicadores chave das suas finanças.
        </p>
      </header>

      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400">Carregando...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {cards.map(({ title, desc, icon: Icon, value, color, bgIcon }) => (
              <div
                key={title}
                className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{title}</p>
                    <p className={`text-2xl font-semibold ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${bgIcon}`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
            <div className="p-6 border-b border-card-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Entradas Registradas Recentemente</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  As últimas 10 entradas cadastradas.
                </p>
              </div>
              <Link
                to="/dashboard/financeiro/entradas"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas →
              </Link>
            </div>
            {entradasRecentes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nenhuma entrada registrada.{' '}
                <Link to="/dashboard/financeiro/entradas" className="text-blue-400 hover:underline">
                  Registrar a primeira
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border text-left text-sm text-slate-400">
                    <th className="p-4">Descrição</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {entradasRecentes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-card-border/50 hover:bg-sidebar-hover/30"
                    >
                      <td className="p-4 text-white">{item.descricao || '-'}</td>
                      <td className="p-4 text-right text-emerald-400 font-medium">
                        {formatMoney(item.valor)}
                      </td>
                      <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
