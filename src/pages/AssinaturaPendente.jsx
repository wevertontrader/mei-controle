import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'

export default function AssinaturaPendente() {
  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
      <Clock className="w-16 h-16 text-amber-400 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Pagamento pendente</h2>
      <p className="text-slate-400 text-center mb-6 max-w-md">
        Seu pagamento está sendo processado. Assim que for aprovado, você terá acesso completo ao plano.
      </p>
      <Link to="/dashboard/assinatura/planos" className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
        Voltar aos planos
      </Link>
    </div>
  )
}
