/**
 * CE2 — Effect registry.
 *
 * 18+ effekt 4 kategóriában. Minden effekt deklarálja a paraméter-mezőit
 * + default-okat + alkalmazási réteg-szűrőket.
 */
import type { Clip, Effect } from '@ce2/core'

export type EffectCategory = 'visual' | 'motion' | 'text' | 'audio'
export type LayerKind = Clip['layer']

export interface EffectParamField {
  key: string
  label: string
  kind: 'number' | 'color' | 'select'
  min?: number
  max?: number
  step?: number
  default?: unknown
  options?: Array<{ value: string; label: string }>
}

export interface EffectDefinition {
  kind: string
  category: EffectCategory
  label: string
  icon: string
  description: string
  params: EffectParamField[]
  applies_to: LayerKind[]
}

const EASING_OPTIONS = [
  { value: 'linear', label: 'Lineáris' },
  { value: 'ease-in', label: 'Lassan indul' },
  { value: 'ease-out', label: 'Lassan érkezik' },
  { value: 'ease-in-out', label: 'Smoothstep' },
  { value: 'back-out', label: 'Kilövés (céln túl, vissza)' },
  { value: 'back-in', label: 'Bedobás (vissza, lendülettel)' },
  { value: 'bounce-out', label: 'Visszapattan (bounce)' },
  { value: 'elastic-out', label: 'Rugalmas (elastic)' },
]

export const EFFECTS: EffectDefinition[] = [
  {
    kind: 'color.brightness',
    category: 'visual',
    label: 'Fényerő',
    icon: '☀️',
    description: 'Fényerő +/- (0 = neutral)',
    params: [{ key: 'value', label: 'Érték', kind: 'number', min: -1, max: 1, step: 0.05, default: 0 }],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'color.contrast',
    category: 'visual',
    label: 'Kontraszt',
    icon: '◐',
    description: 'Kontraszt +/-',
    params: [{ key: 'value', label: 'Érték', kind: 'number', min: -1, max: 1, step: 0.05, default: 0 }],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'color.saturate',
    category: 'visual',
    label: 'Telítettség',
    icon: '🌈',
    description: 'Telítettség (0 = b&w, 1 = neutral, 2 = telített)',
    params: [{ key: 'value', label: 'Érték', kind: 'number', min: 0, max: 2, step: 0.05, default: 1 }],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'color.tint',
    category: 'visual',
    label: 'Színes overlay',
    icon: '🎨',
    description: 'Színes átfedés',
    params: [
      { key: 'color', label: 'Szín', kind: 'color', default: '#ff8800' },
      { key: 'strength', label: 'Erősség', kind: 'number', min: 0, max: 1, step: 0.05, default: 0.3 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'filter.grayscale',
    category: 'visual',
    label: 'Fekete-fehér',
    icon: '⚫',
    description: 'Grayscale',
    params: [{ key: 'strength', label: 'Erősség', kind: 'number', min: 0, max: 1, step: 0.05, default: 1 }],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'filter.cinematic',
    category: 'visual',
    label: 'Cinematic',
    icon: '🎬',
    description: 'Mozis tónus preset',
    params: [{ key: 'strength', label: 'Erősség', kind: 'number', min: 0, max: 1, step: 0.05, default: 0.7 }],
    applies_to: ['video', 'pixel'],
  },
  {
    kind: 'blur.gaussian',
    category: 'visual',
    label: 'Elmosás',
    icon: '😵',
    description: 'Sima Gauss-elmosás',
    params: [{ key: 'radius_px', label: 'Sugár (px)', kind: 'number', min: 0, max: 40, step: 0.5, default: 4 }],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'vignette',
    category: 'visual',
    label: 'Vignette',
    icon: '⭕',
    description: 'Sötét keret',
    params: [{ key: 'strength', label: 'Erősség', kind: 'number', min: 0, max: 1, step: 0.05, default: 0.4 }],
    applies_to: ['video', 'pixel'],
  },
  {
    kind: 'glitch.pixelate',
    category: 'visual',
    label: 'Pixelizáció',
    icon: '⬛',
    description: 'Pixel-blokkok. Statikus vagy clip-időre animált.',
    params: [
      {
        key: 'animate',
        label: 'Animált',
        kind: 'select',
        options: [
          { value: 'false', label: 'Statikus' },
          { value: 'true', label: 'Animált (from → to)' },
        ],
        default: 'false',
      },
      { key: 'block_size_px', label: 'Block méret (px) — statikus', kind: 'number', min: 1, max: 30, step: 1, default: 6 },
      { key: 'from_block_size_px', label: 'Honnan block', kind: 'number', min: 1, max: 30, step: 1, default: 12 },
      { key: 'to_block_size_px', label: 'Hová block', kind: 'number', min: 1, max: 30, step: 1, default: 1 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.shake',
    category: 'motion',
    label: 'Rázás',
    icon: '🌀',
    description: 'Kamera-rázás',
    params: [
      { key: 'intensity_px', label: 'Intenzitás (px)', kind: 'number', min: 0, max: 30, step: 1, default: 4 },
      { key: 'frequency', label: 'Frekvencia', kind: 'number', min: 1, max: 30, step: 1, default: 12 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.move',
    category: 'motion',
    label: 'Mozgás A→B',
    icon: '➡️',
    description: 'Egyszeri irányított mozgás start → end pozícióra',
    params: [
      { key: 'from_x_pct', label: 'Honnan X (vw)', kind: 'number', min: -100, max: 100, step: 1, default: 0 },
      { key: 'from_y_pct', label: 'Honnan Y (vh)', kind: 'number', min: -100, max: 100, step: 1, default: 0 },
      { key: 'to_x_pct', label: 'Hová X (vw)', kind: 'number', min: -100, max: 100, step: 1, default: 0 },
      { key: 'to_y_pct', label: 'Hová Y (vh)', kind: 'number', min: -100, max: 100, step: 1, default: -20 },
      { key: 'easing', label: 'Görbe', kind: 'select', options: EASING_OPTIONS, default: 'ease-out' },
      { key: 'start_offset_sec', label: 'Késleltetés (s)', kind: 'number', min: 0, max: 30, step: 0.1, default: 0 },
      { key: 'duration_sec', label: 'Hossz (s, üres = clip teljes)', kind: 'number', min: 0.1, max: 30, step: 0.1, default: 1 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.zoom',
    category: 'motion',
    label: 'Zoom A→B',
    icon: '🔍',
    description: 'Egyszeri scale animáció start → end méretre',
    params: [
      { key: 'from_scale', label: 'Honnan skála', kind: 'number', min: 0.1, max: 5, step: 0.05, default: 1 },
      { key: 'to_scale', label: 'Hová skála', kind: 'number', min: 0.1, max: 5, step: 0.05, default: 1.5 },
      { key: 'easing', label: 'Görbe', kind: 'select', options: EASING_OPTIONS, default: 'ease-out' },
      { key: 'start_offset_sec', label: 'Késleltetés (s)', kind: 'number', min: 0, max: 30, step: 0.1, default: 0 },
      { key: 'duration_sec', label: 'Hossz (s, üres = clip teljes)', kind: 'number', min: 0.1, max: 30, step: 0.1, default: 1 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.pulse',
    category: 'motion',
    label: 'Pulse',
    icon: '💗',
    description: 'Méret-pulzálás',
    params: [
      { key: 'scale_min', label: 'Min skála', kind: 'number', min: 0.5, max: 1, step: 0.01, default: 0.95 },
      { key: 'scale_max', label: 'Max skála', kind: 'number', min: 1, max: 2, step: 0.01, default: 1.05 },
      { key: 'period_sec', label: 'Periódus (s)', kind: 'number', min: 0.2, max: 5, step: 0.1, default: 1 },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.float',
    category: 'motion',
    label: 'Lebegés',
    icon: '🎈',
    description: 'Lebegő mozgás',
    params: [
      { key: 'amplitude_px', label: 'Amplitúdó (px)', kind: 'number', min: 1, max: 50, step: 1, default: 8 },
      { key: 'period_sec', label: 'Periódus (s)', kind: 'number', min: 0.5, max: 10, step: 0.1, default: 2 },
      {
        key: 'axis',
        label: 'Tengely',
        kind: 'select',
        options: [
          { value: 'y', label: 'Függőleges' },
          { value: 'x', label: 'Vízszintes' },
          { value: 'both', label: 'Mindkettő' },
        ],
        default: 'y',
      },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'motion.spin',
    category: 'motion',
    label: 'Forgás',
    icon: '🔄',
    description: 'Folyamatos forgás',
    params: [
      { key: 'rpm', label: 'RPM', kind: 'number', min: 1, max: 120, step: 1, default: 30 },
      {
        key: 'direction',
        label: 'Irány',
        kind: 'select',
        options: [
          { value: 'cw', label: 'Óramutató szerint' },
          { value: 'ccw', label: 'Ellenkező' },
        ],
        default: 'cw',
      },
    ],
    applies_to: ['video', 'pixel', 'vector'],
  },
  {
    kind: 'text.typewriter',
    category: 'text',
    label: 'Gépelés',
    icon: '⌨️',
    description: 'Karakterenkénti megjelenés',
    params: [
      { key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.2, max: 5, step: 0.1, default: 1.5 },
    ],
    applies_to: ['vector'],
  },
  {
    kind: 'text.neon',
    category: 'text',
    label: 'Neon (glow)',
    icon: '💡',
    description: 'Többrétegű neon-glow a szöveg körül',
    params: [
      { key: 'glow_color', label: 'Glow szín', kind: 'color', default: '#00ffff' },
      { key: 'glow_size_px', label: 'Glow méret (px)', kind: 'number', min: 2, max: 60, step: 1, default: 12 },
      { key: 'intensity', label: 'Intenzitás', kind: 'number', min: 0.3, max: 3, step: 0.1, default: 1 },
    ],
    applies_to: ['vector'],
  },
  {
    kind: 'text.shadow',
    category: 'text',
    label: 'Árnyék',
    icon: '🌑',
    description: 'Eltolt árnyék blur + spread szabályozható',
    params: [
      { key: 'color', label: 'Szín', kind: 'color', default: '#000000' },
      { key: 'offset_x', label: 'Eltolás X (px)', kind: 'number', min: -30, max: 30, step: 1, default: 2 },
      { key: 'offset_y', label: 'Eltolás Y (px)', kind: 'number', min: -30, max: 30, step: 1, default: 2 },
      { key: 'blur_px', label: 'Blur (px)', kind: 'number', min: 0, max: 30, step: 1, default: 4 },
      { key: 'spread_px', label: 'Szórás / spread (px)', kind: 'number', min: 0, max: 30, step: 1, default: 0 },
    ],
    applies_to: ['vector'],
  },
  {
    kind: 'audio.fade_in',
    category: 'audio',
    label: 'Audio fade in',
    icon: '🔉',
    description: 'Hang fade in',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 5, step: 0.1, default: 0.5 }],
    applies_to: ['music', 'narration', 'sfx'],
  },
  {
    kind: 'audio.fade_out',
    category: 'audio',
    label: 'Audio fade out',
    icon: '🔈',
    description: 'Hang fade out',
    params: [{ key: 'duration_sec', label: 'Időtartam (s)', kind: 'number', min: 0.1, max: 5, step: 0.1, default: 0.5 }],
    applies_to: ['music', 'narration', 'sfx'],
  },
  {
    kind: 'audio.duck',
    category: 'audio',
    label: 'Audio duck',
    icon: '🦆',
    description: 'Halkítás másik clip alatt',
    params: [
      { key: 'level_db', label: 'Halkítás (dB)', kind: 'number', min: -30, max: 0, step: 1, default: -12 },
    ],
    applies_to: ['music'],
  },
]

export const EFFECTS_BY_KIND: Record<string, EffectDefinition> = Object.fromEntries(
  EFFECTS.map((e) => [e.kind, e]),
)

/** Alkalmazható effektek egy adott clip-rétegre. */
export function effectsForLayer(layer: LayerKind): EffectDefinition[] {
  return EFFECTS.filter((e) => e.applies_to.includes(layer))
}

/** Default-okkal feltöltött Effect objektum. */
export function buildDefaultEffect(def: EffectDefinition): Effect {
  const eff: Effect = { kind: def.kind }
  for (const p of def.params) {
    if (p.default !== undefined) (eff as any)[p.key] = p.default
  }
  return eff
}
