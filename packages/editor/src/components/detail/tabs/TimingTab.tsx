/**
 * CE2 — Detail / Időzítés tab.
 *
 * Start (TimeAnchor union) + duration (Duration union) + átmenetek.
 */
import React, { useState } from 'react'
import type { Clip, CE2Composition, TimeAnchor, Duration, Transition } from '@ce2/core'
import { Field, NumberInput, SelectInput, Section, TextInput } from '../../primitives.js'
import { AnchorPicker } from '../AnchorPicker.js'
import { TransitionPicker } from '../TransitionPicker.js'
import { TRANSITIONS_BY_KIND } from '../../../registry/transitions.js'

interface Props {
  clip: Clip
  composition: CE2Composition
  onUpdate: (updater: (c: Clip) => Clip) => void
  onUpdateComposition?: (updater: (c: CE2Composition) => CE2Composition) => void
}

const TransitionDisplay: React.FC<{
  transition: Transition | undefined
  onPick: () => void
  onClear: () => void
  onChangeDuration: (sec: number) => void
}> = ({ transition, onPick, onClear, onChangeDuration }) => {
  if (!transition) {
    return (
      <button
        onClick={onPick}
        className="w-full px-2 py-1.5 text-xs text-gray-500 border border-dashed border-gray-200 rounded bg-gray-50 hover:bg-gray-100 text-left"
      >
        + Átmenet választás (default: cut)
      </button>
    )
  }
  const def = TRANSITIONS_BY_KIND[transition.kind]
  const supportsDuration = transition.kind !== 'cut'
  return (
    <div className="bg-gray-50 border border-gray-200 rounded">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-base">{def?.icon ?? '⚡'}</span>
        <span className="text-xs font-semibold flex-1 truncate">{def?.label ?? transition.kind}</span>
        <button
          onClick={onPick}
          className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-200 hover:bg-gray-100"
        >
          Csere
        </button>
        <button onClick={onClear} className="text-xs text-red-700 hover:text-red-900 px-1" title="Törlés">
          🗑
        </button>
      </div>
      {supportsDuration && (
        <div className="px-2 pb-2 pt-0.5 border-t border-gray-200/50">
          <label className="text-[10px] text-gray-500 font-semibold">Hossz (s)</label>
          <NumberInput
            value={transition.duration_sec ?? 0.4}
            onChange={onChangeDuration}
            min={0.05}
            max={3}
            step={0.05}
            showSlider
          />
        </div>
      )}
    </div>
  )
}

type StartUiKind = TimeAnchor['kind'] | 'after_clip'
type DurUiKind = Duration['kind'] | 'until_clip_start' | 'until_clip_end'

const START_KIND_OPTIONS: Array<{ value: StartUiKind; label: string }> = [
  { value: 'moment_start', label: 'Pillanat eleje' },
  { value: 'after_previous', label: 'Előző clip után (a sorban)' },
  { value: 'after_clip', label: '🔗 Egy konkrét clip után' },
  { value: 'anchor', label: 'Anchor referencia (haladó)' },
  { value: 'absolute_sec', label: 'Konkrét másodperc' },
]

const DUR_KIND_OPTIONS: Array<{ value: DurUiKind; label: string }> = [
  { value: 'fixed_sec', label: 'Fix másodperc' },
  { value: 'matches_source', label: 'Forrás hossza (asset)' },
  { value: 'until_clip_start', label: '🔗 Egy konkrét clip kezdetéig' },
  { value: 'until_clip_end', label: '🔗 Egy konkrét clip végéig' },
  { value: 'until_anchor', label: 'Anchor referencia (haladó)' },
  { value: 'until_moment_end', label: 'Pillanat végéig' },
]

function startUiKindFromClip(clip: Clip): StartUiKind {
  if (clip.start.kind !== 'anchor') return clip.start.kind
  const ref = clip.start.anchor_ref
  if (ref.endsWith('.end') && !ref.startsWith('moment.')) return 'after_clip'
  return 'anchor'
}

function durUiKindFromClip(clip: Clip): DurUiKind {
  if (clip.duration.kind !== 'until_anchor') return clip.duration.kind
  const ref = clip.duration.anchor_ref
  if (ref.endsWith('.start') && !ref.startsWith('moment.')) return 'until_clip_start'
  if (ref.endsWith('.end') && !ref.startsWith('moment.')) return 'until_clip_end'
  return 'until_anchor'
}

function clipIdFromRef(ref: string): string {
  return ref.split('.')[0]
}

const ClipPicker: React.FC<{
  composition: CE2Composition
  excludeClipId: string
  value: string
  onChange: (clipId: string) => void
}> = ({ composition, excludeClipId, value, onChange }) => {
  const allClips = [
    ...composition.spanning_layers.map((c) => ({ clip: c, ctx: '🌊 Átívelő' })),
    ...composition.moments.flatMap((m) =>
      m.layers.map((c) => ({ clip: c, ctx: m.label ?? m.id })),
    ),
  ].filter((x) => x.clip.id !== excludeClipId)

  if (allClips.length === 0) {
    return (
      <div className="text-[10px] text-gray-500 italic px-2 py-1.5 bg-gray-50 rounded">
        Nincs másik clip.
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white"
    >
      <option value="">— válassz clipet —</option>
      {allClips.map(({ clip: c, ctx }) => (
        <option key={c.id} value={c.id}>
          {ctx} → {c.label || c.id}
        </option>
      ))}
    </select>
  )
}

export const TimingTab: React.FC<Props> = ({ clip, composition, onUpdate }) => {
  const [pickerFor, setPickerFor] = useState<null | 'start' | 'duration'>(null)
  const [transitionFor, setTransitionFor] = useState<null | 'in' | 'out'>(null)

  const startUiKind = startUiKindFromClip(clip)
  const durUiKind = durUiKindFromClip(clip)

  const updateStartUiKind = (kind: StartUiKind) => {
    onUpdate((c) => {
      let next: TimeAnchor
      switch (kind) {
        case 'moment_start':
          next = { kind: 'moment_start' }
          break
        case 'after_previous':
          next = { kind: 'after_previous', offset_sec: 0 }
          break
        case 'after_clip':
          next = {
            kind: 'anchor',
            anchor_ref:
              c.start.kind === 'anchor' && c.start.anchor_ref.endsWith('.end')
                ? c.start.anchor_ref
                : '',
          }
          break
        case 'anchor':
          next = {
            kind: 'anchor',
            anchor_ref: c.start.kind === 'anchor' ? c.start.anchor_ref : '',
          }
          break
        case 'absolute_sec':
          next = { kind: 'absolute_sec', value: 0 }
          break
        default:
          next = { kind: 'moment_start' }
      }
      return { ...c, start: next }
    })
  }

  const updateDurUiKind = (kind: DurUiKind) => {
    onUpdate((c) => {
      let next: Duration
      switch (kind) {
        case 'fixed_sec':
          next = { kind: 'fixed_sec', value: 3 }
          break
        case 'matches_source':
          next = { kind: 'matches_source' }
          break
        case 'until_clip_start':
          next = {
            kind: 'until_anchor',
            anchor_ref:
              c.duration.kind === 'until_anchor' && c.duration.anchor_ref.endsWith('.start')
                ? c.duration.anchor_ref
                : '',
          }
          break
        case 'until_clip_end':
          next = {
            kind: 'until_anchor',
            anchor_ref:
              c.duration.kind === 'until_anchor' && c.duration.anchor_ref.endsWith('.end')
                ? c.duration.anchor_ref
                : '',
          }
          break
        case 'until_anchor':
          next = {
            kind: 'until_anchor',
            anchor_ref: c.duration.kind === 'until_anchor' ? c.duration.anchor_ref : '',
          }
          break
        case 'until_moment_end':
          next = { kind: 'until_moment_end' }
          break
        default:
          next = { kind: 'fixed_sec', value: 3 }
      }
      return { ...c, duration: next }
    })
  }

  return (
    <>
      <Section title="Indulás">
        <Field label="Mikor induljon?">
          <SelectInput
            value={startUiKind}
            onChange={(v) => updateStartUiKind(v as StartUiKind)}
            options={START_KIND_OPTIONS}
          />
        </Field>

        {clip.start.kind === 'after_previous' && (
          <Field label="Késleltetés (s)">
            <NumberInput
              value={clip.start.offset_sec ?? 0}
              onChange={(v) =>
                onUpdate((c) => {
                  if (c.start.kind !== 'after_previous') return c
                  return { ...c, start: { ...c.start, offset_sec: v } }
                })
              }
              min={0}
              max={10}
              step={0.1}
              showSlider
            />
          </Field>
        )}

        {clip.start.kind === 'absolute_sec' && (
          <Field label="Másodperc">
            <NumberInput
              value={clip.start.value}
              onChange={(v) =>
                onUpdate((c) => {
                  if (c.start.kind !== 'absolute_sec') return c
                  return { ...c, start: { ...c.start, value: v } }
                })
              }
              min={0}
              step={0.1}
            />
          </Field>
        )}

        {clip.start.kind === 'anchor' && startUiKind === 'after_clip' && (
          <>
            <Field label="Melyik clip után?">
              <ClipPicker
                composition={composition}
                excludeClipId={clip.id}
                value={clipIdFromRef(clip.start.anchor_ref)}
                onChange={(clipId) =>
                  onUpdate((c) => {
                    if (c.start.kind !== 'anchor') return c
                    return { ...c, start: { ...c.start, anchor_ref: clipId ? `${clipId}.end` : '' } }
                  })
                }
              />
            </Field>
            <Field label="Eltolás (s)" helper="Negatív → korábban indul, pozitív → később">
              <NumberInput
                value={clip.start.offset_sec ?? 0}
                onChange={(v) =>
                  onUpdate((c) => {
                    if (c.start.kind !== 'anchor') return c
                    return { ...c, start: { ...c.start, offset_sec: v } }
                  })
                }
                min={-10}
                max={10}
                step={0.1}
              />
            </Field>
          </>
        )}

        {clip.start.kind === 'anchor' && startUiKind === 'anchor' && (
          <>
            <Field label="Anchor referencia">
              <div className="flex items-center gap-2">
                <TextInput
                  value={clip.start.anchor_ref}
                  onChange={(v) =>
                    onUpdate((c) => {
                      if (c.start.kind !== 'anchor') return c
                      return { ...c, start: { ...c.start, anchor_ref: v } }
                    })
                  }
                  placeholder="pl. txt_a.phase.enter"
                />
                <button
                  onClick={() => setPickerFor('start')}
                  className="px-2 py-1.5 text-xs rounded bg-gray-50 hover:bg-gray-100 whitespace-nowrap"
                >
                  📍
                </button>
              </div>
            </Field>
            <Field label="Eltolás (s)">
              <NumberInput
                value={clip.start.offset_sec ?? 0}
                onChange={(v) =>
                  onUpdate((c) => {
                    if (c.start.kind !== 'anchor') return c
                    return { ...c, start: { ...c.start, offset_sec: v } }
                  })
                }
                min={-10}
                max={10}
                step={0.1}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="Időtartam">
        <Field label="Meddig tart?">
          <SelectInput
            value={durUiKind}
            onChange={(v) => updateDurUiKind(v as DurUiKind)}
            options={DUR_KIND_OPTIONS}
          />
        </Field>

        {clip.duration.kind === 'fixed_sec' && (
          <Field label="Hossz (s)">
            <NumberInput
              value={clip.duration.value}
              onChange={(v) =>
                onUpdate((c) => {
                  if (c.duration.kind !== 'fixed_sec') return c
                  return { ...c, duration: { ...c.duration, value: v } }
                })
              }
              min={0.1}
              max={60}
              step={0.1}
              showSlider
            />
          </Field>
        )}

        {clip.duration.kind === 'until_anchor' && durUiKind === 'until_clip_start' && (
          <>
            <Field label="Melyik clip kezdetéig?">
              <ClipPicker
                composition={composition}
                excludeClipId={clip.id}
                value={clipIdFromRef(clip.duration.anchor_ref)}
                onChange={(clipId) =>
                  onUpdate((c) => {
                    if (c.duration.kind !== 'until_anchor') return c
                    return { ...c, duration: { ...c.duration, anchor_ref: clipId ? `${clipId}.start` : '' } }
                  })
                }
              />
            </Field>
          </>
        )}

        {clip.duration.kind === 'until_anchor' && durUiKind === 'until_clip_end' && (
          <>
            <Field label="Melyik clip végéig?">
              <ClipPicker
                composition={composition}
                excludeClipId={clip.id}
                value={clipIdFromRef(clip.duration.anchor_ref)}
                onChange={(clipId) =>
                  onUpdate((c) => {
                    if (c.duration.kind !== 'until_anchor') return c
                    return { ...c, duration: { ...c.duration, anchor_ref: clipId ? `${clipId}.end` : '' } }
                  })
                }
              />
            </Field>
          </>
        )}

        {clip.duration.kind === 'until_anchor' && durUiKind === 'until_anchor' && (
          <>
            <Field label="Anchor referencia">
              <div className="flex items-center gap-2">
                <TextInput
                  value={clip.duration.anchor_ref}
                  onChange={(v) =>
                    onUpdate((c) => {
                      if (c.duration.kind !== 'until_anchor') return c
                      return { ...c, duration: { ...c.duration, anchor_ref: v } }
                    })
                  }
                  placeholder="pl. txt_b.phase.exit"
                />
                <button
                  onClick={() => setPickerFor('duration')}
                  className="px-2 py-1.5 text-xs rounded bg-gray-50 hover:bg-gray-100 whitespace-nowrap"
                >
                  📍
                </button>
              </div>
            </Field>
          </>
        )}
      </Section>

      <Section title="Átmenetek (clip be / ki)">
        <Field label="Bejövő átmenet">
          <TransitionDisplay
            transition={clip.in_transition}
            onPick={() => setTransitionFor('in')}
            onClear={() => onUpdate((c) => ({ ...c, in_transition: undefined }))}
            onChangeDuration={(sec) =>
              onUpdate((c) =>
                c.in_transition
                  ? { ...c, in_transition: { ...c.in_transition, duration_sec: sec } }
                  : c,
              )
            }
          />
        </Field>
        <Field label="Kimenő átmenet">
          <TransitionDisplay
            transition={clip.out_transition}
            onPick={() => setTransitionFor('out')}
            onClear={() => onUpdate((c) => ({ ...c, out_transition: undefined }))}
            onChangeDuration={(sec) =>
              onUpdate((c) =>
                c.out_transition
                  ? { ...c, out_transition: { ...c.out_transition, duration_sec: sec } }
                  : c,
              )
            }
          />
        </Field>
      </Section>

      <TransitionPicker
        open={transitionFor !== null}
        label={
          transitionFor === 'in'
            ? 'Bejövő átmenet (clip kezdése)'
            : 'Kimenő átmenet (clip vége)'
        }
        onClose={() => setTransitionFor(null)}
        onPick={(t: Transition) => {
          if (transitionFor === 'in') {
            onUpdate((c) => ({ ...c, in_transition: t }))
          } else if (transitionFor === 'out') {
            onUpdate((c) => ({ ...c, out_transition: t }))
          }
        }}
      />

      <AnchorPicker
        open={pickerFor !== null}
        composition={composition}
        excludeClipId={clip.id}
        onClose={() => setPickerFor(null)}
        onPick={(ref) => {
          if (pickerFor === 'start') {
            onUpdate((c) => {
              if (c.start.kind !== 'anchor') return c
              return { ...c, start: { ...c.start, anchor_ref: ref } }
            })
          } else if (pickerFor === 'duration') {
            onUpdate((c) => {
              if (c.duration.kind !== 'until_anchor') return c
              return { ...c, duration: { ...c.duration, anchor_ref: ref } }
            })
          }
        }}
      />
    </>
  )
}
