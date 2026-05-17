import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class ShapeElement extends BaseElement {
  protected createElement(): HTMLElement {
    const src = this.resolved.clip.source
    if (src.kind !== 'shape' && src.kind !== 'svg') {
      return document.createElement('div')
    }

    if (src.kind === 'svg') {
      const div = document.createElement('div')
      div.style.cssText = 'width:100%;height:100%;'
      div.innerHTML = src.payload
      return div
    }

    // shape
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.cssText = 'width:100%;height:100%;overflow:visible;'

    const geom = src.geom as Record<string, unknown>

    switch (src.shape) {
      case 'rect': {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x',      String(geom.x ?? 0))
        rect.setAttribute('y',      String(geom.y ?? 0))
        rect.setAttribute('width',  String(geom.width ?? 100))
        rect.setAttribute('height', String(geom.height ?? 100))
        rect.setAttribute('fill',   String(geom.fill ?? 'transparent'))
        if (geom.stroke)      rect.setAttribute('stroke',       String(geom.stroke))
        if (geom.strokeWidth) rect.setAttribute('stroke-width', String(geom.strokeWidth))
        if (geom.rx)          rect.setAttribute('rx',           String(geom.rx))
        svg.appendChild(rect)
        break
      }
      case 'circle': {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('cx',   String(geom.cx ?? 50))
        circle.setAttribute('cy',   String(geom.cy ?? 50))
        circle.setAttribute('r',    String(geom.r ?? 50))
        circle.setAttribute('fill', String(geom.fill ?? 'transparent'))
        if (geom.stroke)      circle.setAttribute('stroke',       String(geom.stroke))
        if (geom.strokeWidth) circle.setAttribute('stroke-width', String(geom.strokeWidth))
        svg.appendChild(circle)
        break
      }
      case 'line': {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1',     String(geom.x1 ?? 0))
        line.setAttribute('y1',     String(geom.y1 ?? 0))
        line.setAttribute('x2',     String(geom.x2 ?? 100))
        line.setAttribute('y2',     String(geom.y2 ?? 0))
        line.setAttribute('stroke', String(geom.stroke ?? '#fff'))
        if (geom.strokeWidth) line.setAttribute('stroke-width', String(geom.strokeWidth))
        svg.appendChild(line)
        break
      }
    }

    const div = document.createElement('div')
    div.style.cssText = 'width:100%;height:100%;'
    div.appendChild(svg)
    return div
  }
}
