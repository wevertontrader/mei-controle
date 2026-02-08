/**
 * Input de data no formato brasileiro DD/MM/YYYY.
 * value e onChange usam YYYY-MM-DD internamente (para APIs).
 */
import { useState, useEffect } from 'react'

function isoParaBr(iso) {
  if (!iso || iso.length < 10) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d || ''}${d ? '/' : ''}${m || ''}${m ? '/' : ''}${y || ''}`
}

function brParaIso(br) {
  const nums = br.replace(/\D/g, '')
  if (nums.length < 8) return ''
  const d = nums.slice(0, 2)
  const m = nums.slice(2, 4)
  const y = nums.slice(4, 8)
  if (d.length === 2 && m.length === 2 && y.length === 4) {
    const dia = parseInt(d, 10)
    const mes = parseInt(m, 10)
    const ano = parseInt(y, 10)
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1900 && ano <= 2100) {
      return `${ano}-${m}-${d}`
    }
  }
  return ''
}

function formatarDigitacao(v) {
  const nums = v.replace(/\D/g, '')
  if (nums.length <= 2) return nums
  if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
  return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`
}

export default function InputData({ value = '', onChange, required, className = '', placeholder = 'DD/MM/AAAA', ...rest }) {
  const [texto, setTexto] = useState(isoParaBr(value))

  useEffect(() => {
    setTexto(isoParaBr(value))
  }, [value])

  function handleChange(e) {
    const v = e.target.value
    const formatado = formatarDigitacao(v)
    setTexto(formatado)
    const iso = brParaIso(formatado)
    if (iso) onChange(iso)
    else if (formatado.length === 0) onChange('')
  }

  function handleBlur() {
    const iso = brParaIso(texto)
    if (iso) {
      setTexto(isoParaBr(iso))
      onChange(iso)
    } else if (texto.length > 0) {
      setTexto(isoParaBr(value))
    }
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={texto}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      placeholder={placeholder}
      maxLength={10}
      pattern={required ? '\\d{2}/\\d{2}/\\d{4}' : undefined}
      title={required ? 'Digite a data no formato DD/MM/AAAA' : undefined}
      className={className}
      {...rest}
    />
  )
}
