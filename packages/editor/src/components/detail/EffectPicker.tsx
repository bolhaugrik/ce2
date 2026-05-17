/**
 * CE2 — EffectPicker (Safe + Advanced).
 *
 * Safe mode (default): Look-preset rács.
 * Advanced mode: kategória-bontás → effekt választás.
 */
import React, { useState, useMemo } from 'react'
import type { Effect, Clip } from '@ce2/core'
import { LOOK_PRESETS } from '../../registry/looks.js'
import { effectsForLayer, buildDefaultEffect, type EffectCategory } from '../../registry/effects.js'

interface Props {
  open: boolean
  layer: Clip['layer']
  onClose: () => void
  onApplyStack: (effects: Effect[]) => void
  onAddEffect: (eff: Effect) => void
}

const CATEGORIES: Array<{ id: EffectCategory; label: string; icon: string }> = [
  { id: 'visual', label: 'Vizuális', icon: '🎨' },
  { id: 'motion', label: 'Mozgás', icon: '💫' },
  { id: 'text', label: 'Szöveg', icon: '✏️' },
  { id: 'audio', label: 'Hang', icon: '🎵' },
]

export const EffectPicker: React.FC<Props> = ({ open, layer, onClose, onApplyStack, onAddEffect }) => {
  const [mode, setMode] = useState<'safe' | 'advanced'>('safe')
  const [activeCategory, setActiveCategory] = useState<EffectCategory>('visual')

  const allowedEffects = useMemo(() => effectsForLayer(layer), [layer])
  const visibleCategories = useMemo(
    () => CATEGORIES.filter((c) => allowedEffects.some((e) => e.category === c.id)),
    [allowedEffects],
  )
  const filteredEffects = useMemo(
    () => allowedEffects.filter((e) => e.category === activeCategory),
    [allowedEffects, activeCategory],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">🎬 Effekt hozzáadása</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Layer: {layer}</p>
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-50 rounded">
            <button
              onClick={() => setMode('safe')}
              className={`px-2.5 py-1 text-xs rounded ${mode === 'safe' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              ⭐ Look
            </button>
            <button
              onClick={() => setMode('advanced')}
              className={`px-2.5 py-1 text-xs rounded ${mode === 'advanced' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              ⚙ Advanced
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'safe' && (
            <>
              <p className="text-[11px] text-gray-500 mb-3">
                Egy click → előre összeállított effekt-stack a clip-re.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LOOK_PRESETS.map((look) => (
                  <button
                    key={look.kind}
                    onClick={() => { onApplyStack(look.stack); onClose() }}
                    className="text-left p-3 rounded border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mb-1">{look.icon}</div>
                    <div className="text-xs font-semibold text-gray-900">{look.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{look.description}</div>
                    <div className="text-[10px] text-gray-500 mt-1">{look.stack.length} effekt</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-4 italic">
                💡 Look applikálása felülírja a meglévő stack-et.
              </p>
            </>
          )}

          {mode === 'advanced' && (
            <>
              <div className="flex gap-1 mb-3 border-b border-gray-200">
                {visibleCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-2.5 py-1.5 text-xs border-b-2 transition-colors ${
                      activeCategory === c.id
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-1">{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredEffects.map((eff) => (
                  <button
                    key={eff.kind}
                    onClick={() => { onAddEffect(buildDefaultEffect(eff)); onClose() }}
                    className="text-left p-2.5 rounded border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-xl">{eff.icon}</div>
                    <div className="text-xs font-semibold text-gray-900 mt-1">{eff.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{eff.description}</div>
                  </button>
                ))}
                {filteredEffects.length === 0 && (
                  <div className="col-span-3 text-xs text-gray-500 p-4 text-center">
                    Ezen a rétegen nincs ebbe a kategóriába tartozó effekt.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
