import { validateComposition, type CE2Composition } from '@ce2/core'
import { BrowserRenderer } from '@ce2/browser'

// ─── Composition ─────────────────────────────────────────────────────────────
// Canvas: 300 × 533
// Anchor 'top-left' + y = pixels from top, x = pixels from left
// Anchor 'top'       + y = pixels from top, horizontally centered
// Anchor 'center'    + y = pixels offset from canvas center (266px)

const composition: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 300, height: 533, fps: 30, title: 'CE2 Demo' },
  globals: { background_color: '#0d0d1a' },
  assets: [],
  bundles: [],

  spanning_layers: [
    {
      id: 'bg_ambient',
      layer: 'vector',
      source: { kind: 'shape', shape: 'circle', geom: { cx: 150, cy: 266, r: 260, fill: 'rgba(99,102,241,0.04)' } },
      start: { kind: 'moment_start' },
      duration: { kind: 'fixed_sec', value: 14 },
      attached_effects: [{ kind: 'motion.pulse', scale_max: 1.4, period_sec: 4 }],
    },
  ],

  moments: [
    // ── Moment 1: Intro (4s) ────────────────────────────────────────────────
    {
      id: 'm_intro',
      label: 'Intro',
      layers: [
        // Background
        {
          id: 'intro_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 300, height: 533, fill: '#0d0d1a' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        // Decorative circle — centered at 150, 160
        {
          id: 'deco_circle',
          layer: 'vector',
          source: { kind: 'shape', shape: 'circle', geom: { cx: 0, cy: 0, r: 75, fill: 'rgba(99,102,241,0.10)', stroke: 'rgba(99,102,241,0.25)', strokeWidth: 1 } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.float', amplitude_px: 8, period_sec: 3 }],
        },
        // CE2 title — centered, 40px above canvas center
        {
          id: 'txt_title',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'CE2', font_size: 88, font_weight: '800', color: '#ffffff', text_align: 'center', letter_spacing: -3, position: { anchor: 'center', y: -20 } },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
        },
        // Subtitle — appears when title reaches static phase
        {
          id: 'txt_subtitle',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'Composition Language', font_size: 15, color: '#818cf8', text_align: 'center', letter_spacing: 3, text_transform: 'uppercase', position: { anchor: 'center', y: 50 } },
          },
          start: { kind: 'anchor', anchor_ref: 'txt_title.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.5 },
        },
        // Tagline
        {
          id: 'txt_tag',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'JSON → animated multimedia', font_size: 12, color: '#475569', text_align: 'center', position: { anchor: 'center', y: 82 } },
          },
          start: { kind: 'anchor', anchor_ref: 'txt_subtitle.phase.static', offset_sec: 0.15 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.35 },
        },
      ],
    },

    // ── Moment 2: Features (5s) ─────────────────────────────────────────────
    // Canvas: 533px tall. Feature area: y=100 → y=460 (360px)
    // 3 blocks × (title 30px + gap 18px + desc 18px) = 3 × 66 = 198px
    // Space left: 360 - 198 = 162px → 4 gaps of 40px each
    // feat1 title top: 100 + 40 = 140
    // feat1 desc  top: 140 + 30 + 8 = 178
    // feat2 title top: 178 + 18 + 40 = 236
    // feat2 desc  top: 236 + 30 + 8 = 274
    // feat3 title top: 274 + 18 + 40 = 332
    // feat3 desc  top: 332 + 30 + 8 = 370
    {
      id: 'm_features',
      label: 'Features',
      transition_in: { kind: 'fade', duration_sec: 0.4 },
      layers: [
        {
          id: 'feat_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 300, height: 533, fill: '#07071a' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        // Section heading — centered, 85px from top
        {
          id: 'feat_heading',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'HOW IT WORKS', font_size: 10, font_weight: '600', color: '#4f46e5', text_align: 'center', letter_spacing: 3, text_transform: 'uppercase', position: { anchor: 'top', y: 85 } },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        // ── Feature 1: Moments ───
        {
          id: 'feat1',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: '◈  Moments', font_size: 24, font_weight: '700', color: '#e2e8f0', position: { anchor: 'top-left', x: 28, y: 140 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat_heading.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.35, easing: 'back-out' },
        },
        {
          id: 'feat1_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'Sequential time units — like slides', font_size: 12, color: '#64748b', position: { anchor: 'top-left', x: 28, y: 178 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat1.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
        // ── Feature 2: Anchors ───
        {
          id: 'feat2',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: '⚓  Anchors', font_size: 24, font_weight: '700', color: '#e2e8f0', position: { anchor: 'top-left', x: 28, y: 236 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat1.start', offset_sec: 0.55 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.35, easing: 'back-out' },
        },
        {
          id: 'feat2_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'Relational timing — no raw seconds', font_size: 12, color: '#64748b', position: { anchor: 'top-left', x: 28, y: 274 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat2.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
        // ── Feature 3: Bundles ───
        {
          id: 'feat3',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: '◉  Bundles', font_size: 24, font_weight: '700', color: '#e2e8f0', position: { anchor: 'top-left', x: 28, y: 332 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat2.start', offset_sec: 0.55 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.35, easing: 'back-out' },
        },
        {
          id: 'feat3_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'Compound presets as first-class entities', font_size: 12, color: '#64748b', position: { anchor: 'top-left', x: 28, y: 370 } },
          },
          start: { kind: 'anchor', anchor_ref: 'feat3.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.25 },
        },
      ],
    },

    // ── Moment 3: CTA (3s) ──────────────────────────────────────────────────
    {
      id: 'm_cta',
      label: 'CTA',
      transition_in: { kind: 'fade', duration_sec: 0.5 },
      layers: [
        {
          id: 'cta_bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 300, height: 533, fill: '#0a0a1a' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        {
          id: 'cta_glow',
          layer: 'vector',
          source: { kind: 'shape', shape: 'circle', geom: { cx: 0, cy: 0, r: 110, fill: 'rgba(99,102,241,0.08)' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.3, period_sec: 1.5 }],
        },
        {
          id: 'cta_main',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'Open Source', font_size: 36, font_weight: '800', color: '#818cf8', text_align: 'center', position: { anchor: 'center', y: -28 } },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
          attached_effects: [{ kind: 'text.neon', color: '#6366f1', intensity: 0.6 }],
        },
        {
          id: 'cta_mit',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'MIT License', font_size: 11, color: '#334155', text_align: 'center', letter_spacing: 2, text_transform: 'uppercase', position: { anchor: 'center', y: 12 } },
          },
          start: { kind: 'anchor', anchor_ref: 'cta_main.phase.static', offset_sec: 0.15 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        {
          id: 'cta_url',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: { content: 'github.com/bolhaugrik/ce2', font_size: 13, color: '#4f46e5', text_align: 'center', position: { anchor: 'center', y: 52 } },
          },
          start: { kind: 'anchor', anchor_ref: 'cta_mit.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.4 },
        },
      ],
    },
  ],
}

// ─── Validate ────────────────────────────────────────────────────────────────

const statusEl = document.getElementById('status')!
const validation = validateComposition(composition)
if (!validation.ok) {
  statusEl.className = 'error'
  statusEl.textContent = validation.errors.map(e => `[${e.code}] ${e.message}`).join(' · ')
  throw new Error('Invalid composition')
}
statusEl.textContent = `✓ Valid · ${composition.moments.length} moments · ${[...composition.moments.flatMap(m => m.layers), ...composition.spanning_layers].length} clips`

// ─── Renderer ────────────────────────────────────────────────────────────────

const TOTAL_SEC = 12

// Build asset URL map from composition.assets
const assetMap: Record<string, string> = {}
for (const a of composition.assets) {
  if (a.url) assetMap[a.id] = a.url
}

const renderer = new BrowserRenderer({
  container: document.getElementById('player-container')!,
  composition,
  assets: assetMap,
  loop: true,
  fitContainer: true,
})

// ─── JSON panel ──────────────────────────────────────────────────────────────

function highlightJson(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2)
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (m) => {
        if (/^"/.test(m)) return /:$/.test(m) ? `<span class="jk">${m}</span>` : `<span class="js">${m}</span>`
        if (/true|false/.test(m)) return `<span class="jb">${m}</span>`
        if (/null/.test(m)) return `<span class="jn">${m}</span>`
        return `<span class="ji">${m}</span>`
      },
    )
}

const jsonTabFull    = document.getElementById('json-tab-full')!
const jsonTabMoment  = document.getElementById('json-tab-moment')!
const jsonContent    = document.getElementById('json-content')! as HTMLElement
let jsonMode: 'full' | 'moment' = 'moment'
let currentMomentId = composition.moments[0].id

function renderJson() {
  if (jsonMode === 'full') {
    jsonContent.innerHTML = highlightJson(composition)
  } else {
    const moment = composition.moments.find(m => m.id === currentMomentId)
    jsonContent.innerHTML = highlightJson(moment)
  }
}

jsonTabFull.onclick = () => {
  jsonMode = 'full'
  jsonTabFull.classList.add('active')
  jsonTabMoment.classList.remove('active')
  renderJson()
}
jsonTabMoment.onclick = () => {
  jsonMode = 'moment'
  jsonTabMoment.classList.add('active')
  jsonTabFull.classList.remove('active')
  renderJson()
}

document.getElementById('json-copy')!.onclick = () => {
  const text = jsonMode === 'full'
    ? JSON.stringify(composition, null, 2)
    : JSON.stringify(composition.moments.find(m => m.id === currentMomentId), null, 2)
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('json-copy')!
    btn.textContent = '✓ Copied'
    setTimeout(() => { btn.textContent = 'Copy' }, 1500)
  })
}

renderJson()

// ─── Controls ────────────────────────────────────────────────────────────────

const btnPlay      = document.getElementById('btn-play')!     as HTMLButtonElement
const btnStop      = document.getElementById('btn-stop')!     as HTMLButtonElement
const progressFill = document.getElementById('progress-fill')! as HTMLDivElement
const progressWrap = document.getElementById('progress-wrap')! as HTMLDivElement
const timeLabel    = document.getElementById('time-label')!   as HTMLSpanElement
const momentRow    = document.getElementById('moment-row')!   as HTMLDivElement

// Moment pills
const pills = new Map<string, HTMLButtonElement>()
for (const moment of composition.moments) {
  const pill = document.createElement('button')
  pill.className = 'moment-pill'
  pill.textContent = moment.label ?? moment.id
  pill.onclick = () => {
    let frame = 0
    for (const m of composition.moments) {
      if (m.id === moment.id) break
      const dur = m.layers.reduce((mx, l) =>
        l.duration.kind === 'fixed_sec' ? Math.max(mx, l.duration.value) : Math.max(mx, 4), 0)
      frame += dur * composition.meta.fps
    }
    renderer.seek(Math.round(frame))
  }
  pills.set(moment.id, pill)
  momentRow.appendChild(pill)
}
pills.get(composition.moments[0].id)?.classList.add('active')

btnPlay.onclick = () => {
  if (renderer.isPlaying) { renderer.pause(); btnPlay.textContent = '▶ Play' }
  else                    { renderer.play();  btnPlay.textContent = '⏸ Pause' }
}
btnStop.onclick = () => { renderer.stop(); btnPlay.textContent = '▶ Play' }

progressWrap.onclick = (e) => {
  const r = progressWrap.getBoundingClientRect()
  renderer.seek(Math.round(((e.clientX - r.left) / r.width) * TOTAL_SEC * composition.meta.fps))
}

renderer.on('moment-change', (id) => {
  currentMomentId = id as string
  pills.forEach((pill, mid) => pill.classList.toggle('active', mid === id))
  if (jsonMode === 'moment') renderJson()
})
renderer.on('end', () => { btnPlay.textContent = '▶ Play' })

const TOTAL_FRAMES = composition.meta.fps * TOTAL_SEC
function uiTick() {
  const pct = Math.min((renderer.currentFrame / TOTAL_FRAMES) * 100, 100)
  progressFill.style.width = `${pct}%`
  timeLabel.textContent = `${renderer.currentTimeSec.toFixed(1)}s / ${TOTAL_SEC}.0s`
  requestAnimationFrame(uiTick)
}
requestAnimationFrame(uiTick)

renderer.play()
btnPlay.textContent = '⏸ Pause'
