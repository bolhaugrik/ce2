import type { BundleInstance, Clip } from '@ce2/core'

export interface PresetDef {
  kind: string
  category: 'atomic' | 'compound'
  label: string
  icon: string
  description: string
  emit(clipId: string): { clips: Clip[]; bundle?: BundleInstance }
}

function baseClip(id: string, overrides: Partial<Clip>): Clip {
  return {
    id,
    layer: 'vector',
    source: { kind: 'text', payload: { content: 'New text', font_size: 32, color: '#ffffff', text_align: 'center' } },
    start: { kind: 'moment_start' },
    duration: { kind: 'fixed_sec', value: 3 },
    ...overrides,
  } as Clip
}

export const PRESETS: PresetDef[] = [
  // ── Atomic ──────────────────────────────────────────────────────────────────

  {
    kind: 'text',
    category: 'atomic',
    label: 'Text',
    icon: '✏️',
    description: 'Animated text overlay with fade-in',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'vector',
        source: {
          kind: 'text',
          payload: {
            content: 'New text',
            font_size: 48,
            color: '#ffffff',
            text_align: 'center',
            position: { anchor: 'center' },
          },
        },
        start: { kind: 'moment_start' },
        duration: { kind: 'fixed_sec', value: 3 },
        in_transition: { kind: 'fade', duration_sec: 0.4 },
      })],
    }),
  },

  {
    kind: 'image',
    category: 'atomic',
    label: 'Image',
    icon: '🖼',
    description: 'Static image asset',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'pixel',
        source: { kind: 'asset', asset_id: '' },
        start: { kind: 'moment_start' },
        duration: { kind: 'until_moment_end' },
      })],
    }),
  },

  {
    kind: 'video',
    category: 'atomic',
    label: 'Video',
    icon: '📹',
    description: 'Video asset clip',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'video',
        source: { kind: 'asset', asset_id: '' },
        start: { kind: 'moment_start' },
        duration: { kind: 'matches_source' },
      })],
    }),
  },

  {
    kind: 'music',
    category: 'atomic',
    label: 'Music',
    icon: '🎵',
    description: 'Background music track (spanning)',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'music',
        source: { kind: 'asset', asset_id: '' },
        start: { kind: 'moment_start' },
        duration: { kind: 'matches_source' },
        volume: 0.4,
      })],
    }),
  },

  {
    kind: 'narration',
    category: 'atomic',
    label: 'Narration',
    icon: '🎤',
    description: 'Text-to-speech narration clip',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'narration',
        source: { kind: 'tts', text: 'Enter narration text', voice_id: 'default' },
        start: { kind: 'moment_start' },
        duration: { kind: 'matches_source' },
      })],
    }),
  },

  {
    kind: 'sfx',
    category: 'atomic',
    label: 'SFX',
    icon: '🔊',
    description: 'Sound effect asset',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'sfx',
        source: { kind: 'asset', asset_id: '' },
        start: { kind: 'moment_start' },
        duration: { kind: 'matches_source' },
      })],
    }),
  },

  {
    kind: 'shape_rect',
    category: 'atomic',
    label: 'Rectangle',
    icon: '▭',
    description: 'Filled rectangle shape',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'vector',
        source: {
          kind: 'shape',
          shape: 'rect',
          geom: { width: 200, height: 200, x: 0, y: 0, rx: 0, fill: 'rgba(99,102,241,0.8)', stroke: 'none', strokeWidth: 0 },
        },
        start: { kind: 'moment_start' },
        duration: { kind: 'fixed_sec', value: 3 },
      })],
    }),
  },

  {
    kind: 'shape_circle',
    category: 'atomic',
    label: 'Circle',
    icon: '⭕',
    description: 'Filled circle shape',
    emit: (clipId) => ({
      clips: [baseClip(clipId, {
        layer: 'vector',
        source: {
          kind: 'shape',
          shape: 'circle',
          geom: { r: 100, cx: 0, cy: 0, fill: 'rgba(99,102,241,0.8)', stroke: 'none', strokeWidth: 0 },
        },
        start: { kind: 'moment_start' },
        duration: { kind: 'fixed_sec', value: 3 },
      })],
    }),
  },

  // ── Compound ─────────────────────────────────────────────────────────────────

  {
    kind: 'countdown',
    category: 'compound',
    label: 'Countdown',
    icon: '⏱',
    description: 'Animated countdown 5→0 with audio ticks',
    emit: (clipId) => {
      const bundleId = `bundle_${clipId}`
      const clips: Clip[] = [
        {
          id: `${clipId}_visual`,
          layer: 'vector',
          source: {
            kind: 'computed',
            logic_id: 'countdown_visual',
            inputs: { from_number: 5, to_number: 0, format: 'integer' },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 5 },
          bundle_id: bundleId,
          bundle_role: 'visual',
        },
        {
          id: `${clipId}_audio`,
          layer: 'sfx',
          source: {
            kind: 'computed',
            logic_id: 'countdown_audio',
            inputs: {},
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 5 },
          bundle_id: bundleId,
          bundle_role: 'audio',
        },
      ]
      const bundle: BundleInstance = {
        id: bundleId,
        kind: 'countdown',
        version: 1,
        inputs: { from_number: 5, to_number: 0 },
        exposes: {
          editable_layers: [`${clipId}_visual`],
          locked_layers: [`${clipId}_audio`],
          timing_hooks: [],
        },
        meta: { source: 'preset_emit' },
      }
      return { clips, bundle }
    },
  },

  {
    kind: 'cta_pulse',
    category: 'compound',
    label: 'CTA Pulse',
    icon: '💥',
    description: 'Call-to-action text with pulsing circle background',
    emit: (clipId) => {
      const bundleId = `bundle_${clipId}`
      const clips: Clip[] = [
        {
          id: `${clipId}_bg`,
          layer: 'vector',
          source: {
            kind: 'shape',
            shape: 'circle',
            geom: { r: 120, cx: 0, cy: 0, fill: 'rgba(99,102,241,0.8)', stroke: 'none', strokeWidth: 0 },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.12, period_sec: 1.0 }],
          bundle_id: bundleId,
          bundle_role: 'bg',
        },
        {
          id: `${clipId}_text`,
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Click Now',
              font_size: 36,
              font_weight: '700',
              color: '#ffffff',
              text_align: 'center',
              position: { anchor: 'center' },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          bundle_id: bundleId,
          bundle_role: 'text',
        },
        {
          id: `${clipId}_sfx`,
          layer: 'sfx',
          source: { kind: 'asset', asset_id: '' },
          start: { kind: 'moment_start' },
          duration: { kind: 'matches_source' },
          bundle_id: bundleId,
          bundle_role: 'sfx',
        },
      ]
      const bundle: BundleInstance = {
        id: bundleId,
        kind: 'cta_pulse',
        version: 1,
        inputs: {},
        exposes: {
          editable_layers: [`${clipId}_text`, `${clipId}_bg`],
          locked_layers: [],
          timing_hooks: [],
        },
        meta: { source: 'preset_emit' },
      }
      return { clips, bundle }
    },
  },

  {
    kind: 'text_sequence',
    category: 'compound',
    label: 'Text Sequence',
    icon: '📝',
    description: 'Three text clips appearing one after another',
    emit: (clipId) => {
      const bundleId = `bundle_${clipId}`
      const texts = ['First line', 'Second line', 'Third line']
      const clips: Clip[] = texts.map((content, i) => ({
        id: `${clipId}_t${i + 1}`,
        layer: 'vector' as const,
        source: {
          kind: 'text' as const,
          payload: {
            content,
            font_size: 40,
            color: '#ffffff',
            text_align: 'center' as const,
            position: { anchor: 'center' as const },
          },
        },
        start: i === 0
          ? { kind: 'moment_start' as const }
          : { kind: 'after_previous' as const, offset_sec: 0.5 },
        duration: { kind: 'fixed_sec' as const, value: 2 },
        in_transition: { kind: 'fade', duration_sec: 0.3 },
        bundle_id: bundleId,
        bundle_role: `text_${i + 1}`,
      }))
      const bundle: BundleInstance = {
        id: bundleId,
        kind: 'text_sequence',
        version: 1,
        inputs: {},
        exposes: {
          editable_layers: clips.map(c => c.id),
          locked_layers: [],
          timing_hooks: [],
        },
        meta: { source: 'preset_emit' },
      }
      return { clips, bundle }
    },
  },
]

export const ATOMIC_PRESETS   = PRESETS.filter(p => p.category === 'atomic')
export const COMPOUND_PRESETS = PRESETS.filter(p => p.category === 'compound')
