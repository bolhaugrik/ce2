import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class ImageElement extends BaseElement {
  protected createElement(): HTMLElement {
    const img       = document.createElement('img')
    const src       = this.resolved.clip.source
    const scale     = src.kind === 'asset' ? ((src as any).scale ?? 1) : 1
    const position  = src.kind === 'asset' ? (src as any).position : null

    img.draggable   = false
    img.style.cssText = [
      'width:100%;height:100%;',
      'object-fit:cover;',
      scale !== 1 ? `transform:scale(${scale});` : '',
      this.positionStyle(position),
    ].join('')
    return img
  }

  setUrl(url: string): void {
    ;(this.el as HTMLImageElement).src = url
  }

  private positionStyle(pos: unknown): string {
    if (!pos || typeof pos !== 'object') return ''
    const p = pos as Record<string, unknown>
    // OSS format: { anchor, x, y }
    if (p.anchor) {
      const MAP: Record<string, string> = {
        'top-left':     'object-position:left top',
        'top':          'object-position:center top',
        'top-right':    'object-position:right top',
        'left':         'object-position:left center',
        'center':       'object-position:center center',
        'right':        'object-position:right center',
        'bottom-left':  'object-position:left bottom',
        'bottom':       'object-position:center bottom',
        'bottom-right': 'object-position:right bottom',
      }
      return (MAP[p.anchor as string] ?? '') + ';'
    }
    // ZAVA format: { kind: 'preset', value } or { kind: 'xy', x_pct, y_pct }
    if (p.kind === 'preset' && p.value) {
      const MAP: Record<string, string> = {
        'top-left':      'object-position:left top',
        'top-center':    'object-position:center top',
        'top-right':     'object-position:right top',
        'middle-left':   'object-position:left center',
        'middle-center': 'object-position:center center',
        'middle-right':  'object-position:right center',
        'bottom-left':   'object-position:left bottom',
        'bottom-center': 'object-position:center bottom',
        'bottom-right':  'object-position:right bottom',
      }
      return (MAP[p.value as string] ?? '') + ';'
    }
    if (p.kind === 'xy') {
      return `object-position:${p.x_pct ?? 50}% ${p.y_pct ?? 50}%;`
    }
    return ''
  }
}
