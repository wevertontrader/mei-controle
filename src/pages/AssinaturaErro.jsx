import { Link } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function AssinaturaErro() {
  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
      <XCircle className="w-16 h-16 text-red-400 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Pagamento não concluído</h2>
      <p className="text-slate-400 text-center mb-6 max-w-md">
        O pagamento não foi processado ou foi cancelado. Você pode tentar novamente quando quiser.
      </p>
      <Link to="/dashboard/assinatura/planos" className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
        Voltar aos planos
      </Link>
    </div>
  )
}
