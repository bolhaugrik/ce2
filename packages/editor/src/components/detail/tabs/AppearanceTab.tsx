/**
 * CE2 — Detail / Megjelenés tab.
 */
import React from 'react'
import type { Clip, CE2Composition } from '@ce2/core'
import { Field, NumberInput, SelectInput, Section } from '../../primitives.js'
import { ClipPositionPicker } from '../ClipPositionPicker.js'

const isAudioLayer = (l: string) => ['music', 'narration', 'sfx'].includes(l)

interface Props {
  clip: Clip
  composition: CE2Composition
  onUpdate: (updater: (c: Clip) => Clip) => void
}

const BLEND_MODES = [
  { value: 'normal', label: 'Normál' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'soft-light', label: 'Soft light' },
  { value: 'hard-light', label: 'Hard light' },
]

export const AppearanceTab: React.FC<Props> = ({ clip, composition, onUpdate }) => {
  if (isAudioLayer(clip.layer)) {
    return (
      <div className="text-xs text-gray-500 p-3 italic">
        Audio rétegnek nincs vizuális megjelenítése — lásd a 🎵 Hang tabot.
      </div>
    )
  }

  return (
    <>
      <Section title="Pozíció (canvas)">
        <ClipPositionPicker
          clipId={clip.id}
          value={(clip as any).position}
          composition={composition}
          onChange={(pos) => onUpdate((c) => ({ ...c, position: pos } as any))}
        />
      </Section>

      <Section title="Vizuális megjelenés">
        <Field label="Átlátszóság (opacity)" helper="0 = teljesen átlátszó, 1 = teljesen látható">
          <NumberInput
            value={clip.opacity ?? 1}
            onChange={(v) => onUpdate((c) => ({ ...c, opacity: v }))}
            min={0}
            max={1}
            step={0.05}
            showSlider
          />
        </Field>

        {(clip.layer === 'video' || clip.layer === 'pixel') && (
          <Field label="Blend mode">
            <SelectInput
              value={clip.blend_mode ?? 'normal'}
              onChange={(v) =>
                onUpdate((c) => ({
                  ...c,
                  blend_mode: v === 'normal' ? undefined : (v as Clip['blend_mode']),
                }))
              }
              options={BLEND_MODES}
            />
          </Field>
        )}

        <Field label="Z-index (réteg-belül)" helper="Alacsonyabb = hátrébb. Default: 0.">
          <NumberInput
            value={clip.z_within_layer ?? 0}
            onChange={(v) => onUpdate((c) => ({ ...c, z_within_layer: v }))}
            min={-100}
            max={100}
            step={1}
          />
        </Field>
      </Section>
    </>
  )
}
