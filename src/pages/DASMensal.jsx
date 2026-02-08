import { useState, useEffect } from 'react'
import { Plus, Check, Trash2, Calendar, ExternalLink } from 'lucide-react'
import { dasMensal } from '../api/client'

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

function refToLabel(ref) {
  if (!ref || ref.length < 7) return ref
  const [y, m] = ref.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[parseInt(m, 10) - 1]}/${y}`
}

export default function DASMensal() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState({
    referencia: new Date().toISOString().slice(0, 7),
    valor: '66.00',
  })

  useEffect(() => {
    carregar()
  }, [])

  function carregar() {
    setLoading(true)
    dasMensal
      .list()
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }

  function abrirModal() {
    const now = new Date()
    const ref = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setForm({ referencia: ref, valor: '66.00' })
    setModalAberto(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    dasMensal
      .create({ referencia: form.referencia, valor: form.valor })
      .then(() => {
        setModalAberto(false)
        carregar()
      })
      .catch((e) => setErro(e.message))
  }

  function handleMarcarPago(item) {
    dasMensal.marcarPago(item.id).then(carregar).catch((e) => setErro(e.message))
  }

  function handleExcluir(item) {
    if (!confirm(`Remover DAS ${refToLabel(item.referencia)}?`)) return
    dasMensal.delete(item.id).then(carregar).catch((e) => setErro(e.message))
  }

  const proximoVencimento = () => {
    const d = new Date()
    const ano = d.getFullYear()
    const mes = d.getMonth()
    return new Date(ano, mes, 20)
  }
  const vencimento = proximoVencimento()

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">DAS Mensal</h1>
          <p className="text-slate-400 mt-1">Controle e pagamento do Documento de Arrecadação do Simples Nacional.</p>
        </div>
        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
        >
          <Plus className="w-5 h-5" />
          Adicionar referência
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-6">
        <p className="text-amber-200 text-sm font-medium flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          DAS vence todo dia 20. Próximo vencimento: {formatDate(vencimento.toISOString().slice(0, 10))}.
        </p>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-5 mb-6">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-blue-400" />
          Emitir e pagar DAS no site do governo
        </h3>
        <p className="text-slate-300 text-sm mb-4">
          Não existe API pública para puxar o DAS automaticamente. O documento deve ser emitido pelo MEI no Portal do Simples Nacional ou no app MEI, com login gov.br. Use os links abaixo:
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://www8.receita.fazenda.gov.br/SimplesNacional/Default.aspx"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Portal Simples Nacional
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/pagamento-de-contribuicao-mensal/boleto-de-pagamento-1"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 text-sm font-medium"
          >
            Boleto DAS (gov.br)
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Nenhum DAS lançado. Clique em Adicionar referência para registrar um mês.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border text-left text-sm text-slate-400">
                  <th className="p-4">REFERÊNCIA</th>
                  <th className="p-4">VENCIMENTO</th>
                  <th className="p-4">VALOR</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4">DATA PAGAMENTO</th>
                  <th className="p-4 w-32">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/30">
                    <td className="p-4 font-medium text-white">{refToLabel(item.referencia)}</td>
                    <td className="p-4 text-slate-300">{formatDate(item.vencimento)}</td>
                    <td className="p-4 text-slate-300">{formatMoney(item.valor)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.pago ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {item.pago ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{item.data_pagamento ? formatDate(item.data_pagamento) : '-'}</td>
                    <td className="p-4 flex gap-2">
                      {!item.pago && (
                        <button
                          onClick={() => handleMarcarPago(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        >
                          <Check className="w-3 h-3" />
                          Marcar pago
                        </button>
                      )}
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

      <div className="mt-6 rounded-xl bg-card-bg border border-card-border p-4">
        <p className="text-slate-400 text-sm">
          O pagamento do DAS pode ser feito no site da Receita Federal ou pelo app MEI. Este módulo serve para controle e lembrete; o valor padrão é referência e pode variar conforme a atividade.
        </p>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-card-border w-full max-w-md shadow-xl">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-lg font-semibold text-white">Adicionar DAS</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Referência (mês/ano)</label>
                <input
                  type="month"
                  value={form.referencia}
                  onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  required
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
                />
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
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
