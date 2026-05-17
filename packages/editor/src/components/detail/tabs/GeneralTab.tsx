/**
 * CE2 — Detail / Általános tab.
 */
import React from 'react'
import type { Clip } from '@ce2/core'
import { Field, TextInput, Section } from '../../primitives.js'

interface Props {
  clip: Clip
  onUpdate: (updater: (c: Clip) => Clip) => void
}

const layerLabels: Record<string, string> = {
  music: '🎵 Zene',
  narration: '🎤 Narráció',
  sfx: '🔊 SFX',
  video: '📹 Videó',
  pixel: '🖼️ Kép',
  vector: '✏️ Vektor (text/shape)',
}

const sourceKindLabels: Record<string, string> = {
  asset: 'Asset hivatkozás',
  text: 'Szöveg (inline)',
  tts: 'TTS narráció',
  shape: 'Shape (geometriai)',
  svg: 'SVG (inline)',
  computed: 'Programozott (computed)',
}

export const GeneralTab: React.FC<Props> = ({ clip, onUpdate }) => {
  return (
    <>
      <Section title="Megnevezés">
        <Field label="Név (label)" helper="Csak a UI-ban — könnyebb azonosíthatóság. Üres → ID jelenik meg.">
          <TextInput
            value={clip.label ?? ''}
            onChange={(v) => onUpdate((c) => ({ ...c, label: v || undefined }))}
            placeholder={clip.id}
          />
        </Field>
        <Field label="ID" helper="Read-only — anchor referencia ide mutathat">
          <TextInput value={clip.id} onChange={() => undefined} />
        </Field>
      </Section>

      <Section title="Típus">
        <Field label="Réteg-kategória">
          <div className="text-xs text-gray-900 px-2 py-1.5 bg-gray-50 rounded">
            {layerLabels[clip.layer] ?? clip.layer}
          </div>
        </Field>
        <Field label="Forrás">
          <div className="text-xs text-gray-900 px-2 py-1.5 bg-gray-50 rounded">
            {sourceKindLabels[clip.source.kind] ?? clip.source.kind}
          </div>
        </Field>
        {clip.bundle_id && (
          <Field label="Bundle">
            <div className="text-xs text-gray-900 px-2 py-1.5 bg-gray-50 rounded font-mono">
              {clip.bundle_id}
              {clip.bundle_role && (
                <span className="text-gray-500 ml-2 text-[10px]">[{clip.bundle_role}]</span>
              )}
            </div>
          </Field>
        )}
      </Section>
    </>
  )
}
