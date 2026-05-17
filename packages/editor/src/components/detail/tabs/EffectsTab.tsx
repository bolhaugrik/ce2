/**
 * CE2 — Detail / Effekt tab.
 *
 * Stack listázás + sor-szintű paraméter-szerkesztők + EffectPicker integráció.
 */
import React, { useState } from 'react'
import type { Clip, Effect } from '@ce2/core'
import { Section } from '../../primitives.js'
import { EFFECTS_BY_KIND, type EffectParamField } from '../../../registry/effects.js'
import { EffectPicker } from '../EffectPicker.js'

const isAudioLayer = (l: string) => ['music', 'narration', 'sfx'].includes(l)

interface Props {
  clip: Clip
  composition?: import('@ce2/core').CE2Composition
  onUpdate: (updater: (c: Clip) => Clip) => void
}

export const EffectsTab: React.FC<Props> = ({ clip, onUpdate }) => {
  const effects = clip.attached_effects ?? []
  const [pickerOpen, setPickerOpen] = useState(false)

  const removeAt = (idx: number) => {
    onUpdate((c) => {
      const next = (c.attached_effects ?? []).filter((_, i) => i !== idx)
      return { ...c, attached_effects: next.length > 0 ? next : undefined }
    })
  }

  const updateParamAt = (idx: number, key: string, value: unknown) => {
    onUpdate((c) => {
      const next = [...(c.attached_effects ?? [])]
      next[idx] = { ...next[idx], [key]: value }
      return { ...c, attached_effects: next }
    })
  }

  const handleApplyStack = (stack: Effect[]) => {
    onUpdate((c) => ({ ...c, attached_effects: stack }))
  }
  const handleAddEffect = (eff: Effect) => {
    onUpdate((c) => ({ ...c, attached_effects: [...(c.attached_effects ?? []), eff] }))
  }

  return (
    <>
      <Section title="Effektek (stack)">
        {effects.length === 0 && (
          <div className="text-[11px] text-gray-500 p-3 text-center bg-gray-50 border border-dashed border-gray-200 rounded">
            Nincs effekt. Kattints az alsó gombra → ⭐ Look-preset vagy ⚙ Advanced.
          </div>
        )}
        {effects.map((eff, i) => {
          const def = EFFECTS_BY_KIND[eff.kind]
          return (
            <EffectRow
              key={i}
              eff={eff}
              def={def}
              onChangeParam={(k, v) => updateParamAt(i, k, v)}
              onRemove={() => removeAt(i)}
            />
          )
        })}
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full px-3 py-2 text-xs text-gray-900 border border-dashed border-gray-200 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          + Effekt hozzáadása
        </button>
      </Section>

      <EffectPicker
        open={pickerOpen}
        layer={clip.layer}
        onClose={() => setPickerOpen(false)}
        onApplyStack={handleApplyStack}
        onAddEffect={handleAddEffect}
      />
    </>
  )
}

const EffectRow: React.FC<{
  eff: Effect
  def: (typeof EFFECTS_BY_KIND)[string] | undefined
  onChangeParam: (key: string, value: unknown) => void
  onRemove: () => void
}> = ({ eff, def, onChangeParam, onRemove }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-gray-50 border border-gray-200 rounded">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-base">{def?.icon ?? '🎬'}</span>
        <span className="text-xs font-semibold flex-1 truncate">{def?.label ?? eff.kind}</span>
        {def && def.params.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-gray-500 hover:text-gray-900 px-1"
            title={expanded ? 'Becsuk' : 'Kibont'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        <button
          onClick={onRemove}
          className="text-xs text-red-700 hover:text-red-900 px-1"
          title="Törlés"
        >
          🗑
        </button>
      </div>
      {expanded && def && def.params.length > 0 && (
        <div className="px-2 pb-2 pt-1 border-t border-gray-200 space-y-2">
          {def.params.map((p) => (
            <ParamEditor
              key={p.key}
              field={p}
              value={(eff as any)[p.key]}
              onChange={(v) => onChangeParam(p.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const ParamEditor: React.FC<{
  field: EffectParamField
  value: unknown
  onChange: (v: unknown) => void
}> = ({ field, value, onChange }) => {
  if (field.kind === 'number') {
    return (
      <div>
        <label className="text-[10px] text-gray-500 font-semibold">{field.label}</label>
        <div className="flex items-center gap-2">
          {field.min !== undefined && field.max !== undefined && (
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step ?? 0.1}
              value={(value as number) ?? 0}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="flex-1"
            />
          )}
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 0.1}
            value={(value as number) ?? 0}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-16 px-1 py-0.5 text-[11px] border border-gray-200 rounded"
          />
        </div>
      </div>
    )
  }
  if (field.kind === 'color') {
    return (
      <div>
        <label className="text-[10px] text-gray-500 font-semibold">{field.label}</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) ?? '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-8 border border-gray-200 rounded cursor-pointer"
          />
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-1 py-0.5 text-[11px] font-mono border border-gray-200 rounded"
          />
        </div>
      </div>
    )
  }
  if (field.kind === 'select') {
    return (
      <div>
        <label className="text-[10px] text-gray-500 font-semibold">{field.label}</label>
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-1 py-0.5 text-[11px] border border-gray-200 rounded bg-white"
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  return null
}
