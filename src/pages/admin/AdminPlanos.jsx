import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { admin } from '../../api/client'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function AdminPlanos() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    preco: '',
    dias: '',
    periodo: 'mês',
    features: '',
    destaque: false,
    economia: '',
  })

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    admin.planos.list()
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }

  function abrirNovo() {
    setEditando(null)
    setForm({
      nome: '',
      slug: '',
      preco: '',
      dias: '',
      periodo: 'mês',
      features: '',
      destaque: false,
      economia: '',
    })
    setModalAberto(true)
  }

  function abrirEditar(p) {
    setEditando(p)
    setForm({
      nome: p.nome,
      slug: p.slug,
      preco: String(p.preco),
      dias: String(p.dias),
      periodo: p.periodo || 'mês',
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      destaque: !!p.destaque,
      economia: p.economia || '',
    })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const features = form.features.trim().split('\n').filter(Boolean)
    const dados = {
      nome: form.nome.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      preco: parseFloat(form.preco) || 0,
      dias: parseInt(form.dias, 10) || 30,
      periodo: form.periodo || 'mês',
      features,
      destaque: form.destaque,
      economia: form.economia.trim() || null,
    }
    const promessa = editando
      ? admin.planos.update(editando.id, dados)
      : admin.planos.create(dados)
    promessa
      .then(() => {
        fecharModal()
        carregar()
      })
      .catch((e) => setErro(e.message))
  }

  function handleExcluir(id) {
    if (!confirm('Excluir este plano? Empresas não poderão assiná-lo.')) return
    admin.planos.delete(id)
      .then(carregar)
      .catch((e) => setErro(e.message))
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Planos</h1>
          <p className="text-slate-400 mt-1">Cadastre os planos de assinatura exibidos às empresas.</p>
        </div>
        <button
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo plano
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum plano cadastrado. Clique em Novo plano para começar.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Plano</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Dias</th>
                <th className="p-4">Período</th>
                <th className="p-4">Destaque</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 font-medium text-white">{item.nome}</td>
                  <td className="p-4 text-slate-300">{item.slug}</td>
                  <td className="p-4 text-emerald-400">{formatMoney(item.preco)}</td>
                  <td className="p-4 text-slate-300">{item.dias}</td>
                  <td className="p-4 text-slate-300">{item.periodo}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.destaque ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'}`}>
                      {item.destaque ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => abrirEditar(item)}
                      className="p-2 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExcluir(item.id)}
                      className="p-2 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-card-border w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">{editando ? 'Editar plano' : 'Novo plano'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Ex: Mensal"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Slug (identificador único)</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Ex: mensal"
                  required
                  readOnly={!!editando}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Dias de vigência</label>
                  <input
                    type="number"
                    value={form.dias}
                    onChange={(e) => setForm({ ...form, dias: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Período (exibido)</label>
                <select
                  value={form.periodo}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                >
                  <option value="mês">/mês</option>
                  <option value="ano">/ano</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Economia (opcional)</label>
                <input
                  value={form.economia}
                  onChange={(e) => setForm({ ...form, economia: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Ex: Economize 2 meses"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Benefícios (um por linha)</label>
                <textarea
                  value={form.features}
                  onChange={(e) => setForm({ ...form, features: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white min-h-[80px]"
                  placeholder="Acesso completo ao sistema&#10;Suporte por e-mail"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="destaque"
                  checked={form.destaque}
                  onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
                  className="rounded border-card-border"
                />
                <label htmlFor="destaque" className="text-sm text-slate-300">Destacar este plano</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2 rounded-lg border border-card-border text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
                >
                  {editando ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
