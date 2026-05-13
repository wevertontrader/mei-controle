import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Plus, Trash2, Search, ShoppingCart, Sparkles, Sun, Moon, UserPlus } from 'lucide-react'
import { clientes, produtos } from '../api/client'
import { useAuth } from '../context/AuthContext'

const FORMAS = ['PIX', 'Dinheiro', 'Cartão', 'Transferência', 'Outro']
const PDV_THEME_KEY = 'meipro-pdv-theme'

function formatMoney(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

export default function VendasPDVModal({ open, onClose, onSucesso }) {
  const { user } = useAuth()
  const [clientesList, setClientesList] = useState([])
  const [produtosList, setProdutosList] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [clienteBusca, setClienteBusca] = useState('')
  const [mostrarClientes, setMostrarClientes] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [observacao, setObservacao] = useState('')
  const [linhas, setLinhas] = useState([])
  const [produtoSel, setProdutoSel] = useState('')
  const [produtoBusca, setProdutoBusca] = useState('')
  const [mostrarProdutos, setMostrarProdutos] = useState(false)
  const [qtdAdd, setQtdAdd] = useState('1')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [logoErro, setLogoErro] = useState(false)
  const [pdvTheme, setPdvTheme] = useState(() => {
    try {
      return localStorage.getItem(PDV_THEME_KEY) === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const wrapRef = useRef(null)
  const produtoWrapRef = useRef(null)
  const [modalCliente, setModalCliente] = useState(false)
  const [cadNome, setCadNome] = useState('')
  const [cadEmail, setCadEmail] = useState('')
  const [cadWhatsapp, setCadWhatsapp] = useState('')
  const [cadEndereco, setCadEndereco] = useState('')
  const [cadErro, setCadErro] = useState('')
  const [cadSalvando, setCadSalvando] = useState(false)

  const pdvNome = useMemo(
    () => String(user?.pdv_empresa_nome || user?.empresa || 'MEI Controle').trim() || 'MEI Controle',
    [user?.pdv_empresa_nome, user?.empresa],
  )
  const pdvLogo = useMemo(() => String(user?.pdv_logo_url || '').trim(), [user?.pdv_logo_url])
  const iniciais = useMemo(() => {
    const p = pdvNome.split(/\s+/).filter(Boolean)
    const a = (p[0] || 'M')[0] || 'M'
    const b = (p[1] || '')[0] || ''
    return (a + b).toUpperCase().slice(0, 2)
  }, [pdvNome])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    setLogoErro(false)
  }, [pdvLogo])

  useEffect(() => {
    if (!open) return
    setErro('')
    setClienteId('')
    setClienteBusca('')
    setFormaPagamento('PIX')
    setObservacao('')
    setLinhas([])
    setProdutoSel('')
    setProdutoBusca('')
    setMostrarProdutos(false)
    setQtdAdd('1')
    setModalCliente(false)
    setCadNome('')
    setCadEmail('')
    setCadWhatsapp('')
    setCadEndereco('')
    setCadErro('')
    Promise.all([clientes.list(), produtos.list()])
      .then(([c, p]) => {
        setClientesList(c)
        setProdutosList(p)
      })
      .catch((e) => setErro(e.message))
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMostrarClientes(false)
      if (produtoWrapRef.current && !produtoWrapRef.current.contains(e.target)) setMostrarProdutos(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const clientesFiltrados = clienteBusca.trim()
    ? clientesList.filter((c) => (c.nome || '').toLowerCase().includes(clienteBusca.trim().toLowerCase()))
    : clientesList

  const qProd = produtoBusca.trim().toLowerCase()
  const produtosFiltrados = qProd
    ? produtosList.filter((p) => {
        const nome = (p.nome || '').toLowerCase()
        const cod = String(p.codigo || '').toLowerCase().replace(/\s/g, '')
        const needle = qProd.replace(/\s/g, '')
        return nome.includes(needle) || (cod && cod.includes(needle))
      })
    : produtosList

  const listaDropdownProdutos =
    produtoBusca.trim().length > 0
      ? produtosFiltrados.slice(0, 80)
      : produtosList.length <= 30
        ? produtosList
        : []

  function rotuloProduto(p) {
    const cod = (p.codigo || '').trim()
    return cod ? `${p.nome} · ${cod}` : p.nome
  }

  function selecionarProduto(p) {
    setProdutoSel(String(p.id))
    setProdutoBusca(rotuloProduto(p))
    setMostrarProdutos(false)
  }

  function selecionarCliente(c) {
    setClienteId(String(c.id))
    setClienteBusca(c.nome || '')
    setMostrarClientes(false)
  }

  function limparCliente() {
    setClienteId('')
    setClienteBusca('')
  }

  function abrirCadastroCliente() {
    setCadErro('')
    setCadNome(clienteBusca.trim())
    setCadEmail('')
    setCadWhatsapp('')
    setCadEndereco('')
    setModalCliente(true)
    setMostrarClientes(false)
  }

  async function salvarNovoCliente(e) {
    e.preventDefault()
    setCadErro('')
    const nome = cadNome.trim()
    if (!nome) {
      setCadErro('Informe o nome do cliente.')
      return
    }
    setCadSalvando(true)
    try {
      const row = await clientes.create({
        nome,
        email: cadEmail.trim(),
        whatsapp: cadWhatsapp.trim(),
        endereco: cadEndereco.trim(),
        documento: '',
        nome_empresa: '',
        funcao: '',
        site: '',
        instagram: '',
      })
      setClientesList((prev) => [...prev, row].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''))))
      selecionarCliente(row)
      setModalCliente(false)
    } catch (err) {
      setCadErro(err.message || 'Não foi possível cadastrar.')
    } finally {
      setCadSalvando(false)
    }
  }

  function adicionarLinha() {
    setErro('')
    const pid = Number(produtoSel)
    const qtd = Math.max(1, Math.floor(Number(qtdAdd) || 1))
    if (!pid) {
      setErro('Selecione um produto.')
      return
    }
    const p = produtosList.find((x) => x.id === pid)
    if (!p) return
    const preco = Number(p.preco) || 0
    setLinhas((prev) => {
      const idx = prev.findIndex((l) => l.produto_id === pid)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + qtd }
        return next
      }
      return [...prev, { produto_id: pid, nome: p.nome, preco_unit: preco, quantidade: qtd, estoque_atual: p.estoque_atual ?? 0 }]
    })
    setQtdAdd('1')
    setProdutoSel('')
    setProdutoBusca('')
    setMostrarProdutos(false)
  }

  function removerLinha(pid) {
    setLinhas((prev) => prev.filter((l) => l.produto_id !== pid))
  }

  const total = linhas.reduce((s, l) => s + l.preco_unit * l.quantidade, 0)

  function alternarTemaPdv() {
    setPdvTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(PDV_THEME_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }

  async function finalizar(e) {
    e.preventDefault()
    setErro('')
    if (linhas.length === 0) {
      setErro('Adicione pelo menos um produto ao carrinho.')
      return
    }
    setSalvando(true)
    const valorArredondado = Math.round(total * 100) / 100
    if (!Number.isFinite(valorArredondado) || valorArredondado <= 0) {
      setErro('Total inválido. Verifique preços e quantidades.')
      setSalvando(false)
      return
    }
    const resumoLinhas = linhas.map((l) => `${l.nome} ×${l.quantidade}`).join(' · ')
    const descricaoBase = [observacao.trim(), resumoLinhas].filter(Boolean).join(' — ')
    const descricaoGravar = descricaoBase
      ? `${descricaoBase} · Pag.: ${formaPagamento}`
      : `Pag.: ${formaPagamento}`
    try {
      await clientes.vendas.create({
        cliente_id: clienteId || null,
        valor: valorArredondado,
        forma_pagamento: formaPagamento,
        forma: formaPagamento,
        descricao: descricaoGravar,
        itens: linhas.map((l) => ({ produto_id: l.produto_id, quantidade: l.quantidade })),
        registrar_caixa: true,
        atualizar_estoque: true,
      })
      window.dispatchEvent(new CustomEvent('financeiro-atualizado'))
      onSucesso?.()
      onClose()
    } catch (err) {
      setErro(err.message || 'Erro ao registrar venda.')
    } finally {
      setSalvando(false)
    }
  }

  if (!open) return null

  const L = pdvTheme === 'light'

  return (
    <div
      className={
        L
          ? 'fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-slate-100 text-slate-900'
          : 'fixed inset-0 z-[100] flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#030712] text-slate-100'
      }
      style={{ colorScheme: L ? 'light' : 'dark' }}
    >
      <div
        className={L ? 'pointer-events-none absolute inset-0 opacity-[0.45]' : 'pointer-events-none absolute inset-0 opacity-[0.35]'}
        style={{
          backgroundImage: L
            ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.2), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(16, 185, 129, 0.08), transparent)'
            : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(16, 185, 129, 0.12), transparent)',
        }}
      />

      <header
        className={
          L
            ? 'relative shrink-0 z-10 border-b border-slate-200/90 bg-white/85 backdrop-blur-xl px-4 py-4 sm:px-6 shadow-sm'
            : 'relative shrink-0 z-10 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl px-4 py-4 sm:px-6'
        }
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={
                L
                  ? 'hidden sm:flex h-11 w-11 rounded-xl bg-slate-100 ring-1 ring-slate-200 items-center justify-center shrink-0'
                  : 'hidden sm:flex h-11 w-11 rounded-xl bg-white/5 ring-1 ring-white/10 items-center justify-center shrink-0'
              }
            >
              <ShoppingCart className={L ? 'w-5 h-5 text-blue-600' : 'w-5 h-5 text-blue-300/90'} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={L ? 'text-lg sm:text-xl font-semibold text-slate-900 tracking-tight truncate' : 'text-lg sm:text-xl font-semibold text-white tracking-tight truncate'}>
                  {pdvNome}
                </h2>
                <span
                  className={
                    L
                      ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200'
                      : 'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-500/30'
                  }
                >
                  <Sparkles className="w-3 h-3" />
                  PDV
                </span>
              </div>
              <p className={L ? 'text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-1.5' : 'text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-1.5'}>
                <ShoppingCart className={L ? 'w-3.5 h-3.5 shrink-0 text-slate-500 sm:hidden' : 'w-3.5 h-3.5 shrink-0 text-slate-500 sm:hidden'} />
                Nova venda · estoque e caixa atualizados ao finalizar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className={L ? 'hidden sm:block text-right pr-2 border-r border-slate-200' : 'hidden sm:block text-right pr-2 border-r border-white/10'}>
              <p className={L ? 'text-[10px] uppercase tracking-wider text-slate-500' : 'text-[10px] uppercase tracking-wider text-slate-500'}>Total</p>
              <p className={L ? 'text-lg font-bold text-emerald-600 tabular-nums' : 'text-lg font-bold text-emerald-400 tabular-nums'}>{formatMoney(total)}</p>
            </div>
            <button
              type="button"
              onClick={alternarTemaPdv}
              className={
                L
                  ? 'p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-amber-600 ring-1 ring-slate-200 transition-colors'
                  : 'p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 ring-1 ring-white/10 transition-colors'
              }
              title={L ? 'Modo escuro' : 'Modo claro'}
              aria-label={L ? 'Ativar modo escuro' : 'Ativar modo claro'}
            >
              {L ? <Moon className="w-5 h-5 sm:w-6 sm:h-6" /> : <Sun className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={
                L
                  ? 'p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 ring-1 ring-slate-200 transition-colors'
                  : 'p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white ring-1 ring-white/10 transition-colors'
              }
              aria-label="Fechar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      <form onSubmit={finalizar} className="relative z-[1] flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-rows-[auto_minmax(0,1fr)] grid-cols-1 gap-4 overflow-hidden px-4 py-3 sm:px-6 lg:grid-cols-12 lg:grid-rows-1 lg:gap-6">
          {/* Logo — sem borda, ocupa altura disponível */}
          <aside
            className={
              L
                ? 'flex min-h-[120px] flex-col items-center justify-center lg:col-span-5 lg:min-h-0 xl:col-span-4'
                : 'flex min-h-[120px] flex-col items-center justify-center lg:col-span-5 lg:min-h-0 xl:col-span-4'
            }
          >
            <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-1 py-2 lg:py-4">
              {pdvLogo && !logoErro ? (
                <img
                  src={pdvLogo}
                  alt=""
                  className="max-h-[min(42dvh,380px)] w-full max-w-[min(96vw,520px)] object-contain object-center drop-shadow-2xl lg:max-h-[min(78dvh,720px)] lg:max-w-none"
                  onError={() => setLogoErro(true)}
                />
              ) : (
                <div
                  className={
                    L
                      ? 'flex aspect-square w-full max-w-[min(92vw,400px)] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 via-white to-emerald-50 shadow-xl shadow-slate-300/40 ring-0 lg:max-w-[min(100%,480px)]'
                      : 'flex aspect-square w-full max-w-[min(92vw,400px)] items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600/25 via-white/10 to-emerald-600/20 shadow-2xl shadow-black/50 ring-0 lg:max-w-[min(100%,480px)]'
                  }
                  aria-hidden
                >
                  <span
                    className={
                      L
                        ? 'select-none text-[clamp(4rem,18dvh,8rem)] font-bold tracking-tight text-slate-800'
                        : 'select-none text-[clamp(4rem,18dvh,8rem)] font-bold tracking-tight text-white/90'
                    }
                  >
                    {iniciais}
                  </span>
                </div>
              )}
            </div>
          </aside>

          {/* Painel central: apenas produtos e lista */}
          <section
            className={
              L
                ? 'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-md shadow-slate-200/40 backdrop-blur-md sm:p-5 lg:col-span-7 xl:col-span-8'
                : 'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4 shadow-xl shadow-black/20 backdrop-blur-md sm:p-5 lg:col-span-7 xl:col-span-8'
            }
          >
            <div className={L ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}>
              <h3 className={L ? 'mb-0.5 shrink-0 text-sm font-semibold text-slate-900 flex items-center gap-2' : 'mb-0.5 shrink-0 text-sm font-semibold text-white flex items-center gap-2'}>
                <span className="h-1 w-6 rounded-full bg-emerald-500" />
                Produtos
              </h3>
              <p className={L ? 'mb-2 shrink-0 text-[11px] text-slate-500' : 'mb-2 shrink-0 text-[11px] text-slate-500'}>
                Data e hora da venda são gravadas ao finalizar.
              </p>
              <div className="mb-2 flex shrink-0 flex-wrap items-end gap-2">
                <div className="relative min-w-[200px] flex-1" ref={produtoWrapRef}>
                  <label className={L ? 'mb-1.5 block text-xs font-medium text-slate-600' : 'mb-1.5 block text-xs font-medium text-slate-400'}>Produto (nome ou código)</label>
                  <div className="relative">
                    <Search className={L ? 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' : 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500'} />
                    <input
                      type="text"
                      value={produtoBusca}
                      onChange={(e) => {
                        setProdutoBusca(e.target.value)
                        setProdutoSel('')
                        setMostrarProdutos(true)
                      }}
                      onFocus={() => setMostrarProdutos(true)}
                      placeholder="Digite nome ou código…"
                      className={
                        L
                          ? 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/35'
                          : 'w-full rounded-xl border border-white/10 bg-slate-950/80 py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
                      }
                      autoComplete="off"
                    />
                  </div>
                  {mostrarProdutos && (
                    <ul
                      className={
                        L
                          ? 'absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40'
                          : 'absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/50'
                      }
                    >
                      {!produtoBusca.trim() && produtosList.length > 30 ? (
                        <li className={L ? 'px-3 py-3 text-sm text-slate-500' : 'px-3 py-3 text-sm text-slate-500'}>
                          Digite parte do <span className={L ? 'text-slate-800' : 'text-slate-300'}>nome</span> ou o{' '}
                          <span className={L ? 'text-slate-800' : 'text-slate-300'}>código</span> do produto para filtrar.
                        </li>
                      ) : listaDropdownProdutos.length === 0 ? (
                        <li className="px-3 py-3 text-sm text-slate-500">Nenhum produto encontrado.</li>
                      ) : (
                        listaDropdownProdutos.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className={
                                L
                                  ? 'w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 last:border-0 hover:bg-emerald-50'
                                  : 'w-full border-b border-white/5 px-3 py-2.5 text-left text-sm text-slate-100 last:border-0 hover:bg-emerald-600/15'
                              }
                              onClick={() => selecionarProduto(p)}
                            >
                              <span className="font-medium">{p.nome}</span>
                              {p.codigo ? <span className={L ? 'text-slate-500' : 'text-slate-400'}> · {p.codigo}</span> : null}
                              <span className={L ? 'mt-0.5 block text-xs text-slate-500' : 'mt-0.5 block text-xs text-slate-500'}>
                                {formatMoney(p.preco)} · est. {p.estoque_atual ?? 0}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                      {produtoBusca.trim() && produtosFiltrados.length > 80 && (
                        <li className={L ? 'border-t border-slate-200 px-3 py-2 text-xs text-slate-500' : 'border-t border-white/10 px-3 py-2 text-xs text-slate-500'}>
                          Mostrando 80 de {produtosFiltrados.length} — refine a busca.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="w-24 shrink-0">
                  <label className={L ? 'mb-1.5 block text-xs font-medium text-slate-600' : 'mb-1.5 block text-xs font-medium text-slate-400'}>Qtd</label>
                  <input
                    type="number"
                    min={1}
                    value={qtdAdd}
                    onChange={(e) => setQtdAdd(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/35'
                        : 'w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={adicionarLinha}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/30 hover:from-blue-500 hover:to-blue-400"
                >
                  <Plus className="h-4 w-4" /> Adicionar
                </button>
              </div>

              <div
                className={
                  L
                    ? 'mt-2 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80'
                    : 'mt-2 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40'
                }
              >
                {linhas.length === 0 ? (
                  <p className={L ? 'px-4 py-8 text-center text-sm text-slate-500' : 'px-4 py-8 text-center text-sm text-slate-500'}>
                    Carrinho vazio. Busque um produto e clique em Adicionar.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className={L ? 'sticky top-0 z-10' : 'sticky top-0 z-10'}>
                      <tr
                        className={
                          L
                            ? 'bg-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
                            : 'bg-white/5 text-left text-xs font-medium uppercase tracking-wide text-slate-500'
                        }
                      >
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-right">Unit.</th>
                        <th className="w-14 p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="w-10 p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => (
                        <tr key={l.produto_id} className={L ? 'border-t border-slate-200' : 'border-t border-white/5'}>
                          <td className={L ? 'p-3 text-slate-900' : 'p-3 text-slate-100'}>{l.nome}</td>
                          <td className={L ? 'p-3 text-right tabular-nums text-slate-600' : 'p-3 text-right tabular-nums text-slate-400'}>{formatMoney(l.preco_unit)}</td>
                          <td className={L ? 'p-3 text-center tabular-nums text-slate-700' : 'p-3 text-center tabular-nums text-slate-300'}>{l.quantidade}</td>
                          <td
                            className={
                              L
                                ? 'p-3 text-right text-base font-semibold tabular-nums text-emerald-700'
                                : 'p-3 text-right text-base font-semibold tabular-nums text-emerald-400'
                            }
                          >
                            {formatMoney(l.preco_unit * l.quantidade)}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => removerLinha(l.produto_id)}
                              className={
                                L
                                  ? 'rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600'
                                  : 'rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400'
                              }
                              aria-label="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </div>

        {erro && (
          <div className="mx-auto w-full max-w-7xl shrink-0 px-4 pt-1 sm:px-6">
            <div
              className={
                L
                  ? 'rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800'
                  : 'rounded-xl border border-red-500/30 bg-red-500/15 p-3 text-sm text-red-300'
              }
            >
              {erro}
            </div>
          </div>
        )}

        <div
          className={
            L
              ? 'relative z-20 shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-6'
              : 'relative z-20 shrink-0 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur-xl sm:px-6'
          }
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            <div
              className={
                L
                  ? 'flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5'
                  : 'flex items-center justify-between gap-3 border-b border-white/10 pb-2.5'
              }
            >
              <span className={L ? 'text-sm font-medium text-slate-600' : 'text-sm font-medium text-slate-400'}>Total da venda</span>
              <span className={L ? 'text-xl font-bold tabular-nums tracking-tight text-emerald-600 sm:text-2xl' : 'text-xl font-bold tabular-nums tracking-tight text-emerald-400 sm:text-2xl'}>
                {formatMoney(total)}
              </span>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="relative w-full max-w-[200px] shrink-0 sm:max-w-[220px]" ref={wrapRef}>
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>Cliente</label>
                  <div className="relative">
                    <Search className={L ? 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' : 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500'} />
                    <input
                      type="text"
                      value={clienteBusca}
                      onChange={(e) => {
                        setClienteBusca(e.target.value)
                        setClienteId('')
                        setMostrarClientes(true)
                      }}
                      onFocus={() => setMostrarClientes(true)}
                      placeholder="Buscar cliente…"
                      className={
                        L
                          ? 'w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                          : 'w-full rounded-xl border border-white/10 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                      }
                      autoComplete="off"
                    />
                  </div>
                  {mostrarClientes && (
                    <ul
                      className={
                        L
                          ? 'absolute bottom-full left-0 right-0 z-40 mb-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-300/40'
                          : 'absolute bottom-full left-0 right-0 z-40 mb-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-950 py-1 shadow-2xl shadow-black/50'
                      }
                    >
                  {clientesFiltrados.length > 0 && (
                    <>
                      <li>
                        <button
                          type="button"
                          className={
                            L
                              ? 'w-full px-3 py-2.5 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                              : 'w-full px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white'
                          }
                          onClick={() => {
                            limparCliente()
                            setMostrarClientes(false)
                          }}
                        >
                          — Consumidor / sem cadastro —
                        </button>
                      </li>
                      {clientesFiltrados.slice(0, 50).map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className={
                              L
                                ? 'w-full border-t border-slate-100 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-blue-50'
                                : 'w-full border-t border-white/5 px-3 py-2.5 text-left text-sm text-slate-100 hover:bg-blue-600/20'
                            }
                            onClick={() => selecionarCliente(c)}
                          >
                            {c.nome}
                          </button>
                        </li>
                      ))}
                    </>
                  )}
                  {clienteBusca.trim() && clientesFiltrados.length === 0 && (
                    <>
                      <li className={L ? 'px-3 py-2 text-sm text-slate-500' : 'px-3 py-2 text-sm text-slate-500'}>
                        Nenhum cliente encontrado para &quot;{clienteBusca.trim()}&quot;.
                      </li>
                      <li>
                        <button
                          type="button"
                          className={
                            L
                              ? 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-50'
                              : 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-blue-300 hover:bg-blue-500/15'
                          }
                          onClick={abrirCadastroCliente}
                        >
                          <UserPlus className="h-4 w-4 shrink-0" />
                          Cadastrar cliente
                        </button>
                      </li>
                    </>
                  )}
                  {!clienteBusca.trim() && clientesList.length === 0 && (
                    <>
                      <li className={L ? 'px-3 py-2 text-sm text-slate-500' : 'px-3 py-2 text-sm text-slate-500'}>Nenhum cliente cadastrado.</li>
                      <li>
                        <button
                          type="button"
                          className={
                            L
                              ? 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-50'
                              : 'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-blue-300 hover:bg-blue-500/15'
                          }
                          onClick={abrirCadastroCliente}
                        >
                          <UserPlus className="h-4 w-4 shrink-0" />
                          Cadastrar cliente
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              )}
                </div>
                <div className="min-w-0 flex-1">
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>Observação (opcional)</label>
                  <input
                    type="text"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                        : 'w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    }
                    placeholder="Ex.: Balcão, pedido especial…"
                  />
                </div>
              </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
              <div className="w-full min-w-[10rem] sm:w-44">
                <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>Forma de pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className={
                    L
                      ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                      : 'w-full rounded-xl border border-white/15 bg-slate-900/90 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                  }
                >
                  {FORMAS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={
                    L
                      ? 'rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:px-5 sm:py-3'
                      : 'rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white sm:px-5 sm:py-3'
                  }
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || linhas.length === 0}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500 disabled:pointer-events-none disabled:opacity-40 sm:px-8 sm:py-3"
                >
                  {salvando ? 'Finalizando…' : 'Finalizar venda'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </form>

      {modalCliente && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdv-cad-cliente-titulo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalCliente(false)
          }}
        >
          <div
            className={
              L
                ? 'flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl'
                : 'flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl'
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className={L ? 'flex items-center justify-between border-b border-slate-200 px-5 py-4' : 'flex items-center justify-between border-b border-white/10 px-5 py-4'}>
              <h2 id="pdv-cad-cliente-titulo" className={L ? 'text-lg font-semibold text-slate-900' : 'text-lg font-semibold text-white'}>
                Cadastrar cliente
              </h2>
              <button
                type="button"
                onClick={() => setModalCliente(false)}
                className={
                  L
                    ? 'rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    : 'rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white'
                }
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={salvarNovoCliente} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
              {cadErro && (
                <div className={L ? 'mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800' : 'mb-3 rounded-lg border border-red-500/30 bg-red-500/15 px-3 py-2 text-sm text-red-300'}>
                  {cadErro}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>Nome *</label>
                  <input
                    type="text"
                    value={cadNome}
                    onChange={(e) => setCadNome(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                        : 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    }
                    placeholder="Nome do cliente"
                    autoFocus
                  />
                </div>
                <div>
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>E-mail</label>
                  <input
                    type="email"
                    value={cadEmail}
                    onChange={(e) => setCadEmail(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                        : 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    }
                    placeholder="opcional"
                  />
                </div>
                <div>
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>WhatsApp</label>
                  <input
                    type="text"
                    value={cadWhatsapp}
                    onChange={(e) => setCadWhatsapp(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                        : 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    }
                    placeholder="opcional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={L ? 'mb-1 block text-xs font-medium text-slate-600' : 'mb-1 block text-xs font-medium text-slate-400'}>Endereço</label>
                  <input
                    type="text"
                    value={cadEndereco}
                    onChange={(e) => setCadEndereco(e.target.value)}
                    className={
                      L
                        ? 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40'
                        : 'w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                    }
                    placeholder="opcional"
                  />
                </div>
              </div>
              <div className={L ? 'mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4' : 'mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4'}>
                <button
                  type="submit"
                  disabled={cadSalvando}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 sm:flex-none sm:px-8"
                >
                  {cadSalvando ? 'Salvando…' : 'Salvar e selecionar'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className={
                    L
                      ? 'rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50'
                      : 'rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5'
                  }
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
