import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class VideoElement extends BaseElement {
  private video: HTMLVideoElement
  private trimIn: number
  private fps: number

  constructor(resolved: ResolvedClip, fps: number) {
    super(resolved)
    this.fps = fps
    const src = resolved.clip.source
    this.trimIn = src.kind === 'asset' && src.trim ? src.trim.in_sec : 0
    this.video = this.el as HTMLVideoElement
  }

  protected createElement(): HTMLElement {
    const v   = document.createElement('video')
    const src = this.resolved.clip.source
    const scale = src.kind === 'asset' ? ((src as any).scale ?? 1) : 1
    v.style.cssText = [
      'width:100%;height:100%;object-fit:cover;',
      scale !== 1 ? `transform:scale(${scale});` : '',
    ].join('')
    v.playsInline = true
    v.muted       = this.resolved.clip.muted ?? true  // muted by default (autoplay policy)
    return v
  }

  setUrl(url: string): void {
    this.video.src = url
    this.video.load()
  }

  update(frame: number, _fps: number): void {
    const elapsed = (frame - this.resolved.start_frame) / this.fps
    const targetTime = this.trimIn + elapsed
    // Only seek if drift > 1 frame to avoid constant seeking
    if (Math.abs(this.video.currentTime - targetTime) > 1 / this.fps) {
      this.video.currentTime = targetTime
    }
  }

  onEnter(fps: number): void {
    super.onEnter(fps)
    this.video.currentTime = this.trimIn
    this.video.play().catch(() => {})
  }

  onExit(fps: number): void {
    super.onExit(fps)
    this.video.pause()
  }
}
