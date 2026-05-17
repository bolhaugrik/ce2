import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class VideoElement extends BaseElement {
  private video: HTMLVideoElement
  private trimIn: number
  private fps: number

  constructor(resolved: ResolvedClip, fps: number) {
    super(resolved)
    this.fps    = fps
    const src   = resolved.clip.source
    this.trimIn = src.kind === 'asset' && src.trim ? src.trim.in_sec : 0
    this.video  = this.el as HTMLVideoElement
  }

  protected createElement(): HTMLElement {
    const v   = document.createElement('video')
    v.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    v.playsInline = true
    v.muted       = this.resolved.clip.muted ?? true
    return v
  }

  setUrl(url: string): void {
    this.video.src = url
    this.video.load()
  }

  update(frame: number, fps: number): void {
    super.update(frame, fps)
    const elapsed = (frame - this.resolved.start_frame) / this.fps
    const targetTime = this.trimIn + elapsed
    if (Math.abs(this.video.currentTime - targetTime) > 1 / this.fps) {
      this.video.currentTime = targetTime
    }
  }

  /**
   * onEnter NEM játszik le automatikusan — csak pozicionál.
   * A user-gesture (▶ click) → BrowserRenderer.play() → resumeActiveMedia() játszik.
   */
  onEnter(_fps: number): void {
    this.video.currentTime = this.trimIn
  }

  onExit(_fps: number): void {
    this.video.pause()
  }

  destroy(): void {
    this.video.pause()
    this.video.src = ''
    try { this.video.load() } catch {}
  }

  setMuted(muted: boolean): void {
    this.video.muted = muted
  }
}
