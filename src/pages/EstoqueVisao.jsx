import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Box, Sigma, TrendingUp } from 'lucide-react'
import { produtos, estoque } from '../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function EstoqueVisao() {
  const [produtosList, setProdutosList] = useState([])
  const [movimentacoes, setMovimentacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([produtos.list(), estoque.movimentacoes.list()])
      .then(([p, m]) => {
        setProdutosList(p || [])
        setMovimentacoes(m || [])
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const totalProdutos = produtosList.length
  const itensEstoque = produtosList.reduce((s, p) => s + (p.estoque_atual || 0), 0)
  const custoEstoque = produtosList.reduce(
    (s, p) => s + (p.preco_custo || 0) * (p.estoque_atual || 0),
    0
  )
  const potencialVenda = produtosList.reduce(
    (s, p) => s + (p.preco || 0) * (p.estoque_atual || 0),
    0
  )

  const movimentacoesRecentes = [...movimentacoes].slice(0, 10)

  const cards = [
    {
      title: 'Total de Produtos',
      desc: 'Tipos de produtos cadastrados.',
      icon: Package,
      value: totalProdutos,
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
    {
      title: 'Itens em Estoque',
      desc: 'Soma de todas as unidades.',
      icon: Box,
      value: itensEstoque,
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
    {
      title: 'Custo do Estoque',
      desc: 'Valor total do estoque a preço de custo.',
      icon: Sigma,
      value: formatMoney(custoEstoque),
      color: 'text-white',
      bgIcon: 'bg-slate-500/20',
    },
    {
      title: 'Potencial de Venda',
      desc: 'Receita se todo o estoque for vendido.',
      icon: TrendingUp,
      value: formatMoney(potencialVenda),
      color: 'text-emerald-400',
      bgIcon: 'bg-emerald-500/20',
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Visão Geral do Estoque</h1>
        <p className="text-slate-400 mt-1">
          Acompanhe os indicadores chave do seu estoque.
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
                <h2 className="text-lg font-semibold text-white">Movimentações Recentes</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  As últimas 10 movimentações de estoque.
                </p>
              </div>
              <Link
                to="/dashboard/estoque/movimentacoes"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Ver todas →
              </Link>
            </div>
            {movimentacoesRecentes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nenhuma movimentação registrada.{' '}
                <Link to="/dashboard/estoque/movimentacoes" className="text-blue-400 hover:underline">
                  Registrar movimentação
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border text-left text-sm text-slate-400">
                    <th className="p-4">Produto</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-right">Quantidade</th>
                    <th className="p-4">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoesRecentes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-card-border/50 hover:bg-sidebar-hover/30"
                    >
                      <td className="p-4 text-white">{item.produto_nome || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                            item.tipo === 'entrada'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="p-4 text-right text-slate-300">{item.quantidade}</td>
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
