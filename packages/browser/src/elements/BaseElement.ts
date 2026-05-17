import type { ResolvedClip, Clip, Effect, Transition } from '@ce2/core'
import { easingToCss } from '../css/animations.js'

export abstract class BaseElement {
  readonly el: HTMLElement
  readonly resolved: ResolvedClip

  constructor(resolved: ResolvedClip) {
    this.resolved = resolved
    this.el = this.createElement()
    this.applyBaseStyles()
    this.el.dataset.clipId = resolved.clip.id
    this.el.classList.add('ce2-clip', `ce2-clip--${resolved.clip.layer}`)
  }

  protected abstract createElement(): HTMLElement

  /** Called every frame while the clip is visible */
  update(_frame: number, _fps: number): void {}

  /** Called once when the clip first becomes visible */
  onEnter(fps: number): void {
    const t = this.resolved.clip.in_transition
    if (t) this.applyTransition(t, 'in', fps)
  }

  /** Called when the clip is about to leave (last N frames) */
  onExit(fps: number): void {
    const t = this.resolved.clip.out_transition
    if (t) this.applyTransition(t, 'out', fps)
  }

  show(): void  { this.el.classList.remove('ce2-clip--hidden') }
  hide(): void  { this.el.classList.add('ce2-clip--hidden') }

  isActive(frame: number): boolean {
    return frame >= this.resolved.start_frame && frame < this.resolved.end_frame
  }

  /** z-index: layer category (base) + z_within_layer override */
  zIndex(): number {
    const base: Record<string, number> = {
      music: 0, narration: 0, sfx: 0,
      video: 1, pixel: 10, vector: 20,
    }
    return (base[this.resolved.clip.layer] ?? 0) + (this.resolved.clip.z_within_layer ?? 0)
  }

  private applyBaseStyles(): void {
    const c = this.resolved.clip
    this.el.style.zIndex = String(this.zIndex())
    if (c.opacity !== undefined) {
      this.el.style.setProperty('--ce2-opacity', String(c.opacity))
      this.el.style.opacity = String(c.opacity)
    }
    if (c.blend_mode) this.el.style.mixBlendMode = c.blend_mode
  }

  protected applyEffects(effects: Effect[], fps: number): void {
    for (const effect of effects) {
      const delay = effect['start_offset_sec'] ? `${effect['start_offset_sec']}s` : '0s'
      const dur = effect['duration_sec'] ? `${effect['duration_sec']}s` : 'var(--ce2-clip-dur, 3s)'
      const easing = easingToCss(effect['easing'] as string | undefined)

      switch (effect.kind) {
        case 'motion.float': {
          const amp    = effect['amplitude_px'] ?? 6
          const period = effect['period_sec'] ?? 2.5
          const axis   = (effect['axis'] as string | undefined) ?? 'y'
          this.el.style.setProperty('--ce2-float-amp', String(amp))
          if (axis === 'x') {
            this.el.style.animation = `ce2-float-x ${period}s ${easing} ${delay} infinite`
          } else if (axis === 'both') {
            this.el.style.animation = `ce2-float-both ${period}s ${easing} ${delay} infinite`
          } else {
            this.el.style.animation = `ce2-float ${period}s ${easing} ${delay} infinite`
          }
          break
        }
        case 'motion.pulse':
          this.el.style.setProperty('--ce2-pulse-max', String(effect['scale_max'] ?? 1.08))
          this.el.style.animation = `ce2-pulse ${effect['period_sec'] ?? 1.2}s ${easing} ${delay} infinite`
          break
        case 'motion.shake': {
          const speeds: Record<string, string> = { slow: '0.6s', normal: '0.3s', fast: '0.15s' }
          this.el.style.setProperty('--ce2-shake-amp', String(effect['intensity_px'] ?? 5))
          this.el.style.animation = `ce2-shake ${speeds[effect['speed'] as string] ?? '0.3s'} ${easing} ${delay} infinite`
          break
        }
        case 'motion.move':
          this.el.style.transition = `transform ${dur} ${easing} ${delay}`
          this.el.style.transform = `translate(${effect['from_x'] ?? 0}px, ${effect['from_y'] ?? 0}px)`
          requestAnimationFrame(() => {
            this.el.style.transform = `translate(${effect['to_x'] ?? 0}px, ${effect['to_y'] ?? 0}px)`
          })
          break
        case 'visual.blur':
          this.el.style.transition = `filter ${dur} ${easing} ${delay}`
          this.el.style.filter = `blur(${effect['from_px'] ?? 0}px)`
          requestAnimationFrame(() => {
            this.el.style.filter = `blur(${effect['to_px'] ?? 0}px)`
          })
          break
        case 'blur.gaussian':
          this.el.style.filter = `blur(${effect['radius_px'] ?? 4}px)`
          break
        case 'visual.color_correction':
          this.el.style.filter = [
            effect['brightness'] ? `brightness(${effect['brightness']})` : '',
            effect['contrast']   ? `contrast(${effect['contrast']})` : '',
            effect['saturation'] ? `saturate(${effect['saturation']})` : '',
          ].filter(Boolean).join(' ')
          break
        case 'text.neon': {
          const neonColor = (effect['color'] ?? effect['glow_color'] ?? '#fff') as string
          const neonSize  = (effect['glow_size_px'] as number | undefined) ?? 20
          const neonInt   = (effect['intensity'] as number | undefined) ?? 1
          this.el.style.textShadow =
            `0 0 ${neonSize * 0.4 * neonInt}px ${neonColor},` +
            `0 0 ${neonSize * neonInt}px ${neonColor},` +
            `0 0 ${neonSize * 2 * neonInt}px ${neonColor}`
          break
        }
        case 'text.neon_dummy': // fallthrough prevention
          if (effect['flicker']) {
            this.el.style.animation = `ce2-pulse 0.15s ease-in-out infinite alternate`
          }
          break
        case 'text.shadow':
          this.el.style.textShadow =
            `${effect['offset_x'] ?? 2}px ${effect['offset_y'] ?? 2}px ` +
            `${(effect['blur'] ?? effect['blur_px'] ?? 4)}px ${effect['color'] ?? 'rgba(0,0,0,0.5)'}`
          break
      }
    }
  }

  protected applyTransition(t: Transition, dir: 'in' | 'out', fps: number): void {
    const dur    = t.duration_sec ?? 0.4
    const easing = easingToCss(t.easing as string | undefined)
    const dist   = t['distance_px'] ?? 60

    // ZAVA: {kind:'slide', from:'left'|'right'|'top'|'bottom'} → OSS kind
    let kind = t.kind
    if (kind === 'slide' && t['from']) {
      const MAP: Record<string, string> = {
        left: 'slide_left', right: 'slide_right',
        top:  'slide_down', bottom: 'slide_up',
      }
      kind = MAP[t['from'] as string] ?? 'slide_left'
    }

    const animMap: Record<string, Record<'in' | 'out', string>> = {
      fade:        { in: 'ce2-fade-in',       out: 'ce2-fade-out' },
      slide_left:  { in: 'ce2-slide-in-left', out: 'ce2-fade-out' },
      slide_right: { in: 'ce2-slide-in-right',out: 'ce2-fade-out' },
      slide_up:    { in: 'ce2-slide-in-up',   out: 'ce2-fade-out' },
      slide_down:  { in: 'ce2-slide-in-down', out: 'ce2-fade-out' },
      zoom_in:     { in: 'ce2-zoom-in',       out: 'ce2-zoom-out' },
      zoom_out:    { in: 'ce2-zoom-in',       out: 'ce2-zoom-out' },
      blur_in:     { in: 'ce2-blur-in',       out: 'ce2-blur-out' },
      blur_out:    { in: 'ce2-blur-in',       out: 'ce2-blur-out' },
      fade_to_black:{ in: 'ce2-fade-in',      out: 'ce2-fade-out' },
    }

    const animName = animMap[kind]?.[dir]
    if (!animName) return

    this.el.style.setProperty('--ce2-slide-dist', String(dist))
    if (t['from_scale']) this.el.style.setProperty('--ce2-zoom-from', String(t['from_scale']))
    if (t['to_scale'])   this.el.style.setProperty('--ce2-zoom-to',   String(t['to_scale']))
    if (t['from_px'])    this.el.style.setProperty('--ce2-blur-px',   String(t['from_px']))

    this.el.style.animation = `${animName} ${dur}s ${easing} both`
  }
}

export type Transition = Clip['in_transition'] & {}
