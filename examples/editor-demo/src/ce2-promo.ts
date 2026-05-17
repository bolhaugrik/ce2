import type { CE2Composition } from '@ce2/core'

/**
 * CE2 promotional composition — test case covering all clip types:
 * text, shape, tts (narration), asset (music/sfx), computed (countdown bundle),
 * spanning layers, bundles, effects, transitions, anchor-based timing.
 *
 * Canvas: 1080×1920 @30fps (TikTok/Reels vertical)
 */
export const CE2_PROMO: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30, title: 'CE2 — Build Once, Show Everywhere' },
  globals: { background_color: '#080810', base_music_volume: 0.25 },

  assets: [
    { id: 'bg_music', kind: 'audio', url: '/assets/bg_ambient.mp3', duration_sec: 60 },
    { id: 'tick_sfx', kind: 'audio', url: '/assets/tick.mp3',       duration_sec: 0.2 },
    { id: 'ding_sfx', kind: 'audio', url: '/assets/ding.mp3',       duration_sec: 0.5 },
  ],

  bundles: [
    {
      id: 'b_countdown',
      kind: 'countdown',
      version: 1,
      inputs: { from_number: 5, to_number: 0, format: 'integer', tick_enabled: true, opacity: 1.0 },
      exposes: {
        editable_layers: ['countdown.visual'],
        locked_layers:   ['countdown.tick'],
        timing_hooks:    ['enter', 'exit'],
      },
      meta: { source: 'preset_emit' },
    },
  ],

  // ── Spanning: background music throughout ───────────────────────────────────
  spanning_layers: [
    {
      id: 'bg_music_clip',
      layer: 'music',
      source: { kind: 'asset', asset_id: 'bg_music' },
      start:    { kind: 'moment_start' },
      duration: { kind: 'fixed_sec', value: 24 },
      volume: 0.25,
    },
  ],

  moments: [
    // ── M1: Hook (5s) ─────────────────────────────────────────────────────────
    {
      id: 'm_hook',
      label: 'Hook',
      layers: [
        {
          id: 'hook_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#080810' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
        },
        // Ambient glow circle — centered (540, 960)
        {
          id: 'hook_glow',
          layer: 'vector',
          source: { kind: 'shape', shape: 'circle', geom: { cx: 540, cy: 960, r: 480, fill: 'rgba(99,102,241,0.05)' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.18, period_sec: 3.5 }],
        },
        // CE2 main title
        {
          id: 'hook_title',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'CE2', font_size: 220, font_weight: '800',
            color: '#ffffff', text_align: 'center', letter_spacing: -10,
            position: { anchor: 'center', y: -300 },
          }},
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.6, easing: 'back-out' },
        },
        // Tagline
        {
          id: 'hook_tag',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Build Once.\nShow Everywhere.',
            font_size: 62, font_weight: '700', color: '#818cf8',
            text_align: 'center', line_height: 1.25,
            position: { anchor: 'center', y: -80 },
          }},
          start: { kind: 'anchor', anchor_ref: 'hook_title.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.6 },
        },
        // Description
        {
          id: 'hook_desc',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'The open-source composition language\nfor animated multimedia',
            font_size: 36, color: '#475569', text_align: 'center', line_height: 1.4,
            position: { anchor: 'center', y: 100 },
          }},
          start: { kind: 'anchor', anchor_ref: 'hook_tag.phase.static', offset_sec: 0.25 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.45 },
        },
        // MIT badge
        {
          id: 'hook_badge',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'v0.1.0 — MIT License',
            font_size: 28, color: '#a5b4fc', text_align: 'center',
            letter_spacing: 2, text_transform: 'uppercase',
            position: { anchor: 'center', y: 280 },
          }},
          start: { kind: 'anchor', anchor_ref: 'hook_desc.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        // TTS narration
        {
          id: 'hook_narr',
          layer: 'narration',
          source: { kind: 'tts', text: 'Meet CE2. The open source JSON composition language for video ads and animated content.', voice_id: 'en-us-1', lang: 'en' },
          start: { kind: 'anchor', anchor_ref: 'hook_tag.phase.static', offset_sec: 0.5 },
          duration: { kind: 'matches_source' },
          volume: 1.0,
        },
      ],
    },

    // ── M2: Core Concepts (5s) ────────────────────────────────────────────────
    {
      id: 'm_concepts',
      label: 'Core Concepts',
      transition_in: { kind: 'fade', duration_sec: 0.5 },
      layers: [
        {
          id: 'conc_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#060612' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
        },
        {
          id: 'conc_label',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'CORE CONCEPTS',
            font_size: 32, font_weight: '600', color: '#4f46e5',
            text_align: 'center', letter_spacing: 8, text_transform: 'uppercase',
            position: { anchor: 'top', y: 220 },
          }},
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        // Concept 1
        {
          id: 'conc_1',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: '◈  Moments',
            font_size: 70, font_weight: '700', color: '#e2e8f0',
            position: { anchor: 'top-left', x: 80, y: 400 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_label.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'conc_1d',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Sequential time units — like slides',
            font_size: 36, color: '#64748b',
            position: { anchor: 'top-left', x: 80, y: 498 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_1.phase.static', offset_sec: 0.08 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
        // Concept 2
        {
          id: 'conc_2',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: '⚓  Anchors',
            font_size: 70, font_weight: '700', color: '#e2e8f0',
            position: { anchor: 'top-left', x: 80, y: 660 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_1.start', offset_sec: 0.65 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'conc_2d',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Relational timing — no raw seconds',
            font_size: 36, color: '#64748b',
            position: { anchor: 'top-left', x: 80, y: 758 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_2.phase.static', offset_sec: 0.08 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
        // Concept 3
        {
          id: 'conc_3',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: '◉  Renderers',
            font_size: 70, font_weight: '700', color: '#e2e8f0',
            position: { anchor: 'top-left', x: 80, y: 920 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_2.start', offset_sec: 0.65 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'conc_3d',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Browser · MP4 · App — one JSON',
            font_size: 36, color: '#64748b',
            position: { anchor: 'top-left', x: 80, y: 1018 },
          }},
          start: { kind: 'anchor', anchor_ref: 'conc_3.phase.static', offset_sec: 0.08 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
      ],
    },

    // ── M3: For Developers (4s) ────────────────────────────────────────────────
    {
      id: 'm_dev',
      label: 'For Developers',
      transition_in: { kind: 'slide_left', duration_sec: 0.4 },
      layers: [
        {
          id: 'dev_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#07070f' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
        },
        // Code card background — centered: x=80, y=700, w=920, h=520
        {
          id: 'dev_card',
          layer: 'vector',
          source: { kind: 'shape', shape: 'rect', geom: {
            x: 80, y: 700, width: 920, height: 520,
            fill: 'rgba(12,12,28,0.95)', stroke: 'rgba(99,102,241,0.25)', strokeWidth: 2, rx: 24,
          }},
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.5 },
        },
        {
          id: 'dev_install',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'pnpm add @ce2/core',
            font_size: 46, font_weight: '600', color: '#22c55e',
            text_align: 'center', letter_spacing: -1,
            position: { anchor: 'center', y: -100 },
          }},
          start: { kind: 'anchor', anchor_ref: 'dev_card.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
          attached_effects: [{ kind: 'text.typewriter', chars_per_sec: 22 }],
        },
        {
          id: 'dev_import',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: "import { AnchorResolver,\n  validateComposition } from '@ce2/core'",
            font_size: 30, color: '#818cf8', text_align: 'center', line_height: 1.5,
            position: { anchor: 'center', y: 30 },
          }},
          start: { kind: 'anchor', anchor_ref: 'dev_install.phase.static', offset_sec: 0.3 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.5 },
        },
        {
          id: 'dev_packages',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: '@ce2/core   @ce2/browser   @ce2/editor',
            font_size: 34, color: '#475569', text_align: 'center', letter_spacing: 1,
            position: { anchor: 'center', y: 340 },
          }},
          start: { kind: 'anchor', anchor_ref: 'dev_import.phase.static', offset_sec: 0.4 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.4 },
        },
        {
          id: 'dev_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'TypeScript · MIT · Zero lock-in',
            font_size: 30, color: '#334155', text_align: 'center',
            position: { anchor: 'center', y: 420 },
          }},
          start: { kind: 'anchor', anchor_ref: 'dev_packages.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.35 },
        },
      ],
    },

    // ── M4: Countdown Bundle (4s) ─────────────────────────────────────────────
    {
      id: 'm_countdown',
      label: 'Countdown',
      transition_in: { kind: 'fade', duration_sec: 0.4 },
      layers: [
        {
          id: 'cd_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#05050f' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
        },
        {
          id: 'cd_glow',
          layer: 'vector',
          source: { kind: 'shape', shape: 'circle', geom: { cx: 540, cy: 960, r: 420, fill: 'rgba(99,102,241,0.07)' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.4, period_sec: 1.2 }],
        },
        {
          id: 'cd_label',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'SHIPPING IN',
            font_size: 44, font_weight: '600', color: '#475569',
            text_align: 'center', letter_spacing: 8, text_transform: 'uppercase',
            position: { anchor: 'center', y: -250 },
          }},
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        // Countdown bundle — visual (computed source)
        {
          id: 'cd_visual',
          layer: 'vector',
          bundle_id: 'b_countdown',
          bundle_role: 'countdown.visual',
          source: { kind: 'computed', logic_id: 'countdown_visual', inputs: { from_number: 5, to_number: 0, format: 'integer' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
        },
        // Countdown bundle — audio (sfx asset)
        {
          id: 'cd_tick',
          layer: 'sfx',
          bundle_id: 'b_countdown',
          bundle_role: 'countdown.tick',
          source: { kind: 'asset', asset_id: 'tick_sfx' },
          start: { kind: 'moment_start' }, duration: { kind: 'matches_source' },
          volume: 0.7,
        },
        {
          id: 'cd_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Version 1.0.0',
            font_size: 36, color: '#334155', text_align: 'center',
            position: { anchor: 'center', y: 260 },
          }},
          start: { kind: 'anchor', anchor_ref: 'cd_label.phase.static', offset_sec: 0.3 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
      ],
    },

    // ── M5: CTA (4s) ──────────────────────────────────────────────────────────
    {
      id: 'm_cta',
      label: 'CTA',
      transition_in: { kind: 'fade', duration_sec: 0.5 },
      layers: [
        {
          id: 'cta_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#06060f' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
        },
        {
          id: 'cta_glow',
          layer: 'vector',
          source: { kind: 'shape', shape: 'circle', geom: { cx: 540, cy: 960, r: 520, fill: 'rgba(99,102,241,0.06)' } },
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.25, period_sec: 2.2 }],
        },
        {
          id: 'cta_main',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Open Source',
            font_size: 104, font_weight: '800', color: '#818cf8',
            text_align: 'center', position: { anchor: 'center', y: -180 },
          }},
          start: { kind: 'moment_start' }, duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.6, easing: 'back-out' },
          attached_effects: [{ kind: 'text.neon', color: '#6366f1', intensity: 0.8 }],
        },
        {
          id: 'cta_mit',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'MIT License',
            font_size: 38, color: '#334155', text_align: 'center',
            letter_spacing: 5, text_transform: 'uppercase',
            position: { anchor: 'center', y: -30 },
          }},
          start: { kind: 'anchor', anchor_ref: 'cta_main.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        {
          id: 'cta_github',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'github.com/bolhaugrik/ce2',
            font_size: 40, color: '#4f46e5', text_align: 'center',
            position: { anchor: 'center', y: 120 },
          }},
          start: { kind: 'anchor', anchor_ref: 'cta_mit.phase.static', offset_sec: 0.15 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.5 },
        },
        {
          id: 'cta_start',
          layer: 'vector',
          source: { kind: 'text', payload: {
            content: 'Start building today ↗',
            font_size: 36, color: '#818cf8', text_align: 'center',
            position: { anchor: 'center', y: 260 },
          }},
          start: { kind: 'anchor', anchor_ref: 'cta_github.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
          attached_effects: [{ kind: 'motion.float', amplitude_px: 8, period_sec: 2.5 }],
        },
        // Ding SFX on CTA reveal
        {
          id: 'cta_ding',
          layer: 'sfx',
          source: { kind: 'asset', asset_id: 'ding_sfx' },
          start: { kind: 'anchor', anchor_ref: 'cta_main.phase.static' },
          duration: { kind: 'matches_source' },
          volume: 0.8,
        },
      ],
    },
  ],
}
