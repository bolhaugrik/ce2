/**
 * CE2 — TransitionPicker.
 *
 * Modal: 10 átmenet rács.
 */
import React from 'react'
import type { Transition } from '@ce2/core'
import { TRANSITIONS, buildDefaultTransition } from '../../registry/transitions.js'

interface Props {
  open: boolean
  onClose: () => void
  onPick: (t: Transition) => void
  label?: string
}

export const TransitionPicker: React.FC<Props> = ({ open, onClose, onPick, label }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded shadow-xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">⚡ Átmenet választó</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">{label ?? 'Válassz egy típust'}</p>
        </header>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TRANSITIONS.map((t) => (
              <button
                key={t.kind}
                onClick={() => { onPick(buildDefaultTransition(t)); onClose() }}
                className="text-left p-2.5 rounded border border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xl">{t.icon}</span>
                  {t.rendererStatus === 'placeholder' && (
                    <span className="text-[8px] uppercase font-bold text-amber-700 bg-amber-50 px-1 rounded">
                      placeholder
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-gray-900 mt-1">{t.label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{t.description}</div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-4 italic">
            💡 A `placeholder` átmenetek vizuálisan fade-ként futnak, de a JSON-ban a választott típus tárolódik.
          </p>
        </div>
      </div>
    </div>
  )
}
