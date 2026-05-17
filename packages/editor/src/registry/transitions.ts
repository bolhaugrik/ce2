/**
 * CE2 — Transition registry.
 *
 * 10 átmenet. Mind clip in/out, mind moment-átmenet helyén használható.
 */
import type { Transition } from '@ce2/core'

export interface TransitionParamField {
  key: string
  label: string
  kind: 'number' | 'select'
  min?: number
  max?: number
  step?: number
  default?: unknown
  options?: Array<{ value: string; label: string }>
}

export interface TransitionDefinition {
  kind: string
  label: string
  icon: string
  description: string
  rendererStatus: 'live' | 'placeholder'
  params: TransitionParamField[]
}

export const TRANSITIONS: TransitionDefinition[] = [
  { kind: 'cut', label: 'Cut', icon: '✂️', description: 'Azonnali váltás', rendererStatus: 'live', params: [] },
  {
    kind: 'fade',
    label: 'Fade',
    icon: '🌗',
    description: 'Crossfade (opacity ramp)',
    rendererStatus: 'live',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 3, step: 0.1, default: 0.4 }],
  },
  {
    kind: 'fade_to_black',
    label: 'Fade to black',
    icon: '⚫',
    description: 'Kifade fekete → befade',
    rendererStatus: 'placeholder',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.2, max: 3, step: 0.1, default: 0.6 }],
  },
  {
    kind: 'slide',
    label: 'Slide',
    icon: '➡️',
    description: 'Bejön egyik irányból (translate)',
    rendererStatus: 'live',
    params: [
      {
        key: 'from',
        label: 'Honnan',
        kind: 'select',
        options: [
          { value: 'left', label: 'Balról' },
          { value: 'right', label: 'Jobbról' },
          { value: 'top', label: 'Felülről' },
          { value: 'bottom', label: 'Alulról' },
        ],
        default: 'left',
      },
      { key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 },
    ],
  },
  {
    kind: 'wipe',
    label: 'Wipe',
    icon: '🧹',
    description: 'Lineáris törlés',
    rendererStatus: 'placeholder',
    params: [
      {
        key: 'direction',
        label: 'Irány',
        kind: 'select',
        options: [
          { value: 'left', label: 'Balról' },
          { value: 'right', label: 'Jobbról' },
          { value: 'top', label: 'Felülről' },
          { value: 'bottom', label: 'Alulról' },
        ],
        default: 'left',
      },
      { key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 },
    ],
  },
  {
    kind: 'zoom_in',
    label: 'Zoom in',
    icon: '🔍',
    description: 'Bezúmolás (kicsiből → teljes)',
    rendererStatus: 'live',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 }],
  },
  {
    kind: 'zoom_out',
    label: 'Zoom out',
    icon: '🔎',
    description: 'Kizúmolás (nagyból → teljes)',
    rendererStatus: 'live',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 }],
  },
  {
    kind: 'blur_in',
    label: 'Blur in',
    icon: '😵',
    description: 'Életlenből élesbe',
    rendererStatus: 'live',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 }],
  },
  {
    kind: 'blur_out',
    label: 'Blur out',
    icon: '😶',
    description: 'Élesből életlenbe',
    rendererStatus: 'live',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 }],
  },
  {
    kind: 'dissolve',
    label: 'Dissolve',
    icon: '🌫️',
    description: 'Egyszerűsítve fade-ként',
    rendererStatus: 'placeholder',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 2, step: 0.1, default: 0.5 }],
  },
]

export const TRANSITIONS_BY_KIND: Record<string, TransitionDefinition> = Object.fromEntries(
  TRANSITIONS.map((t) => [t.kind, t]),
)

export function buildDefaultTransition(def: TransitionDefinition): Transition {
  const t: Transition = { kind: def.kind }
  for (const p of def.params) {
    if (p.default !== undefined) (t as any)[p.key] = p.default
  }
  return t
}
