import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../api/client'
import { Upload, Crown, Check } from 'lucide-react'

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
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [logotipo, setLogotipo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef(null)

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
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setSalvando(true)
    setMsg('')
    try {
      const { user: u } = await auth.updatePerfil({
        nome,
        empresa,
        email,
        cpf: unmask(cpf),
        whatsapp: unmask(whatsapp),
        cnpj: unmask(cnpj),
        logotipo: logotipo || undefined,
      })
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

  function handleLogoChange(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setLogotipo(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Informações do Perfil</h1>
        <p className="text-slate-400 mt-1">Mantenha seus dados sempre atualizados.</p>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-[#0d1117] border border-card-border flex items-center justify-center overflow-hidden shrink-0">
            {logotipo ? (
              <img src={logotipo} alt="Logotipo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-500 text-xs text-center px-2">100 x 100</span>
            )}
          </div>
          <div>
            <p className="text-white font-medium">Logotipo da Empresa</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 mt-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Upload className="w-4 h-4" />
              Alterar Logotipo
            </button>
            <p className="text-slate-500 text-xs mt-1">Recomendado: 200x200px, PNG ou JPG.</p>
          </div>
        </div>

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
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plano Contratado</label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[#0d1117] border border-card-border">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-white">{planoExibido}</span>
              </div>
            </div>
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
    </div>
  )
}
