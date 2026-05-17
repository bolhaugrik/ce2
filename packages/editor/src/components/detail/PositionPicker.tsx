/**
 * CE2 — PositionPicker: 9-pont preset rács VAGY X/Y % csúszka.
 * Bárhol használható ahol Position szerkesztés kell.
 */
import React, { useState } from 'react'

type Preset =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export type PositionValue =
  | { kind: 'preset'; value: Preset }
  | { kind: 'xy'; x_pct: number; y_pct: number }
  | undefined

const PRESET_GRID: Preset[][] = [
  ['top-left',    'top-center',    'top-right'],
  ['middle-left', 'middle-center', 'middle-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
]

interface Props {
  value: PositionValue
  onChange: (v: PositionValue) => void
}

export const PositionPicker: React.FC<Props> = ({ value, onChange }) => {
  const isPreset = !value || value.kind === 'preset'
  const currentPreset: Preset = (value?.kind === 'preset' ? value.value : 'middle-center')
  const xy = value?.kind === 'xy' ? value : null

  const [mode, setMode] = useState<'preset' | 'xy'>(isPreset ? 'preset' : 'xy')

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
        <button
          onClick={() => {
            setMode('preset')
            onChange({ kind: 'preset', value: currentPreset })
          }}
          className={`flex-1 px-2 py-1 text-[11px] rounded ${mode === 'preset' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          9-pont
        </button>
        <button
          onClick={() => {
            setMode('xy')
            onChange({ kind: 'xy', x_pct: xy?.x_pct ?? 50, y_pct: xy?.y_pct ?? 50 })
          }}
          className={`flex-1 px-2 py-1 text-[11px] rounded ${mode === 'xy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          X / Y %
        </button>
      </div>

      {mode === 'preset' && (
        <div className="grid grid-cols-3 gap-1 max-w-[140px]">
          {PRESET_GRID.flat().map((p) => (
            <button
              key={p}
              onClick={() => onChange({ kind: 'preset', value: p })}
              className={`aspect-square rounded border ${
                currentPreset === p
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              title={p}
            >
              <span className={`block w-1.5 h-1.5 rounded-full mx-auto ${currentPreset === p ? 'bg-white' : 'bg-gray-500'}`} />
            </button>
          ))}
        </div>
      )}

      {mode === 'xy' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-3">X</span>
            <input
              type="range" min={0} max={100} step={1}
              value={xy?.x_pct ?? 50}
              onChange={(e) => onChange({ kind: 'xy', x_pct: parseInt(e.target.value, 10), y_pct: xy?.y_pct ?? 50 })}
              className="flex-1"
            />
            <span className="text-[10px] text-gray-900 w-8 text-right">{xy?.x_pct ?? 50}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-3">Y</span>
            <input
              type="range" min={0} max={100} step={1}
              value={xy?.y_pct ?? 50}
              onChange={(e) => onChange({ kind: 'xy', x_pct: xy?.x_pct ?? 50, y_pct: parseInt(e.target.value, 10) })}
              className="flex-1"
            />
            <span className="text-[10px] text-gray-900 w-8 text-right">{xy?.y_pct ?? 50}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Detektálja-e az értéket position objektumnak */
export function isPositionValue(v: unknown): v is PositionValue {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  if (o.kind === 'preset' && typeof o.value === 'string') return true
  if (o.kind === 'xy' && typeof o.x_pct === 'number' && typeof o.y_pct === 'number') return true
  return false
}
