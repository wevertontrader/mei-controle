import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function CalculadoraPrecificacao() {
  const [tab, setTab] = useState('produtos')
  const [custoUnitario, setCustoUnitario] = useState('25.5')
  const [despesasFixas, setDespesasFixas] = useState('5')
  const [impostos, setImpostos] = useState('6')
  const [margemLucro, setMargemLucro] = useState('40')
  const [custoHoraTecnica, setCustoHoraTecnica] = useState('50')
  const [custosDespesas, setCustosDespesas] = useState('30')
  const [tempoEstimado, setTempoEstimado] = useState('4')
  const [margemLucroServ, setMargemLucroServ] = useState('50')
  const [resultado, setResultado] = useState(null)

  function calcular(e) {
    e.preventDefault()
    if (tab === 'produtos') {
      const custo = Number(custoUnitario) || 0
      const despesas = Number(despesasFixas) || 0
      const imp = Number(impostos) || 0
      const margem = Number(margemLucro) || 0
      const custoTotal = custo + despesas
      if (custoTotal <= 0) {
        setResultado(null)
        return
      }
      const preco = custoTotal / ((1 - imp / 100) * (1 - margem / 100))
      const lucroBruto = preco * (1 - imp / 100) - custoTotal
      const markup = custoTotal > 0 ? preco / custoTotal : 0
      setResultado({ tab: 'produtos', preco, lucroBruto, markup })
    } else {
      const custoHora = Number(custoHoraTecnica) || 0
      const despesas = Number(custosDespesas) || 0
      const tempo = Number(tempoEstimado) || 0
      const margem = Number(margemLucroServ) || 0
      const custoTotal = custoHora * tempo + despesas
      if (custoTotal <= 0 || margem >= 100) {
        setResultado(null)
        return
      }
      const preco = custoTotal / (1 - margem / 100)
      const lucroBruto = preco - custoTotal
      setResultado({ tab: 'servicos', preco, lucroBruto })
    }
  }


  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Calculadora de Precificação</h1>
        <p className="text-slate-400 mt-1">
          Calcule preços de forma inteligente para garantir sua lucratividade.
        </p>
      </header>

      <div className="flex gap-1 mb-8">
        <button
          type="button"
          onClick={() => { setTab('produtos'); setResultado(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'produtos'
              ? 'bg-sidebar-active text-blue-300'
              : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
          }`}
        >
          Produtos
        </button>
        <button
          type="button"
          onClick={() => { setTab('servicos'); setResultado(null) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'servicos'
              ? 'bg-sidebar-active text-blue-300'
              : 'text-slate-400 hover:bg-sidebar-hover hover:text-white'
          }`}
        >
          Serviços
        </button>
      </div>

      <div className="max-w-2xl rounded-xl bg-card-bg border border-card-border overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h2 className="text-lg font-semibold text-white">
            {tab === 'produtos' ? 'Calculadora de Produtos' : 'Calculadora de Serviços'}
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {tab === 'produtos'
              ? 'Calcule o preço de venda ideal para seus produtos.'
              : 'Defina o preço de seus serviços com base no seu custo e tempo.'}
          </p>
        </div>
        <form onSubmit={calcular} className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {tab === 'produtos' ? (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoUnitario}
                    onChange={(e) => setCustoUnitario(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Despesas Fixas (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={despesasFixas}
                    onChange={(e) => setDespesasFixas(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Impostos/Taxas (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="99"
                    value={impostos}
                    onChange={(e) => setImpostos(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Margem de Lucro (%)</label>
                  <div className="flex rounded-lg bg-[#0d1117] border border-card-border overflow-hidden">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="99"
                      value={margemLucro}
                      onChange={(e) => setMargemLucro(e.target.value)}
                      className="flex-1 px-4 py-3 bg-transparent text-white focus:outline-none focus:ring-0"
                    />
                    <div className="flex flex-col border-l border-card-border">
                      <button type="button" onClick={() => { setMargemLucro(String(Math.min(99, Number(margemLucro) + 1))) }} className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-hover"><ChevronUp className="w-4 h-4" /></button>
                      <button type="button" onClick={() => { setMargemLucro(String(Math.max(0, Number(margemLucro) - 1))) }} className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-hover"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Custo da Hora Técnica (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custoHoraTecnica}
                    onChange={(e) => setCustoHoraTecnica(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Custos com Despesas (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={custosDespesas}
                    onChange={(e) => setCustosDespesas(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tempo Estimado (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={tempoEstimado}
                    onChange={(e) => setTempoEstimado(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Margem de Lucro (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="99"
                    value={margemLucroServ}
                    onChange={(e) => setMargemLucroServ(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
              </>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Calcular
          </button>
        </form>

        {resultado && (
          <div className="p-6 border-t border-card-border space-y-6">
            <h3 className="font-semibold text-white">Resultado Detalhado:</h3>
            {resultado.tab === 'servicos' ? (
              <div className="space-y-6">
                <div>
                  <p className="text-2xl font-semibold text-blue-400">{formatMoney(resultado.preco)}</p>
                  <p className="text-sm font-medium text-white mt-1">Preço Final Sugerido</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Valor a ser cobrado do cliente, incluindo seus custos, tempo e lucro desejado.
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-emerald-400">{formatMoney(resultado.lucroBruto)}</p>
                  <p className="text-sm font-medium text-white mt-1">Lucro Bruto Estimado</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Valor que você irá lucrar com o serviço após a dedução de todos os custos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-semibold text-blue-400">{formatMoney(resultado.preco)}</p>
                  <p className="text-sm font-medium text-white mt-1">Preço de Venda Sugerido</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Este é o valor final que você deve cobrar do seu cliente para cobrir todos os custos
                    e atingir sua meta de lucro.
                  </p>
                </div>
                <div>
                  <p
                    className={`text-2xl font-semibold ${
                      resultado.lucroBruto >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatMoney(resultado.lucroBruto)}
                  </p>
                  <p className="text-sm font-medium text-white mt-1">Lucro Bruto por Unidade</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Este é o valor que sobra após subtrair todos os custos diretos e indiretos do
                    preço de venda.
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{resultado.markup.toFixed(2)}x</p>
                  <p className="text-sm font-medium text-white mt-1">Markup (Multiplicador)</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seu preço de venda é {resultado.markup.toFixed(2)} vezes maior que o custo total do
                    produto.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
