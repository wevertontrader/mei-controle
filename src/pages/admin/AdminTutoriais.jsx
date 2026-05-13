import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { admin } from '../../api/client'

const ICON_OPTIONS = [
  { value: 'book-open', label: 'Livro' },
  { value: 'trending-up', label: 'Gráfico / tendência' },
  { value: 'users', label: 'Usuários' },
  { value: 'package', label: 'Pacote / produto' },
  { value: 'play-circle', label: 'Play' },
  { value: 'video', label: 'Vídeo' },
  { value: 'file-text', label: 'Documento' },
  { value: 'sparkles', label: 'Destaque' },
]

export default function AdminTutoriais() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    url_video: '',
    icon: 'book-open',
    ordem: '0',
    ativo: true,
  })

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    admin.tutoriais
      .list()
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }

  function abrirNovo() {
    setEditando(null)
    setForm({
      titulo: '',
      descricao: '',
      url_video: '',
      icon: 'book-open',
      ordem: String((list[list.length - 1]?.ordem ?? 0) + 1),
      ativo: true,
    })
    setModalAberto(true)
  }

  function abrirEditar(row) {
    setEditando(row)
    setForm({
      titulo: row.titulo || '',
      descricao: row.descricao || '',
      url_video: row.url_video || '',
      icon: row.icon || 'book-open',
      ordem: String(row.ordem ?? 0),
      ativo: !!row.ativo,
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
    const dados = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      url_video: form.url_video.trim() || null,
      icon: form.icon,
      ordem: parseInt(form.ordem, 10) || 0,
      ativo: form.ativo,
    }
    const promessa = editando ? admin.tutoriais.update(editando.id, dados) : admin.tutoriais.create(dados)
    promessa
      .then(() => {
        fecharModal()
        carregar()
      })
      .catch((e) => setErro(e.message))
  }

  function handleExcluir(id) {
    if (!confirm('Excluir este tutorial?')) return
    admin.tutoriais.delete(id).then(carregar).catch((e) => setErro(e.message))
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tutoriais</h1>
          <p className="text-slate-400 mt-1">
            Cadastre os guias exibidos em <span className="text-slate-300">Tutoriais</span> para todas as empresas.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo tutorial
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum tutorial. Clique em Novo tutorial.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4 w-20">Ordem</th>
                <th className="p-4">Título</th>
                <th className="p-4">Ícone</th>
                <th className="p-4">Link</th>
                <th className="p-4">Ativo</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{item.ordem}</td>
                  <td className="p-4 font-medium text-white">{item.titulo}</td>
                  <td className="p-4 text-slate-400 text-sm">{item.icon}</td>
                  <td className="p-4 text-slate-400 text-sm truncate max-w-[180px]">
                    {item.url_video ? item.url_video : '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${item.ativo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600/30 text-slate-500'}`}
                    >
                      {item.ativo ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(item)}
                      className="p-2 rounded text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
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
          <div className="bg-slate-800 rounded-xl border border-card-border w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">{editando ? 'Editar tutorial' : 'Novo tutorial'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Ex: Como lançar entradas"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white min-h-[88px]"
                  placeholder="Texto exibido no card do tutorial"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Link (YouTube, artigo, etc.) — opcional</label>
                <input
                  value={form.url_video}
                  onChange={(e) => setForm({ ...form, url_video: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ícone</label>
                  <select
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  >
                    {ICON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Ordem na lista</label>
                  <input
                    type="number"
                    value={form.ordem}
                    onChange={(e) => setForm({ ...form, ordem: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tut-ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="rounded border-card-border"
                />
                <label htmlFor="tut-ativo" className="text-sm text-slate-300">
                  Visível para as empresas
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2 rounded-lg border border-card-border text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium">
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
