/**
 * CE2 — GlobalsEditor.
 */
import React from 'react'
import type { CE2Composition } from '@ce2/core'
import { Field, TextInput, NumberInput, ColorInput, SelectInput, Section } from '../primitives.js'

interface Props {
  composition: CE2Composition
  onUpdateMeta: (updater: (m: CE2Composition['meta']) => CE2Composition['meta']) => void
  onUpdateGlobals: (updater: (g: CE2Composition['globals']) => CE2Composition['globals']) => void
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
]

const ASPECT_PRESETS = [
  { label: 'Vertikál (1080×1920) — TikTok/Reels', w: 1080, h: 1920 },
  { label: 'Square (1080×1080) — Instagram', w: 1080, h: 1080 },
  { label: 'Horizontál (1920×1080) — YouTube', w: 1920, h: 1080 },
]

export const GlobalsEditor: React.FC<Props> = ({ composition, onUpdateMeta, onUpdateGlobals }) => {
  const globals = composition.globals ?? {}

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-white">
        <div className="text-[9px] uppercase tracking-wider text-gray-500">Detail</div>
        <div className="text-xs font-semibold text-gray-900 mt-0.5">🌐 Globálisok</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-white">
        <Section title="Kreatív">
          <Field label="Cím">
            <TextInput
              value={composition.meta.title ?? ''}
              onChange={(v) => onUpdateMeta((m) => ({ ...m, title: v }))}
              placeholder="Pl. Klíma akció - júniusi kampány"
            />
          </Field>
        </Section>

        <Section title="Vászon">
          <Field label="Aspect arány preset">
            <div className="flex flex-col gap-1">
              {ASPECT_PRESETS.map((p) => {
                const active = composition.meta.width === p.w && composition.meta.height === p.h
                return (
                  <button
                    key={p.label}
                    onClick={() => onUpdateMeta((m) => ({ ...m, width: p.w, height: p.h }))}
                    className={`text-left px-2 py-1.5 text-xs rounded ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Szélesség (px)">
              <NumberInput
                value={composition.meta.width}
                onChange={(v) => onUpdateMeta((m) => ({ ...m, width: Math.round(v) }))}
                min={100}
                max={4096}
                step={1}
              />
            </Field>
            <Field label="Magasság (px)">
              <NumberInput
                value={composition.meta.height}
                onChange={(v) => onUpdateMeta((m) => ({ ...m, height: Math.round(v) }))}
                min={100}
                max={4096}
                step={1}
              />
            </Field>
          </div>
          <Field label="FPS">
            <SelectInput
              value={String(composition.meta.fps)}
              onChange={(v) => onUpdateMeta((m) => ({ ...m, fps: Number(v) }))}
              options={[
                { value: '24', label: '24 (mozis)' },
                { value: '30', label: '30 (default)' },
                { value: '60', label: '60 (sima)' },
              ]}
            />
          </Field>
        </Section>

        <Section title="Megjelenés default-ok">
          <Field label="Háttérszín">
            <ColorInput
              value={globals.background_color ?? '#000000'}
              onChange={(v) => onUpdateGlobals((g) => ({ ...g, background_color: v }))}
            />
          </Field>
          <Field label="Alap font" helper="Text clipek default font-ja">
            <SelectInput
              value={globals.base_font ?? 'Inter'}
              onChange={(v) => onUpdateGlobals((g) => ({ ...g, base_font: v }))}
              options={FONT_OPTIONS}
            />
          </Field>
          <Field label="Alap zene-hangerő">
            <NumberInput
              value={globals.base_music_volume ?? 0.3}
              onChange={(v) => onUpdateGlobals((g) => ({ ...g, base_music_volume: v }))}
              min={0}
              max={2}
              step={0.05}
              showSlider
            />
          </Field>
        </Section>
      </div>
    </div>
  )
}
