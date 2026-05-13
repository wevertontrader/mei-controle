import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { empresaUsuarios } from '../api/client'
import { PERMISSION_KEYS, PERMISSION_LABELS } from '../lib/sidebarAccess'

const CHECKBOX_KEYS = PERMISSION_KEYS

function emptyForm() {
  return {
    nome: '',
    email: '',
    senha: '',
    sidebar_permissions: ['visao-geral', 'perfil'],
  }
}

export default function UsuariosEmpresa() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro('')
    try {
      const rows = await empresaUsuarios.colaboradores.list()
      setLista(rows)
    } catch (e) {
      setErro(e.message)
      setLista([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const abrirNovo = () => {
    setErro('')
    setForm(emptyForm())
    setModal({ modo: 'novo' })
  }

  const abrirEditar = (row) => {
    setErro('')
    setForm({
      nome: row.nome || '',
      email: row.email || '',
      senha: '',
      sidebar_permissions:
        Array.isArray(row.sidebar_permissions) && row.sidebar_permissions.length
          ? [...row.sidebar_permissions]
          : ['visao-geral', 'perfil'],
    })
    setModal({ modo: 'editar', id: row.id })
  }

  const togglePerm = (key) => {
    setForm((f) => {
      const set = new Set(f.sidebar_permissions)
      if (set.has(key)) set.delete(key)
      else set.add(key)
      return { ...f, sidebar_permissions: [...set] }
    })
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      if (modal.modo === 'novo' && !form.senha.trim()) {
        setErro('Defina uma senha para o colaborador')
        setSalvando(false)
        return
      }
      if (modal.modo === 'novo') {
        await empresaUsuarios.colaboradores.create({
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
          sidebar_permissions: form.sidebar_permissions,
        })
      } else {
        const body = {
          nome: form.nome.trim(),
          email: form.email.trim(),
          sidebar_permissions: form.sidebar_permissions,
        }
        if (form.senha.trim()) body.senha = form.senha
        await empresaUsuarios.colaboradores.update(modal.id, body)
      }
      setModal(null)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (id) => {
    if (!window.confirm('Remover este colaborador? Ele não poderá mais entrar.')) return
    setErro('')
    try {
      await empresaUsuarios.colaboradores.delete(id)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Usuários</h1>
          <p className="text-slate-400 mt-1 max-w-xl">
            Você é o <span className="text-slate-300">administrador da empresa</span> e tem acesso completo.
            Cadastre <span className="text-slate-300">colaboradores</span> com e-mail e senha próprios e marque
            quais seções do sistema eles podem ver no menu.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo colaborador
        </button>
      </header>

      {erro && !modal && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum colaborador cadastrado. Use &quot;Novo colaborador&quot; para adicionar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-slate-400">
                  <th className="p-4">Nome</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Acessos</th>
                  <th className="p-4 w-28 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((row) => (
                  <tr key={row.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/20">
                    <td className="p-4 text-slate-200">{row.nome}</td>
                    <td className="p-4 text-slate-400 text-sm">{row.email}</td>
                    <td className="p-4 text-slate-500 text-sm">
                      {(row.sidebar_permissions || []).length} página(s)
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => abrirEditar(row)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-sidebar-hover"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => excluir(row.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-sidebar-hover"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg rounded-xl bg-[#161b22] border border-card-border shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">
                {modal.modo === 'novo' ? 'Novo colaborador' : 'Editar colaborador'}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {erro && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-card-bg border border-card-border text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">E-mail (login)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-card-bg border border-card-border text-white text-sm"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Senha {modal.modo === 'editar' ? '(deixe em branco para manter)' : ''}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-card-bg border border-card-border text-white text-sm"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Páginas com acesso ao menu</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECKBOX_KEYS.map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg border border-card-border cursor-pointer hover:border-slate-500"
                    >
                      <input
                        type="checkbox"
                        checked={form.sidebar_permissions.includes(key)}
                        onChange={() => togglePerm(key)}
                        className="rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">{PERMISSION_LABELS[key] || key}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-card-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-lg border border-card-border text-slate-300 text-sm hover:bg-sidebar-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={salvar}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
