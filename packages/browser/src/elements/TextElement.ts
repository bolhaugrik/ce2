import type { ResolvedClip, TextPayload } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

const ANCHOR_TO_CSS: Record<string, { justifyContent: string; alignItems: string }> = {
  'top-left':     { justifyContent: 'flex-start', alignItems: 'flex-start' },
  'top':          { justifyContent: 'center',     alignItems: 'flex-start' },
  'top-right':    { justifyContent: 'flex-end',   alignItems: 'flex-start' },
  'left':         { justifyContent: 'flex-start', alignItems: 'center' },
  'center':       { justifyContent: 'center',     alignItems: 'center' },
  'right':        { justifyContent: 'flex-end',   alignItems: 'center' },
  'bottom-left':  { justifyContent: 'flex-start', alignItems: 'flex-end' },
  'bottom':       { justifyContent: 'center',     alignItems: 'flex-end' },
  'bottom-right': { justifyContent: 'flex-end',   alignItems: 'flex-end' },
}

export class TextElement extends BaseElement {
  private payload: TextPayload
  private typewriterActive = false
  private fullText = ''

  constructor(resolved: ResolvedClip) {
    super(resolved)
    const src = resolved.clip.source
    this.payload = src.kind === 'text' ? src.payload : { content: '' }
    this.applyTextStyles()

    const typewriter = resolved.clip.attached_effects?.find(e => e.kind === 'text.typewriter')
    if (typewriter) {
      this.typewriterActive = true
      this.fullText = this.payload.content
      this.el.textContent = ''
    } else {
      this.el.textContent = this.payload.content
    }

    if (resolved.clip.attached_effects?.length) {
      const durationSec =
        (resolved.end_frame - resolved.start_frame) /
        ((resolved.clip as any)._fps ?? 30)
      this.el.style.setProperty('--ce2-clip-dur', `${durationSec}s`)
      this.applyEffects(resolved.clip.attached_effects!, 30)
    }
  }

  protected createElement(): HTMLElement {
    const el = document.createElement('div')
    el.style.cssText = 'width:100%;height:100%;display:flex;'
    return el
  }

  update(frame: number, fps: number): void {
    if (!this.typewriterActive) return
    const typewriter = this.resolved.clip.attached_effects?.find(e => e.kind === 'text.typewriter')
    if (!typewriter) return

    const elapsed = (frame - this.resolved.start_frame) / fps
    const charsPerSec = (typewriter['chars_per_sec'] as number) ?? 15
    const visibleChars = Math.min(Math.floor(elapsed * charsPerSec), this.fullText.length)
    const cursor = typewriter['cursor'] && visibleChars < this.fullText.length ? '|' : ''
    this.el.textContent = this.fullText.slice(0, visibleChars) + cursor
  }

  private applyTextStyles(): void {
    const p = this.payload
    const posAnchor = p.position?.anchor ?? 'center'
    const css = ANCHOR_TO_CSS[posAnchor] ?? ANCHOR_TO_CSS['center']

    Object.assign(this.el.style, {
      display: 'flex',
      width: '100%',
      height: '100%',
      justifyContent: css.justifyContent,
      alignItems: css.alignItems,
    })

    const inner = document.createElement('span')
    inner.style.cssText = [
      p.font_size      ? `font-size:${p.font_size}px` : '',
      p.font_family    ? `font-family:${p.font_family}` : '',
      p.font_weight    ? `font-weight:${p.font_weight}` : '',
      p.font_style     ? `font-style:${p.font_style}` : '',
      p.color          ? `color:${p.color}` : '',
      p.text_align     ? `text-align:${p.text_align}` : '',
      p.line_height    ? `line-height:${p.line_height}` : '',
      p.letter_spacing ? `letter-spacing:${p.letter_spacing}px` : '',
      p.text_transform ? `text-transform:${p.text_transform}` : '',
      p.position?.x    ? `margin-left:${p.position.x}px` : '',
      p.position?.y    ? `margin-top:${p.position.y}px` : '',
    ].filter(Boolean).join(';')

    this.el.appendChild(inner)
    // Redirect text rendering to inner span
    Object.defineProperty(this, 'el', {
      get: () => inner,
      configurable: true,
    })
    // But keep the outer div in the DOM
    Object.defineProperty(this, '_outerEl', { value: this.el, configurable: true })
  }

  /** Return outer div for DOM insertion */
  get domEl(): HTMLElement {
    return (this as any)._outerEl ?? this.el
  }
}
