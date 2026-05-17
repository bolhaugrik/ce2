/**
 * CE2 — Look-presetek.
 *
 * Curated effekt-stack-ek 1-click-re.
 */
import type { Effect } from '@ce2/core'

export interface LookPreset {
  kind: string
  label: string
  icon: string
  description: string
  stack: Effect[]
}

export const LOOK_PRESETS: LookPreset[] = [
  {
    kind: 'look.cinematic',
    label: 'Cinematic',
    icon: '🎬',
    description: 'Mozis, prémium hangulat',
    stack: [
      { kind: 'filter.cinematic', strength: 0.7 } as Effect,
      { kind: 'vignette', strength: 0.4 } as Effect,
      { kind: 'color.contrast', value: 0.15 } as Effect,
    ],
  },
  {
    kind: 'look.high_energy',
    label: 'High Energy',
    icon: '⚡',
    description: 'Gyors, dinamikus reklám',
    stack: [
      { kind: 'color.saturate', value: 1.3 } as Effect,
      { kind: 'color.contrast', value: 0.2 } as Effect,
      { kind: 'motion.shake', intensity_px: 2, frequency: 18 } as Effect,
    ],
  },
  {
    kind: 'look.minimal_clean',
    label: 'Minimal Clean',
    icon: '✨',
    description: 'Tiszta, letisztult',
    stack: [
      { kind: 'color.saturate', value: 0.85 } as Effect,
      { kind: 'vignette', strength: 0.15 } as Effect,
    ],
  },
  {
    kind: 'look.vintage_film',
    label: 'Vintage',
    icon: '📽️',
    description: 'Retro / nosztalgikus',
    stack: [
      { kind: 'color.saturate', value: 0.7 } as Effect,
      { kind: 'color.brightness', value: -0.05 } as Effect,
      { kind: 'vignette', strength: 0.5 } as Effect,
    ],
  },
  {
    kind: 'look.bw_classic',
    label: 'B&W Classic',
    icon: '🎞️',
    description: 'Fekete-fehér klasszikus',
    stack: [
      { kind: 'filter.grayscale', strength: 1 } as Effect,
      { kind: 'color.contrast', value: 0.2 } as Effect,
      { kind: 'vignette', strength: 0.5 } as Effect,
    ],
  },
]

export const LOOKS_BY_KIND: Record<string, LookPreset> = Object.fromEntries(
  LOOK_PRESETS.map((l) => [l.kind, l]),
)
