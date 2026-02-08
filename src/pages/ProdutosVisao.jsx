import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, Box, Sigma, TrendingUp } from 'lucide-react'
import { produtos } from '../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  const str = String(s).slice(0, 10)
  const d = new Date(str + 'T12:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

const cards = [
  {
    title: 'Produtos Cadastrados',
    desc: 'Total de tipos de produtos diferentes.',
    icon: Package,
    getValue: (list) => list.length,
    color: 'text-white',
    bgIcon: 'bg-slate-500/20',
  },
  {
    title: 'Itens em Estoque',
    desc: 'Soma de todas as unidades.',
    icon: Box,
    getValue: (list) => list.reduce((s, p) => s + (p.estoque_atual || 0), 0),
    color: 'text-white',
    bgIcon: 'bg-slate-500/20',
  },
  {
    title: 'Custo do Estoque',
    desc: 'Valor total do estoque a preço de custo.',
    icon: Sigma,
    getValue: (list) => list.reduce((s, p) => s + ((p.preco_custo || 0) * (p.estoque_atual || 0)), 0),
    color: 'text-white',
    bgIcon: 'bg-slate-500/20',
  },
  {
    title: 'Potencial de Venda',
    desc: 'Receita se todo o estoque for vendido.',
    icon: TrendingUp,
    getValue: (list) => list.reduce((s, p) => s + ((p.preco || 0) * (p.estoque_atual || 0)), 0),
    color: 'text-emerald-400',
    bgIcon: 'bg-emerald-500/20',
  },
]

export default function ProdutosVisao() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    produtos
      .list()
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const recentes = [...list]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Visão Geral de Produtos</h1>
        <p className="text-slate-400 mt-1">
          Acompanhe os indicadores chave do seu catálogo de produtos.
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
            {cards.map(({ title, desc, icon: Icon, getValue, color, bgIcon }) => (
              <div
                key={title}
                className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{title}</p>
                    <p className={`text-2xl font-semibold ${color}`}>
                      {title === 'Custo do Estoque' || title === 'Potencial de Venda'
                        ? formatMoney(getValue(list))
                        : getValue(list)}
                    </p>
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
            <div className="p-6 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">Produtos Adicionados Recentemente</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Os últimos 10 produtos cadastrados.
              </p>
            </div>
            {recentes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Nenhum produto cadastrado.{' '}
                <Link to="/dashboard/produtos/lista" className="text-blue-400 hover:underline">
                  Cadastrar o primeiro
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border text-left text-sm text-slate-400">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Estoque</th>
                    <th className="p-4">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-card-border/50 hover:bg-sidebar-hover/30"
                    >
                      <td className="p-4 text-white">{item.nome || '-'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400">
                          {item.estoque_atual ?? 0} {item.unidade || 'UN'}
                        </span>
                      </td>
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
