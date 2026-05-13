import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const user = await login(email, senha)
      navigate(user.role === 'super_admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-semibold text-white mb-2">Entrar</h1>
          <p className="text-slate-400 text-sm mb-6">
            Acesse sua conta para continuar
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && (
              <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                {erro}
              </div>
            )}
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
              <label className="block text-sm text-slate-400 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <div className="text-right mt-1">
                <Link to="/esqueci-senha" className="text-xs text-blue-400 hover:text-blue-300">
                  Esqueci minha senha
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-slate-400 text-sm text-center mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-blue-400 hover:text-blue-300">
              Cadastre-se
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
