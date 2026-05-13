/**
 * Conversões de data no padrão brasileiro DD/MM/AAAA.
 * Valores ISO usados em APIs: data "YYYY-MM-DD", data/hora em ISO 8601 completo.
 */

export function isoYmdToBr(ymd) {
  if (!ymd || String(ymd).length < 10) return ''
  const [y, m, d] = String(ymd).slice(0, 10).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

export function isValidIsoYmd(ymd) {
  if (!ymd || String(ymd).length < 10) return false
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/** Aceita texto com ou sem barras; retorna '' ou YYYY-MM-DD. */
export function brDigitsToIso(br) {
  const nums = String(br).replace(/\D/g, '')
  if (nums.length < 8) return ''
  const d = nums.slice(0, 2)
  const m = nums.slice(2, 4)
  const y = nums.slice(4, 8)
  const dia = parseInt(d, 10)
  const mes = parseInt(m, 10)
  const ano = parseInt(y, 10)
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || ano < 1900 || ano > 2100) return ''
  const iso = `${y}-${m}-${d}`
  return isValidIsoYmd(iso) ? iso : ''
}

export function formatarDigitacaoDataBr(v) {
  const nums = String(v).replace(/\D/g, '')
  if (nums.length <= 2) return nums
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`
}

export function isoToLocalYmdHm(iso) {
  if (!iso) return { ymd: '', hm: '00:00' }
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return { ymd: '', hm: '00:00' }
  const pad = (n) => String(n).padStart(2, '0')
  return {
    ymd: `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`,
    hm: `${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
  }
}

/** ymd = YYYY-MM-DD, hm = HH:mm (24h). Retorna ISO ou '' se data inválida. */
export function localYmdHmToIso(ymd, hm) {
  if (!ymd || String(ymd).length < 10 || !isValidIsoYmd(ymd)) return ''
  const [y, M, d] = String(ymd).slice(0, 10).split('-').map(Number)
  const parts = String(hm || '00:00').split(':')
  const hh = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0))
  const mm = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0))
  const dt = new Date(y, M - 1, d, hh, mm, 0, 0)
  return dt.toISOString()
}
