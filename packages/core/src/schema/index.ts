import { z } from 'zod'

// ─── Primitives ───────────────────────────────────────────────────────────────

export const TimeAnchorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('moment_start') }),
  z.object({ kind: z.literal('after_previous'), offset_sec: z.number().optional() }),
  z.object({
    kind: z.literal('anchor'),
    anchor_ref: z.string().min(1),
    offset_sec: z.number().optional(),
  }),
  z.object({ kind: z.literal('absolute_sec'), value: z.number().nonnegative() }),
])

export const DurationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixed_sec'), value: z.number().positive() }),
  z.object({ kind: z.literal('matches_source') }),
  z.object({
    kind: z.literal('until_anchor'),
    anchor_ref: z.string().min(1),
    offset_sec: z.number().optional(),
  }),
  z.object({ kind: z.literal('until_moment_end') }),
])

export const EffectSchema = z.object({ kind: z.string().min(1) }).passthrough()

export const TransitionSchema = z
  .object({
    kind: z.string().min(1),
    duration_sec: z.number().positive().optional(),
  })
  .passthrough()

// ─── TextPayload ──────────────────────────────────────────────────────────────

export const TextPayloadSchema = z.object({
  // OSS field: content. ZAVA alias: text. One of them must be present.
  content: z.string().optional(),
  text:    z.string().optional(),   // ZAVA compat alias
  font_size:       z.number().positive().optional(),
  font_size_pct:   z.number().positive().optional(), // ZAVA compat
  font_family:     z.string().optional(),
  font_weight:     z.union([z.string(), z.number()]).optional(),
  font_style:      z.enum(['normal', 'italic']).optional(),
  color:           z.string().optional(),
  text_align:      z.enum(['left', 'center', 'right']).optional(),
  align:           z.enum(['left', 'center', 'right']).optional(), // ZAVA compat
  line_height:     z.number().positive().optional(),
  letter_spacing:  z.number().optional(),
  letter_spacing_em: z.number().optional(), // ZAVA compat
  text_transform:  z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
  max_width_pct:   z.number().optional(), // ZAVA compat
  lines:           z.array(z.string()).optional(), // ZAVA compat
  position:        z.record(z.unknown()).optional(), // accept both OSS and ZAVA position formats
}).passthrough()

// ─── AudioMarker (CE2.16d) ────────────────────────────────────────────────────

export const AudioMarkerSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['point', 'region']),
  label: z.string().optional(),
  time_sec: z.number().nonnegative(),
  end_sec: z.number().positive().optional(),
})

// ─── ClipSource ───────────────────────────────────────────────────────────────

export const ClipSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('asset'),
    asset_id: z.string().min(1),
    trim: z
      .object({ in_sec: z.number().nonnegative(), out_sec: z.number().positive() })
      .optional(),
  }),
  z.object({
    kind: z.literal('tts'),
    text: z.string().min(1),
    voice_id: z.string().min(1),
    lang: z.string().optional(),
  }),
  z.object({
    kind: z.literal('text'),
    payload: TextPayloadSchema,
  }),
  z.object({
    kind: z.literal('svg'),
    payload: z.string().min(1),
  }),
  z.object({
    kind: z.literal('shape'),
    shape: z.enum(['rect', 'circle', 'line']),
    geom: z.record(z.unknown()),
  }),
  z.object({
    kind: z.literal('computed'),
    logic_id: z.string().min(1),
    inputs: z.record(z.unknown()),
    inputs_from_bundle: z.array(z.string()).optional(),
  }),
])

// ─── Clip ─────────────────────────────────────────────────────────────────────

export const ClipSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  layer: z.enum(['music', 'narration', 'sfx', 'video', 'pixel', 'vector']),
  source: ClipSourceSchema,
  start: TimeAnchorSchema,
  duration: DurationSchema,
  z_within_layer: z.number().optional(),
  bundle_id: z.string().optional(),
  bundle_role: z.string().optional(),
  attached_effects: z.array(EffectSchema).optional(),
  publish_anchors: z.array(z.string()).optional(),
  in_transition: TransitionSchema.optional(),
  out_transition: TransitionSchema.optional(),
  blend_mode: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  opacity_from_bundle: z.string().optional(),
  muted: z.boolean().optional(),
  volume: z.number().min(0).max(2).optional(),
  audio_markers: z.array(AudioMarkerSchema).optional(),
})

// ─── Moment ───────────────────────────────────────────────────────────────────

export const MomentSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  transition_in: TransitionSchema.optional(),
  layers: z.array(ClipSchema),
})

// ─── Bundle ───────────────────────────────────────────────────────────────────

export const BundleInstanceSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  version: z.number().int().positive(),
  inputs: z.record(z.unknown()),
  exposes: z.object({
    editable_layers: z.array(z.string()),
    locked_layers: z.array(z.string()).optional(),
    timing_hooks: z.array(z.string()),
  }),
  meta: z
    .object({
      created_at: z.string().optional(),
      source: z.enum(['user', 'ai', 'preset_emit', 'imported']).optional(),
    })
    .optional(),
})

// ─── Asset ────────────────────────────────────────────────────────────────────

export const AssetRefSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['video', 'image', 'audio', 'font']),
  url: z.string().min(1),
  duration_sec: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
})

// ─── Composition ─────────────────────────────────────────────────────────────

export const CE2CompositionSchema = z.object({
  schema_version: z.literal('2.0'),
  meta: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    fps: z.number().positive(),
    title: z.string().optional(),
  }),
  globals: z
    .object({
      background_color: z.string().optional(),
      base_font: z.string().optional(),
      base_voice_id: z.string().optional(),
      base_music_volume: z.number().min(0).max(2).optional(),
    })
    .passthrough()
    .default({}),
  spanning_layers: z.array(ClipSchema).default([]),
  moments: z.array(MomentSchema).min(1),
  bundles: z.array(BundleInstanceSchema).default([]),
  assets: z.array(AssetRefSchema).default([]),
  // Optional ZAVA-compatibility fields — preserved but not required
  audio_pool: z.array(z.record(z.unknown())).default([]).optional(),
}).passthrough()  // preserve any extra fields from ZAVA or future versions

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type TimeAnchor    = z.infer<typeof TimeAnchorSchema>
export type Duration      = z.infer<typeof DurationSchema>
export type Effect        = z.infer<typeof EffectSchema>
export type Transition    = z.infer<typeof TransitionSchema>
export type TextPayload   = z.infer<typeof TextPayloadSchema>
export type AudioMarker   = z.infer<typeof AudioMarkerSchema>
export type ClipSource    = z.infer<typeof ClipSourceSchema>
export type Clip          = z.infer<typeof ClipSchema>
export type Moment        = z.infer<typeof MomentSchema>
export type BundleInstance = z.infer<typeof BundleInstanceSchema>
export type AssetRef      = z.infer<typeof AssetRefSchema>
export type CE2Composition = z.infer<typeof CE2CompositionSchema>
