import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class CountdownElement extends BaseElement {
  private inputs: Record<string, unknown>
  private fps: number

  constructor(resolved: ResolvedClip, fps: number, inputs: Record<string, unknown>) {
    super(resolved)
    this.fps    = fps
    this.inputs = inputs
    this.applyCountdownStyle()
    this.updateNumber(resolved.start_frame, fps)
  }

  protected createElement(): HTMLElement {
    const div = document.createElement('div')
    div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;pointer-events:none;'
    return div
  }

  update(frame: number, fps: number): void {
    this.updateNumber(frame, fps)
  }

  private updateNumber(frame: number, fps: number): void {
    const from   = (this.inputs.from_number as number) ?? 5
    const to     = (this.inputs.to_number   as number) ?? 0
    const total  = this.resolved.end_frame - this.resolved.start_frame
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
      display = `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    } else {
      display = String(clamped)
    }
    this.el.textContent = display
  }

  private applyCountdownStyle(): void {
    const color   = (this.inputs.color       as string)  ?? '#ffffff'
    const fsPct   = (this.inputs.font_size_pct as number) ?? 10
    const fontSize = Math.round(fsPct / 100 * 1920)
    Object.assign(this.el.style, {
      fontSize:   `${fontSize}px`,
      fontWeight: '800',
      color,
      textAlign:  'center',
      lineHeight: '1',
      fontFamily: 'system-ui, sans-serif',
    })
  }
}
