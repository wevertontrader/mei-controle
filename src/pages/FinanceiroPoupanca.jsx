import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Calendar } from 'lucide-react'
import { financeiro } from '../api/client'
import InputData from '../components/InputData'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

const TIPOS_OPCOES = ['Reserva', 'Poupança', 'Investimento']

export default function FinanceiroPoupanca() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('Poupança')

  async function carregar() {
    setLoading(true)
    try {
      const res = await financeiro.poupanca.list()
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
      await financeiro.poupanca.create({ valor: Number(valor), descricao, data, tipo })
      setModal(false)
      setDescricao('')
      setData(new Date().toISOString().slice(0, 10))
      setValor('')
      setTipo('Poupança')
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este registro?')) return
    try {
      await financeiro.poupanca.delete(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const total = list.reduce((s, i) => s + (i.valor || 0), 0)

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Poupança</h1>
          <p className="text-slate-400 mt-1">Acompanhe seus aportes e reservas.</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Novo registro
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border p-4 mb-6">
        <span className="text-slate-400">Total acumulado: </span>
        <span className="text-xl font-semibold text-emerald-400">{formatMoney(total)}</span>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum registro.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Data</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                  <td className="p-4 text-slate-300">{item.descricao || '-'}</td>
                  <td className="p-4 text-slate-300">{item.tipo || '-'}</td>
                  <td className="p-4 text-right text-emerald-400 font-medium">{formatMoney(item.valor)}</td>
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
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-card-border">
              <div>
                <h2 className="text-lg font-semibold text-white">Novo Registro</h2>
                <p className="text-sm text-slate-400 mt-0.5">Preencha as informações do valor guardado ou investido.</p>
              </div>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Reserva de emergência" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <div className="relative">
                  <InputData value={data} onChange={setData} required className="w-full px-4 py-2 pr-10 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" placeholder="DD/MM/AAAA" />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} required placeholder="0,00" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  {TIPOS_OPCOES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
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
