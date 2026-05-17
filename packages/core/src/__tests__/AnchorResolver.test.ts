import { describe, it, expect } from 'vitest'
import { AnchorResolver, CE2CycleError, CE2AnchorMissingError } from '../resolver/AnchorResolver.js'
import type { CE2Composition, Clip } from '../schema/index.js'

const BASE: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30, title: 'Test' },
  globals: {},
  spanning_layers: [],
  moments: [],
  bundles: [],
  assets: [],
}

function textClip(overrides: Partial<Clip> & { id: string }): Clip {
  return {
    layer: 'vector',
    source: { kind: 'text', payload: { content: 'Hello' } },
    start: { kind: 'moment_start' },
    duration: { kind: 'fixed_sec', value: 3 },
    ...overrides,
  }
}

describe('AnchorResolver — basic resolution', () => {
  it('resolves a single fixed_sec clip starting at moment_start', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [
        { id: 'm1', layers: [textClip({ id: 'c1', duration: { kind: 'fixed_sec', value: 3 } })] },
      ],
    }
    const resolver = new AnchorResolver({ composition: comp })
    const result = resolver.resolve()

    expect(result).toHaveLength(1)
    expect(result[0].start_frame).toBe(0)
    expect(result[0].end_frame).toBe(90) // 3s * 30fps
  })

  it('resolves two sequential moments', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [
        { id: 'm1', layers: [textClip({ id: 'c1', duration: { kind: 'fixed_sec', value: 2 } })] },
        { id: 'm2', layers: [textClip({ id: 'c2', duration: { kind: 'fixed_sec', value: 3 } })] },
      ],
    }
    const result = new AnchorResolver({ composition: comp }).resolve()

    const c1 = result.find(r => r.clip.id === 'c1')!
    const c2 = result.find(r => r.clip.id === 'c2')!

    expect(c1.start_frame).toBe(0)
    expect(c1.end_frame).toBe(60)   // 2s
    expect(c2.start_frame).toBe(60) // starts after m1
    expect(c2.end_frame).toBe(150)  // 60 + 3s*30
  })

  it('resolves after_previous', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [
          textClip({ id: 'c1', start: { kind: 'moment_start' }, duration: { kind: 'fixed_sec', value: 1 } }),
          textClip({ id: 'c2', start: { kind: 'after_previous', offset_sec: 0.5 }, duration: { kind: 'fixed_sec', value: 2 } }),
        ],
      }],
    }
    const result = new AnchorResolver({ composition: comp }).resolve()
    const c2 = result.find(r => r.clip.id === 'c2')!

    expect(c2.start_frame).toBe(45) // 1s + 0.5s = 1.5s * 30
  })

  it('resolves anchor reference between clips', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [
          textClip({ id: 'c1', start: { kind: 'moment_start' }, duration: { kind: 'fixed_sec', value: 2 } }),
          textClip({
            id: 'c2',
            start: { kind: 'anchor', anchor_ref: 'c1.end', offset_sec: 0.2 },
            duration: { kind: 'fixed_sec', value: 1 },
          }),
        ],
      }],
    }
    const result = new AnchorResolver({ composition: comp }).resolve()
    const c2 = result.find(r => r.clip.id === 'c2')!

    expect(c2.start_frame).toBe(66) // (2 + 0.2) * 30
  })

  it('registers moment.start and moment.end anchors', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [
        { id: 'm1', layers: [textClip({ id: 'c1', duration: { kind: 'fixed_sec', value: 4 } })] },
      ],
    }
    const resolver = new AnchorResolver({ composition: comp })
    resolver.resolve()
    const anchors = resolver.getAnchors()

    expect(anchors.get('moment.m1.start')).toBe(0)
    expect(anchors.get('moment.m1.end')).toBe(120)
  })

  it('resolves matches_source with trim', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [{
          id: 'c1',
          layer: 'video',
          source: { kind: 'asset', asset_id: 'vid1', trim: { in_sec: 1, out_sec: 4 } },
          start: { kind: 'moment_start' },
          duration: { kind: 'matches_source' },
        }],
      }],
      assets: [{ id: 'vid1', kind: 'video', url: 'https://example.com/v.mp4', duration_sec: 10 }],
    }
    const result = new AnchorResolver({ composition: comp }).resolve()
    expect(result[0].end_frame).toBe(90) // (4-1)*30
  })

  it('resolves phase anchors for vector clip', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{ id: 'm1', layers: [textClip({ id: 'c1', duration: { kind: 'fixed_sec', value: 10 } })] }],
    }
    const resolver = new AnchorResolver({ composition: comp })
    resolver.resolve()
    const anchors = resolver.getAnchors()

    expect(anchors.has('c1.phase.enter')).toBe(true)
    expect(anchors.has('c1.phase.static')).toBe(true)
    expect(anchors.has('c1.phase.exit')).toBe(true)
  })

  it('resolves audio_marker anchors', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [{
          id: 'narr1',
          layer: 'narration',
          source: { kind: 'tts', text: 'Hello world', voice_id: 'v1' },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 5 },
          audio_markers: [
            { id: 'word0', kind: 'point', label: 'Hello', time_sec: 0.3 },
            { id: 'word1', kind: 'region', label: 'world', time_sec: 0.8, end_sec: 1.2 },
          ],
        }],
      }],
    }
    const resolver = new AnchorResolver({ composition: comp })
    resolver.resolve()
    const anchors = resolver.getAnchors()

    expect(anchors.get('narr1.mark.word0.start')).toBe(9)   // 0.3 * 30
    expect(anchors.get('narr1.mark.word1.start')).toBe(24)  // 0.8 * 30
    expect(anchors.get('narr1.mark.word1.end')).toBe(36)    // 1.2 * 30
  })
})

describe('AnchorResolver — spanning layers', () => {
  it('resolves a spanning layer after moments', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{ id: 'm1', layers: [textClip({ id: 'c1', duration: { kind: 'fixed_sec', value: 5 } })] }],
      spanning_layers: [{
        id: 'bg',
        layer: 'music',
        source: { kind: 'asset', asset_id: 'music1' },
        start: { kind: 'moment_start' },
        duration: { kind: 'fixed_sec', value: 10 },
      }],
      assets: [{ id: 'music1', kind: 'audio', url: 'https://example.com/m.mp3' }],
    }
    const result = new AnchorResolver({ composition: comp }).resolve()
    const bg = result.find(r => r.clip.id === 'bg')!

    expect(bg.moment_id).toBeNull()
    expect(bg.start_frame).toBe(0)
    expect(bg.end_frame).toBe(300) // 10s
  })
})

describe('AnchorResolver — error cases', () => {
  it('throws CE2CycleError on circular anchor dependency', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [
          textClip({
            id: 'c1',
            start: { kind: 'anchor', anchor_ref: 'c2.end' },
            duration: { kind: 'fixed_sec', value: 1 },
          }),
          textClip({
            id: 'c2',
            start: { kind: 'anchor', anchor_ref: 'c1.end' },
            duration: { kind: 'fixed_sec', value: 1 },
          }),
        ],
      }],
    }
    expect(() => new AnchorResolver({ composition: comp }).resolve()).toThrow(CE2CycleError)
  })

  it('throws CE2AnchorMissingError for unknown anchor_ref', () => {
    const comp: CE2Composition = {
      ...BASE,
      moments: [{
        id: 'm1',
        layers: [
          textClip({
            id: 'c1',
            start: { kind: 'anchor', anchor_ref: 'nonexistent.end' },
            duration: { kind: 'fixed_sec', value: 1 },
          }),
        ],
      }],
    }
    expect(() => new AnchorResolver({ composition: comp }).resolve()).toThrow(CE2AnchorMissingError)
  })
})
