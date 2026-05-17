/**
 * CE2 — Detail editor primitív input-komponensek.
 *
 * Apró, vizuálisan konzisztens form-elemek a tab-okban.
 */
import React from 'react'

export const Field: React.FC<{ label: string; helper?: string; children: React.ReactNode }> = ({
  label,
  helper,
  children,
}) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-semibold text-gray-900">{label}</label>
    {children}
    {helper && <p className="text-[10px] text-gray-500 leading-tight">{helper}</p>}
  </div>
)

export const TextInput: React.FC<{
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}> = ({ value, onChange, placeholder, multiline }) => {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded resize-y"
      />
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded"
    />
  )
}

export const NumberInput: React.FC<{
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  showSlider?: boolean
}> = ({ value, onChange, min, max, step = 1, showSlider }) => (
  <div className="flex items-center gap-2">
    {showSlider && min !== undefined && max !== undefined && (
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1"
      />
    )}
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded"
    />
  </div>
)

export const ColorInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({
  value,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={value || '#ffffff'}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 w-10 border border-gray-200 rounded cursor-pointer"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 px-2 py-1 text-xs font-mono border border-gray-200 rounded"
      placeholder="#ffffff"
    />
  </div>
)

export const SelectInput: React.FC<{
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
)

export const Toggle: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 cursor-pointer"
    />
    <span className="text-xs text-gray-900">{label}</span>
  </label>
)

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="mb-4">
    <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">{title}</h3>
    <div className="space-y-2.5">{children}</div>
  </section>
)
