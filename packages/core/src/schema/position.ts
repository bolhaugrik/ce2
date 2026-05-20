import { z } from 'zod'

// ─── SpatialAlign ─────────────────────────────────────────────────────────────

export const SPATIAL_ALIGNS = [
  // relative to reference — outside
  'above', 'below', 'left-of', 'right-of',
  // corners + edges of reference — outside aligned
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  // inside reference
  'inside-top', 'inside-bottom', 'inside-left', 'inside-right',
  // center of reference
  'center',
] as const

export type SpatialAlign = typeof SPATIAL_ALIGNS[number]

// ─── SpatialAnchor string shorthand ──────────────────────────────────────────
// Format: "<ref>.<align>"  e.g. "CTA.left-of" | "screen.bottom-center"
// "screen" is a built-in ref for the composition canvas.

const ALIGN_PATTERN = SPATIAL_ALIGNS.join('|')
const ANCHOR_STRING_RE = new RegExp(`^[\\w-]+\\.(${ALIGN_PATTERN})$`)

export const PositionAnchorStringSchema = z
  .string()
  .regex(ANCHOR_STRING_RE, {
    message: 'Position anchor must be "<ref>.<align>" e.g. "CTA.below" or "screen.top-center"',
  })

export type PositionAnchorString = z.infer<typeof PositionAnchorStringSchema>

// ─── Full SpatialAnchor form ──────────────────────────────────────────────────

export const SpatialAnchorSchema = z.object({
  anchor: PositionAnchorStringSchema,
  offset: z.object({ x: z.number(), y: z.number() }).optional(),
})

export type SpatialAnchor = z.infer<typeof SpatialAnchorSchema>

// ─── Position union ───────────────────────────────────────────────────────────

export const AbsolutePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type AbsolutePosition = z.infer<typeof AbsolutePositionSchema>

export const PositionSchema = z.union([
  AbsolutePositionSchema,         // { x: 100, y: 200 }
  PositionAnchorStringSchema,     // "CTA.below"
  SpatialAnchorSchema,            // { anchor: "CTA.below", offset: { x: 0, y: 12 } }
])

export type Position = z.infer<typeof PositionSchema>
