const STYLE_ID = 'ce2-browser-styles'

const CSS = `
@keyframes ce2-float {
  0%, 100% { translate: 0 0px; }
  50%       { translate: 0 calc(var(--ce2-float-amp, 6) * 1px); }
}
@keyframes ce2-float-x {
  0%, 100% { translate: 0px 0; }
  50%       { translate: calc(var(--ce2-float-amp, 6) * 1px) 0; }
}
@keyframes ce2-float-both {
  0%, 100% { translate: 0px 0px; }
  25%      { translate: calc(var(--ce2-float-amp, 6) * 0.7px) calc(var(--ce2-float-amp, 6) * -1px); }
  75%      { translate: calc(var(--ce2-float-amp, 6) * -0.7px) calc(var(--ce2-float-amp, 6) * 1px); }
}
@keyframes ce2-pulse {
  0%, 100% { scale: 1; }
  50%       { scale: var(--ce2-pulse-max, 1.08); }
}
@keyframes ce2-shake {
  0%, 100% { translate: 0 0; }
  20%       { translate: calc(var(--ce2-shake-amp, 5) * -1px) 0; }
  40%       { translate: calc(var(--ce2-shake-amp, 5) * 1px) 0; }
  60%       { translate: calc(var(--ce2-shake-amp, 5) * -0.6px) 0; }
  80%       { translate: calc(var(--ce2-shake-amp, 5) * 0.4px) 0; }
}
@keyframes ce2-fade-in {
  from { opacity: 0; }
  to   { opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-fade-out {
  from { opacity: var(--ce2-opacity, 1); }
  to   { opacity: 0; }
}
@keyframes ce2-slide-in-left {
  from { transform: translateX(calc(var(--ce2-slide-dist, 60) * 1px)); opacity: 0; }
  to   { transform: translateX(0); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-slide-in-right {
  from { transform: translateX(calc(var(--ce2-slide-dist, 60) * -1px)); opacity: 0; }
  to   { transform: translateX(0); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-slide-in-up {
  from { transform: translateY(calc(var(--ce2-slide-dist, 60) * 1px)); opacity: 0; }
  to   { transform: translateY(0); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-slide-in-down {
  from { transform: translateY(calc(var(--ce2-slide-dist, 60) * -1px)); opacity: 0; }
  to   { transform: translateY(0); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-zoom-in {
  from { transform: scale(var(--ce2-zoom-from, 0.7)); opacity: 0; }
  to   { transform: scale(1); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-zoom-out {
  from { transform: scale(1); opacity: var(--ce2-opacity, 1); }
  to   { transform: scale(var(--ce2-zoom-to, 0.7)); opacity: 0; }
}
@keyframes ce2-blur-in {
  from { filter: blur(calc(var(--ce2-blur-px, 12) * 1px)); opacity: 0; }
  to   { filter: blur(0); opacity: var(--ce2-opacity, 1); }
}
@keyframes ce2-blur-out {
  from { filter: blur(0); opacity: var(--ce2-opacity, 1); }
  to   { filter: blur(calc(var(--ce2-blur-px, 12) * 1px)); opacity: 0; }
}
.ce2-canvas {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.ce2-clip {
  position: absolute;
  box-sizing: border-box;
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

export function easingToCss(easing?: string): string {
  const map: Record<string, string> = {
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    'back-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'back-in': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
    'bounce-out': 'cubic-bezier(0.34, 1.7, 0.64, 1)',
    'elastic-out': 'cubic-bezier(0.64, 0.57, 0.67, 1.53)',
  }
  return map[easing ?? 'ease-out'] ?? 'ease-out'
}
