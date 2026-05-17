import type { ResolvedClip } from '@ce2/core'
import { BaseElement } from './BaseElement.js'

export class ImageElement extends BaseElement {
  protected createElement(): HTMLElement {
    const img = document.createElement('img')
    img.draggable = false
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;'
    return img
  }

  setUrl(url: string): void {
    ;(this.el as HTMLImageElement).src = url
  }
}
