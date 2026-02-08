import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { produtos } from '../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function ProdutosLista() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [preco_custo, setPrecoCusto] = useState('')
  const [preco, setPreco] = useState('')
  const [estoque_atual, setEstoqueAtual] = useState('0')
  const [unidade, setUnidade] = useState('UN')

  async function carregar() {
    setLoading(true)
    try {
      const res = await produtos.list()
      setList(res)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEdit(null)
    setNome('')
    setCodigo('')
    setPrecoCusto('')
    setPreco('')
    setEstoqueAtual('0')
    setUnidade('UN')
    setModal(true)
  }

  function abrirEditar(item) {
    setEdit(item)
    setNome(item.nome || '')
    setCodigo(item.codigo || '')
    setPrecoCusto(String(item.preco_custo ?? ''))
    setPreco(String(item.preco || 0))
    setEstoqueAtual(String(item.estoque_atual || 0))
    setUnidade(item.unidade || 'UN')
    setModal(true)
  }

  async function salvar(e) {
    e.preventDefault()
    try {
      if (edit) {
        await produtos.update(edit.id, { nome, codigo, preco_custo: Number(preco_custo) || 0, preco: Number(preco), estoque_atual: Number(estoque_atual), unidade })
      } else {
        await produtos.create({ nome, codigo, preco_custo: Number(preco_custo) || 0, preco: Number(preco), estoque_atual: Number(estoque_atual), unidade })
      }
      setModal(false)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este produto?')) return
    try {
      await produtos.delete(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Lista de Produtos</h1>
          <p className="text-slate-400 mt-1">Gerencie seus produtos e serviços.</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum produto cadastrado.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Nome</th>
                <th className="p-4">Código</th>
                <th className="p-4 text-right">Preço de Custo</th>
                <th className="p-4 text-right">Preço de Venda</th>
                <th className="p-4 text-right">Estoque</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{item.nome}</td>
                  <td className="p-4 text-slate-300">{item.codigo || '-'}</td>
                  <td className="p-4 text-right text-slate-400">{formatMoney(item.preco_custo)}</td>
                  <td className="p-4 text-right text-emerald-400 font-medium">{formatMoney(item.preco)}</td>
                  <td className="p-4 text-right text-slate-300">{item.estoque_atual} {item.unidade}</td>
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
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">{edit ? 'Editar' : 'Novo'} produto</h2>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Código (SKU)</label>
                <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Preço de Custo (R$)</label>
                <input type="number" step="0.01" min="0" value={preco_custo} onChange={(e) => setPrecoCusto(e.target.value)} placeholder="0,00" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Preço de Venda (R$)</label>
                <input type="number" step="0.01" min="0" value={preco} onChange={(e) => setPreco(e.target.value)} required placeholder="0,00" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-slate-400 mb-1">Estoque</label>
                  <input type="number" min="0" value={estoque_atual} onChange={(e) => setEstoqueAtual(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Unidade</label>
                  <select value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white">
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="L">L</option>
                    <option value="PCT">PCT</option>
                    <option value="CX">CX</option>
                  </select>
                </div>
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
