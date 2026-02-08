import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { admin } from '../../api/client'
import { Link } from 'react-router-dom'

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

export default function AdminEmpresaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [diasTrial, setDiasTrial] = useState('3')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    admin.empresa(id)
      .then(setEmpresa)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function estenderTrial() {
    setSalvando(true)
    setErro('')
    try {
      await admin.estenderTrial(id, Number(diasTrial) || 3)
      const updated = await admin.empresa(id)
      setEmpresa(updated)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400">Empresa não encontrada.</div>
        <button onClick={() => navigate('/admin/empresas')} className="mt-4 text-blue-400 hover:underline">Voltar</button>
      </div>
    )
  }

  const trialExpired = empresa.trial_ends_at && new Date(empresa.trial_ends_at) < new Date()

  return (
    <div className="p-6 lg:p-8">
      <Link
        to="/admin/empresas"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para empresas
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">{empresa.empresa}</h1>
        <p className="text-slate-400 mt-1">Detalhes e gestão da empresa.</p>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-4">Dados da conta</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Responsável</span>
              <span className="text-white">{empresa.nome}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">E-mail</span>
              <span className="text-white">{empresa.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Cadastro em</span>
              <span className="text-white">{formatDate(empresa.created_at)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Teste até</span>
              <span className={trialExpired ? 'text-red-400' : 'text-emerald-400'}>
                {formatDate(empresa.trial_ends_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-4">Estatísticas</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de entradas</span>
              <span className="text-emerald-400">{formatMoney(empresa.stats?.entradas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de gastos</span>
              <span className="text-red-400">{formatMoney(empresa.stats?.gastos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de vendas</span>
              <span className="text-emerald-400">{formatMoney(empresa.stats?.vendas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Clientes cadastrados</span>
              <span className="text-white">{empresa.stats?.clientes || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Produtos cadastrados</span>
              <span className="text-white">{empresa.stats?.produtos || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border p-6">
        <h2 className="font-semibold text-white mb-4">Estender período de teste</h2>
        <p className="text-slate-400 text-sm mb-4">
          Adicione dias de teste para esta empresa continuar usando o sistema.
        </p>
        <div className="flex gap-4 items-end">
          <div className="w-32">
            <label className="block text-sm text-slate-400 mb-1">Dias</label>
            <input
              type="number"
              min="1"
              value={diasTrial}
              onChange={(e) => setDiasTrial(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
            />
          </div>
          <button
            onClick={estenderTrial}
            disabled={salvando}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium"
          >
            {salvando ? 'Salvando...' : 'Estender teste'}
          </button>
        </div>
      </div>
    </div>
  )
}
