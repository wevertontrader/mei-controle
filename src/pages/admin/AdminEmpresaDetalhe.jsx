import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload } from 'lucide-react'
import { admin } from '../../api/client'
import InputData from '../../components/InputData'
import InputDataHora from '../../components/InputDataHora'
import { isValidIsoYmd } from '../../utils/dateBr'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function formatDate(s) {
  if (!s) return '-'
  const str = String(s).slice(0, 10)
  const d = new Date(str + 'T12:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

function emptyForm() {
  return {
    nome: '',
    email: '',
    empresa: '',
    trial_ends_at: '',
    proximo_pagamento: '',
    plano_id: '',
    cpf: '',
    whatsapp: '',
    cnpj: '',
    logotipo: '',
    senha: '',
    senhaConfirm: '',
  }
}

export default function AdminEmpresaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [planos, setPlanos] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [diasTrial, setDiasTrial] = useState('3')
  const [salvando, setSalvando] = useState(false)
  const [salvandoTrial, setSalvandoTrial] = useState(false)
  const [enviandoLogo, setEnviandoLogo] = useState(false)
  const logoFileRef = useRef(null)

  function aplicarEmpresaNoForm(e) {
    setForm({
      nome: e.nome || '',
      email: e.email || '',
      empresa: e.empresa || '',
      trial_ends_at: e.trial_ends_at ? String(e.trial_ends_at) : '',
      proximo_pagamento: e.proximo_pagamento && isValidIsoYmd(String(e.proximo_pagamento).slice(0, 10))
        ? String(e.proximo_pagamento).slice(0, 10)
        : '',
      plano_id: e.plano_id != null && e.plano_id !== '' ? String(e.plano_id) : '',
      cpf: e.cpf || '',
      whatsapp: e.whatsapp || '',
      cnpj: e.cnpj || '',
      logotipo: e.logotipo || '',
      senha: '',
      senhaConfirm: '',
    })
  }

  useEffect(() => {
    let cancel = false
    setLoading(true)
    setErro('')
    Promise.all([admin.empresa(id), admin.planos.list().catch(() => [])])
      .then(([emp, pl]) => {
        if (cancel) return
        setEmpresa(emp)
        setPlanos(Array.isArray(pl) ? pl : [])
        aplicarEmpresaNoForm(emp)
      })
      .catch((e) => setErro(e.message))
      .finally(() => {
        if (!cancel) setLoading(false)
      })
    return () => { cancel = true }
  }, [id])

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function salvarAlteracoes(e) {
    e.preventDefault()
    setErro('')
    if (form.senha || form.senhaConfirm) {
      if (form.senha !== form.senhaConfirm) {
        setErro('As senhas digitadas não coincidem.')
        return
      }
      if (form.senha.length < 6) {
        setErro('A nova senha deve ter no mínimo 6 caracteres.')
        return
      }
    }
    if (!form.trial_ends_at) {
      setErro('Informe a data (DD/MM/AAAA) e a hora de término do acesso.')
      return
    }
    const trialD = new Date(form.trial_ends_at)
    if (isNaN(trialD.getTime())) {
      setErro('Data e hora de término do acesso inválidas. Use DD/MM/AAAA e ajuste a hora.')
      return
    }

    if (form.proximo_pagamento && !isValidIsoYmd(form.proximo_pagamento)) {
      setErro('Data do próximo pagamento inválida. Use DD/MM/AAAA.')
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        empresa: form.empresa.trim(),
        trial_ends_at: trialD.toISOString(),
        proximo_pagamento: form.proximo_pagamento ? form.proximo_pagamento : null,
        plano_id: form.plano_id === '' ? 'none' : form.plano_id,
        cpf: form.cpf.trim(),
        whatsapp: form.whatsapp.trim(),
        cnpj: form.cnpj.trim(),
        logotipo: form.logotipo ? String(form.logotipo).trim() : '',
      }
      if (form.senha) payload.senha = form.senha

      const updated = await admin.updateEmpresa(id, payload)
      setEmpresa(updated)
      aplicarEmpresaNoForm(updated)
    } catch (err) {
      setErro(err.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function handleUploadLogo(e) {
    const file = e.target.files?.[0]
    if (file) e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setErro('')
    setEnviandoLogo(true)
    try {
      const updated = await admin.uploadLogotipoEmpresa(id, file)
      setEmpresa(updated)
      aplicarEmpresaNoForm(updated)
    } catch (err) {
      setErro(err.message || 'Erro ao enviar a imagem.')
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function handleRemoverLogo() {
    if (!form.logotipo) return
    if (!confirm('Remover o logotipo desta empresa?')) return
    setErro('')
    setEnviandoLogo(true)
    try {
      const updated = await admin.updateEmpresa(id, { logotipo: '' })
      setEmpresa(updated)
      aplicarEmpresaNoForm(updated)
    } catch (err) {
      setErro(err.message || 'Erro ao remover o logotipo.')
    } finally {
      setEnviandoLogo(false)
    }
  }

  async function estenderTrial() {
    setSalvandoTrial(true)
    setErro('')
    try {
      await admin.estenderTrial(id, Number(diasTrial) || 3)
      const updated = await admin.empresa(id)
      setEmpresa(updated)
      aplicarEmpresaNoForm(updated)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvandoTrial(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-lg bg-red-500/20 text-red-400">Empresa não encontrada.</div>
        <button type="button" onClick={() => navigate('/admin/empresas')} className="mt-4 text-blue-400 hover:underline">Voltar</button>
      </div>
    )
  }

  const trialExpired = empresa.trial_ends_at && new Date(empresa.trial_ends_at) < new Date()

  return (
    <div className="p-6 lg:p-8">
      <Link
        to="/admin/empresas"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para empresas
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">{empresa.empresa}</h1>
        <p className="text-slate-400 mt-1">Edite plano, mensalidade, acesso e dados da empresa.</p>
      </header>

      {erro && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">{erro}</div>}

      <form onSubmit={salvarAlteracoes} className="space-y-6">
        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-1">Plano e mensalidade</h2>
          <p className="text-slate-400 text-sm mb-4">
            Vincule um plano cadastrado em Admin → Planos e defina quando vence a próxima cobrança (controle interno).
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Plano</label>
              <select
                value={form.plano_id}
                onChange={(e) => setField('plano_id', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              >
                <option value="">Sem plano vinculado</option>
                {planos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nome} — {formatMoney(p.preco)}/{p.periodo}{p.ativo ? '' : ' (inativo)'}
                  </option>
                ))}
              </select>
              {empresa.plano_catalogo_nome && (
                <p className="text-xs text-slate-500 mt-1">
                  Catálogo atual: {empresa.plano_catalogo_nome}
                  {empresa.plano && empresa.plano !== empresa.plano_catalogo_nome ? ` · Registro: ${empresa.plano}` : ''}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Próximo pagamento (mensalidade)</label>
              <InputData
                value={form.proximo_pagamento}
                onChange={(iso) => setField('proximo_pagamento', iso)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500"
                placeholder="DD/MM/AAAA"
              />
              <p className="text-xs text-slate-500 mt-1">Digite no formato DD/MM/AAAA (gravado no sistema como data civil).</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-4">Dados da conta e da empresa</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome do responsável</label>
              <input
                required
                value={form.nome}
                onChange={(e) => setField('nome', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">E-mail (login)</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Nome da empresa (razão social / fantasia)</label>
              <input
                required
                value={form.empresa}
                onChange={(e) => setField('empresa', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">CPF</label>
              <input
                value={form.cpf}
                onChange={(e) => setField('cpf', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">CNPJ</label>
              <input
                value={form.cnpj}
                onChange={(e) => setField('cnpj', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => setField('whatsapp', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-2">Logotipo da empresa</label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-[#0d1117] border border-card-border overflow-hidden shrink-0 flex items-center justify-center">
                  {form.logotipo ? (
                    <img key={form.logotipo} src={form.logotipo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 text-[10px] text-center px-1">Sem logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleUploadLogo}
                  />
                  <button
                    type="button"
                    onClick={() => logoFileRef.current?.click()}
                    disabled={enviandoLogo}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-card-border text-slate-200 hover:bg-sidebar-hover/50 text-sm disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {enviandoLogo ? 'Enviando...' : 'Enviar imagem'}
                  </button>
                  {form.logotipo && (
                    <button
                      type="button"
                      onClick={handleRemoverLogo}
                      disabled={enviandoLogo}
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 text-left"
                    >
                      Remover logotipo
                    </button>
                  )}
                  <p className="text-xs text-slate-500">JPG, PNG, GIF ou WebP, até 2 MB. URLs externas continuam válidas se já estiverem salvas; novos envios usam o servidor.</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Acesso válido até (data DD/MM/AAAA e hora)</label>
              <InputDataHora
                required
                value={form.trial_ends_at}
                onChange={(iso) => setField('trial_ends_at', iso)}
                dataClassName="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white placeholder-slate-500"
                horaClassName="w-full px-3 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
              <p className={`text-xs mt-1 ${trialExpired ? 'text-red-400' : 'text-slate-500'}`}>
                {trialExpired ? 'Período expirado — a empresa não consegue entrar até estender o acesso ou a data acima.' : 'Enquanto esta data e hora forem futuras, o login da empresa funciona.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-1">Alterar senha</h2>
          <p className="text-slate-400 text-sm mb-4">Deixe em branco para manter a senha atual.</p>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                value={form.senha}
                onChange={(e) => setField('senha', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                autoComplete="new-password"
                value={form.senhaConfirm}
                onChange={(e) => setField('senhaConfirm', e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-4">Resumo rápido</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Cadastro em</span>
              <span className="text-white">{formatDate(empresa.created_at)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Próx. pagamento</span>
              <span className="text-white">{formatDate(empresa.proximo_pagamento)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Plano (registro)</span>
              <span className="text-white">{empresa.plano || '—'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card-bg border border-card-border p-6">
          <h2 className="font-semibold text-white mb-4">Estatísticas</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de entradas</span>
              <span className="text-emerald-400">{formatMoney(empresa.stats?.entradas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de gastos</span>
              <span className="text-red-400">{formatMoney(empresa.stats?.gastos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Total de vendas</span>
              <span className="text-emerald-400">{formatMoney(empresa.stats?.vendas)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-card-border">
              <span className="text-slate-400">Clientes cadastrados</span>
              <span className="text-white">{empresa.stats?.clientes || 0}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Produtos cadastrados</span>
              <span className="text-white">{empresa.stats?.produtos || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card-bg border border-card-border p-6 mt-6">
        <h2 className="font-semibold text-white mb-4">Estender período de teste</h2>
        <p className="text-slate-400 text-sm mb-4">
          Atalho: soma dias a partir de hoje (não altera o campo &quot;Acesso válido até&quot; acima até você salvar de novo — após estender, recarregamos os dados).
        </p>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="w-32">
            <label className="block text-sm text-slate-400 mb-1">Dias</label>
            <input
              type="number"
              min="1"
              value={diasTrial}
              onChange={(e) => setDiasTrial(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#0d1117] border border-card-border text-white"
            />
          </div>
          <button
            type="button"
            onClick={estenderTrial}
            disabled={salvandoTrial}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium"
          >
            {salvandoTrial ? 'Salvando...' : 'Estender teste'}
          </button>
        </div>
      </div>
    </div>
  )
}
