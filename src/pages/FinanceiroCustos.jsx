import { useState, useEffect } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { financeiro } from '../api/client'
import InputData from '../components/InputData'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function FinanceiroCustos() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))

  async function carregar() {
    setLoading(true)
    try {
      const res = await financeiro.custos.list()
      setList(res)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function salvar(e) {
    e.preventDefault()
    try {
      await financeiro.custos.create({ valor: Number(valor), descricao, vencimento })
      setModal(false)
      setValor('')
      setDescricao('')
      setVencimento(new Date().toISOString().slice(0, 10))
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function marcarPago(id) {
    try {
      await financeiro.custos.pago(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este custo?')) return
    try {
      await financeiro.custos.delete(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const pendentes = list.filter((i) => !i.pago)
  const totalPendente = pendentes.reduce((s, i) => s + (i.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Custos</h1>
          <p className="text-slate-400 mt-1">Gerencie custos fixos e obrigações pendentes.</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Novo custo
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border p-4 mb-6">
        <span className="text-slate-400">Custos pendentes: </span>
        <span className="text-xl font-semibold text-amber-400">{formatMoney(totalPendente)}</span>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum custo registrado.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Descrição</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{item.descricao || '-'}</td>
                  <td className="p-4 text-slate-300">{formatDate(item.vencimento)}</td>
                  <td className="p-4 text-right text-slate-300 font-medium">{formatMoney(item.valor)}</td>
                  <td className="p-4">
                    {item.pago ? (
                      <span className="text-emerald-400 text-sm">Pago</span>
                    ) : (
                      <button onClick={() => marcarPago(item.id)} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30">
                        <Check className="w-3 h-3" /> Marcar pago
                      </button>
                    )}
                  </td>
                  <td className="p-4">
                    <button onClick={() => excluir(item.id)} className="p-2 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Novo custo</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Aluguel, Luz..." className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vencimento</label>
                <InputData value={vencimento} onChange={setVencimento} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" placeholder="DD/MM/AAAA" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Salvar</button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border border-card-border text-slate-400 hover:text-white">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
