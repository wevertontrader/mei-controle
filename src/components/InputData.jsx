/**
 * Input de data no formato brasileiro DD/MM/AAAA.
 * value e onChange usam YYYY-MM-DD internamente (para APIs).
 */
import { useState, useEffect } from 'react'
import { isoYmdToBr, brDigitsToIso, formatarDigitacaoDataBr } from '../utils/dateBr'

export default function InputData({ value = '', onChange, required, className = '', placeholder = 'DD/MM/AAAA', ...rest }) {
  const [texto, setTexto] = useState(isoYmdToBr(value))

  useEffect(() => {
    setTexto(isoYmdToBr(value))
  }, [value])

  function handleChange(e) {
    const v = e.target.value
    const formatado = formatarDigitacaoDataBr(v)
    setTexto(formatado)
    const iso = brDigitsToIso(formatado)
    if (iso) onChange(iso)
    else if (formatado.length === 0) onChange('')
  }

  function handleBlur() {
    const iso = brDigitsToIso(texto)
    if (iso) {
      setTexto(isoYmdToBr(iso))
      onChange(iso)
    } else if (texto.length > 0) {
      setTexto(isoYmdToBr(value))
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
