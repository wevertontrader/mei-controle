import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Package, Calculator, Check, Mail, Phone, MessageCircle, ArrowRight } from 'lucide-react'
import { getPublicContato } from '../api/client'

function buildWhatsappMeUrl(raw) {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length < 10) return ''
  return `https://wa.me/${d.startsWith('55') ? d : `55${d}`}`
}

function contatoFromViteEnv() {
  const email = String(import.meta.env.VITE_PUBLIC_CONTACT_EMAIL || '').trim()
  const phone = String(import.meta.env.VITE_PUBLIC_CONTACT_PHONE || '').trim()
  let whatsappUrl = buildWhatsappMeUrl(import.meta.env.VITE_PUBLIC_CONTACT_WHATSAPP || '')
  if (!whatsappUrl && phone) whatsappUrl = buildWhatsappMeUrl(phone)
  return { email, phone, whatsappUrl }
}

function mergeContato(api, env) {
  const email = (api?.email || '').trim() || env.email
  const phone = (api?.phone || '').trim() || env.phone
  let whatsappUrl = (api?.whatsappUrl || '').trim() || env.whatsappUrl
  if (!whatsappUrl && phone) whatsappUrl = buildWhatsappMeUrl(phone)
  return { email, phone, whatsappUrl }
}

export default function Landing() {
  const [contato, setContato] = useState({ email: '', phone: '', whatsappUrl: '' })

  useEffect(() => {
    const env = contatoFromViteEnv()
    getPublicContato()
      .then((api) => setContato(mergeContato(api, env)))
      .catch(() => setContato(env))
  }, [])

  const temContato = !!(contato.email || contato.phone || contato.whatsappUrl)

  return (
    <div className="bg-[#0d1117] text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xl">
              M
            </div>
            <span className="font-semibold text-xl">MEI Controle</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 md:py-20 w-full">
        <section className="text-center mb-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Controle financeiro simplificado para o seu <span className="text-blue-400">MEI</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Organize entradas, gastos, clientes, produtos e muito mais em um único lugar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/cadastro"
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
            >
              Começar 3 dias grátis
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold text-lg transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            ✓ 3 dias de teste grátis &nbsp; ✓ Sem cartão de crédito
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {[
            { icon: TrendingUp, title: 'Financeiro', desc: 'Entradas, gastos, custos e poupança' },
            { icon: Users, title: 'Clientes', desc: 'Cadastro e histórico de vendas' },
            { icon: Package, title: 'Produtos', desc: 'Lista de produtos e controle de estoque' },
            { icon: Calculator, title: 'Calculadora', desc: 'Precificação e pró-labore' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-card-bg border border-card-border p-8 md:p-12 mb-0">
          <h2 className="text-2xl font-bold text-center mb-10">Por que escolher o MEI Controle?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Controle completo das finanças do seu negócio',
              'Cadastro de clientes e histórico de vendas',
              'Gestão de produtos e movimentações de estoque',
              'Calculadora de precificação e pró-labore',
              'Tarefas e organização do dia a dia',
              'Relatórios e visão geral financeira',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        className="relative z-20 mt-24 border-t border-slate-800/80 bg-[#0d1117]"
        role="contentinfo"
        aria-label="Rodapé"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px max-w-6xl mx-auto bg-gradient-to-r from-transparent via-blue-500/45 to-transparent"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-16 pb-28 md:pb-20">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10 lg:items-start">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold shadow-lg shadow-blue-900/25">
                  M
                </div>
                <div>
                  <p className="font-semibold text-lg tracking-tight text-white">MEI Controle</p>
                  <p className="text-sm text-slate-500">Feito para o microempreendedor</p>
                </div>
              </div>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                Organize finanças, clientes e estoque em um só lugar — com a mesma linguagem visual que você já usa
                no painel.
              </p>
            </div>

            <div className="lg:col-span-4 lg:border-l lg:border-slate-800/60 lg:pl-10">
              <h3 className="text-sm font-semibold text-white">Fale conosco</h3>
              <p className="mt-1 text-xs text-slate-500">Resposta em horário comercial</p>
              {temContato ? (
                <ul className="mt-5 space-y-3">
                  {contato.email ? (
                    <li>
                      <a
                        href={`mailto:${contato.email}`}
                        className="group flex items-center gap-3 rounded-xl border border-card-border bg-card-bg/80 px-4 py-3 transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.06]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
                          <Mail className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            E-mail
                          </span>
                          <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">
                            {contato.email}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-blue-400 group-hover:opacity-100" />
                      </a>
                    </li>
                  ) : null}
                  {contato.phone ? (
                    <li>
                      <a
                        href={`tel:${contato.phone.replace(/\D/g, '')}`}
                        className="group flex items-center gap-3 rounded-xl border border-card-border bg-card-bg/80 px-4 py-3 transition-colors hover:border-blue-500/35 hover:bg-blue-500/[0.06]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20">
                          <Phone className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            Telefone
                          </span>
                          <span className="block truncate text-sm font-medium text-slate-200 group-hover:text-white">
                            {contato.phone}
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-blue-400 group-hover:opacity-100" />
                      </a>
                    </li>
                  ) : null}
                  {contato.whatsappUrl ? (
                    <li>
                      <a
                        href={contato.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-4 py-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.08]"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                          <MessageCircle className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1 text-left">
                          <span className="block text-[11px] font-medium uppercase tracking-wide text-emerald-500/80">
                            WhatsApp
                          </span>
                          <span className="block text-sm font-medium text-emerald-100/90 group-hover:text-emerald-50">
                            Iniciar conversa
                          </span>
                        </span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-emerald-600/80 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-300 group-hover:opacity-100" />
                      </a>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-slate-700/80 bg-slate-900/30 px-4 py-6 text-center">
                  <p className="text-sm text-slate-500">
                    Em breve os canais de contato aparecerão aqui. Enquanto isso, use os botões ao lado para criar
                    conta ou entrar.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:col-span-3">
              <p className="text-sm font-semibold text-white lg:text-right">Comece agora</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:flex-col">
                <Link
                  to="/cadastro"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-500"
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-600/90 bg-slate-900/40 px-4 py-3 text-center text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/50 hover:text-white"
                >
                  Já tenho conta
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800/60 pt-8 sm:flex-row">
            <p className="order-2 text-center text-xs text-slate-500 sm:order-1 sm:text-left">
              © {new Date().getFullYear()} MEI Controle. Todos os direitos reservados.
            </p>
            <div className="order-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 sm:order-2">
              <Link to="/login" className="transition hover:text-blue-400">
                Entrar
              </Link>
              <span className="hidden text-slate-700 sm:inline" aria-hidden>
                |
              </span>
              <Link to="/cadastro" className="transition hover:text-blue-400">
                Cadastro
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {contato.whatsappUrl ? (
        <a
          href={contato.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-xl shadow-black/30 ring-2 ring-white/10 transition hover:bg-[#20bd5a] hover:ring-white/20 hover:scale-[1.03] active:scale-[0.98]"
          aria-label="Abrir conversa no WhatsApp"
          title="WhatsApp"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      ) : null}
    </div>
  )
}
