import type { ResolvedClip, Effect, Transition } from '@ce2/core'

/**
 * BaseElement — frame-alapú renderer (Remotion-szerű).
 *
 * Nincsenek CSS keyframe animációk: minden frame-ben kiszámítjuk
 * a transform/opacity/filter értékeket inline style-ként.
 * → "amit látsz azt kapsz" (WYSIWYG): pause = pontos frame; minden
 *   effect kombinálódik egyetlen string-be (nincs CSS conflict).
 */

export interface FrameStyle {
  translateX: number
  translateY: number
  scaleX:     number
  scaleY:     number
  opacity:    number
  blur:       number    // px
  rotateDeg:  number
  /** filter() string ami a blur-höz adódik (brightness, contrast, etc.) */
  filterExtra: string
}

function newFrameStyle(baseOpacity: number): FrameStyle {
  return {
    translateX: 0, translateY: 0,
    scaleX: 1, scaleY: 1, rotateDeg: 0,
    opacity: baseOpacity,
    blur: 0, filterExtra: '',
  }
}

function easing(t: number, kind?: string): number {
  switch (kind ?? 'ease-out') {
    case 'linear':       return t
    case 'ease':         return t * (2 - t)
    case 'ease-in':      return t * t
    case 'ease-out':     return t * (2 - t)
    case 'ease-in-out':  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    case 'back-out': {
      const c1 = 1.70158, c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }
    case 'back-in': {
      const c1 = 1.70158, c3 = c1 + 1
      return c3 * t * t * t - c1 * t * t
    }
    case 'bounce-out': {
      const n1 = 7.5625, d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
    default: return t * (2 - t)
  }
}

export abstract class BaseElement {
  readonly el: HTMLElement
  readonly resolved: ResolvedClip

  private attachedEffects: Effect[] = []
  private inTransition?:  Transition
  private outTransition?: Transition

  /** Cached: static base opacity from clip definition */
  private baseOpacity: number
  /** Statikus filter rész (color correction, grayscale, stb.) — applyFrameStyle hozzáadja */
  private _staticFilter = ''

  constructor(resolved: ResolvedClip) {
    this.resolved = resolved
    this.el = this.createElement()
    this.el.dataset.clipId = resolved.clip.id
    this.el.classList.add('ce2-clip', `ce2-clip--${resolved.clip.layer}`)

    this.baseOpacity     = resolved.clip.opacity ?? 1
    this.attachedEffects = resolved.clip.attached_effects ?? []
    this.inTransition    = resolved.clip.in_transition
    this.outTransition   = resolved.clip.out_transition

    this.applyBaseStyles()
    this.applyStaticEffects()
  }

  protected abstract createElement(): HTMLElement

  /** Per-frame frissítés — minden frame-ben hívva amíg aktív. */
  update(frame: number, fps: number): void {
    const s = this.computeFrameStyle(frame, fps)
    this.applyFrameStyle(s)
  }

  /** Frame 0-tól mostani frame-ig számolt összes vizuális érték. */
  protected computeFrameStyle(frame: number, fps: number): FrameStyle {
    const start    = this.resolved.start_frame
    const end      = this.resolved.end_frame
    const dur      = (end - start) / fps
    const elapsed  = Math.max(0, (frame - start) / fps)
    const remain   = Math.max(0, dur - elapsed)

    const style = newFrameStyle(this.baseOpacity)
    style.filterExtra = this._staticFilter

    // 1) Effects (continuous — float/pulse/shake) + static (blur/color filters)
    for (const eff of this.attachedEffects) {
      this._applyEffect(eff, elapsed, dur, style)
    }

    // 2) In-transition (first N seconds)
    if (this.inTransition) {
      const tdur = this.inTransition.duration_sec ?? 0.4
      if (elapsed < tdur) {
        const t = elapsed / tdur
        this._applyTransition(this.inTransition, t, 'in', style)
      }
    }

    // 3) Out-transition (last N seconds)
    if (this.outTransition) {
      const tdur = this.outTransition.duration_sec ?? 0.4
      if (remain < tdur) {
        const t = 1 - (remain / tdur)
        this._applyTransition(this.outTransition, t, 'out', style)
      }
    }

    return style
  }

  protected applyFrameStyle(s: FrameStyle): void {
    const tx = s.translateX, ty = s.translateY
    const sx = s.scaleX,     sy = s.scaleY
    const transforms: string[] = []
    if (tx !== 0 || ty !== 0) transforms.push(`translate(${tx}px, ${ty}px)`)
    if (sx !== 1 || sy !== 1) transforms.push(`scale(${sx}, ${sy})`)
    if (s.rotateDeg !== 0)    transforms.push(`rotate(${s.rotateDeg}deg)`)
    this.el.style.transform = transforms.join(' ')

    this.el.style.opacity = String(s.opacity)

    const filters: string[] = []
    if (s.blur > 0)        filters.push(`blur(${s.blur}px)`)
    if (s.filterExtra)     filters.push(s.filterExtra)
    this.el.style.filter = filters.join(' ')
  }

  /** Egy effect alkalmazása a frame style-ra. */
  private _applyEffect(eff: Effect, elapsed: number, _dur: number, s: FrameStyle): void {
    switch (eff.kind) {
      case 'motion.float': {
        const amp    = (eff['amplitude_px'] as number) ?? 6
        const period = (eff['period_sec']   as number) ?? 2.5
        const axis   = (eff['axis']         as string) ?? 'y'
        const v = amp * Math.sin(elapsed * 2 * Math.PI / period)
        if (axis === 'x')        s.translateX += v
        else if (axis === 'both') { s.translateX += v * 0.7; s.translateY += v }
        else                      s.translateY += v
        break
      }
      case 'motion.pulse': {
        const smin   = (eff['scale_min']  as number) ?? 0.95
        const smax   = (eff['scale_max']  as number) ?? 1.08
        const period = (eff['period_sec'] as number) ?? 1.2
        const v = smin + (smax - smin) * (Math.sin(elapsed * 2 * Math.PI / period) + 1) / 2
        s.scaleX *= v; s.scaleY *= v
        break
      }
      case 'motion.shake': {
        const amp   = (eff['intensity_px'] as number) ?? 5
        const speed = eff['speed'] === 'fast' ? 0.15 : eff['speed'] === 'slow' ? 0.6 : 0.3
        const SHAKE = [-1, 1, -0.6, 0.4, 0]
        const phase = (elapsed % speed) / speed
        const idx   = Math.min(SHAKE.length - 1, Math.floor(phase * SHAKE.length))
        s.translateX += amp * SHAKE[idx]
        break
      }
      case 'motion.spin': {
        const rpm = (eff['rpm'] as number) ?? 30
        const dir = eff['direction'] === 'ccw' ? -1 : 1
        s.rotateDeg += dir * elapsed * rpm * 6   // 360deg/min ÷ 60s = 6deg/s per rpm
        break
      }
      case 'motion.move': {
        // Egyszeri mozgás 0..duration_sec alatt from→to
        const moveDur = (eff['duration_sec'] as number) ?? 1
        const dly     = (eff['start_offset_sec'] as number) ?? 0
        const t       = Math.max(0, Math.min(1, (elapsed - dly) / moveDur))
        const e       = easing(t, eff['easing'] as string)
        const fx      = (eff['from_x'] as number) ?? (eff['from_x_pct'] as number ?? 0)
        const fy      = (eff['from_y'] as number) ?? (eff['from_y_pct'] as number ?? 0)
        const tx      = (eff['to_x']   as number) ?? (eff['to_x_pct']   as number ?? 0)
        const ty      = (eff['to_y']   as number) ?? (eff['to_y_pct']   as number ?? 0)
        s.translateX += fx + (tx - fx) * e
        s.translateY += fy + (ty - fy) * e
        break
      }
      case 'motion.zoom': {
        const zoomDur = (eff['duration_sec'] as number) ?? 1
        const dly     = (eff['start_offset_sec'] as number) ?? 0
        const t       = Math.max(0, Math.min(1, (elapsed - dly) / zoomDur))
        const e       = easing(t, eff['easing'] as string)
        const fs      = (eff['from_scale'] as number) ?? 1
        const ts      = (eff['to_scale']   as number) ?? 1.5
        const cur     = fs + (ts - fs) * e
        s.scaleX *= cur; s.scaleY *= cur
        break
      }
      case 'visual.blur': {
        // Animated blur from_px → to_px
        const blDur = (eff['duration_sec'] as number) ?? 1
        const dly   = (eff['start_offset_sec'] as number) ?? 0
        const t     = Math.max(0, Math.min(1, (elapsed - dly) / blDur))
        const e     = easing(t, eff['easing'] as string)
        const fb    = (eff['from_px'] as number) ?? 0
        const tb    = (eff['to_px']   as number) ?? 4
        s.blur += fb + (tb - fb) * e
        break
      }
      case 'blur.gaussian':
        s.blur += (eff['radius_px'] as number) ?? 4
        break
    }
  }

  /** Transition alkalmazása. t: 0..1 (in: 0=start, 1=végre; out: 0=végre, 1=teljes kifelé). */
  private _applyTransition(tr: Transition, t: number, dir: 'in' | 'out', s: FrameStyle): void {
    const e = easing(t, tr.easing as string)
    // fromMul = mennyire alkalmazzuk a kezdő-állapotot (in: 1→0; out: 0→1)
    const fromMul = dir === 'in' ? 1 - e : e

    let kind = tr.kind
    if (kind === 'slide' && tr['from']) {
      const MAP: Record<string, string> = {
        left: 'slide_left', right: 'slide_right',
        top:  'slide_down', bottom: 'slide_up',
      }
      kind = (MAP[tr['from'] as string] ?? 'slide_left') as Transition['kind']
    }

    const dist = (tr['distance_px'] as number) ?? 60

    switch (kind) {
      case 'fade':
      case 'fade_to_black':
        s.opacity *= (1 - fromMul)
        break
      case 'slide_left':
        s.translateX += fromMul *  dist
        s.opacity    *= (1 - fromMul)
        break
      case 'slide_right':
        s.translateX += fromMul * -dist
        s.opacity    *= (1 - fromMul)
        break
      case 'slide_up':
        s.translateY += fromMul *  dist
        s.opacity    *= (1 - fromMul)
        break
      case 'slide_down':
        s.translateY += fromMul * -dist
        s.opacity    *= (1 - fromMul)
        break
      case 'zoom_in': {
        const fs = (tr['from_scale'] as number) ?? 0.7
        const cur = fs + (1 - fs) * (1 - fromMul)
        s.scaleX *= cur; s.scaleY *= cur
        s.opacity *= (1 - fromMul)
        break
      }
      case 'zoom_out': {
        const ts = (tr['to_scale'] as number) ?? 0.7
        const cur = 1 + (ts - 1) * fromMul
        s.scaleX *= cur; s.scaleY *= cur
        s.opacity *= (1 - fromMul)
        break
      }
      case 'blur_in':
      case 'blur_out': {
        const bx = (tr['from_px'] as number) ?? 12
        s.blur    += bx * fromMul
        s.opacity *= (1 - fromMul)
        break
      }
      case 'dissolve':
        s.opacity *= (1 - fromMul)
        break
      // 'cut' → no transition
    }
  }

  /** Statikus effekt-ek: text shadow, neon, color filter. */
  private applyStaticEffects(): void {
    let cssFilter = ''
    for (const eff of this.attachedEffects) {
      switch (eff.kind) {
        case 'text.neon': {
          const c = (eff['color'] ?? eff['glow_color'] ?? '#fff') as string
          const sz = (eff['glow_size_px'] as number) ?? 20
          const it = (eff['intensity']   as number) ?? 1
          this.el.style.textShadow =
            `0 0 ${sz * 0.4 * it}px ${c},` +
            `0 0 ${sz * it}px ${c},` +
            `0 0 ${sz * 2 * it}px ${c}`
          break
        }
        case 'text.shadow':
          this.el.style.textShadow =
            `${eff['offset_x'] ?? 2}px ${eff['offset_y'] ?? 2}px ` +
            `${eff['blur'] ?? eff['blur_px'] ?? 4}px ${eff['color'] ?? 'rgba(0,0,0,0.5)'}`
          break
        case 'visual.color_correction':
        case 'color.brightness': {
          const v = eff.kind === 'color.brightness' ? (eff['value'] as number ?? 0) : (eff['brightness'] as number ?? 0)
          if (v) cssFilter += ` brightness(${1 + v})`
          break
        }
        case 'color.contrast': {
          const v = eff['value'] as number ?? 0
          if (v) cssFilter += ` contrast(${1 + v})`
          break
        }
        case 'color.saturate': {
          const v = eff['value'] as number ?? 1
          cssFilter += ` saturate(${v})`
          break
        }
        case 'filter.grayscale': {
          const v = eff['strength'] as number ?? 1
          cssFilter += ` grayscale(${v})`
          break
        }
        case 'filter.cinematic': {
          const v = eff['strength'] as number ?? 0.7
          cssFilter += ` contrast(${1 + 0.3 * v}) saturate(${1 + 0.2 * v}) brightness(${1 - 0.05 * v})`
          break
        }
      }
    }
    // Static filter base (dynamic blur is added per-frame in computeFrameStyle)
    this._staticFilter = cssFilter.trim()
  }

  /** Called once when the clip first becomes visible — nincs hatása a frame-renderre. */
  onEnter(_fps: number): void {}
  /** Called when the clip leaves — nincs hatása a frame-renderre. */
  onExit(_fps: number): void {}

  show(): void { this.el.classList.remove('ce2-clip--hidden') }
  hide(): void { this.el.classList.add('ce2-clip--hidden') }

  /** Cleanup hook — BrowserRenderer.destroy() hívja minden elementen */
  destroy(): void {}

  /** Mute audio/video — alapból no-op; AudioElement / VideoElement override-olja */
  setMuted(_muted: boolean): void {}

  /** A frame-alapú rendszerben a JS pause-ja megáll, így a CSS animation-play-state nem kell. */
  syncAnimationState(_playing: boolean): void { /* no-op */ }

  isActive(frame: number): boolean {
    return frame >= this.resolved.start_frame && frame < this.resolved.end_frame
  }

  zIndex(): number {
    const base: Record<string, number> = {
      music: 0, narration: 0, sfx: 0,
      video: 1, pixel: 10, vector: 20,
    }
    return (base[this.resolved.clip.layer] ?? 0) + (this.resolved.clip.z_within_layer ?? 0)
  }

  /**
   * Switch this element to a specific canvas position with content-sized dimensions.
   * Called by SpatialAnchorResolver for clips with clip.position set.
   */
  setAbsolutePosition(x: number, y: number): void {
    this.el.style.left   = `${x}px`
    this.el.style.top    = `${y}px`
    this.el.style.width  = 'auto'
    this.el.style.height = 'auto'
  }

  private applyBaseStyles(): void {
    const c = this.resolved.clip
    this.el.style.zIndex = String(this.zIndex())
    if (c.blend_mode) this.el.style.mixBlendMode = c.blend_mode
    // Initial transform/opacity = identity; majd update() állítja be
    this.el.style.opacity = String(this.baseOpacity)
  }
}
