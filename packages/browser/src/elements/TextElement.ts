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
      this.fullText = this.payload.content
      this.inner.textContent = ''
    } else {
      this.inner.textContent = this.payload.content
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
    const p   = this.payload as any
    const pos = p.position
    let key   = pos?.anchor ?? 'center'

    // ZAVA preset position → OSS anchor
    if (pos?.kind === 'preset') {
      const MAP: Record<string, string> = {
        'top-left':      'top-left',  'top-center':    'top',
        'top-right':     'top-right', 'middle-left':   'left',
        'middle-center': 'center',    'middle-right':  'right',
        'bottom-left':   'bottom-left','bottom-center':'bottom',
        'bottom-right':  'bottom-right',
      }
      key = MAP[pos.value] ?? 'center'
    } else if (pos?.kind === 'xy') {
      // x_pct: determines horizontal anchor; y_pct: becomes y offset from top
      key = pos.x_pct < 30 ? 'top-left' : pos.x_pct > 70 ? 'top-right' : 'top'
    }

    const flex = ANCHOR_FLEX[key] ?? ANCHOR_FLEX['center']
    this.el.style.justifyContent = flex.justify
    this.el.style.alignItems     = flex.align
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

    // Position offset
    let x = p.position?.x ?? 0
    let y = p.position?.y ?? 0
    // ZAVA xy position: y_pct → translate from top
    if (p.position?.kind === 'xy') {
      x = p.position.x_pct < 30 ? Math.round(p.position.x_pct / 100 * 1080) : 0
      y = Math.round(p.position.y_pct / 100 * 1920)
    }
    if (x !== 0 || y !== 0) s.transform = `translate(${x}px, ${y}px)`
  }
}
