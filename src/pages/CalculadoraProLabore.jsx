import { useState } from 'react'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function CalculadoraProLabore() {
  const [lucroMensal, setLucroMensal] = useState('3500')
  const [impostos, setImpostos] = useState('6')
  const [guardarFuturo, setGuardarFuturo] = useState('10')
  const [resultado, setResultado] = useState(null)

  function obterSugestao(e) {
    e.preventDefault()
    const lucro = Number(lucroMensal) || 0
    const imp = Number(impostos) || 0
    const guardar = Number(guardarFuturo) || 0

    if (lucro <= 0) {
      setResultado(null)
      return
    }

    const valorReserva = lucro * (guardar / 100)
    const disponivel = lucro - valorReserva
    const proLaboreBruto = imp < 100 ? disponivel / (1 - imp / 100) : disponivel
    const proLaboreLiquido = proLaboreBruto * (1 - imp / 100)

    setResultado({
      proLaboreBruto,
      proLaboreLiquido,
      valorReserva,
      impostosPagos: proLaboreBruto - proLaboreLiquido,
    })
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Sugestão de Pró-labore</h1>
        <p className="text-slate-400 mt-1">
          Use nossa ferramenta de IA para encontrar o valor ideal para seu pró-labore.
        </p>
      </header>

      <div className="max-w-2xl rounded-xl bg-card-bg border border-card-border overflow-hidden">
        <div className="p-6 border-b border-card-border">
          <h2 className="text-lg font-semibold text-white">Calculadora de Pró-labore</h2>
          <p className="text-sm text-slate-400 mt-1">
            Informe os dados financeiros da sua empresa para receber uma sugestão de pró-labore
            gerada por nossa IA.
          </p>
        </div>
        <form onSubmit={obterSugestao} className="p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Lucro Mensal (Valor que sobra) (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={lucroMensal}
                onChange={(e) => setLucroMensal(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                placeholder="0,00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Após pagar todas as contas, quanto sobra por mês?
              </p>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Impostos (em %)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="99"
                value={impostos}
                onChange={(e) => setImpostos(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Alíquota do seu imposto (ex: 6% para o Simples Nacional).
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">
                Quanto quer guardar para o futuro (em %)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={guardarFuturo}
                onChange={(e) => setGuardarFuturo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Percentual que você deseja guardar para uma reserva.
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Obter Sugestão da IA
          </button>
        </form>

        {resultado && (
          <div className="p-6 border-t border-card-border space-y-4">
            <h3 className="font-semibold text-white">Resultado da Sugestão:</h3>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-semibold text-blue-400">
                  {formatMoney(resultado.proLaboreBruto)}
                </p>
                <p className="text-sm font-medium text-white mt-1">Pró-labore Bruto Sugerido</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valor a ser retirado e declarado como pró-labore (antes dos impostos).
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-emerald-400">
                  {formatMoney(resultado.proLaboreLiquido)}
                </p>
                <p className="text-sm font-medium text-white mt-1">Pró-labore Líquido</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Valor que você irá receber após a dedução dos impostos.
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-300">{formatMoney(resultado.valorReserva)}</p>
                <p className="text-xs text-slate-500">Valor destinado à reserva</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
