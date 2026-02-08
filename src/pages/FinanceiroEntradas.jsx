import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, X, Calendar } from 'lucide-react'
import { financeiro, clientes } from '../api/client'
import InputData from '../components/InputData'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

const FORMAS_PAGAMENTO = [
  'Dinheiro',
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Transferência Bancária',
  'Boleto',
  'Outro',
]

const STATUS_OPCOES = ['Recebido', 'Pendente']

export default function FinanceiroEntradas() {
  const [list, setList] = useState([])
  const [clientesList, setClientesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [valor, setValor] = useState('')
  const [status, setStatus] = useState('Recebido')
  const [forma_pagamento, setFormaPagamento] = useState('')
  const [cliente_id, setClienteId] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const [entradas, clientesRes] = await Promise.all([financeiro.entradas.list(), clientes.list()])
      setList(entradas)
      setClientesList(clientesRes || [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEdit(null)
    setDescricao('')
    setData(new Date().toISOString().slice(0, 10))
    setValor('')
    setStatus('Recebido')
    setFormaPagamento('')
    setClienteId('')
    setModal(true)
  }

  function abrirEditar(item) {
    setEdit(item)
    setDescricao(item.descricao || '')
    setData(item.data?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setValor(String(item.valor))
    setStatus(item.status || 'Recebido')
    setFormaPagamento(item.forma_pagamento || '')
    setClienteId(item.cliente_id ? String(item.cliente_id) : '')
    setModal(true)
  }

  async function salvar(e) {
    e.preventDefault()
    try {
      const dados = { valor: Number(valor), descricao, data, status, forma_pagamento: forma_pagamento || null, cliente_id: cliente_id ? Number(cliente_id) : null }
      if (edit) {
        await financeiro.entradas.update(edit.id, dados)
      } else {
        await financeiro.entradas.create(dados)
      }
      setModal(false)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta entrada?')) return
    try {
      await financeiro.entradas.delete(id)
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
          <h1 className="text-2xl font-semibold text-white">Entradas</h1>
          <p className="text-slate-400 mt-1">Registre suas receitas e entradas de dinheiro.</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Nova entrada
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <span className="text-slate-400">Total do período: </span>
          <span className="text-xl font-semibold text-emerald-400">{formatMoney(total)}</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma entrada registrada.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Data</th>
                <th className="p-4">Descrição</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                  <td className="p-4 text-slate-300">{item.descricao || '-'}</td>
                  <td className="p-4 text-slate-300">{item.cliente_nome || '-'}</td>
                  <td className="p-4 text-slate-300">{item.status || '-'}</td>
                  <td className="p-4 text-right text-emerald-400 font-medium">{formatMoney(item.valor)}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(item)} className="p-2 rounded text-slate-400 hover:text-white hover:bg-sidebar-hover"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => excluir(item.id)} className="p-2 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
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
                <h2 className="text-lg font-semibold text-white">Cadastrar Nova Entrada</h2>
                <p className="text-sm text-slate-400 mt-0.5">Preencha as informações da venda ou serviço prestado.</p>
              </div>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvar} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da venda ou serviço" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
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
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  {STATUS_OPCOES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Forma de Pagamento</label>
                <select value={forma_pagamento} onChange={(e) => setFormaPagamento(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  <option value="">Selecione a forma de pagamento</option>
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente (Opcional)</label>
                <select value={cliente_id} onChange={(e) => setClienteId(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  <option value="">Nenhum</option>
                  {clientesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Salvar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
