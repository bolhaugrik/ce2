import type { ResolvedClip, TextPayload } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

const loadedFonts = new Set<string>()
function loadGoogleFont(family: string): void {
  if (typeof document === 'undefined' || loadedFonts.has(family)) return
  loadedFonts.add(family)
  const link = document.createElement('link')
  link.rel  = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700;800;900&display=swap`
  document.head.appendChild(link)
}


export class TextElement extends BaseElement {
  private inner: HTMLSpanElement
  private typewriterActive = false
  private fullText = ''
  private payload: TextPayload

  constructor(resolved: ResolvedClip) {
    super(resolved)

    const src = resolved.clip.source
    if (src.kind === 'text') {
      const raw = src.payload as any
      // ZAVA compat: normalise field names
      this.payload = {
        ...raw,
        content:       raw.content ?? raw.text ?? '',
        font_size:     raw.font_size ?? (raw.font_size_pct != null ? Math.round(raw.font_size_pct / 100 * 1920) : 32),
        text_align:    raw.text_align ?? raw.align,
        letter_spacing: raw.letter_spacing ?? (raw.letter_spacing_em != null
          ? Math.round(raw.letter_spacing_em * (raw.font_size ?? Math.round((raw.font_size_pct ?? 3) / 100 * 1920)))
          : undefined),
      }
    } else {
      this.payload = { content: '' }
    }

    // Build inner span and place inside outer el
    this.inner = document.createElement('span')
    this.el.appendChild(this.inner)

    this.applyLayout()
    this.applyTextStyles()

    // Typewriter setup
    const tw = resolved.clip.attached_effects?.find(e => e.kind === 'text.typewriter')
    if (tw) {
      this.typewriterActive = true
      this.fullText = this.payload.content ?? ''
      this.inner.textContent = ''
    } else {
      this.inner.textContent = this.payload.content ?? ''
    }


  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div')
    // Fills the entire canvas slot; flex positions the inner span
    div.style.cssText = 'width:100%;height:100%;display:flex;pointer-events:none;'
    return div
  }

  update(frame: number, fps: number): void {
    super.update(frame, fps)   // ← frame-alapú transform/opacity/filter
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
    // Pozicionálás kizárólag clip.position (SpatialAnchor) alapján történik.
    // A régi payload.position rendszer el lett távolítva.
    this.el.style.justifyContent = 'center'
    this.el.style.alignItems     = 'center'
  }

  private applyTextStyles(): void {
    const p   = this.payload as any
    const s   = this.inner.style
    const px  = (v: number) => `${v}px`

    if (p.font_size)       s.fontSize      = px(p.font_size)
    if (p.font_family) {
      loadGoogleFont(p.font_family)
      s.fontFamily = `'${p.font_family}', sans-serif`
    }
    if (p.font_weight)     s.fontWeight    = String(p.font_weight)
    if (p.font_style)      s.fontStyle     = p.font_style
    if (p.color)           s.color         = p.color
    if (p.text_align)      s.textAlign     = p.text_align
    if (p.line_height)     s.lineHeight    = String(p.line_height)
    if (p.letter_spacing)  s.letterSpacing = px(p.letter_spacing)
    if (p.text_transform)  s.textTransform = p.text_transform
    if (p.max_width_pct)   s.maxWidth      = `${p.max_width_pct}%`
    if (p.text_align === 'left' && p.max_width_pct) s.textAlign = 'left'
  }
}
