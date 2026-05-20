import { parseSpatialAnchor, isAbsolutePosition, type SpatialAlign } from '@ce2/core'
import type { Clip } from '@ce2/core'
import type { BaseElement } from './elements/BaseElement.js'

interface ClipElement {
  clip: Clip
  element: BaseElement
}

/**
 * Resolves clip.position (AbsolutePosition | SpatialAnchorString | SpatialAnchor)
 * and applies absolute coordinates to each element.
 *
 * Call this after elements are appended to the canvas but before hiding them,
 * so getBoundingClientRect() returns real measurements.
 *
 * Two-pass layout:
 *   Pass 1 — apply { x, y } positions + switch SpatialAnchor clips to auto-sizing
 *   Pass 2 — measure ref rects, compute and apply SpatialAnchor positions
 */
export function resolveClipPositions(
  items: ClipElement[],
  canvas: HTMLElement,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const withPos = items.filter(({ clip }) => (clip as any).position != null)
  if (withPos.length === 0) return

  // Build name → element index for SpatialAnchor ref lookup
  const nameMap = new Map<string, BaseElement>()
  for (const { clip, element } of withPos) {
    const name = (clip as any).name as string | undefined
    if (name) nameMap.set(name, element)
  }
  // Also index all items (including those without position, so ref can point to any named clip)
  for (const { clip, element } of items) {
    const name = (clip as any).name as string | undefined
    if (name && !nameMap.has(name)) nameMap.set(name, element)
  }

  // ── Pass 1: absolute positions + pre-size SpatialAnchor clips ───────────────

  const spatialItems: ClipElement[] = []

  for (const item of withPos) {
    const pos = (item.clip as any).position
    if (isAbsolutePosition(pos)) {
      item.element.setAbsolutePosition(pos.x, pos.y)
    } else {
      // Switch to auto-sizing so getBoundingClientRect returns intrinsic size
      item.element.el.style.width  = 'auto'
      item.element.el.style.height = 'auto'
      spatialItems.push(item)
    }
  }

  if (spatialItems.length === 0) return

  // ── Pass 2: resolve SpatialAnchor (up to 3 sweeps for ref chains) ───────────

  const canvasRect = canvas.getBoundingClientRect()

  for (let sweep = 0; sweep < 3; sweep++) {
    for (const { clip, element } of spatialItems) {
      const pos = (clip as any).position
      const parsed = parseSpatialAnchor(pos)
      if (!parsed) continue

      // Reference rect (canvas-relative)
      const refRect = parsed.ref === 'screen'
        ? { left: 0, top: 0, width: canvasWidth, height: canvasHeight }
        : getCanvasRelativeRect(nameMap.get(parsed.ref)?.el, canvasRect)

      if (!refRect) continue  // ref not found or not measurable yet

      // Self intrinsic size
      const selfR = element.el.getBoundingClientRect()
      const selfW = selfR.width
      const selfH = selfR.height

      const { x, y } = alignPoint(refRect, selfW, selfH, parsed.align as SpatialAlign)
      element.setAbsolutePosition(
        x + (parsed.offset?.x ?? 0),
        y + (parsed.offset?.y ?? 0),
      )
    }
  }
}

// ── Geometry ─────────────────────────────────────────────────────────────────

function getCanvasRelativeRect(
  el: HTMLElement | undefined,
  canvasRect: DOMRect,
): { left: number; top: number; width: number; height: number } | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return {
    left:   r.left   - canvasRect.left,
    top:    r.top    - canvasRect.top,
    width:  r.width,
    height: r.height,
  }
}

function alignPoint(
  ref: { left: number; top: number; width: number; height: number },
  selfW: number,
  selfH: number,
  align: SpatialAlign,
): { x: number; y: number } {
  const { left: rl, top: rt, width: rw, height: rh } = ref
  const rcx = rl + rw / 2  // ref center x
  const rcy = rt + rh / 2  // ref center y

  switch (align) {
    // ── INSIDE (CSS background-position convention) ──────────────────────────
    // self placed inside the reference, aligned to the named edge/corner
    case 'top-left':      return { x: rl,              y: rt }
    case 'top-center':    return { x: rcx - selfW / 2, y: rt }
    case 'top-right':     return { x: rl + rw - selfW, y: rt }
    case 'bottom-left':   return { x: rl,              y: rt + rh - selfH }
    case 'bottom-center': return { x: rcx - selfW / 2, y: rt + rh - selfH }
    case 'bottom-right':  return { x: rl + rw - selfW, y: rt + rh - selfH }
    case 'inside-top':    return { x: rcx - selfW / 2, y: rt }
    case 'inside-bottom': return { x: rcx - selfW / 2, y: rt + rh - selfH }
    case 'inside-left':   return { x: rl,              y: rcy - selfH / 2 }
    case 'inside-right':  return { x: rl + rw - selfW, y: rcy - selfH / 2 }
    case 'center':        return { x: rcx - selfW / 2, y: rcy - selfH / 2 }

    // ── OUTSIDE (clip-to-clip use case) ─────────────────────────────────────
    // self placed outside the reference, edge-to-edge, centered
    case 'above':    return { x: rcx - selfW / 2, y: rt - selfH }
    case 'below':    return { x: rcx - selfW / 2, y: rt + rh }
    case 'left-of':  return { x: rl - selfW,      y: rcy - selfH / 2 }
    case 'right-of': return { x: rl + rw,         y: rcy - selfH / 2 }

    default:         return { x: rcx - selfW / 2, y: rcy - selfH / 2 }
  }
}
