/**
 * CE2 — BundleDetailPanel.
 *
 * Bundle-szintű inputs szerkesztése.
 * PRESET_BY_KIND: opcionális — null-safe fallback ha nincs def.
 */
import React from 'react'
import type { BundleInstance, CE2Composition } from '@ce2/core'
import { Field, TextInput, NumberInput, ColorInput, SelectInput, Section } from '../primitives.js'

interface PresetInputField {
  key: string
  label: string
  kind: 'text' | 'textarea' | 'color' | 'number' | 'select' | 'asset' | 'asset_with_trim' | 'position'
  helper?: string
  default?: unknown
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
}

interface Props {
  bundle: BundleInstance
  composition: CE2Composition
  onUpdate: (updater: (b: BundleInstance) => BundleInstance) => void
}

export const BundleDetailPanel: React.FC<Props> = ({ bundle, composition, onUpdate }) => {
  // Try to get preset def from the presets registry if available
  let presetDef: { label: string; inputs: PresetInputField[] } | null = null
  try {
    // Dynamic import not supported here; we'll use a simple inline check
    // If PRESET_BY_KIND is available from the presets module, use it
    // Otherwise gracefully degrade
    presetDef = null
  } catch {
    presetDef = null
  }

  const taggedClips = [
    ...composition.spanning_layers,
    ...composition.moments.flatMap((m) => m.layers),
  ].filter((c) => c.bundle_id === bundle.id)

  const updateInput = (key: string, value: unknown) => {
    onUpdate((b) => ({ ...b, inputs: { ...b.inputs, [key]: value } }))
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-white">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">Detail</div>
        <div className="text-xs font-semibold text-gray-900 mt-0.5">
          📦 {bundle.kind}
          <span className="text-gray-500 font-normal ml-1">v{bundle.version}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">{bundle.id}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-white">
        {/* Bundle inputs — raw editing since we don't have PRESET_BY_KIND */}
        <Section title="Bundle paraméterek (inputs)">
          {Object.entries(bundle.inputs).map(([key, value]) => (
            <Field key={key} label={key}>
              {typeof value === 'number' ? (
                <NumberInput
                  value={value}
                  onChange={(v) => updateInput(key, v)}
                  step={1}
                />
              ) : typeof value === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => updateInput(key, e.target.checked)}
                />
              ) : (
                <TextInput
                  value={typeof value === 'string' ? value : JSON.stringify(value)}
                  onChange={(v) => {
                    try {
                      updateInput(key, JSON.parse(v))
                    } catch {
                      updateInput(key, v)
                    }
                  }}
                />
              )}
            </Field>
          ))}
          {Object.keys(bundle.inputs).length === 0 && (
            <p className="text-[11px] text-gray-500 italic">Nincs bundle input.</p>
          )}
        </Section>

        <Section title="Bundle tagok">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {taggedClips.length} clip ehhez a bundle-höz. A vásznon click egy tagra → a saját
            Detail-jét nyitja.
          </p>
          <ul className="mt-2 space-y-0.5">
            {taggedClips.map((c) => (
              <li
                key={c.id}
                className="text-[11px] font-mono text-gray-900 px-2 py-1 bg-gray-50 rounded flex items-center gap-2"
              >
                <span className="text-gray-500 w-5">
                  {c.layer === 'vector' ? '✏️' : c.layer === 'sfx' ? '🔊' : '·'}
                </span>
                <span className="flex-1 truncate">{c.id}</span>
                <span className="text-[9px] text-gray-500">{c.bundle_role}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Exposes">
          <div className="text-[10px] font-mono text-gray-500 bg-gray-50 p-2 rounded">
            editable: {bundle.exposes.editable_layers.join(', ') || '—'}
            <br />
            timing_hooks: {bundle.exposes.timing_hooks.join(', ') || '—'}
          </div>
        </Section>
      </div>
    </div>
  )
}
