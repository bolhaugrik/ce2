import type { SpatialAlign, SpatialAnchor, Position, AbsolutePosition } from '../schema/position.js'
import { SPATIAL_ALIGNS } from '../schema/position.js'

export interface ParsedSpatialAnchor {
  ref: string        // clip name or "screen"
  align: SpatialAlign
  offset?: { x: number, y: number }
}

/**
 * Parses a SpatialAnchor position into its ref + align + offset components.
 * Accepts all three Position forms:
 *   "CTA.left-of"
 *   { anchor: "screen.bottom-center", offset: { x: 0, y: -20 } }
 *   { x: 100, y: 200 }  → returns null (absolute position, not a spatial anchor)
 */
export function parseSpatialAnchor(position: Position): ParsedSpatialAnchor | null {
  if (typeof position === 'string') {
    return parseAnchorString(position)
  }

  if ('anchor' in position) {
    const parsed = parseAnchorString(position.anchor)
    if (!parsed) return null
    return { ...parsed, offset: position.offset }
  }

  // absolute { x, y } — not a spatial anchor
  return null
}

function parseAnchorString(str: string): ParsedSpatialAnchor | null {
  const lastDot = str.lastIndexOf('.')
  if (lastDot === -1) return null

  const ref = str.slice(0, lastDot)
  const align = str.slice(lastDot + 1) as SpatialAlign

  if (!ref || !(SPATIAL_ALIGNS as readonly string[]).includes(align)) return null

  return { ref, align }
}

/** Returns true if a Position value is a SpatialAnchor (string or object form). */
export function isSpatialAnchor(position: Position): boolean {
  return parseSpatialAnchor(position) !== null
}

/** Returns true if the position is absolute { x, y }. */
export function isAbsolutePosition(position: Position): position is AbsolutePosition {
  return typeof position === 'object' && 'x' in position && 'y' in position
}
