import { useLocation } from 'react-router-dom'

const labels = {
  financeiro: 'Financeiro',
  entradas: 'Entradas',
  gastos: 'Gastos',
  custos: 'Custos',
  poupanca: 'Poupança',
  clientes: 'Clientes',
  cadastro: 'Cadastro',
  'historico-vendas': 'Histórico de Vendas',
  produtos: 'Produtos',
  lista: 'Lista de Produtos',
  estoque: 'Estoque',
  movimentacoes: 'Movimentações',
  calculadora: 'Calculadora',
  precificacao: 'Precificação',
  'pro-labore': 'Pró-labore',
  tarefas: 'Tarefas',
  tutoriais: 'Tutoriais',
  assinatura: 'Assinatura',
  planos: 'Planos e Pagamento',
  historico: 'Histórico',
  perfil: 'Perfil',
}

export default function Placeholder() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const label = parts.map((p) => labels[p] || p).join(' › ') || 'Página'

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-semibold text-white">{label}</h1>
      <p className="text-slate-400 mt-2">
        Conteúdo desta seção em desenvolvimento.
      </p>
    </div>
  )
}
