import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { clientes } from '../api/client'

export default function ClientesCadastro() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [endereco, setEndereco] = useState('')
  const [documento, setDocumento] = useState('')
  const [nome_empresa, setNomeEmpresa] = useState('')
  const [funcao, setFuncao] = useState('')
  const [site, setSite] = useState('')
  const [instagram, setInstagram] = useState('')

  async function carregar() {
    setLoading(true)
    try {
      const res = await clientes.list()
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
    setEmail('')
    setWhatsapp('')
    setEndereco('')
    setDocumento('')
    setNomeEmpresa('')
    setFuncao('')
    setSite('')
    setInstagram('')
    setModal(true)
  }

  function abrirEditar(item) {
    setEdit(item)
    setNome(item.nome || '')
    setEmail(item.email || '')
    setWhatsapp(item.whatsapp || '')
    setEndereco(item.endereco || '')
    setDocumento(item.documento || '')
    setNomeEmpresa(item.nome_empresa || '')
    setFuncao(item.funcao || '')
    setSite(item.site || '')
    setInstagram(item.instagram || '')
    setModal(true)
  }

  async function salvar(e) {
    e.preventDefault()
    try {
      const dados = { nome, email, whatsapp, endereco, documento, nome_empresa, funcao, site, instagram }
      if (edit) {
        await clientes.update(edit.id, dados)
      } else {
        await clientes.create(dados)
      }
      setModal(false)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir este cliente?')) return
    try {
      await clientes.delete(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cadastro de Clientes</h1>
          <p className="text-slate-400 mt-1">Gerencie seu cadastro de clientes.</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
          <Plus className="w-4 h-4" /> Novo cliente
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum cliente cadastrado.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border text-left text-sm text-slate-400">
                <th className="p-4">Nome</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">WhatsApp</th>
                <th className="p-4 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                  <td className="p-4 text-slate-300">{item.nome || '-'}</td>
                  <td className="p-4 text-slate-300">{item.email || '-'}</td>
                  <td className="p-4 text-slate-300">{item.whatsapp || item.telefone || '-'}</td>
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
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-card-border">
              <div>
                <h2 className="text-lg font-semibold text-white">Cadastrar Cliente</h2>
                <p className="text-sm text-slate-400 mt-0.5">Preencha as informações do cliente. Todos os campos são opcionais.</p>
              </div>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={salvar} className="overflow-y-auto p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao.silva@email.com" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
                  <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-8888" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Endereço</label>
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua das Flores, 123" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nome da Empresa</label>
                  <input type="text" value={nome_empresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Silva & Filhos Ltda." className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">CPF ou CNPJ</label>
                  <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Função</label>
                  <input type="text" value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Ex: Diretor de Compras" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Instagram</label>
                  <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seucliente" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Site</label>
                  <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="www.sitecliente.com.br" className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-6">
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
