import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class AudioElement extends BaseElement {
  private audio: HTMLAudioElement | null = null
  private ttsUtterance: SpeechSynthesisUtterance | null = null
  private fps: number
  private trimIn: number
  private isTts: boolean

  constructor(resolved: ResolvedClip, fps: number) {
    super(resolved)
    this.fps    = fps
    this.isTts  = resolved.clip.source.kind === 'tts'
    const src   = resolved.clip.source
    this.trimIn = src.kind === 'asset' && src.trim ? src.trim.in_sec : 0

    if (this.isTts) {
      this.setupTts()
    } else {
      this.audio = this.el as HTMLAudioElement
    }
  }

  protected createElement(): HTMLElement {
    if (this.isTts) {
      return document.createElement('span') // invisible placeholder
    }
    const a = document.createElement('audio')
    const c = this.resolved.clip
    a.preload = 'auto'
    a.loop    = false
    a.muted   = c.muted ?? false
    a.volume  = Math.min(c.volume ?? 1, 1)
    return a
  }

  private setupTts(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const src = this.resolved.clip.source
    if (src.kind !== 'tts') return
    const utt = new SpeechSynthesisUtterance(src.text)
    if (src.lang) utt.lang = src.lang
    utt.volume = Math.min(this.resolved.clip.volume ?? 1, 1)
    // Try to match voice
    const voices = window.speechSynthesis.getVoices()
    const match  = voices.find(v => src.lang ? v.lang.startsWith(src.lang) : v.default)
    if (match) utt.voice = match
    this.ttsUtterance = utt
  }

  setUrl(url: string): void {
    if (!this.audio) return
    this.audio.src = url
    this.audio.load()
  }

  onEnter(_fps: number): void {
    if (this.isTts) {
      if (!this.ttsUtterance) return
      window.speechSynthesis?.cancel()
      // Re-create utterance each time (browser clears it after speak)
      const src = this.resolved.clip.source
      if (src.kind !== 'tts') return
      const utt = new SpeechSynthesisUtterance(src.text)
      if (src.lang) utt.lang = src.lang
      utt.volume = Math.min(this.resolved.clip.volume ?? 1, 1)
      const voices = window.speechSynthesis?.getVoices() ?? []
      const match  = voices.find(v => src.lang ? v.lang.startsWith(src.lang) : v.default)
      if (match) utt.voice = match
      window.speechSynthesis?.speak(utt)
      return
    }
    if (!this.audio?.src) return
    this.audio.currentTime = this.trimIn
    this.audio.play().catch(() => {
      // Autoplay blocked — will play on next user interaction
      const unlock = () => {
        this.audio?.play().catch(() => {})
        document.removeEventListener('click', unlock)
        document.removeEventListener('keydown', unlock)
      }
      document.addEventListener('click', unlock, { once: true })
      document.addEventListener('keydown', unlock, { once: true })
    })
  }

  onExit(_fps: number): void {
    if (this.isTts) {
      window.speechSynthesis?.cancel()
      return
    }
    this.audio?.pause()
  }

  update(frame: number, _fps: number): void {
    if (this.isTts || !this.audio?.src) return
    const elapsed = (frame - this.resolved.start_frame) / this.fps
    const target  = this.trimIn + elapsed
    if (Math.abs(this.audio.currentTime - target) > 0.4) {
      this.audio.currentTime = target
    }
  }

  show(): void { /* audio has no visual */ }
  hide(): void {
    if (this.isTts) { window.speechSynthesis?.cancel(); return }
    if (this.audio && !this.audio.paused) this.audio.pause()
  }
}
