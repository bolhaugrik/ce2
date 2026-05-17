import type { ResolvedClip, TextPayload } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

const ANCHOR_FLEX: Record<string, { justify: string; align: string }> = {
  'top-left':     { justify: 'flex-start', align: 'flex-start' },
  'top':          { justify: 'center',     align: 'flex-start' },
  'top-right':    { justify: 'flex-end',   align: 'flex-start' },
  'left':         { justify: 'flex-start', align: 'center' },
  'center':       { justify: 'center',     align: 'center' },
  'right':        { justify: 'flex-end',   align: 'center' },
  'bottom-left':  { justify: 'flex-start', align: 'flex-end' },
  'bottom':       { justify: 'center',     align: 'flex-end' },
  'bottom-right': { justify: 'flex-end',   align: 'flex-end' },
}

export class TextElement extends BaseElement {
  private inner: HTMLSpanElement
  private typewriterActive = false
  private fullText = ''
  private payload: TextPayload

  constructor(resolved: ResolvedClip) {
    super(resolved)

    const src = resolved.clip.source
    this.payload = src.kind === 'text' ? src.payload : { content: '' }

    // Build inner span and place inside outer el
    this.inner = document.createElement('span')
    this.el.appendChild(this.inner)

    this.applyLayout()
    this.applyTextStyles()

    // Typewriter setup
    const tw = resolved.clip.attached_effects?.find(e => e.kind === 'text.typewriter')
    if (tw) {
      this.typewriterActive = true
      this.fullText = this.payload.content
      this.inner.textContent = ''
    } else {
      this.inner.textContent = this.payload.content
    }

    // Apply remaining effects to the outer el
    if (resolved.clip.attached_effects?.length) {
      this.applyEffects(resolved.clip.attached_effects, 30)
    }
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div')
    // Fills the entire canvas slot; flex positions the inner span
    div.style.cssText = 'width:100%;height:100%;display:flex;pointer-events:none;'
    return div
  }

  update(frame: number, fps: number): void {
    if (!this.typewriterActive) return
    const tw = this.resolved.clip.attached_effects?.find(e => e.kind === 'text.typewriter')
    if (!tw) return
    const elapsed = (frame - this.resolved.start_frame) / fps
    const charsPerSec = (tw['chars_per_sec'] as number) ?? 15
    const n = Math.min(Math.floor(elapsed * charsPerSec), this.fullText.length)
    const cursor = (tw['cursor'] && n < this.fullText.length) ? '|' : ''
    this.inner.textContent = this.fullText.slice(0, n) + cursor
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private applyLayout(): void {
    const pos = this.payload.position
    const key = pos?.anchor ?? 'center'
    const flex = ANCHOR_FLEX[key] ?? ANCHOR_FLEX['center']
    this.el.style.justifyContent = flex.justify
    this.el.style.alignItems     = flex.align
  }

  private applyTextStyles(): void {
    const p  = this.payload
    const s  = this.inner.style
    const px = (v: number) => `${v}px`

    if (p.font_size)       s.fontSize      = px(p.font_size)
    if (p.font_family)     s.fontFamily    = p.font_family
    if (p.font_weight)     s.fontWeight    = String(p.font_weight)
    if (p.font_style)      s.fontStyle     = p.font_style
    if (p.color)           s.color         = p.color
    if (p.text_align)      s.textAlign     = p.text_align
    if (p.line_height)     s.lineHeight    = String(p.line_height)
    if (p.letter_spacing)  s.letterSpacing = px(p.letter_spacing)
    if (p.text_transform)  s.textTransform = p.text_transform

    // x/y offset from anchor point via translate
    const x = p.position?.x ?? 0
    const y = p.position?.y ?? 0
    if (x !== 0 || y !== 0) {
      s.transform = `translate(${x}px, ${y}px)`
    }
  }
}
