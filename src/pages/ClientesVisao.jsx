import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, ShoppingCart, DollarSign, BarChart3 } from 'lucide-react'
import { clientes } from '../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function ClientesVisao() {
  const [lista, setLista] = useState([])
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([clientes.list(), clientes.vendas.list()])
      .then(([c, v]) => {
        setLista(c || [])
        setVendas(v || [])
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalClientes = lista.length
  const totalVendas = vendas.length
  const valorTotalVendas = vendas.reduce((s, i) => s + (i.valor || 0), 0)
  const ticketMedio = totalVendas > 0 ? valorTotalVendas / totalVendas : 0

  const clientesRecentes = [...lista]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 10)

  const cards = [
    {
      title: 'Total de Clientes',
      desc: 'Clientes cadastrados no sistema.',
      icon: Users,
      value: totalClientes,
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
    {
      title: 'Vendas Realizadas',
      desc: 'Quantidade total de vendas.',
      icon: ShoppingCart,
      value: totalVendas,
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
    {
      title: 'Valor Total em Vendas',
      desc: 'Soma de todas as vendas.',
      icon: DollarSign,
      value: formatMoney(valorTotalVendas),
      color: 'text-emerald-400',
      bgIcon: 'bg-emerald-500/20',
    },
    {
      title: 'Ticket Médio',
      desc: 'Valor médio por venda.',
      icon: BarChart3,
      value: formatMoney(ticketMedio),
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Visão Geral de Clientes</h1>
        <p className="text-slate-400 mt-1">
          Acompanhe os indicadores chave do seu cadastro de clientes.
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
                <h2 className="text-lg font-semibold text-white">Clientes Cadastrados Recentemente</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Os últimos 10 clientes cadastrados.
                </p>
              </div>
              <Link
                to="/dashboard/clientes/cadastro"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todos →
              </Link>
            </div>
            {clientesRecentes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nenhum cliente cadastrado.{' '}
                <Link to="/dashboard/clientes/cadastro" className="text-blue-400 hover:underline">
                  Cadastrar o primeiro
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border text-left text-sm text-slate-400">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesRecentes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-card-border/50 hover:bg-sidebar-hover/30"
                    >
                      <td className="p-4 text-white">{item.nome || '-'}</td>
                      <td className="p-4 text-slate-300">{item.email || '-'}</td>
                      <td className="p-4 text-slate-300">{formatDate(item.created_at)}</td>
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
