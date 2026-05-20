import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'


export class CountdownElement extends BaseElement {
  private inputs: Record<string, unknown>
  private fps: number
  private inner: HTMLSpanElement

  constructor(resolved: ResolvedClip, fps: number, inputs: Record<string, unknown>) {
    super(resolved)
    this.fps    = fps
    this.inputs = inputs

    // Inner span tartja a szöveget — az outer flex container pozicionálja
    this.inner = document.createElement('span')
    this.el.appendChild(this.inner)

    this.applyLayout()
    this.applyCountdownStyle()
    this.updateNumber(resolved.start_frame, fps)
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div')
    // Outer: flex container (justify/align beállítva applyLayout-ban a position szerint)
    div.style.cssText = 'width:100%;height:100%;display:flex;pointer-events:none;'
    return div
  }

  update(frame: number, fps: number): void {
    super.update(frame, fps)   // frame-alapú transform/opacity/filter (outer .el)
    this.updateNumber(frame, fps)
  }

  private applyLayout(): void {
    // Pozicionálás kizárólag clip.position (SpatialAnchor) alapján történik.
    this.el.style.justifyContent = 'center'
    this.el.style.alignItems     = 'center'
  }

  private updateNumber(frame: number, _fps: number): void {
    const from    = (this.inputs.from_number as number) ?? 5
    const to      = (this.inputs.to_number   as number) ?? 0
    const total   = this.resolved.end_frame - this.resolved.start_frame
    const elapsed = frame - this.resolved.start_frame
    const progress = total > 0 ? Math.min(elapsed / total, 1) : 0
    const current  = Math.round(from - progress * (from - to))
    const clamped  = from > to ? Math.max(to, current) : Math.min(to, current)

    const format = (this.inputs.format as string) ?? 'integer'
    let display: string
    if (format === 'mm:ss') {
      const m = Math.floor(clamped / 60)
      const s = clamped % 60
      display = `${m}:${s.toString().padStart(2, '0')}`
    } else if (format === 'hh:mm:ss') {
      const h = Math.floor(clamped / 3600)
      const m = Math.floor((clamped % 3600) / 60)
      const s = clamped % 60
      display = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    } else {
      display = String(clamped)
    }
    this.inner.textContent = display
  }

  private applyCountdownStyle(): void {
    const color    = (this.inputs.color       as string)  ?? '#ffffff'
    const fsPct    = (this.inputs.font_size_pct as number) ?? 10
    const fontSize = Math.round(fsPct / 100 * 1920)
    Object.assign(this.inner.style, {
      fontSize:   `${fontSize}px`,
      fontWeight: '800',
      color,
      textAlign:  'center',
      lineHeight: '1',
      fontFamily: 'system-ui, sans-serif',
      display:    'inline-block',
    })
  }
}
