const STYLE_ID = 'ce2-browser-styles'

const CSS = `
.ce2-canvas {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.ce2-clip {
  position: absolute;
  box-sizing: border-box;
  will-change: transform, opacity, filter;
}
.ce2-clip--hidden {
  display: none !important;
}
.ce2-clip--vector {
  pointer-events: none;
  white-space: pre-wrap;
  word-break: break-word;
}
.ce2-clip--video,
.ce2-clip--pixel {
  object-fit: cover;
}
`

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CSS
  document.head.appendChild(style)
}

/** @deprecated csak backward-compat — a frame-alapú rendszerben nincs CSS easing */
export function easingToCss(_easing?: string): string { return 'ease-out' }
