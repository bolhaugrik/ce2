/**
 * CE2 — Detail / Hang tab.
 */
import React from 'react'
import type { Clip, Effect } from '@ce2/core'
import { Field, NumberInput, Toggle, Section } from '../../primitives.js'

const isAudioLayer = (l: string) => ['music', 'narration', 'sfx'].includes(l)

interface Props {
  clip: Clip
  onUpdate: (updater: (c: Clip) => Clip) => void
}

const findEffect = (effects: Effect[] | undefined, kind: string): Effect | undefined =>
  effects?.find((e) => e.kind === kind)

const upsertEffect = (effects: Effect[] | undefined, eff: Effect): Effect[] => {
  const list = [...(effects ?? [])]
  const idx = list.findIndex((e) => e.kind === eff.kind)
  if (idx >= 0) list[idx] = eff
  else list.push(eff)
  return list
}

const removeEffect = (effects: Effect[] | undefined, kind: string): Effect[] | undefined => {
  const filtered = (effects ?? []).filter((e) => e.kind !== kind)
  return filtered.length > 0 ? filtered : undefined
}

export const AudioTab: React.FC<Props> = ({ clip, onUpdate }) => {
  const isAudio = isAudioLayer(clip.layer)
  const isVideoWithAudio = clip.layer === 'video'

  if (!isAudio && !isVideoWithAudio) {
    return (
      <div className="text-xs text-gray-500 p-3 italic">
        Ennek a clipnek nincs hang-tartalma.
      </div>
    )
  }

  const fadeIn = findEffect(clip.attached_effects, 'audio.fade_in')
  const fadeOut = findEffect(clip.attached_effects, 'audio.fade_out')

  return (
    <Section title="Hang">
      <Field label="Hangerő" helper="0 = csend, 1 = teljes, 2 = duplázott (csak server-render)">
        <NumberInput
          value={clip.volume ?? 1}
          onChange={(v) => onUpdate((c) => ({ ...c, volume: v }))}
          min={0}
          max={2}
          step={0.05}
          showSlider
        />
      </Field>

      <Field label=" ">
        <Toggle
          label="Némítás"
          value={clip.muted ?? false}
          onChange={(v) => onUpdate((c) => ({ ...c, muted: v || undefined }))}
        />
      </Field>

      <Field label="Fade in (s)">
        <NumberInput
          value={(fadeIn?.duration_sec as number) ?? 0}
          onChange={(v) =>
            onUpdate((c) => ({
              ...c,
              attached_effects:
                v > 0
                  ? upsertEffect(c.attached_effects, { kind: 'audio.fade_in', duration_sec: v })
                  : removeEffect(c.attached_effects, 'audio.fade_in'),
            }))
          }
          min={0}
          max={5}
          step={0.1}
          showSlider
        />
      </Field>

      <Field label="Fade out (s)">
        <NumberInput
          value={(fadeOut?.duration_sec as number) ?? 0}
          onChange={(v) =>
            onUpdate((c) => ({
              ...c,
              attached_effects:
                v > 0
                  ? upsertEffect(c.attached_effects, { kind: 'audio.fade_out', duration_sec: v })
                  : removeEffect(c.attached_effects, 'audio.fade_out'),
            }))
          }
          min={0}
          max={5}
          step={0.1}
          showSlider
        />
      </Field>
    </Section>
  )
}
