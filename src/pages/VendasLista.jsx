import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { clientes } from '../api/client'
import VendasPDVModal from '../components/VendasPDVModal'

const FORMAS = ['', 'PIX', 'Dinheiro', 'Cartão', 'Transferência', 'Outro']

const MARCA_PAGAMENTO_NA_DESCRICAO = ' · Pag.: '

function formaPagamentoExibicao(row) {
  const ex = String(row.forma_exibicao ?? row.formaExibicao ?? '').trim()
  if (ex) return ex
  const direto = String(row.forma_pagamento || row.formaPagamento || row.forma_caixa || row.formaCaixa || '').trim()
  if (direto) return direto
  const desc = String(row.descricao || '')
  const idx = desc.indexOf(MARCA_PAGAMENTO_NA_DESCRICAO)
  if (idx >= 0) {
    const extraido = desc.slice(idx + MARCA_PAGAMENTO_NA_DESCRICAO.length).trim()
    if (extraido) return extraido
  }
  const m = desc.match(/(?:^|[\s·\-—])Pag\.:\s*(.+)$/i)
  if (m && m[1]) return m[1].trim()
  return '—'
}

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return ''
  const t = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return new Date(`${t}T12:00:00`).toLocaleDateString('pt-BR')
  }
  const isoish = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(t) ? t.replace(' ', 'T') : t
  const d = new Date(isoish)
  if (Number.isNaN(d.getTime())) return t
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stripMarcaPagamento(s) {
  let t = String(s || '').trim()
  const idx = t.indexOf(MARCA_PAGAMENTO_NA_DESCRICAO)
  if (idx >= 0) t = t.slice(0, idx).trim()
  t = t.replace(/(?:^|[\s·\-—])Pag\.:\s*.+$/i, '').trim()
  return t
}

function resumoItens(row) {
  const itensRaw = row.itens_json ?? row.itensJson
  const descTrim = stripMarcaPagamento(row.descricao)
  const mov = (row.resumo_estoque && String(row.resumo_estoque).trim()) || ''
  const caixaFull = (row.descricao_caixa && String(row.descricao_caixa).trim()) || ''
  if (itensRaw) {
    try {
      const arr = JSON.parse(itensRaw)
      if (Array.isArray(arr) && arr.length) {
        const line = arr
          .map((i) => `${i.nome || i.produto_nome || 'Item'} ×${i.quantidade ?? 1}`)
          .join(' · ')
        if (line) return line
      }
    } catch {
      /* usa fallbacks abaixo */
    }
  }
  if (mov) return mov
  if (caixaFull) {
    const sep = caixaFull.indexOf(' — ')
    if (sep >= 0) {
      const tail = stripMarcaPagamento(caixaFull.slice(sep + 3))
      if (tail) return tail
    }
    return stripMarcaPagamento(caixaFull) || caixaFull
  }
  if (descTrim) return descTrim
  return '—'
}

export default function VendasLista() {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [pdvOpen, setPdvOpen] = useState(false)
  const [filtroQ, setFiltroQ] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtroForma, setFiltroForma] = useState('')

  useEffect(() => {
    if (searchParams.get('pdv') === '1') {
      setPdvOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete('pdv')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const fetchVendas = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const params = {}
      if (filtroQ.trim()) params.q = filtroQ.trim()
      if (dataInicio) params.data_inicio = dataInicio
      if (dataFim) params.data_fim = dataFim
      if (filtroForma) params.forma = filtroForma
      const v = await clientes.vendas.list(params)
      setVendas(v)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }, [filtroQ, dataInicio, dataFim, filtroForma])

  useEffect(() => {
    let active = true
    const delay = filtroQ.trim() ? 350 : 0
    const t = setTimeout(() => {
      if (!active) return
      fetchVendas()
    }, delay)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [fetchVendas])

  const total = vendas.reduce((s, i) => s + (i.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Vendas</h1>
          <p className="text-slate-400 mt-1">Lista de vendas realizadas. Use o PDV para registrar novas vendas (atualiza caixa e estoque).</p>
        </div>
        <button
          type="button"
          onClick={() => setPdvOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shrink-0"
        >
          <Plus className="w-4 h-4" /> Nova venda
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="flex flex-col xl:flex-row flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="search"
            value={filtroQ}
            onChange={(e) => setFiltroQ(e.target.value)}
            placeholder="Buscar cliente, descrição, forma ou itens…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card-bg border border-card-border text-white text-sm"
          />
        </div>
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card-bg border border-card-border text-slate-300 text-sm w-full sm:w-auto"
          aria-label="Data inicial"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card-bg border border-card-border text-slate-300 text-sm w-full sm:w-auto"
          aria-label="Data final"
        />
        <select
          value={filtroForma}
          onChange={(e) => setFiltroForma(e.target.value)}
          className="px-3 py-2 rounded-lg bg-card-bg border border-card-border text-slate-300 text-sm min-w-[160px]"
        >
          <option value="">Todas as formas</option>
          {FORMAS.filter(Boolean).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => fetchVendas()}
          className="px-4 py-2 rounded-lg border border-card-border text-slate-400 hover:text-white text-sm"
        >
          Atualizar
        </button>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border p-4 mb-6">
        <span className="text-slate-400">Total no período filtrado: </span>
        <span className="text-xl font-semibold text-emerald-400">{formatMoney(total)}</span>
        <span className="text-slate-500 text-sm ml-2">({vendas.length} venda{vendas.length !== 1 ? 's' : ''})</span>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : vendas.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma venda encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-slate-400">
                  <th className="p-4 whitespace-nowrap">Data</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4 whitespace-nowrap">Pagamento</th>
                  <th className="p-4">Itens / descrição</th>
                  <th className="p-4 text-right whitespace-nowrap">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((item) => (
                  <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                    <td className="p-4 text-slate-300 whitespace-nowrap">{formatDate(item.data)}</td>
                    <td className="p-4 text-slate-300">{item.cliente_nome || '—'}</td>
                    <td className="p-4 text-slate-400">{formaPagamentoExibicao(item)}</td>
                    <td className="p-4 text-slate-400 text-sm max-w-[320px]">{resumoItens(item)}</td>
                    <td className="p-4 text-right text-emerald-400 font-medium whitespace-nowrap">{formatMoney(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VendasPDVModal open={pdvOpen} onClose={() => setPdvOpen(false)} onSucesso={fetchVendas} />
    </div>
  )
}
