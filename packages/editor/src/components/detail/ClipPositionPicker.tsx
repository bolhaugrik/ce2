/**
 * CE2 — ClipPositionPicker
 * Szerkeszti a top-level clip.position mezőt.
 * Módok: Nincs / Abszolút pixel / Horgony (SpatialAnchor)
 */
import React, { useState, useEffect } from 'react'
import type { CE2Composition, Position, SpatialAlign } from '@ce2/core'
import { parseSpatialAnchor, isAbsolutePosition } from '@ce2/core'
import { SelectInput } from '../primitives.js'

// ─── Alignment layout ─────────────────────────────────────────────────────────

type InnerAlign = 'top-left'|'top-center'|'top-right'|'inside-left'|'center'|'inside-right'|'bottom-left'|'bottom-center'|'bottom-right'
type OuterAlign = 'above'|'below'|'left-of'|'right-of'

const INNER_GRID: InnerAlign[][] = [
  ['top-left',    'top-center',    'top-right'   ],
  ['inside-left', 'center',        'inside-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
]

// ─── Named clips ──────────────────────────────────────────────────────────────

function getNamedClips(comp: CE2Composition, selfId: string) {
  return [
    ...comp.spanning_layers,
    ...comp.moments.flatMap((m) => m.layers),
  ]
    .filter((c) => (c as any).name && c.id !== selfId)
    .map((c) => ({ name: (c as any).name as string, label: c.label }))
}

// ─── Slider + number input combo ─────────────────────────────────────────────

const SliderNumber: React.FC<{
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}> = ({ label, value, onChange, min, max, step = 1 }) => (
  <div className="space-y-0.5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-14 text-right text-[11px] border border-gray-200 rounded px-1 py-0.5"
        step={step}
      />
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={Math.max(min, Math.min(max, value))}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-gray-800 h-1"
    />
  </div>
)

// ─── Visual anchor diagram ────────────────────────────────────────────────────
// Minden pozicionálás inline style-lal — Tailwind statikus build nem detektál
// dinamikusan összerakott osztályokat.

// Rács méretei (px)
const BOX = { x: 28, y: 28, w: 100, h: 60 }  // referencia-doboz a konténeren belül
const TOTAL = { w: 156, h: 116 }              // teljes konténer méret
const DOT = 12                                 // pont átmérő
const ARROW = 22                               // nyíl gomb méret

// 9 pont pozíciói (x, y = a doboz sarkaitól)
const DOT_POSITIONS: Array<{ a: InnerAlign; bx: number; by: number }> = [
  { a: 'top-left',    bx: BOX.x,              by: BOX.y              },
  { a: 'top-center',  bx: BOX.x + BOX.w / 2, by: BOX.y              },
  { a: 'top-right',   bx: BOX.x + BOX.w,     by: BOX.y              },
  { a: 'inside-left', bx: BOX.x,              by: BOX.y + BOX.h / 2 },
  { a: 'center',      bx: BOX.x + BOX.w / 2, by: BOX.y + BOX.h / 2 },
  { a: 'inside-right',bx: BOX.x + BOX.w,     by: BOX.y + BOX.h / 2 },
  { a: 'bottom-left', bx: BOX.x,              by: BOX.y + BOX.h     },
  { a: 'bottom-center',bx: BOX.x + BOX.w / 2,by: BOX.y + BOX.h     },
  { a: 'bottom-right',bx: BOX.x + BOX.w,     by: BOX.y + BOX.h     },
]

// 4 külső nyíl pozíciói
const ARROW_POSITIONS: Array<{ a: OuterAlign; label: string; ax: number; ay: number }> = [
  { a: 'above',    label: '↑', ax: BOX.x + BOX.w / 2 - ARROW / 2, ay: 2 },
  { a: 'below',    label: '↓', ax: BOX.x + BOX.w / 2 - ARROW / 2, ay: TOTAL.h - ARROW - 2 },
  { a: 'left-of',  label: '←', ax: 2,                              ay: BOX.y + BOX.h / 2 - ARROW / 2 },
  { a: 'right-of', label: '→', ax: TOTAL.w - ARROW - 2,            ay: BOX.y + BOX.h / 2 - ARROW / 2 },
]

const AnchorDiagram: React.FC<{
  curAlign: SpatialAlign
  onSelect: (a: SpatialAlign) => void
}> = ({ curAlign, onSelect }) => (
  <div style={{ position: 'relative', width: TOTAL.w, height: TOTAL.h, userSelect: 'none' }}>

    {/* Referencia doboz */}
    <div style={{
      position: 'absolute',
      left: BOX.x, top: BOX.y, width: BOX.w, height: BOX.h,
      border: '2px dashed #9ca3af',
      borderRadius: 4,
      background: '#f3f4f6',
    }} />

    {/* 9 belső pont */}
    {DOT_POSITIONS.map(({ a, bx, by }) => {
      const on = curAlign === a
      return (
        <button
          key={a}
          title={a}
          onClick={() => onSelect(a as SpatialAlign)}
          style={{
            position: 'absolute',
            left: bx - DOT / 2,
            top:  by - DOT / 2,
            width: DOT,
            height: DOT,
            borderRadius: '50%',
            border: `2px solid ${on ? '#2563eb' : '#6b7280'}`,
            background: on ? '#2563eb' : '#ffffff',
            cursor: 'pointer',
            padding: 0,
            boxShadow: on ? '0 0 0 2px #bfdbfe' : 'none',
            transition: 'background .12s, border-color .12s',
          }}
        />
      )
    })}

    {/* 4 külső nyíl gomb */}
    {ARROW_POSITIONS.map(({ a, label, ax, ay }) => {
      const on = curAlign === a
      return (
        <button
          key={a}
          title={a}
          onClick={() => onSelect(a as SpatialAlign)}
          style={{
            position: 'absolute',
            left: ax, top: ay,
            width: ARROW, height: ARROW,
            borderRadius: 4,
            border: `1.5px solid ${on ? '#111827' : '#d1d5db'}`,
            background: on ? '#111827' : '#ffffff',
            color: on ? '#ffffff' : '#374151',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            transition: 'background .12s, border-color .12s',
          }}
        >
          {label}
        </button>
      )
    })}
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

type Mode = 'none' | 'absolute' | 'spatial'

interface Props {
  clipId: string
  value: Position | undefined
  composition: CE2Composition
  onChange: (v: Position | undefined) => void
}

export const ClipPositionPicker: React.FC<Props> = ({ clipId, value, composition, onChange }) => {
  const detectMode = (): Mode => {
    if (!value) return 'none'
    if (isAbsolutePosition(value)) return 'absolute'
    return 'spatial'
  }
  const [mode, setMode] = useState<Mode>(detectMode)
  useEffect(() => { setMode(detectMode()) }, [value])

  const parsed = value && !isAbsolutePosition(value) ? parseSpatialAnchor(value) : null
  const absVal  = value && isAbsolutePosition(value) ? value : { x: 0, y: 0 }
  const curRef   = parsed?.ref   ?? 'screen'
  const curAlign = (parsed?.align ?? 'center') as SpatialAlign
  const curOff   = parsed?.offset ?? { x: 0, y: 0 }

  const named = getNamedClips(composition, clipId)
  const refOptions = [
    { value: 'screen', label: 'screen — vászon egésze' },
    ...named.map((c) => ({ value: c.name, label: `${c.name}${c.label ? ` (${c.label})` : ''}` })),
  ]

  function emit(ref: string, align: SpatialAlign, off: { x: number; y: number }) {
    onChange(
      off.x === 0 && off.y === 0
        ? `${ref}.${align}`
        : { anchor: `${ref}.${align}`, offset: off },
    )
  }

  function setModeAndEmit(m: Mode) {
    setMode(m)
    if (m === 'none')      onChange(undefined)
    else if (m === 'absolute') onChange({ x: 0, y: 0 })
    else                   emit('screen', 'center', { x: 0, y: 0 })
  }

  const tabCls = (m: Mode) =>
    `flex-1 px-2 py-1.5 text-[11px] rounded transition-colors ${
      mode === m ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="space-y-3">

      {/* Mode tabs */}
      <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded">
        <button className={tabCls('none')}     onClick={() => setModeAndEmit('none')}>Nincs</button>
        <button className={tabCls('absolute')} onClick={() => setModeAndEmit('absolute')}>Pixel</button>
        <button className={tabCls('spatial')}  onClick={() => setModeAndEmit('spatial')}>Horgony</button>
      </div>

      {/* ── Absolute mode ───────────────────────────────────────────────── */}
      {mode === 'absolute' && (
        <div className="space-y-2.5">
          <SliderNumber label="X (px)" value={absVal.x} onChange={(v) => onChange({ x: v, y: absVal.y })} min={-200} max={2000} />
          <SliderNumber label="Y (px)" value={absVal.y} onChange={(v) => onChange({ x: absVal.x, y: v })} min={-200} max={2000} />
        </div>
      )}

      {/* ── Spatial / Horgony mode ──────────────────────────────────────── */}
      {mode === 'spatial' && (
        <div className="space-y-3">

          {/* Referencia */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1 font-semibold">Referencia</div>
            <SelectInput value={curRef} onChange={(r) => emit(r, curAlign, curOff)} options={refOptions} />
            {named.length === 0 && (
              <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                Clip-re hivatkozáshoz adj name-et az Általános tabban
              </p>
            )}
          </div>

          {/* Visual anchor diagram */}
          <div>
            <div className="text-[10px] text-gray-500 mb-2 font-semibold">
              Igazítás — <span className="font-mono text-gray-700">{curAlign}</span>
            </div>
            <AnchorDiagram curAlign={curAlign} onSelect={(a) => emit(curRef, a, curOff)} />
            <div className="mt-1.5 text-[10px] text-gray-400 leading-tight">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 align-middle mr-1" />
              belül · ↑↓←→ kívül (clip-to-clip)
            </div>
          </div>

          {/* Eltolás */}
          <div>
            <div className="text-[10px] text-gray-500 mb-1.5 font-semibold">Eltolás (offset)</div>
            <div className="space-y-2">
              <SliderNumber label="X px" value={curOff.x} onChange={(v) => emit(curRef, curAlign, { x: v, y: curOff.y })} min={-300} max={300} />
              <SliderNumber label="Y px" value={curOff.y} onChange={(v) => emit(curRef, curAlign, { x: curOff.x, y: v })} min={-300} max={300} />
            </div>
          </div>

          {/* JSON badge */}
          <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded break-all">
            {value ? (typeof value === 'string' ? value : JSON.stringify(value)) : '—'}
          </div>
        </div>
      )}
    </div>
  )
}
