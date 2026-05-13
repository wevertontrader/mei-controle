import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../api/client'

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [senha, setSenha] = useState('')
  const [senha2, setSenha2] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = searchParams.get('token') || ''
    setToken(t)
    if (!t) setErro('Link inválido. Solicite nova redefinição em Esqueci a senha.')
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    if (senha !== senha2) {
      setErro('As senhas não coincidem')
      return
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres')
      return
    }
    setLoading(true)
    try {
      await auth.resetPassword(token, senha)
      setOk(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setErro(err.message || 'Não foi possível redefinir')
    } finally {
      setLoading(false)
    }
  }

  if (!token && erro) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-card-bg border border-card-border p-8 text-center">
          <p className="text-red-400 mb-4">{erro}</p>
          <Link to="/esqueci-senha" className="text-blue-400 hover:underline">
            Solicitar novo link
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-semibold text-white mb-2">Nova senha</h1>
          <p className="text-slate-400 text-sm mb-6">Defina uma nova senha para sua conta.</p>
          {ok ? (
            <p className="text-emerald-400 text-center">Senha alterada! Redirecionando para o login…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nova senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Confirmar senha</label>
                <input
                  type="password"
                  value={senha2}
                  onChange={(e) => setSenha2(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
          <p className="text-slate-400 text-sm text-center mt-6">
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
