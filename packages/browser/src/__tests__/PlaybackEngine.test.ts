import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlaybackEngine } from '../PlaybackEngine.js'

// jsdom provides a basic requestAnimationFrame mock
// We override it to control timing precisely
let rafCallback: ((ts: number) => void) | null = null
let rafTime = 0

vi.stubGlobal('requestAnimationFrame', (cb: (ts: number) => void) => {
  rafCallback = cb
  return 1
})
vi.stubGlobal('cancelAnimationFrame', () => {})
vi.stubGlobal('performance', { now: () => rafTime })

function tick(ms: number) {
  rafTime = ms
  rafCallback?.(ms)
}

describe('PlaybackEngine', () => {
  let frames: number[]
  let engine: PlaybackEngine

  beforeEach(() => {
    frames = []
    rafTime = 0
    rafCallback = null
    engine = new PlaybackEngine({
      fps: 30,
      totalFrames: 90, // 3 seconds
      onFrame: (f) => frames.push(f),
    })
  })

  it('starts at frame 0', () => {
    expect(engine.currentFrame).toBe(0)
    expect(engine.isPlaying).toBe(false)
  })

  it('play() starts the rAF loop', () => {
    engine.play()
    expect(engine.isPlaying).toBe(true)
    tick(0)
    expect(frames).toContain(0)
  })

  it('advances frames with time', () => {
    engine.play()
    tick(0)
    tick(1000) // 1 second = 30 frames
    expect(engine.currentFrame).toBe(30)
  })

  it('pause() stops the loop', () => {
    engine.play()
    tick(0)
    engine.pause()
    expect(engine.isPlaying).toBe(false)
  })

  it('seek() moves to correct frame', () => {
    engine.seek(45)
    expect(engine.currentFrame).toBe(45)
    expect(engine.currentTimeSec).toBeCloseTo(1.5, 1)
  })

  it('stop() resets to frame 0', () => {
    engine.play()
    tick(500)
    engine.stop()
    expect(engine.currentFrame).toBe(0)
    expect(engine.isPlaying).toBe(false)
  })

  it('emits end event when totalFrames reached', () => {
    let ended = false
    engine.on('end', () => { ended = true })
    engine.play()
    tick(0)
    tick(3100) // just past 3 seconds
    expect(ended).toBe(true)
    expect(engine.isPlaying).toBe(false)
  })

  it('loops when loop=true', () => {
    const loopEngine = new PlaybackEngine({
      fps: 30,
      totalFrames: 30,
      loop: true,
      onFrame: (f) => frames.push(f),
    })
    loopEngine.play()
    tick(0)
    tick(1100) // past 1 second (total duration)
    // Should have looped back — engine still playing
    expect(loopEngine.isPlaying).toBe(true)
    loopEngine.destroy()
  })

  it('on() returns an unsubscribe function that stops delivery', () => {
    let count = 0
    const unsub = engine.on('play', () => count++)
    engine.play()
    expect(count).toBe(1)
    engine.pause()
    unsub()
    engine.play()        // handler already removed → count must NOT increase
    expect(count).toBe(1)
  })
})
