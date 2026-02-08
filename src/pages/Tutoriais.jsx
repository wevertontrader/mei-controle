import { PlayCircle, BookOpen, TrendingUp, Users, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

const tutoriais = [
  { titulo: 'Primeiros passos no MEI Controle', descricao: 'Conheça a interface e como registrar suas primeiras entradas e gastos.', icon: BookOpen },
  { titulo: 'Financeiro completo', descricao: 'Aprenda a usar Entradas, Gastos, Custos e Poupança.', icon: TrendingUp },
  { titulo: 'Cadastro de clientes e vendas', descricao: 'Como cadastrar clientes e registrar vendas.', icon: Users },
  { titulo: 'Produtos e estoque', descricao: 'Gestão de produtos e movimentações de estoque.', icon: Package },
]

export default function Tutoriais() {
  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Tutoriais</h1>
        <p className="text-slate-400 mt-1">Aprenda a usar o sistema com nossos guias.</p>
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        {tutoriais.map(({ titulo, descricao, icon: Icon }) => (
          <div key={titulo} className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-white text-lg mb-1">{titulo}</h2>
              <p className="text-slate-400 text-sm mb-3">{descricao}</p>
              <button className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                <PlayCircle className="w-4 h-4" />
                Assistir (em breve)
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 rounded-xl bg-card-bg border border-card-border">
        <h2 className="font-semibold text-white mb-2">Dica rápida</h2>
        <p className="text-slate-400 text-sm">
          Comece pela <Link to="/dashboard/financeiro/entradas" className="text-blue-400 hover:underline">Visão Geral</Link> e registre suas primeiras entradas e gastos. Em seguida, cadastre seus <Link to="/dashboard/clientes/cadastro" className="text-blue-400 hover:underline">clientes</Link> e <Link to="/dashboard/produtos/lista" className="text-blue-400 hover:underline">produtos</Link>.
        </p>
      </div>
    </div>
  )
}
