import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Check, Circle, X, Calendar, Clock, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react'
import { tarefas } from '../api/client'
import InputData from '../components/InputData'

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function formatDate(s) {
  if (!s) return '-'
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

function hojeFormatado() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function gerarDiasCalendario(ano, mes) {
  const primeiro = new Date(ano, mes, 1)
  const ultimo = new Date(ano, mes + 1, 0)
  const inicioDia = primeiro.getDay()
  const totalDias = ultimo.getDate()
  const dias = []
  for (let i = 0; i < inicioDia; i++) dias.push(null)
  for (let d = 1; d <= totalDias; d++) dias.push(d)
  return dias
}

export default function TarefasPage() {
  const hoje = new Date()
  const [calAno, setCalAno] = useState(hoje.getFullYear())
  const [calMes, setCalMes] = useState(hoje.getMonth())
  const [dataSelecionada, setDataSelecionada] = useState(hojeFormatado())
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [data_limite, setDataLimite] = useState(hojeFormatado())
  const [hora, setHora] = useState('')
  const [tipo, setTipo] = useState('Trabalho')
  const [buscaLista, setBuscaLista] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')
  const [filtroTipoLista, setFiltroTipoLista] = useState('todos')

  async function carregar() {
    setLoading(true)
    try {
      const res = await tarefas.list()
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
      await tarefas.create({ titulo: descricao, descricao, data_limite: data_limite || null, hora: hora || null, tipo })
      setModal(false)
      setDescricao('')
      setDataLimite(hojeFormatado())
      setHora('')
      setTipo('Trabalho')
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function toggleConcluida(item) {
    try {
      await tarefas.update(item.id, { concluida: item.concluida ? 0 : 1 })
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    if (!confirm('Excluir esta tarefa?')) return
    try {
      await tarefas.delete(id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const tarefasDoDia = list.filter((t) => t.data_limite === dataSelecionada)
  const listaFiltrada = useMemo(() => {
    const q = buscaLista.trim().toLowerCase()
    return list
      .filter((t) => {
        if (filtroStatus === 'pendentes' && t.concluida) return false
        if (filtroStatus === 'concluidas' && !t.concluida) return false
        if (filtroTipoLista !== 'todos' && (t.tipo || 'Trabalho') !== filtroTipoLista) return false
        if (!q) return true
        const texto = [t.titulo, t.descricao, t.tipo, t.data_limite, t.hora].filter(Boolean).join(' ').toLowerCase()
        return texto.includes(q)
      })
      .sort((a, b) => {
        const da = a.data_limite || ''
        const db = b.data_limite || ''
        if (da !== db) return da.localeCompare(db)
        return (b.id || 0) - (a.id || 0)
      })
  }, [list, buscaLista, filtroStatus, filtroTipoLista])

  const datasComTarefa = useMemo(() => {
    const s = new Set()
    for (const t of list) {
      if (!t.data_limite) continue
      const d = String(t.data_limite).slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) s.add(d)
    }
    return s
  }, [list])

  const diasCal = gerarDiasCalendario(calAno, calMes)
  const dataHojeStr = hojeFormatado()

  function formatarDataParaExibicao(s) {
    if (!s) return ''
    const [y, m, d] = s.split('-')
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }

  function selecionarDia(dia) {
    if (!dia) return
    const str = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    setDataSelecionada(str)
  }

  function irProximoMes() {
    if (calMes === 11) {
      setCalMes(0)
      setCalAno((a) => a + 1)
    } else setCalMes((m) => m + 1)
  }

  function irMesAnterior() {
    if (calMes === 0) {
      setCalMes(11)
      setCalAno((a) => a - 1)
    } else setCalMes((m) => m - 1)
  }

  function ehHoje(dia) {
    if (!dia) return false
    const str = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return str === dataHojeStr
  }

  function ehSelecionado(dia) {
    if (!dia) return false
    const str = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return str === dataSelecionada
  }

  function diaChaveISO(dia) {
    return `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function diaTemTarefaMarcada(dia) {
    if (!dia) return false
    return datasComTarefa.has(diaChaveISO(dia))
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agenda de Tarefas</h1>
          <p className="text-slate-400 mt-1">Organize suas tarefas e compromissos.</p>
        </div>
        <button
          onClick={() => {
            setDataLimite(dataSelecionada)
            setModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
        >
          <Plus className="w-4 h-4" /> Adicionar Tarefa
        </button>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <div className="space-y-6">
        <div className="rounded-xl bg-card-bg border border-card-border p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={irMesAnterior} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover/50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-white font-medium capitalize">{MESES[calMes]} {calAno}</span>
            <button onClick={irProximoMes} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover/50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-2 text-xs font-medium text-slate-400">
                {d}
              </div>
            ))}
            {diasCal.map((dia, i) => (
              <div key={i} className="py-1">
                {dia ? (
                  <button
                    type="button"
                    onClick={() => selecionarDia(dia)}
                    aria-label={
                      diaTemTarefaMarcada(dia)
                        ? `${dia} de ${MESES[calMes]} — há tarefas neste dia`
                        : `${dia} de ${MESES[calMes]}`
                    }
                    className={`min-w-[2.25rem] h-9 px-1 inline-flex items-center justify-center gap-0.5 rounded-lg text-sm font-medium transition-colors
                      ${ehSelecionado(dia) ? 'bg-blue-700 text-white' : ''}
                      ${!ehSelecionado(dia) && ehHoje(dia) ? 'bg-slate-600/60 text-white' : ''}
                      ${!ehSelecionado(dia) && !ehHoje(dia) ? 'text-white hover:bg-sidebar-hover/50' : ''}`}
                  >
                    <span>{dia}</span>
                    {diaTemTarefaMarcada(dia) ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                        title="Há tarefa(s) neste dia"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tarefas do dia {formatarDataParaExibicao(dataSelecionada)}</h2>
          {loading ? (
            <p className="text-slate-400">Carregando...</p>
          ) : tarefasDoDia.length === 0 ? (
            <p className="text-slate-400">Nenhuma tarefa para este dia.</p>
          ) : (
            <ul className="space-y-2">
              {tarefasDoDia.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-hover/30">
                  <button onClick={() => toggleConcluida(item)} className={item.concluida ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}>
                    {item.concluida ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={item.concluida ? 'text-slate-400 line-through' : 'text-white font-medium'}>{item.titulo}</p>
                    {(item.hora || item.tipo) && (
                      <p className="text-slate-500 text-xs mt-0.5">
                        {[item.hora, item.tipo].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => excluir(item.id)} className="p-2 rounded text-slate-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-4 lg:p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                Todas as tarefas
              </h2>
              <span className="text-sm text-slate-500">
                {listaFiltrada.length === list.length
                  ? `${list.length} registro(s)`
                  : `${listaFiltrada.length} de ${list.length}`}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="search"
                  value={buscaLista}
                  onChange={(e) => setBuscaLista(e.target.value)}
                  placeholder="Buscar por título, descrição, tipo, data ou hora…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0d1117] border border-card-border text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  aria-label="Buscar tarefas"
                />
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-[#0d1117] border border-card-border text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                  aria-label="Filtrar por status"
                >
                  <option value="todas">Status: todas</option>
                  <option value="pendentes">Pendentes</option>
                  <option value="concluidas">Concluídas</option>
                </select>
                <select
                  value={filtroTipoLista}
                  onChange={(e) => setFiltroTipoLista(e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-[#0d1117] border border-card-border text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[140px]"
                  aria-label="Filtrar por tipo"
                >
                  <option value="todos">Tipo: todos</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400 py-6">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-slate-400 py-6">Nenhuma tarefa cadastrada.</p>
          ) : listaFiltrada.length === 0 ? (
            <p className="text-slate-400 py-6">Nenhuma tarefa corresponde aos filtros.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-card-border/80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-sidebar-hover/20 text-left text-slate-400">
                    <th className="p-3 w-10" />
                    <th className="p-3">Título</th>
                    <th className="p-3 hidden md:table-cell">Descrição</th>
                    <th className="p-3 whitespace-nowrap">Data limite</th>
                    <th className="p-3 hidden sm:table-cell">Hora</th>
                    <th className="p-3 hidden lg:table-cell">Tipo</th>
                    <th className="p-3 w-24 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((item) => (
                    <tr key={item.id} className="border-b border-card-border/50 hover:bg-sidebar-hover/20">
                      <td className="p-3 align-top">
                        <button
                          type="button"
                          onClick={() => toggleConcluida(item)}
                          className={item.concluida ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}
                          title={item.concluida ? 'Marcar pendente' : 'Marcar concluída'}
                        >
                          {item.concluida ? <Check className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="p-3 align-top">
                        <span className={item.concluida ? 'text-slate-400 line-through' : 'text-white font-medium'}>
                          {item.titulo || '—'}
                        </span>
                        <p className="md:hidden text-xs text-slate-500 mt-1">
                          {[item.tipo, item.hora].filter(Boolean).join(' • ') || '—'}
                        </p>
                      </td>
                      <td className="p-3 align-top text-slate-400 hidden md:table-cell max-w-[220px]">
                        <span className="line-clamp-2">{item.descricao && item.descricao !== item.titulo ? item.descricao : '—'}</span>
                      </td>
                      <td className="p-3 align-top text-slate-300 whitespace-nowrap">{formatDate(item.data_limite)}</td>
                      <td className="p-3 align-top text-slate-400 hidden sm:table-cell">{item.hora || '—'}</td>
                      <td className="p-3 align-top text-slate-400 hidden lg:table-cell">{item.tipo || '—'}</td>
                      <td className="p-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => excluir(item.id)}
                          className="inline-flex p-2 rounded text-slate-400 hover:text-red-400"
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
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md relative">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="absolute top-4 right-4 p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white mb-1">Nova Tarefa</h2>
            <p className="text-sm text-slate-400 mb-6">Preencha os dados para agendar sua tarefa.</p>
            <form onSubmit={salvar} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  placeholder="Ex: Pagar DAS"
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <div className="relative">
                  <InputData
                    value={data_limite}
                    onChange={setDataLimite}
                    required
                    className="w-full px-4 py-3 pr-10 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="DD/MM/AAAA"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Hora</label>
                <div className="relative">
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    placeholder="--:--"
                    className="w-full px-4 py-3 pr-10 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Financeiro">Financeiro</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Pessoal">Pessoal</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">Salvar</button>
                <button type="button" onClick={() => setModal(false)} className="px-4 py-3 rounded-lg border border-card-border text-slate-400 hover:text-white">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
