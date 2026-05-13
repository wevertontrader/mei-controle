import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Porta do backend em dev: VITE_PROXY_TARGET ou arquivo gerado pelo server/index.js */
function readBackendPort() {
  const t = process.env.VITE_PROXY_TARGET?.trim()
  if (t) {
    try {
      const u = new URL(t)
      if (u.port) return u.port
      return u.protocol === 'https:' ? '443' : '80'
    } catch {
      return '3001'
    }
  }
  try {
    const p = fs.readFileSync(path.join(__dirname, '.dev-server-port'), 'utf8').trim()
    if (/^\d+$/.test(p)) return p
  } catch {
    /* arquivo ainda não existe */
  }
  return '3001'
}

function readBackendOrigin() {
  const t = process.env.VITE_PROXY_TARGET?.trim()
  if (t) {
    try {
      const u = new URL(t)
      const port = u.port || (u.protocol === 'https:' ? '443' : '80')
      return { origin: `${u.protocol}//${u.hostname}:${port}`, isHttps: u.protocol === 'https:' }
    } catch {
      return { origin: 'http://127.0.0.1:3001', isHttps: false }
    }
  }
  const port = readBackendPort()
  return { origin: `http://127.0.0.1:${port}`, isHttps: false }
}

/**
 * Em dev, /api e /uploads são encaminhados lendo a porta em .dev-server-port a cada requisição,
 * para não dar "fetch failed" quando 3001 está ocupada e o Node sobe em 3002+.
 */
function devApiProxyPlugin() {
  return {
    name: 'dev-api-proxy-dynamic-port',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api') && !url.startsWith('/uploads')) {
          return next()
        }

        const { origin, isHttps } = readBackendOrigin()
        let u
        try {
          u = new URL(url, origin)
        } catch {
          return next()
        }

        const lib = isHttps ? https : http
        const opts = {
          protocol: isHttps ? 'https:' : 'http:',
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname + u.search,
          method: req.method,
          headers: { ...req.headers },
        }
        opts.headers.host = `${u.hostname}:${opts.port}`

        const pReq = lib.request(opts, (pRes) => {
          res.writeHead(pRes.statusCode || 502, pRes.headers)
          pRes.pipe(res)
        })
        pReq.on('error', (err) => {
          const port = readBackendPort()
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(
            JSON.stringify({
              error:
                `Não foi possível conectar ao backend em 127.0.0.1:${port} (${err.code || err.message}). ` +
                `Suba o servidor (npm run server). Se a porta mudou, o arquivo .dev-server-port é atualizado automaticamente — atualize a página.`,
            }),
          )
        })
        req.pipe(pReq)
      })
    },
  }
}

export default defineConfig({
  plugins: [devApiProxyPlugin(), react()],
  server: {
    // Proxy fixo removido: devApiProxyPlugin lê .dev-server-port a cada requisição
  },
})
