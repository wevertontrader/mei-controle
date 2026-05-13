const fs = require('fs')
const path = require('path')
const multer = require('multer')

const logosDir = path.join(__dirname, '..', 'uploads', 'logos')

function ensureLogosDir() {
  if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true })
}

function unlinkStoredLogo(logotipo) {
  if (!logotipo || typeof logotipo !== 'string') return
  if (!logotipo.startsWith('/uploads/logos/')) return
  const base = path.basename(logotipo)
  if (!base || base.includes('..') || base.includes('/') || base.includes('\\')) return
  const full = path.join(logosDir, base)
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full)
  } catch (_) {}
}

function extFromMime(m) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  }
  return map[m] || '.png'
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureLogosDir()
    cb(null, logosDir)
  },
  filename: (req, file, cb) => {
    const uid = req.logoUserId != null ? String(req.logoUserId) : '0'
    const ext = path.extname(file.originalname || '').toLowerCase()
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const safe = allowed.includes(ext) ? ext : extFromMime(file.mimetype)
    const prefixRaw = req.logoFilePrefix != null ? String(req.logoFilePrefix) : 'logo'
    const prefix = prefixRaw.replace(/[^a-z0-9-]/gi, '') || 'logo'
    cb(null, `${prefix}-${uid}-${Date.now()}${safe}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)
    cb(ok ? null : new Error('Envie uma imagem JPG, PNG, GIF ou WebP (máx. 2 MB).'), ok)
  },
})

function uploadLogoMiddleware(req, res, next) {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      const msg = err.message || (err.code === 'LIMIT_FILE_SIZE' ? 'Arquivo muito grande (máx. 2 MB).' : 'Upload inválido.')
      return res.status(400).json({ error: msg })
    }
    next()
  })
}

module.exports = {
  logosDir,
  unlinkStoredLogo,
  uploadLogoMiddleware,
}
