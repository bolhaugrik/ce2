export type PlaybackEventType = 'play' | 'pause' | 'stop' | 'end' | 'seek' | 'frame'

export interface PlaybackEngineOptions {
  fps: number
  totalFrames: number
  loop?: boolean
  onFrame: (frame: number) => void
  onEnd?: () => void
}

export class PlaybackEngine {
  private fps: number
  private totalFrames: number
  private loop: boolean
  private onFrameCb: (frame: number) => void
  private onEndCb?: () => void

  private _currentTimeMs = 0
  private _playing = false
  private _rafId: number | null = null
  private _startTimestamp = 0

  private listeners = new Map<PlaybackEventType, Set<() => void>>()

  constructor(opts: PlaybackEngineOptions) {
    this.fps = opts.fps
    this.totalFrames = opts.totalFrames
    this.loop = opts.loop ?? false
    this.onFrameCb = opts.onFrame
    this.onEndCb = opts.onEnd
  }

  get currentFrame(): number {
    return Math.min(Math.floor(this._currentTimeMs / 1000 * this.fps), this.totalFrames - 1)
  }

  get currentTimeSec(): number {
    return this._currentTimeMs / 1000
  }

  get isPlaying(): boolean {
    return this._playing
  }

  play(): void {
    if (this._playing) return
    this._playing = true
    this._startTimestamp = performance.now() - this._currentTimeMs
    this._rafId = requestAnimationFrame(this._tick)
    this._emit('play')
  }

  pause(): void {
    if (!this._playing) return
    this._playing = false
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    this._emit('pause')
  }

  stop(): void {
    this.pause()
    this._currentTimeMs = 0
    this.onFrameCb(0)
    this._emit('stop')
  }

  seek(frame: number): void {
    const clamped = Math.max(0, Math.min(frame, this.totalFrames - 1))
    this._currentTimeMs = (clamped / this.fps) * 1000
    if (!this._playing) {
      this.onFrameCb(clamped)
    } else {
      this._startTimestamp = performance.now() - this._currentTimeMs
    }
    this._emit('seek')
  }

  seekToSec(sec: number): void {
    this.seek(Math.round(sec * this.fps))
  }

  on(event: PlaybackEventType, handler: () => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
    return () => this.listeners.get(event)?.delete(handler)
  }

  destroy(): void {
    this.pause()
    this.listeners.clear()
  }

  private _tick = (now: number): void => {
    this._currentTimeMs = now - this._startTimestamp
    const frame = this.currentFrame

    if (frame >= this.totalFrames - 1) {
      this._currentTimeMs = ((this.totalFrames - 1) / this.fps) * 1000
      this.onFrameCb(this.totalFrames - 1)
      if (this.loop) {
        this._currentTimeMs = 0
        this._startTimestamp = performance.now()
      } else {
        this._playing = false
        this._rafId = null
        this._emit('end')
        this.onEndCb?.()
        return
      }
    } else {
      this.onFrameCb(frame)
    }

    this._emit('frame')
    if (this._playing) {
      this._rafId = requestAnimationFrame(this._tick)
    }
  }

  private _emit(event: PlaybackEventType): void {
    this.listeners.get(event)?.forEach(h => h())
  }
}
