import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { clientes } from '../api/client'
import InputData from '../components/InputData'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function ClientesHistoricoVendas() {
  const [vendas, setVendas] = useState([])
  const [clientesList, setClientesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [cliente_id, setClienteId] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [descricao, setDescricao] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const [v, c] = await Promise.all([clientes.vendas.list(), clientes.list()])
      setVendas(v)
      setClientesList(c)
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
      await clientes.vendas.create({ cliente_id: cliente_id || null, valor: Number(valor), data, descricao })
      setModal(false)
      setClienteId('')
      setValor('')
      setData(new Date().toISOString().slice(0, 10))
      setDescricao('')
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const total = vendas.reduce((s, i) => s + (i.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Histórico de Vendas</h1>
          <p className="text-slate-400 mt-1">Registre e consulte suas vendas.</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Nova venda
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border p-4 mb-6">
        <span className="text-slate-400">Total de vendas: </span>
        <span className="text-xl font-semibold text-emerald-400">{formatMoney(total)}</span>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : vendas.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma venda registrada.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Data</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                  <td className="p-4 text-slate-300">{item.cliente_nome || '-'}</td>
                  <td className="p-4 text-slate-300">{item.descricao || '-'}</td>
                  <td className="p-4 text-right text-emerald-400 font-medium">{formatMoney(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Nova venda</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente (opcional)</label>
                <select value={cliente_id} onChange={(e) => setClienteId(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  <option value="">— Sem cliente —</option>
                  {clientesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <InputData value={data} onChange={setData} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" placeholder="DD/MM/AAAA" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
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
