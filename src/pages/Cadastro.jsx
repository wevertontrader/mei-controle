import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Check } from 'lucide-react'

export default function Cadastro() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (senha !== confirmar) {
      setErro('As senhas não coincidem')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await register({ nome, email, empresa, senha })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErro(err.message || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 3)

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xl text-white">
            M
          </div>
          <span className="font-semibold text-xl text-white">MEI Controle</span>
        </Link>
        <div className="rounded-2xl bg-card-bg border border-card-border p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              3 dias grátis
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Criar conta</h1>
          <p className="text-slate-400 text-sm mb-6">
            Preencha os dados para começar seu período de teste
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                {erro}
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Seu nome"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da empresa</label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Minha Empresa MEI"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha (mín. 6 caracteres)</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirmar senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">
                Ao cadastrar, você terá <strong>3 dias de teste grátis</strong> para usar o sistema completo.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar e começar'}
            </button>
          </form>
          <p className="text-slate-400 text-sm text-center mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Entrar
            </Link>
          </p>
        </div>
        <p className="text-slate-500 text-sm text-center mt-6">
          <Link to="/" className="hover:text-slate-400">← Voltar ao início</Link>
        </p>
      </div>
    </div>
  )
}
