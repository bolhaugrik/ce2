/**
 * ZAVA CE2 composition — "Zava.hu webáruház bérlés — Pilot program"
 * Converted to OSS format:
 *   - asset URLs → local /assets/
 *   - shape geom: ZAVA {color, size_pct} → OSS absolute px
 *   - audio.fade_in/out effects removed (no-op in browser)
 *   - audio_link fields removed
 *   - Text fields left in ZAVA format — TextElement handles both formats natively
 */
import type { CE2Composition } from '@ce2/core'

export const ZAVA_PROMO: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30, title: 'Zava.hu webáruház bérlés — Pilot program' },
  globals: { background_color: '#0a0e27' },
  audio_pool: [],

  assets: [
    { id: 'music_1777872330095_mp3', kind: 'audio', url: '/assets/music.mp3', duration_sec: 150 },
    { id: '21274316_mp4',            kind: 'video', url: '/assets/video.mp4', duration_sec: 27 },
  ],

  bundles: [
    {
      id: 'bundle_cd_1',
      kind: 'countdown',
      version: 1,
      inputs: { from_number: 196, to_number: 0, format: 'integer', color: '#90d4fe', font_size_pct: 17 },
      exposes: { editable_layers: ['countdown.visual'], timing_hooks: ['enter', 'exit'] },
      meta: { source: 'preset_emit' },
    },
  ],

  spanning_layers: [
    {
      id: 'music_bg',
      label: 'Háttérzene',
      layer: 'music',
      source: { kind: 'asset', asset_id: 'music_1777872330095_mp3' },
      start:    { kind: 'moment_start' },
      duration: { kind: 'until_anchor', anchor_ref: 'moment.m_cta.end' },
      volume: 0.9,
    },
    {
      id: 'vid_1',
      label: 'Videó háttér',
      layer: 'video',
      source: { kind: 'asset', asset_id: '21274316_mp4', trim: { in_sec: 0, out_sec: 27 } },
      start:    { kind: 'moment_start' },
      duration: { kind: 'until_anchor', anchor_ref: 'moment.m_cta.end' },
      opacity: 0.6,
      attached_effects: [{ kind: 'blur.gaussian', radius_px: 15 }],
    },
  ],

  moments: [
    {
      id: 'm_hook',
      label: 'Hook — kérdés',
      layers: [
        {
          id: 'txt_hook_q',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'WEBÁRUHÁZAT INDÍTANÁL?',
            font_family: 'Montserrat', font_weight: 800, font_size_pct: 5.5,
            color: '#ffffff', align: 'center', max_width_pct: 85,
            letter_spacing_em: 0.02, line_height: 1.25,
            position: { kind: 'preset', value: 'middle-center' },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 2.5 },
          attached_effects: [
            { kind: 'text.shadow', color: '#000000', offset_x: 0, offset_y: 3, blur_px: 10 } as any,
            { kind: 'motion.float', amplitude_px: 8, period_sec: 2 },
          ],
          in_transition:  { kind: 'fade', duration_sec: 0.3 },
          out_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        {
          id: 'txt_hook_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'De nem akarsz fejlesztőkre várni?',
            font_family: 'Inter', font_weight: 500, font_size_pct: 4.5,
            color: '#7dd3fc', align: 'center', max_width_pct: 80,
            position: { kind: 'xy', x_pct: 50, y_pct: 62 },
          } as any},
          start: { kind: 'after_previous', offset_sec: -1.5 },
          duration: { kind: 'fixed_sec', value: 1.5 },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
        },
      ],
    },

    {
      id: 'm_problem',
      label: 'Probléma',
      layers: [
        {
          id: 'txt_problem',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'Egy webshop fejlesztése',
            font_family: 'Inter', font_weight: 600, font_size_pct: 4.5,
            color: '#ffffff', align: 'center', max_width_pct: 85,
            position: { kind: 'xy', x_pct: 50, y_pct: 35 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
          out_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        {
          id: 'txt_problem_big',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'HÓNAPOK',
            font_family: 'Anton', font_weight: 900, font_size_pct: 9.5,
            color: '#ef4444', align: 'center', letter_spacing_em: 0.05,
            position: { kind: 'preset', value: 'middle-center' },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          attached_effects: [
            { kind: 'motion.shake', intensity_px: 3, speed: 'normal' },
            { kind: 'text.shadow', color: '#000000', offset_x: 4, offset_y: 4, blur_px: 8 } as any,
          ],
          in_transition:  { kind: 'zoom_in',  duration_sec: 0.4 },
          out_transition: { kind: 'fade',     duration_sec: 0.3 },
        },
        {
          id: 'txt_problem_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'és milliós költség...',
            font_family: 'Inter', font_weight: 500, font_style: 'italic', font_size_pct: 4.5,
            color: '#fca5a5', align: 'center',
            position: { kind: 'xy', x_pct: 50, y_pct: 68 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          in_transition: { kind: 'slide', from: 'bottom', duration_sec: 0.4 } as any,
        },
      ],
    },

    {
      id: 'm_solution',
      label: 'Megoldás — Zava',
      layers: [
        {
          id: 'txt_solution_label',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'VAN EGY JOBB ÚT',
            font_family: 'Inter', font_weight: 700, font_size_pct: 3.5,
            color: '#7dd3fc', align: 'center', letter_spacing_em: 0.2,
            position: { kind: 'xy', x_pct: 50, y_pct: 28 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        {
          id: 'txt_brand',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'zava.hu',
            font_family: 'Montserrat', font_weight: 900, font_size_pct: 10.5,
            color: '#ffffff', align: 'center', letter_spacing_em: -0.02,
            position: { kind: 'preset', value: 'middle-center' },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          attached_effects: [{ kind: 'text.neon', glow_color: '#7dd3fc', glow_size_px: 25, intensity: 1.2 } as any],
          in_transition:  { kind: 'blur_in',  duration_sec: 0.5 },
          out_transition: { kind: 'zoom_out', duration_sec: 0.5 },
        },
        {
          id: 'txt_brand_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'Webáruház bérlés havi díjért',
            font_family: 'Inter', font_weight: 500, font_size_pct: 5,
            color: '#e0e7ff', align: 'center', max_width_pct: 100,
            text_transform: 'uppercase',
            position: { kind: 'xy', x_pct: 50, y_pct: 65 },
          } as any},
          start: { kind: 'after_previous', offset_sec: -3 },
          duration: { kind: 'fixed_sec', value: 3 },
          in_transition:  { kind: 'zoom_in',  duration_sec: 0.5 },
          out_transition: { kind: 'zoom_out', duration_sec: 0.5 },
        },
      ],
    },

    {
      id: 'm_benefits',
      label: 'Előnyök',
      layers: [
        {
          id: 'txt_benefits_title',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'MIÉRT ÉRI MEG?',
            font_family: 'Montserrat', font_weight: 800, font_size_pct: 4.5,
            color: '#fbbf24', align: 'center', letter_spacing_em: 0.05,
            position: { kind: 'xy', x_pct: 50, y_pct: 18 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 5 },
          in_transition:  { kind: 'fade', duration_sec: 0.3 },
          out_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        ...[
          { id: 'txt_b1', text: '✓ Indulás 24 óra alatt',       y_pct: 38, offset: 0 },
          { id: 'txt_b2', text: '✓ Nincs fejlesztési költség',   y_pct: 45, offset: 1 },
          { id: 'txt_b3', text: '✓ Folyamatos támogatás',        y_pct: 52, offset: 2 },
          { id: 'txt_b4', text: '✓ Skálázható megoldás',         y_pct: 59, offset: 3 },
        ].map(({ id, text, y_pct, offset }) => ({
          id,
          layer: 'vector' as const,
          source: { kind: 'text' as const, payload: {
            text, font_family: 'Inter', font_weight: 600, font_size_pct: 3,
            color: '#ffffff', align: 'left', max_width_pct: 80,
            position: { kind: 'xy', x_pct: 20, y_pct },
          } as any},
          start: { kind: 'anchor' as const, anchor_ref: 'moment.m_benefits.start', offset_sec: offset },
          duration: { kind: 'until_anchor' as const, anchor_ref: 'moment.m_benefits.end' },
          in_transition: { kind: 'slide', from: 'left', duration_sec: 0.4 } as any,
        })),
      ],
    },

    {
      id: 'm_pilot',
      label: 'Pilot program',
      layers: [
        {
          id: 'shape_pilot_bg',
          layer: 'vector',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 1080, height: 1920, fill: '#fbbf24' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          opacity: 0.6,
          z_within_layer: 2,
          in_transition:  { kind: 'fade', duration_sec: 0.3 },
          out_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        {
          id: 'txt_pilot_label',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'PILOT PROGRAM',
            font_family: 'Anton', font_weight: 900, font_size_pct: 5,
            color: '#0a0e27', align: 'center', letter_spacing_em: 0.1,
            position: { kind: 'xy', x_pct: 50, y_pct: 25 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          z_within_layer: 2,
          in_transition: { kind: 'slide', from: 'top', duration_sec: 0.4 } as any,
        },
        {
          id: 'txt_pilot_main',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'Csak az első\n20 partner!',
            font_family: 'Montserrat', font_weight: 900, font_size_pct: 6.5,
            color: '#0a0e27', align: 'center', line_height: 1.1,
            position: { kind: 'preset', value: 'middle-center' },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          z_within_layer: 2,
          attached_effects: [{ kind: 'motion.pulse', scale_min: 0.97, scale_max: 1.04, period_sec: 0.9 } as any],
          in_transition: { kind: 'zoom_in', duration_sec: 0.5 },
        },
        {
          id: 'txt_pilot_offer',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'Kedvezményes havi díj + ingyenes beüzemelés',
            font_family: 'Inter', font_weight: 600, font_size_pct: 3.5,
            color: '#0a0e27', align: 'center', max_width_pct: 88,
            position: { kind: 'xy', x_pct: 50, y_pct: 78 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          z_within_layer: 2,
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        {
          id: 'cd_vis_2',
          layer: 'vector',
          bundle_id: 'bundle_cd_1',
          bundle_role: 'countdown.visual',
          source: { kind: 'computed', logic_id: 'countdown_visual', inputs: {} },
          start:    { kind: 'moment_start' },
          duration: { kind: 'until_anchor', anchor_ref: 'moment.m_pilot.end' },
          opacity: 0.4,
          z_within_layer: 1,
          in_transition:  { kind: 'fade', duration_sec: 0.3 },
          out_transition: { kind: 'fade', duration_sec: 0.3 },
          attached_effects: [
            { kind: 'motion.pulse',  scale_min: 0.95, scale_max: 1.81, period_sec: 1 } as any,
            { kind: 'motion.shake',  intensity_px: 27, speed: 'fast' },
          ],
        },
      ],
    },

    {
      id: 'm_cta',
      label: 'CTA — Jelentkezés',
      layers: [
        {
          id: 'txt_cta_top',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'JELENTKEZZ MOST!',
            font_family: 'Anton', font_weight: 900, font_size_pct: 8,
            color: '#fbbf24', align: 'center', letter_spacing_em: 0.05,
            position: { kind: 'xy', x_pct: 50, y_pct: 38 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          attached_effects: [
            { kind: 'motion.pulse', scale_min: 0.96, scale_max: 1.06, period_sec: 0.7 } as any,
            { kind: 'text.shadow', color: '#000000', offset_x: 0, offset_y: 4, blur_px: 12 } as any,
          ],
          in_transition:  { kind: 'zoom_in', duration_sec: 0.4 },
          out_transition: { kind: 'fade',    duration_sec: 0.4 },
        },
        {
          id: 'txt_cta_url',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'zava.hu/pilot',
            font_family: 'Montserrat', font_weight: 700, font_size_pct: 6,
            color: '#ffffff', align: 'center', letter_spacing_em: 0.05,
            position: { kind: 'xy', x_pct: 50, y_pct: 58 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          attached_effects: [{ kind: 'text.neon', glow_color: '#7dd3fc', glow_size_px: 18, intensity: 1 } as any],
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        {
          id: 'txt_cta_sub',
          layer: 'vector',
          source: { kind: 'text', payload: {
            text: 'Korlátozott helyek\nne maradj le!',
            font_family: 'Inter', font_weight: 500, font_style: 'italic', font_size_pct: 4.5,
            color: '#fca5a5', align: 'center',
            position: { kind: 'xy', x_pct: 50, y_pct: 72 },
          } as any},
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          in_transition: { kind: 'fade', duration_sec: 0.5 },
        },
      ],
    },
  ],
} as CE2Composition
