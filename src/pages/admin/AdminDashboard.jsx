import { useState, useEffect } from 'react'
import { Users, TrendingUp, TrendingDown, ShoppingCart, Building2, Package } from 'lucide-react'
import { admin } from '../../api/client'
import { Link } from 'react-router-dom'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    admin.stats()
      .then(setStats)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400 mb-4">{erro}</div>
        {erro.includes('404') && (
          <p className="text-slate-400 text-sm">
            Verifique se o backend está rodando na porta 3001. Em desenvolvimento, não defina VITE_API_URL (use o proxy do Vite).
          </p>
        )}
      </div>
    )
  }

  const cards = [
    { title: 'Total de Empresas', value: stats?.totalUsuarios || 0, icon: Building2, color: 'text-blue-400', bgIcon: 'bg-blue-500/20' },
    { title: 'Total de Entradas', value: formatMoney(stats?.totalEntradas), icon: TrendingUp, color: 'text-emerald-400', bgIcon: 'bg-emerald-500/20' },
    { title: 'Total de Gastos', value: formatMoney(stats?.totalGastos), icon: TrendingDown, color: 'text-red-400', bgIcon: 'bg-red-500/20' },
    { title: 'Total de Vendas', value: formatMoney(stats?.totalVendas), icon: ShoppingCart, color: 'text-amber-400', bgIcon: 'bg-amber-500/20' },
    { title: 'Total de Clientes', value: stats?.totalClientes || 0, icon: Users, color: 'text-slate-300', bgIcon: 'bg-slate-500/20' },
    { title: 'Total de Produtos', value: stats?.totalProdutos || 0, icon: Package, color: 'text-slate-300', bgIcon: 'bg-slate-500/20' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard do Sistema</h1>
        <p className="text-slate-400 mt-1">Visão geral de todas as empresas e dados do sistema.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map(({ title, value, icon: Icon, color, bgIcon }) => (
          <div key={title} className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{title}</p>
                <p className={`text-2xl font-semibold ${color}`}>{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bgIcon}`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border p-6">
        <h2 className="font-semibold text-white mb-4">Ações rápidas</h2>
        <Link
          to="/admin/empresas"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Ver todas as empresas
        </Link>
      </div>
    </div>
  )
}
