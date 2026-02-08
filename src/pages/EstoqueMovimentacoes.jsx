import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { estoque, produtos } from '../api/client'
import InputData from '../components/InputData'

function formatDate(s) {
  if (!s) return ''
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

export default function EstoqueMovimentacoes() {
  const [list, setList] = useState([])
  const [produtosList, setProdutosList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [produto_id, setProdutoId] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [tipo, setTipo] = useState('entrada')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))

  async function carregar() {
    setLoading(true)
    try {
      const [m, p] = await Promise.all([estoque.movimentacoes.list(), produtos.list()])
      setList(m)
      setProdutosList(p)
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
      await estoque.movimentacoes.create({ produto_id: Number(produto_id), quantidade: Number(quantidade), tipo, descricao, data })
      setModal(false)
      setProdutoId('')
      setQuantidade('')
      setTipo('entrada')
      setDescricao('')
      setData(new Date().toISOString().slice(0, 10))
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Movimentações de Estoque</h1>
          <p className="text-slate-400 mt-1">Registre entradas e saídas de produtos.</p>
        </div>
        <button onClick={() => setModal(true)} disabled={produtosList.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium">
          <Plus className="w-4 h-4" /> Nova movimentação
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
      {produtosList.length === 0 && !loading && (
        <div className="mb-4 p-3 rounded-lg bg-amber-500/20 text-amber-400 text-sm">
          Cadastre produtos antes de registrar movimentações.
        </div>
      )}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma movimentação registrada.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Data</th>
                <th className="p-4">Produto</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 text-right">Quantidade</th>
                <th className="p-4">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                  <td className="p-4 text-slate-300">{item.produto_nome}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm ${item.tipo === 'entrada' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-300 font-medium">{item.quantidade}</td>
                  <td className="p-4 text-slate-400">{item.descricao || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Nova movimentação</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Produto *</label>
                <select value={produto_id} onChange={(e) => setProdutoId(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  <option value="">Selecione...</option>
                  {produtosList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.estoque_atual})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo *</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Quantidade *</label>
                <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
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
