import { describe, it, expect } from 'vitest'
import { validateComposition } from '../validation/validate.js'
import type { CE2Composition } from '../schema/index.js'

const VALID: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30 },
  globals: {},
  spanning_layers: [],
  moments: [
    {
      id: 'm1',
      layers: [
        {
          id: 'c1',
          layer: 'vector',
          source: { kind: 'text', payload: { content: 'Hello' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
        },
      ],
    },
  ],
  bundles: [],
  assets: [],
}

describe('validateComposition', () => {
  it('accepts a valid composition', () => {
    const result = validateComposition(VALID)
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing schema_version', () => {
    const { schema_version: _, ...bad } = VALID as any
    const result = validateComposition(bad)
    expect(result.ok).toBe(false)
  })

  it('rejects empty moments array', () => {
    const result = validateComposition({ ...VALID, moments: [] })
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'SCHEMA')).toBe(true)
  })

  it('detects unknown asset reference', () => {
    const comp: CE2Composition = {
      ...VALID,
      moments: [{
        id: 'm1',
        layers: [{
          id: 'c1',
          layer: 'video',
          source: { kind: 'asset', asset_id: 'missing_asset' },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
        }],
      }],
    }
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'ASSET_REF')).toBe(true)
  })

  it('detects unknown bundle reference', () => {
    const comp: CE2Composition = {
      ...VALID,
      moments: [{
        id: 'm1',
        layers: [{
          id: 'c1',
          layer: 'vector',
          source: { kind: 'text', payload: { content: 'Hi' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 2 },
          bundle_id: 'missing_bundle',
        }],
      }],
    }
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'BUNDLE_REF')).toBe(true)
  })

  it('detects duplicate clip IDs', () => {
    const comp: CE2Composition = {
      ...VALID,
      moments: [
        { id: 'm1', layers: [{ id: 'dup', layer: 'vector', source: { kind: 'text', payload: { content: 'A' } }, start: { kind: 'moment_start' }, duration: { kind: 'fixed_sec', value: 1 } }] },
        { id: 'm2', layers: [{ id: 'dup', layer: 'vector', source: { kind: 'text', payload: { content: 'B' } }, start: { kind: 'moment_start' }, duration: { kind: 'fixed_sec', value: 1 } }] },
      ],
    }
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'DUPLICATE_CLIP_ID')).toBe(true)
  })

  it('detects invalid trim (in >= out)', () => {
    const comp: CE2Composition = {
      ...VALID,
      moments: [{
        id: 'm1',
        layers: [{
          id: 'c1',
          layer: 'video',
          source: { kind: 'asset', asset_id: 'vid1', trim: { in_sec: 5, out_sec: 3 } },
          start: { kind: 'moment_start' },
          duration: { kind: 'matches_source' },
        }],
      }],
      assets: [{ id: 'vid1', kind: 'video', url: 'https://example.com/v.mp4', duration_sec: 10 }],
    }
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'TRIM_INVALID')).toBe(true)
  })

  it('detects anchor cycle', () => {
    const comp: CE2Composition = {
      ...VALID,
      moments: [{
        id: 'm1',
        layers: [
          { id: 'c1', layer: 'vector', source: { kind: 'text', payload: { content: 'A' } }, start: { kind: 'anchor', anchor_ref: 'c2.end' }, duration: { kind: 'fixed_sec', value: 1 } },
          { id: 'c2', layer: 'vector', source: { kind: 'text', payload: { content: 'B' } }, start: { kind: 'anchor', anchor_ref: 'c1.end' }, duration: { kind: 'fixed_sec', value: 1 } },
        ],
      }],
    }
    const result = validateComposition(comp)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.code === 'ANCHOR_CYCLE')).toBe(true)
  })
})
