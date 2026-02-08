import { Link } from 'react-router-dom'
import { TrendingUp, Users, Package, Calculator, Check } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xl">
              M
            </div>
            <span className="font-semibold text-xl">MEI Controle</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <section className="text-center mb-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Controle financeiro simplificado para o seu <span className="text-blue-400">MEI</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Organize entradas, gastos, clientes, produtos e muito mais em um único lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/cadastro"
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
            >
              Começar 3 dias grátis
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-lg transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            ✓ 3 dias de teste grátis &nbsp; ✓ Sem cartão de crédito
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {[
            { icon: TrendingUp, title: 'Financeiro', desc: 'Entradas, gastos, custos e poupança' },
            { icon: Users, title: 'Clientes', desc: 'Cadastro e histórico de vendas' },
            { icon: Package, title: 'Produtos', desc: 'Lista de produtos e controle de estoque' },
            { icon: Calculator, title: 'Calculadora', desc: 'Precificação e pró-labore' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-card-bg border border-card-border p-12 mb-24">
          <h2 className="text-2xl font-bold text-center mb-10">Por que escolher o MEI Controle?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Controle completo das finanças do seu negócio',
              'Cadastro de clientes e histórico de vendas',
              'Gestão de produtos e movimentações de estoque',
              'Calculadora de precificação e pró-labore',
              'Tarefas e organização do dia a dia',
              'Relatórios e visão geral financeira',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} MEI Controle. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
