import { describe, it, expect } from 'vitest'
import { parseSpatialAnchor, isSpatialAnchor, isAbsolutePosition } from '../resolver/parseSpatialAnchor.js'
import { validateComposition } from '../validation/validate.js'
import type { CE2Composition } from '../schema/index.js'

// ─── parseSpatialAnchor ────────────────────────────────────────────────────────

describe('parseSpatialAnchor', () => {
  it('parses string shorthand', () => {
    expect(parseSpatialAnchor('CTA.below')).toEqual({ ref: 'CTA', align: 'below' })
    expect(parseSpatialAnchor('screen.bottom-center')).toEqual({ ref: 'screen', align: 'bottom-center' })
    expect(parseSpatialAnchor('my-clip.left-of')).toEqual({ ref: 'my-clip', align: 'left-of' })
  })

  it('parses full SpatialAnchor object', () => {
    expect(parseSpatialAnchor({ anchor: 'CTA.above', offset: { x: 0, y: -8 } })).toEqual({
      ref: 'CTA', align: 'above', offset: { x: 0, y: -8 },
    })
    expect(parseSpatialAnchor({ anchor: 'screen.center' })).toEqual({ ref: 'screen', align: 'center' })
  })

  it('returns null for absolute position', () => {
    expect(parseSpatialAnchor({ x: 100, y: 200 })).toBeNull()
  })

  it('returns null for invalid align value', () => {
    expect(parseSpatialAnchor('CTA.diagonal' as any)).toBeNull()
  })

  it('returns null for missing dot separator', () => {
    expect(parseSpatialAnchor('CTAbelow' as any)).toBeNull()
  })
})

// ─── isSpatialAnchor / isAbsolutePosition ─────────────────────────────────────

describe('isSpatialAnchor', () => {
  it('returns true for string form', () => expect(isSpatialAnchor('CTA.below')).toBe(true))
  it('returns true for object form', () => expect(isSpatialAnchor({ anchor: 'screen.center' })).toBe(true))
  it('returns false for absolute', () => expect(isSpatialAnchor({ x: 0, y: 0 })).toBe(false))
})

describe('isAbsolutePosition', () => {
  it('returns true for { x, y }', () => expect(isAbsolutePosition({ x: 10, y: 20 })).toBe(true))
  it('returns false for string', () => expect(isAbsolutePosition('CTA.below' as any)).toBe(false))
})

// ─── Validation: SPATIAL_ANCHOR_REF ───────────────────────────────────────────

const baseComp = (): CE2Composition => ({
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30 },
  globals: {},
  spanning_layers: [],
  moments: [
    {
      id: 'm1',
      layers: [
        {
          id: 'title',
          name: 'title',
          layer: 'vector',
          source: { kind: 'text', payload: { content: 'Title' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          position: { x: 540, y: 200 },
        },
        {
          id: 'subtitle',
          layer: 'vector',
          source: { kind: 'text', payload: { content: 'Sub' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          position: 'title.below',
        },
      ],
    },
  ],
  bundles: [],
  assets: [],
})

describe('validateComposition — SpatialAnchor', () => {
  it('accepts valid spatial anchor ref by name', () => {
    const result = validateComposition(baseComp())
    expect(result.ok).toBe(true)
  })

  it('accepts "screen" as built-in ref', () => {
    const comp = baseComp()
    ;(comp.moments[0].layers[1] as any).position = 'screen.bottom-center'
    const result = validateComposition(comp)
    expect(result.ok).toBe(true)
  })

  it('accepts full SpatialAnchor object form', () => {
    const comp = baseComp()
    ;(comp.moments[0].layers[1] as any).position = { anchor: 'title.above', offset: { x: 0, y: -12 } }
    const result = validateComposition(comp)
    expect(result.ok).toBe(true)
  })

  it('rejects unknown ref name', () => {
    const comp = baseComp()
    ;(comp.moments[0].layers[1] as any).position = 'ghost.below'
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors[0].code).toBe('SPATIAL_ANCHOR_REF')
    expect(result.errors[0].message).toContain('"ghost"')
  })

  it('accepts clip with absolute position', () => {
    const comp = baseComp()
    ;(comp.moments[0].layers[1] as any).position = { x: 540, y: 600 }
    const result = validateComposition(comp)
    expect(result.ok).toBe(true)
  })
})
