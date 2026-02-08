import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Circle, X, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
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
                    onClick={() => selecionarDia(dia)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                      ${ehSelecionado(dia) ? 'bg-blue-700 text-white' : ''}
                      ${!ehSelecionado(dia) && ehHoje(dia) ? 'bg-slate-600/60 text-white' : ''}
                      ${!ehSelecionado(dia) && !ehHoje(dia) ? 'text-white hover:bg-sidebar-hover/50' : ''}`}
                  >
                    {dia}
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
