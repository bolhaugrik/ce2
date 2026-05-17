/**
 * CE2 — MomentEditor.
 */
import React, { useState } from 'react'
import type { Moment, Transition } from '@ce2/core'
import { Field, TextInput, NumberInput, Section } from '../primitives.js'
import { TransitionPicker } from './TransitionPicker.js'
import { TRANSITIONS_BY_KIND } from '../../registry/transitions.js'

interface Props {
  moment: Moment
  onUpdate: (updater: (m: Moment) => Moment) => void
}

export const MomentEditor: React.FC<Props> = ({ moment, onUpdate }) => {
  const [pickerOpen, setPickerOpen] = useState(false)
  const trans = moment.transition_in
  const def = trans ? TRANSITIONS_BY_KIND[trans.kind] : undefined

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-white">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">Detail</div>
        <div className="text-xs font-semibold text-gray-900 mt-0.5">
          📝 Pillanat · {moment.label ?? moment.id}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-white">
        <Section title="Pillanat">
          <Field label="Címke (label)" helper="Csak a UI-ban használt felhasználói név">
            <TextInput
              value={moment.label ?? ''}
              onChange={(v) => onUpdate((m) => ({ ...m, label: v || undefined }))}
              placeholder="Pl. Intro / Hook / CTA"
            />
          </Field>
          <Field label="ID" helper="Read-only — anchor referencia ide mutathat">
            <TextInput value={moment.id} onChange={() => undefined} />
          </Field>
        </Section>

        <Section title="Bejövő átmenet">
          {trans ? (
            <div className="bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-base">{def?.icon ?? '⚡'}</span>
                <span className="text-xs font-semibold flex-1 truncate">
                  {def?.label ?? trans.kind}
                </span>
                <button
                  onClick={() => setPickerOpen(true)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100"
                >
                  Csere
                </button>
                <button
                  onClick={() => onUpdate((m) => ({ ...m, transition_in: undefined }))}
                  className="text-xs text-red-700 hover:text-red-900 px-1"
                  title="Eltávolítás"
                >
                  🗑
                </button>
              </div>
              {trans.kind !== 'cut' && (
                <div className="px-2 pb-2 pt-0.5 border-t border-gray-200/50">
                  <label className="text-[10px] text-gray-500 font-semibold">Hossz (s)</label>
                  <NumberInput
                    value={trans.duration_sec ?? 0.5}
                    onChange={(sec) =>
                      onUpdate((m) =>
                        m.transition_in
                          ? { ...m, transition_in: { ...m.transition_in, duration_sec: sec } }
                          : m,
                      )
                    }
                    min={0.05}
                    max={3}
                    step={0.05}
                    showSlider
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setPickerOpen(true)}
              className="w-full px-2 py-1.5 text-xs text-gray-500 border border-dashed border-gray-200 rounded bg-gray-50 hover:bg-gray-100 text-left"
            >
              + Átmenet választás (default: cut)
            </button>
          )}
        </Section>

        <Section title="Tartalmaz">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {moment.layers.length} réteg ezen a pillanaton. A vásznon click egy rétegen → annak
            szerkesztéséhez ugrik.
          </p>
        </Section>
      </div>

      <TransitionPicker
        open={pickerOpen}
        label="Bejövő átmenet az előző pillanatból"
        onClose={() => setPickerOpen(false)}
        onPick={(t: Transition) => onUpdate((m) => ({ ...m, transition_in: t }))}
      />
    </div>
  )
}
