import { useState, useEffect } from 'react'
import { Plus, Download, Trash2, ExternalLink } from 'lucide-react'
import { notasFiscais, clientes } from '../api/client'
import InputData from '../components/InputData'
import { isValidIsoYmd } from '../utils/dateBr'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  const str = String(s).slice(0, 10)
  const d = new Date(str + 'T12:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

const LINKS_EMISSAO_OFICIAL = [
  {
    label: 'NFS-e — serviços',
    hint: 'Nota Fiscal de Serviço eletrônica (gov.br)',
    href: 'https://www.gov.br/nfse/pt-br',
  },
  {
    label: 'NF-e — mercadorias',
    hint: 'Portal da Nota Fiscal eletrônica (Receita Federal)',
    href: 'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
  },
]
const STATUS_CLASS = {
  Emitida: 'bg-emerald-500/20 text-emerald-400',
  Pendente: 'bg-amber-500/20 text-amber-400',
  Cancelada: 'bg-red-500/20 text-red-400',
}

export default function NotasFiscais() {
  const [list, setList] = useState([])
  const [clientesList, setClientesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    cliente_id: '',
    descricao: '',
    valor: '',
    status: 'Pendente',
  })

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setLoading(true)
    Promise.all([notasFiscais.list(), clientes.list()])
      .then(([notas, clientesData]) => {
        setList(notas)
        setClientesList(clientesData || [])
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }

  function abrirModal() {
    setForm({
      data: new Date().toISOString().slice(0, 10),
      cliente_id: '',
      descricao: '',
      valor: '',
      status: 'Pendente',
    })
    setModalAberto(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (!form.data || !isValidIsoYmd(form.data)) {
      setErro('Informe a data da nota no formato DD/MM/AAAA.')
      return
    }
    const payload = {
      data: form.data,
      cliente_id: form.cliente_id || null,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor) || 0,
      status: form.status,
    }
    if (form.cliente_id) {
      const c = clientesList.find((x) => String(x.id) === String(form.cliente_id))
      if (c) payload.cliente_nome = c.nome
    }
    notasFiscais
      .create(payload)
      .then(() => {
        setModalAberto(false)
        carregar()
      })
      .catch((e) => setErro(e.message))
  }

  function handleExcluir(item) {
    if (!confirm(`Excluir a nota ${item.numero}?`)) return
    notasFiscais
      .delete(item.id)
      .then(carregar)
      .catch((e) => setErro(e.message))
  }

  function handleDownload(item) {
    window.alert(`Download da nota ${item.numero}: em produção essa ação gerará o PDF da NFS-e.`)
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notas Fiscais</h1>
          <p className="text-slate-400 mt-1">Controle interno de NFS-e. Use os portais oficiais abaixo para emitir notas junto ao governo.</p>
        </div>
        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shrink-0"
        >
          <Plus className="w-5 h-5" />
          Registrar no app
        </button>
      </header>

      <section className="mb-6 rounded-xl border border-card-border bg-card-bg p-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Emissão oficial — abre em nova aba</p>
        <div className="flex flex-wrap gap-2">
          {LINKS_EMISSAO_OFICIAL.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.hint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-card-border bg-[#0d1117] text-slate-200 text-sm font-medium hover:border-blue-500/50 hover:text-white hover:bg-blue-500/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0 text-blue-400" aria-hidden />
              {link.label}
            </a>
          ))}
        </div>
      </section>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhuma nota registrada. Use o botão Registrar no app ou os links oficiais acima.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-slate-400">
                  <th className="p-4">NÚMERO</th>
                  <th className="p-4">DATA</th>
                  <th className="p-4">CLIENTE</th>
                  <th className="p-4">DESCRIÇÃO</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">VALOR</th>
                  <th className="p-4 w-24">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                    <td className="p-4 font-medium text-white">{item.numero}</td>
                    <td className="p-4 text-slate-300">{formatDate(item.data)}</td>
                    <td className="p-4 text-slate-300">{item.cliente_nome || '-'}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{item.descricao || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_CLASS[item.status] || 'bg-slate-500/20 text-slate-400'}`}>
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-400">{formatMoney(item.valor)}</td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(item)}
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
          </div>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-card-border w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">Registrar nota no app</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <InputData
                  value={form.data}
                  onChange={(iso) => setForm({ ...form, data: iso })}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500"
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Cliente</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                >
                  <option value="">Selecione (opcional)</option>
                  {clientesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome || 'Sem nome'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  placeholder="Ex: Consultoria técnica"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Emitida">Emitida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-2 rounded-lg border border-card-border text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
