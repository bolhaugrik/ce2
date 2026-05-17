import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class AudioElement extends BaseElement {
  private audio: HTMLAudioElement
  private fps: number
  private trimIn: number

  constructor(resolved: ResolvedClip, fps: number) {
    super(resolved)
    this.fps = fps
    const src = resolved.clip.source
    this.trimIn = src.kind === 'asset' && src.trim ? src.trim.in_sec : 0
    this.audio = this.el as HTMLAudioElement
  }

  protected createElement(): HTMLElement {
    const a = document.createElement('audio')
    const c = this.resolved.clip
    a.loop   = false
    a.muted  = c.muted ?? false
    a.volume = Math.min(c.volume ?? 1, 1)  // HTML5 audio clamps to 1
    return a
  }

  setUrl(url: string): void {
    this.audio.src = url
    this.audio.load()
  }

  onEnter(_fps: number): void {
    this.audio.currentTime = this.trimIn
    this.audio.play().catch(() => {})
  }

  onExit(_fps: number): void {
    this.audio.pause()
  }

  update(frame: number, _fps: number): void {
    // Keep audio in sync with video frame (coarse correction)
    const elapsed = (frame - this.resolved.start_frame) / this.fps
    const target = this.trimIn + elapsed
    if (Math.abs(this.audio.currentTime - target) > 0.3) {
      this.audio.currentTime = target
    }
  }

  // Audio clips have no visual — they should not occupy the DOM visually
  show(): void { /* no-op */ }
  hide(): void { if (!this.audio.paused) this.audio.pause() }
}
