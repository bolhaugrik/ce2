import {
  AnchorResolver,
  BundleResolver,
  validateComposition,
  type CE2Composition,
  type ResolvedClip,
} from '@ce2/core'
import { PlaybackEngine, type PlaybackEventType } from './PlaybackEngine.js'
import { injectStyles } from './css/animations.js'
import { TextElement } from './elements/TextElement.js'
import { ImageElement } from './elements/ImageElement.js'
import { VideoElement } from './elements/VideoElement.js'
import { AudioElement } from './elements/AudioElement.js'
import { ShapeElement } from './elements/ShapeElement.js'
import { BaseElement } from './elements/BaseElement.js'
import { CountdownElement } from './elements/CountdownElement.js'

export interface BrowserRendererOptions {
  container: HTMLElement
  composition: CE2Composition
  /** asset_id → absolute URL */
  assets?: Record<string, string>
  assetDurations?: Map<string, number>
  loop?: boolean
  /** Scale the canvas to fit the container. Default: true */
  fitContainer?: boolean
}

export type RendererEventType = PlaybackEventType | 'moment-change' | 'ready'

export class BrowserRenderer {
  private canvas: HTMLDivElement
  private engine: PlaybackEngine
  private elements: BaseElement[] = []
  private resolved: ResolvedClip[] = []
  private activeSet = new Set<string>()
  private currentMomentId: string | null = null
  private momentRanges: Array<{ id: string; start: number; end: number }> = []
  private fps: number
  private _totalFrames = 1
  private listeners = new Map<RendererEventType, Set<(...args: unknown[]) => void>>()

  constructor(private opts: BrowserRendererOptions) {
    const validation = validateComposition(opts.composition)
    if (!validation.ok) {
      throw new Error(
        `CE2 BrowserRenderer: invalid composition\n` +
        validation.errors.map(e => `  [${e.code}] ${e.message}`).join('\n'),
      )
    }

    injectStyles()

    this.fps = opts.composition.meta.fps

    // Resolve anchors
    const resolver = new AnchorResolver({
      composition: opts.composition,
      assetDurations: opts.assetDurations,
    })
    this.resolved = resolver.resolve()

    // Pre-compute moment frame ranges from the resolved anchor map
    const anchorMap = resolver.getAnchors()
    this.momentRanges = opts.composition.moments.map(m => ({
      id: m.id,
      start: anchorMap.get(`moment.${m.id}.start`) ?? 0,
      end:   anchorMap.get(`moment.${m.id}.end`)   ?? 0,
    }))

    // Resolve bundle inputs into clips
    const bundleResolver = new BundleResolver(opts.composition)
    this.resolved = this.resolved.map(rc => ({
      ...rc,
      clip: bundleResolver.resolveClip(rc.clip),
    }))

    // Build canvas
    this.canvas = this.buildCanvas()
    opts.container.appendChild(this.canvas)

    // Create DOM elements for all clips, sorted by z-index
    this.elements = this.buildElements()
    const sorted = [...this.elements].sort((a, b) => a.zIndex() - b.zIndex())
    for (const el of sorted) {
      this.canvas.appendChild(el.el)
    }

    // Fit canvas to container if requested
    if (opts.fitContainer !== false) this.applyFit()

    // Calculate total frame count
    this._totalFrames = this.resolved.length > 0
      ? Math.max(...this.resolved.map(r => r.end_frame))
      : 1

    this.engine = new PlaybackEngine({
      fps: this.fps,
      totalFrames: this._totalFrames,
      loop: opts.loop ?? false,
      onFrame: (frame) => this.onFrame(frame),
      onEnd: () => this.emit('end'),
    })

    // Relay playback events
    for (const ev of ['play', 'pause', 'stop', 'end', 'seek'] as const) {
      this.engine.on(ev, () => this.emit(ev))
    }

    // Render frame 0, start paused
    this.onFrame(0)
    this.syncAnimations(false)
    this.emit('ready')
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** @deprecated — no-op, kept for API compat. Media is resumed automatically from play(). */
  primeAudio(): void {}

  play(): void   { this.engine.play(); this.resumeActiveMedia(); this.syncAnimations(true) }
  pause(): void  { this.pauseAllMedia(); this.engine.pause(); this.syncAnimations(false) }
  stop(): void   { this.pauseAllMedia(); this.engine.stop(); this.syncAnimations(false) }
  seek(frame: number): void { this.engine.seek(frame) }
  seekToSec(sec: number): void { this.engine.seekToSec(sec) }

  get currentFrame(): number  { return this.engine.currentFrame }
  get currentTimeSec(): number { return this.engine.currentTimeSec }
  get totalTimeSec(): number   { return this._totalFrames / this.fps }
  get isPlaying(): boolean     { return this.engine.isPlaying }

  on(event: RendererEventType, handler: (...args: unknown[]) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
    return () => this.listeners.get(event)?.delete(handler)
  }

  /** Re-apply container fit — call after container resizes */
  refit(): void {
    if (this.opts.fitContainer !== false) this.applyFit()
  }

  destroy(): void {
    this.pauseAllMedia()
    for (const el of this.elements) el.destroy()
    this.engine.destroy()
    this.canvas.remove()
    this.listeners.clear()
  }

  /** Mute/unmute minden audio/video clipet — preview kontrollra */
  setMuted(muted: boolean): void {
    for (const el of this.elements) el.setMuted(muted)
  }

  // ─── Media control ──────────────────────────────────────────────────────────

  private resumeActiveMedia(): void {
    for (const el of this.elements) {
      if (!this.activeSet.has(el.resolved.clip.id)) continue
      const audio = (el as any).audio as HTMLAudioElement | undefined
      if (audio?.src) audio.play().catch(() => {})
      const video = (el as any).video as HTMLVideoElement | undefined
      if (video?.src) video.play().catch(() => {})
      // TTS: speakTts() metódus (user gesture context-ben)
      const speakTts = (el as any).speakTts as (() => void) | undefined
      if (speakTts) speakTts()
    }
  }

  private pauseAllMedia(): void {
    for (const el of this.elements) {
      const audio = (el as any).audio as HTMLAudioElement | undefined
      if (audio) audio.pause()
      const video = (el as any).video as HTMLVideoElement | undefined
      if (video) video.pause()
    }
  }

  private syncAnimations(playing: boolean): void {
    for (const el of this.elements) {
      el.syncAnimationState(playing)
    }
  }

  // ─── Frame loop ─────────────────────────────────────────────────────────────

  private onFrame(frame: number): void {
    for (const el of this.elements) {
      const clipId = el.resolved.clip.id
      const wasActive = this.activeSet.has(clipId)
      const isActive = el.isActive(frame)

      if (isActive && !wasActive) {
        el.show()
        el.onEnter(this.fps)
        this.activeSet.add(clipId)
      } else if (!isActive && wasActive) {
        el.hide()
        el.onExit(this.fps)
        this.activeSet.delete(clipId)
      }

      if (isActive) {
        el.update(frame, this.fps)
      }
    }

    // Detect moment change
    const momentId = this.currentMomentAtFrame(frame)
    if (momentId !== this.currentMomentId) {
      this.currentMomentId = momentId
      if (momentId) this.emit('moment-change', momentId)
    }
  }

  // ─── DOM builders ───────────────────────────────────────────────────────────

  private buildCanvas(): HTMLDivElement {
    const { width, height } = this.opts.composition.meta
    const bg = this.opts.composition.globals.background_color ?? '#000'
    const div = document.createElement('div')
    div.className = 'ce2-canvas'
    div.style.cssText = `width:${width}px;height:${height}px;background:${bg};`
    return div
  }

  private buildElements(): BaseElement[] {
    const assets = this.opts.assets ?? {}
    const fps = this.fps
    const els: BaseElement[] = []

    for (const rc of this.resolved) {
      const { clip } = rc
      const src = clip.source

      let el: BaseElement

      if (src.kind === 'text') {
        el = new TextElement(rc)
      } else if (src.kind === 'svg' || src.kind === 'shape') {
        el = new ShapeElement(rc)
      } else if (clip.layer === 'video') {
        const ve = new VideoElement(rc, fps)
        if (src.kind === 'asset' && assets[src.asset_id]) {
          ve.setUrl(assets[src.asset_id])
        }
        el = ve
      } else if (clip.layer === 'pixel') {
        const ie = new ImageElement(rc)
        if (src.kind === 'asset' && assets[src.asset_id]) {
          ie.setUrl(assets[src.asset_id])
        }
        el = ie
      } else if (['music', 'narration', 'sfx'].includes(clip.layer)) {
        const ae = new AudioElement(rc, fps)
        if (src.kind === 'asset' && assets[src.asset_id]) {
          ae.setUrl(assets[src.asset_id])
        }
        el = ae
      } else if (src.kind === 'computed') {
        // Resolve bundle inputs for computed sources
        const bundleInputs: Record<string, unknown> = {}
        if (clip.bundle_id) {
          const bundle = this.opts.composition.bundles.find(b => b.id === clip.bundle_id)
          if (bundle) Object.assign(bundleInputs, bundle.inputs)
        }
        const mergedInputs = { ...src.inputs, ...bundleInputs }
        el = new CountdownElement(rc, fps, mergedInputs)
      } else {
        // Fallback: empty div (tts not yet resolved, etc.)
        el = new TextElement(rc)
      }

      el.hide()
      els.push(el)
    }

    return els
  }

  private applyFit(): void {
    const { width, height } = this.opts.composition.meta
    const cw = this.opts.container.clientWidth  || width
    const ch = this.opts.container.clientHeight || height
    const scale  = Math.min(cw / width, ch / height)
    const left   = Math.round((cw - width  * scale) / 2)
    const top    = Math.round((ch - height * scale) / 2)

    // Absolute positioning keeps canvas out of document flow → no layout bleed
    this.canvas.style.position        = 'absolute'
    this.canvas.style.top             = '0'
    this.canvas.style.left            = '0'
    this.canvas.style.transformOrigin = 'top left'
    this.canvas.style.transform       = `translate(${left}px, ${top}px) scale(${scale})`
    this.opts.container.style.position = 'relative'
    this.opts.container.style.overflow = 'hidden'
  }

  private currentMomentAtFrame(frame: number): string | null {
    for (const { id, start, end } of this.momentRanges) {
      if (frame >= start && frame < end) return id
    }
    return null
  }

  private emit(event: RendererEventType, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(h => h(...args))
  }
}
