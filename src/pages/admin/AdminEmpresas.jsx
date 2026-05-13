import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Search, ChevronLeft } from 'lucide-react'
import { admin } from '../../api/client'
import { Link } from 'react-router-dom'

function formatDate(s) {
  if (!s) return '-'
  const str = String(s).slice(0, 10)
  const d = new Date(str + 'T12:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function planoExibicao(item) {
  const cat = (item.plano_catalogo_nome || '').trim()
  if (cat) return cat
  const legado = (item.plano || '').trim()
  if (legado) return legado
  return '—'
}

const LIMIT_OPTIONS = [10, 12, 20, 30]

export default function AdminEmpresas() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('')
  const [debouncedFiltro, setDebouncedFiltro] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(12)
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, limit: 12 })
  const filtroLimitKeyRef = useRef('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedFiltro(filtro.trim()), 400)
    return () => clearTimeout(id)
  }, [filtro])

  useEffect(() => {
    const key = `${debouncedFiltro}|||${limit}`
    if (filtroLimitKeyRef.current !== key) {
      if (page !== 1) {
        setPage(1)
        return
      }
      filtroLimitKeyRef.current = key
    }

    let cancel = false
    setLoading(true)
    setErro('')
    admin
      .empresas({ q: debouncedFiltro || undefined, page, limit })
      .then((data) => {
        if (cancel) return
        setList(data.items || [])
        const tp = Math.max(1, data.totalPages ?? 1)
        const p = Math.min(data.page ?? page, tp)
        setMeta({
          total: data.total ?? 0,
          totalPages: tp,
          page: p,
          limit: data.limit ?? limit,
        })
        if ((data.page ?? page) > tp) setPage(tp)
      })
      .catch((e) => {
        if (!cancel) setErro(e.message)
      })
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => {
      cancel = true
    }
  }, [debouncedFiltro, page, limit])

  const trialExpired = (trialEndsAt) => trialEndsAt && new Date(trialEndsAt) < new Date()
  const { total, totalPages } = meta
  const pageSafe = Math.min(page, totalPages)
  const mostrandoDe = total === 0 ? 0 : (pageSafe - 1) * limit + 1
  const mostrandoAte = Math.min(pageSafe * limit, total)

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Empresas</h1>
          <p className="text-slate-400 mt-1">Gerencie todas as empresas cadastradas no sistema.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por empresa, responsável ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 text-sm"
              aria-label="Filtrar empresas"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="limite-empresas" className="text-sm text-slate-400 whitespace-nowrap">
              Por página
            </label>
            <select
              id="limite-empresas"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white text-sm"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {debouncedFiltro ? 'Nenhuma empresa encontrada para esta busca.' : 'Nenhuma empresa cadastrada.'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Empresa</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Plano</th>
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
                  <td className="p-4 text-slate-300">{planoExibicao(item)}</td>
                  <td className="p-4 text-slate-300">{formatDate(item.trial_ends_at)}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trialExpired(item.trial_ends_at)
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
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

        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-card-border bg-[#0d1117]/40">
            <p className="text-sm text-slate-400 text-center sm:text-left">
              {mostrandoDe}–{mostrandoAte} de <span className="text-slate-300">{total}</span>
              {debouncedFiltro ? ` · filtro: “${debouncedFiltro}”` : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-card-border text-sm text-slate-300 hover:bg-sidebar-hover/50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-sm text-slate-400 px-2">
                Página {pageSafe} / {totalPages}
              </span>
              <button
                type="button"
                disabled={pageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-card-border text-sm text-slate-300 hover:bg-sidebar-hover/50 disabled:opacity-40 disabled:pointer-events-none"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
