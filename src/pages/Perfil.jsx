import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../api/client'
import { Upload, Crown, Check, Lock, Eye, EyeOff, Store } from 'lucide-react'

function maskCPF(v) {
  const n = v.replace(/\D/g, '')
  if (n.length <= 3) return n
  if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`
  if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9, 11)}`
}

function maskCNPJ(v) {
  const n = v.replace(/\D/g, '')
  if (n.length <= 2) return n
  if (n.length <= 5) return `${n.slice(0, 2)}.${n.slice(2)}`
  if (n.length <= 8) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
  if (n.length <= 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12, 14)}`
}

function maskWhatsApp(v) {
  const n = v.replace(/\D/g, '')
  if (n.length <= 2) return n ? `(${n}` : ''
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
}

function unmask(s) {
  return (s || '').replace(/\D/g, '')
}

export default function Perfil() {
  const { user, updateUser } = useAuth()
  const isColaborador = !!(user?.owner_user_id || user?.role === 'colaborador')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [logotipo, setLogotipo] = useState('')
  const [logotipoPdv, setLogotipoPdv] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const [enviandoLogoPdv, setEnviandoLogoPdv] = useState(false)
  const [msg, setMsg] = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaNova2, setSenhaNova2] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState({ atual: false, nova: false, nova2: false })
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [msgSenha, setMsgSenha] = useState('')
  const fileInputRef = useRef(null)
  const fileInputPdvRef = useRef(null)

  const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
  const trialExpired = trialEndsAt && trialEndsAt < new Date()
  const statusConta = trialExpired ? 'Inativo' : 'Ativo'
  const planoExibido = user?.plano || 'Plano Anual'

  useEffect(() => {
    setNome(user?.nome || '')
    setEmpresa(user?.empresa || '')
    setEmail(user?.email || '')
    setCpf(maskCPF(user?.cpf || ''))
    setWhatsapp(maskWhatsApp(user?.whatsapp || ''))
    setCnpj(maskCNPJ(user?.cnpj || ''))
    setLogotipo(user?.logotipo || '')
    setLogotipoPdv(user?.logotipo_pdv || '')
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    try {
      const payload = isColaborador
        ? { nome, email }
        : {
            nome,
            empresa,
            email,
            cpf: unmask(cpf),
            whatsapp: unmask(whatsapp),
            cnpj: unmask(cnpj),
          }
      const { user: u } = await auth.updatePerfil(payload)
      updateUser(u)
      setMsg('Perfil atualizado com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message || 'Erro ao atualizar perfil.')
    } finally {
      setSalvando(false)
    }
  }

  function handleCpfChange(e) {
    const v = e.target.value
    const m = maskCPF(v)
    setCpf(m)
  }

  function handleCnpjChange(e) {
    const v = e.target.value
    const m = maskCNPJ(v)
    setCnpj(m)
  }

  function handleWhatsappChange(e) {
    const v = e.target.value
    const m = maskWhatsApp(v)
    setWhatsapp(m)
  }

  async function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (file) e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setMsg('')
    setEnviandoLogo(true)
    try {
      const { user: u } = await auth.uploadLogotipo(file)
      setLogotipo(u?.logotipo || '')
      if (u?.logotipo_pdv !== undefined) setLogotipoPdv(u.logotipo_pdv || '')
      updateUser(u)
      setMsg(isColaborador ? 'Foto atualizada com sucesso!' : 'Logotipo enviado com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message || 'Erro ao enviar a imagem.')
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function handlePdvLogoChange(e) {
    const file = e.target.files?.[0]
    if (file) e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setMsg('')
    setEnviandoLogoPdv(true)
    try {
      const { user: u } = await auth.uploadLogotipoPdv(file)
      setLogotipoPdv(u?.logotipo_pdv || '')
      updateUser(u)
      setMsg('Logo do PDV atualizada com sucesso!')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message || 'Erro ao enviar a imagem do PDV.')
    } finally {
      setEnviandoLogoPdv(false)
    }
  }

  async function handleRemoverPdvLogo() {
    if (!logotipoPdv) return
    if (!confirm('Remover a logo usada no PDV? Se remover, o PDV passará a usar o logotipo da empresa (se houver).')) return
    setEnviandoLogoPdv(true)
    setMsg('')
    try {
      const { user: u } = await auth.updatePerfil({ logotipo_pdv: '' })
      setLogotipoPdv('')
      updateUser(u)
      setMsg('Logo do PDV removida.')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message || 'Erro ao remover.')
    } finally {
      setEnviandoLogoPdv(false)
    }
  }

  async function handleAlterarSenha(e) {
    e.preventDefault()
    setMsgSenha('')
    if (senhaNova !== senhaNova2) {
      setMsgSenha('A confirmação da nova senha não confere.')
      return
    }
    if (senhaNova.length < 6) {
      setMsgSenha('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSalvandoSenha(true)
    try {
      await auth.alterarSenha({ senhaAtual, senhaNova })
      setSenhaAtual('')
      setSenhaNova('')
      setSenhaNova2('')
      setMsgSenha('Senha alterada com sucesso!')
      setTimeout(() => setMsgSenha(''), 4000)
    } catch (err) {
      setMsgSenha(err.message || 'Erro ao alterar a senha.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function handleRemoverLogo() {
    if (!logotipo) return
    if (!confirm(isColaborador ? 'Remover a foto do seu perfil?' : 'Remover o logotipo da empresa?')) return
    setEnviandoLogo(true)
    setMsg('')
    try {
      const { user: u } = await auth.updatePerfil({ logotipo: '' })
      setLogotipo('')
      updateUser(u)
      setMsg(isColaborador ? 'Foto removida.' : 'Logotipo removido.')
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg(err.message || 'Erro ao remover.')
    } finally {
      setEnviandoLogo(false)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Informações do Perfil</h1>
        <p className="text-slate-400 mt-1">
          {isColaborador
            ? 'Atualize seu nome, e-mail e foto de perfil. Os dados da empresa são geridos apenas pelo administrador.'
            : 'Mantenha seus dados sempre atualizados.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-[#0d1117] border border-card-border flex items-center justify-center overflow-hidden shrink-0">
            {logotipo ? (
              <img key={logotipo} src={logotipo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-500 text-xs text-center px-2">100 x 100</span>
            )}
          </div>
          <div>
            <p className="text-white font-medium">{isColaborador ? 'Foto do perfil' : 'Logotipo da Empresa'}</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={enviandoLogo}
              className="flex items-center gap-2 mt-2 text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {enviandoLogo ? 'Enviando...' : isColaborador ? 'Enviar foto' : 'Enviar logotipo'}
            </button>
            {logotipo && (
              <button
                type="button"
                onClick={handleRemoverLogo}
                disabled={enviandoLogo}
                className="block mt-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {isColaborador ? 'Remover foto' : 'Remover logotipo'}
              </button>
            )}
            <p className="text-slate-500 text-xs mt-1">JPG, PNG, GIF ou WebP, até 2 MB. A imagem é salva no servidor.</p>
          </div>
        </div>

        {!isColaborador && (
          <div className="flex flex-col sm:flex-row items-start gap-6 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
            <div className="h-20 w-40 rounded-xl bg-[#0d1117] border border-card-border flex items-center justify-center overflow-hidden shrink-0">
              {logotipoPdv ? (
                <img key={logotipoPdv} src={logotipoPdv} alt="" className="w-full h-full object-contain p-1" />
              ) : logotipo ? (
                <img key={`fallback-${logotipo}`} src={logotipo} alt="" className="w-full h-full object-contain p-1 opacity-80" />
              ) : (
                <span className="text-slate-500 text-xs text-center px-2">Sem logo PDV</span>
              )}
            </div>
            <div>
              <p className="text-white font-medium flex items-center gap-2">
                <Store className="w-4 h-4 text-blue-400" />
                Logo no PDV
              </p>
              <p className="text-slate-500 text-sm mt-1 max-w-md">
                Imagem exibida no topo do PDV (ponto de venda). Se você não enviar uma logo aqui, o PDV usa o logotipo da empresa acima.
              </p>
              <input
                type="file"
                ref={fileInputPdvRef}
                onChange={handlePdvLogoChange}
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputPdvRef.current?.click()}
                disabled={enviandoLogoPdv}
                className="flex items-center gap-2 mt-3 text-blue-400 hover:text-blue-300 text-sm disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {enviandoLogoPdv ? 'Enviando...' : 'Enviar logo do PDV'}
              </button>
              {logotipoPdv && (
                <button
                  type="button"
                  onClick={handleRemoverPdvLogo}
                  disabled={enviandoLogoPdv}
                  className="block mt-2 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Remover logo do PDV
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {!isColaborador && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {!isColaborador && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {!isColaborador && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Plano Contratado</label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-white">{planoExibido}</span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {!isColaborador && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={handleWhatsappChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            {!isColaborador && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status da Conta</label>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  statusConta === 'Ativo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{statusConta}</span>
              </div>
            </div>
          </div>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-lg text-sm ${
              msg.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {msg}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={salvando}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      <section className="max-w-4xl mt-12 pt-10 border-t border-card-border">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Alterar senha</h2>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            {isColaborador
              ? 'Use quando precisar trocar a sua senha de acesso ao sistema.'
              : 'Use esta opção quando precisar trocar a senha de acesso da empresa ao sistema.'}
          </p>
          <form onSubmit={handleAlterarSenha} className="max-w-xl space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Senha atual</label>
              <div className="relative">
                <input
                  type={mostrarSenha.atual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarSenha((m) => ({ ...m, atual: !m.atual }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300"
                  aria-label={mostrarSenha.atual ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha.atual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha.nova ? 'text' : 'password'}
                  value={senhaNova}
                  onChange={(e) => setSenhaNova(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  className="w-full px-4 py-3 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarSenha((m) => ({ ...m, nova: !m.nova }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300"
                  aria-label={mostrarSenha.nova ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha.nova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={mostrarSenha.nova2 ? 'text' : 'password'}
                  value={senhaNova2}
                  onChange={(e) => setSenhaNova2(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 rounded-lg bg-[#0d1117] border border-card-border text-white focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarSenha((m) => ({ ...m, nova2: !m.nova2 }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-300"
                  aria-label={mostrarSenha.nova2 ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha.nova2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {msgSenha && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  msgSenha.includes('sucesso') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {msgSenha}
              </div>
            )}
            <button
              type="submit"
              disabled={salvandoSenha}
              className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium border border-card-border"
            >
              {salvandoSenha ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>
        </section>
    </div>
  )
}
