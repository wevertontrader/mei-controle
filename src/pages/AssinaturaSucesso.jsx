import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { assinatura, auth } from '../api/client'
import { CheckCircle } from 'lucide-react'

export default function AssinaturaSucesso() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [status, setStatus] = useState('processando')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const payment_id = searchParams.get('payment_id')
    const external_reference = searchParams.get('external_reference')
    const mpStatus = searchParams.get('status')

    if (!external_reference) {
      setStatus('erro')
      setErro('Dados de pagamento não encontrados.')
      return
    }

    assinatura
      .confirmar({ payment_id, external_reference, status: mpStatus })
      .then(async () => {
        setStatus('ok')
        const { user } = await auth.me()
        updateUser(user)
        setTimeout(() => navigate('/dashboard/assinatura/planos?pago=1', { replace: true }), 2000)
      })
      .catch((e) => {
        setStatus('erro')
        setErro(e.message)
      })
  }, [searchParams, navigate, updateUser])

  if (status === 'processando') {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-slate-400">Confirmando seu pagamento...</p>
      </div>
    )
  }

  if (status === 'erro') {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-400 mb-4">{erro}</p>
          <button
            onClick={() => navigate('/dashboard/assinatura/planos')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            Voltar aos planos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px]">
      <CheckCircle className="w-16 h-16 text-emerald-400 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Pagamento confirmado!</h2>
      <p className="text-slate-400">Sua assinatura foi ativada. Redirecionando...</p>
    </div>
  )
}
