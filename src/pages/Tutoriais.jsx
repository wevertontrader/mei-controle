import { useState, useEffect } from 'react'
import {
  PlayCircle,
  BookOpen,
  TrendingUp,
  Users,
  Package,
  Video,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { tutoriais as tutoriaisApi } from '../api/client'

const ICON_MAP = {
  'book-open': BookOpen,
  'trending-up': TrendingUp,
  users: Users,
  package: Package,
  'play-circle': PlayCircle,
  video: Video,
  'file-text': FileText,
  sparkles: Sparkles,
}

function TutorialIcon({ name }) {
  const Icon = ICON_MAP[name] || BookOpen
  return <Icon className="w-6 h-6 text-blue-400" />
}

export default function Tutoriais() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    tutoriaisApi
      .list()
      .then(setLista)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Tutoriais</h1>
        <p className="text-slate-400 mt-1">Aprenda a usar o sistema com nossos guias.</p>
      </header>

      {erro && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm">{erro}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400">Carregando tutoriais...</div>
      ) : lista.length === 0 ? (
        <div className="py-12 text-center text-slate-400 rounded-xl bg-card-bg border border-card-border">
          Ainda não há tutoriais cadastrados. Em breve novos conteúdos.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {lista.map((item) => {
            const url = (item.url_video || '').trim()
            return (
              <div
                key={item.id}
                className="rounded-xl bg-card-bg border border-card-border p-6 hover:border-slate-600 transition-colors flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <TutorialIcon name={item.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white text-lg mb-1">{item.titulo}</h2>
                  {item.descricao ? <p className="text-slate-400 text-sm mb-3">{item.descricao}</p> : null}
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      Abrir material
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <PlayCircle className="w-4 h-4" />
                      Link em breve
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 p-6 rounded-xl bg-card-bg border border-card-border">
        <h2 className="font-semibold text-white mb-2">Dica rápida</h2>
        <p className="text-slate-400 text-sm">
          Comece pela{' '}
          <Link to="/dashboard/financeiro/entradas" className="text-blue-400 hover:underline">
            Visão Geral
          </Link>{' '}
          e registre suas primeiras entradas e gastos. Em seguida, cadastre seus{' '}
          <Link to="/dashboard/clientes/cadastro" className="text-blue-400 hover:underline">
            clientes
          </Link>{' '}
          e{' '}
          <Link to="/dashboard/produtos/lista" className="text-blue-400 hover:underline">
            produtos
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
