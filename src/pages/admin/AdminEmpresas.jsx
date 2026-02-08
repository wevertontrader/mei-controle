import { useState, useEffect } from 'react'
import { Plus, ChevronRight, Calendar } from 'lucide-react'
import { admin } from '../../api/client'
import { Link } from 'react-router-dom'

function formatDate(s) {
  if (!s) return '-'
  const str = String(s).slice(0, 10)
  const d = new Date(str + 'T12:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

export default function AdminEmpresas() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    admin.empresas()
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  const trialExpired = (trialEndsAt) => trialEndsAt && new Date(trialEndsAt) < new Date()

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Empresas</h1>
        <p className="text-slate-400 mt-1">Gerencie todas as empresas cadastradas no sistema.</p>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma empresa cadastrada.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Empresa</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Teste até</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Entradas</th>
                <th className="p-4 text-center">Gastos</th>
                <th className="p-4 text-center">Vendas</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4">
                    <p className="font-medium text-white">{item.empresa}</p>
                  </td>
                  <td className="p-4 text-slate-300">{item.nome}</td>
                  <td className="p-4 text-slate-300">{item.email}</td>
                  <td className="p-4 text-slate-300">{formatDate(item.trial_ends_at)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trialExpired(item.trial_ends_at)
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {trialExpired(item.trial_ends_at) ? 'Expirado' : 'Ativo'}
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-300">{item.qtd_entradas}</td>
                  <td className="p-4 text-center text-slate-300">{item.qtd_gastos}</td>
                  <td className="p-4 text-center text-slate-300">{item.qtd_vendas}</td>
                  <td className="p-4">
                    <Link
                      to={`/admin/empresas/${item.id}`}
                      className="p-2 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 inline-flex"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
