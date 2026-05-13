import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../api/client'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setMsg('')
    setLoading(true)
    try {
      const r = await auth.forgotPassword(email.trim())
      setMsg(r.message || 'Verifique sua caixa de entrada.')
      setEmail('')
    } catch (err) {
      setErro(err.message || 'Erro ao enviar')
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
          <h1 className="text-2xl font-semibold text-white mb-2">Esqueci a senha</h1>
          <p className="text-slate-400 text-sm mb-6">
            Informe o e-mail da sua conta. Se existir cadastro, enviaremos um link para redefinir a senha (válido por 1
            hora). O envio depende do SMTP configurado pelo administrador.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}
            {msg && <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">{msg}</div>}
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
            >
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
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
