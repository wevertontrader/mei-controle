/**
 * Data em DD/MM/AAAA (via InputData) + hora em HH:mm (24h).
 * value / onChange: string ISO 8601 (ex.: trial_ends_at) ou ''.
 */
import InputData from './InputData'
import { isoToLocalYmdHm, localYmdHmToIso } from '../utils/dateBr'

export default function InputDataHora({
  value = '',
  onChange,
  required,
  dataClassName = '',
  horaClassName = '',
  disabled,
}) {
  const { ymd, hm } = isoToLocalYmdHm(value)

  function emit(newYmd, newHm) {
    const iso = localYmdHmToIso(newYmd, newHm)
    if (iso) onChange(iso)
    else if (!newYmd) onChange('')
  }

  return (
    <div className="flex flex-wrap items-end gap-2 md:gap-3">
      <div className="min-w-[140px] flex-1 max-w-xs">
        <InputData
          value={ymd}
          onChange={(iso) => emit(iso, hm)}
          required={required}
          disabled={disabled}
          className={dataClassName}
          placeholder="DD/MM/AAAA"
        />
      </div>
      <span className="text-slate-500 text-sm pb-2.5 hidden sm:inline">às</span>
      <div className="w-[8.5rem]">
        <span className="block text-xs text-slate-500 mb-1 sm:hidden">Hora</span>
        <input
          type="time"
          value={hm}
          disabled={disabled || !ymd}
          onChange={(e) => emit(ymd, e.target.value)}
          className={horaClassName}
          step={60}
          title="Hora (24h)"
        />
      </div>
    </div>
  )
}
