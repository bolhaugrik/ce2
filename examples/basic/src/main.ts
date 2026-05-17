import { validateComposition, type CE2Composition } from '@ce2/core'
import { BrowserRenderer } from '@ce2/browser'

// ─── Composition ─────────────────────────────────────────────────────────────
// 300×533 = iPhone viewport at 77% scale, so demo fits nicely on any screen

const composition: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 300, height: 533, fps: 30, title: 'CE2 Demo' },
  globals: { background_color: '#0d0d1a' },
  assets: [],
  bundles: [],

  // ── Spanning: subtle ambient background pulse ─────────────────────────────
  spanning_layers: [
    {
      id: 'bg_ambient',
      layer: 'vector',
      source: {
        kind: 'shape',
        shape: 'circle',
        geom: { cx: 150, cy: 266, r: 260, fill: 'rgba(99,102,241,0.04)' },
      },
      start: { kind: 'moment_start' },
      duration: { kind: 'fixed_sec', value: 12 },
      attached_effects: [{ kind: 'motion.pulse', scale_max: 1.4, period_sec: 4 }],
    },
  ],

  moments: [
    // ── Moment 1: Intro (4s) ────────────────────────────────────────────────
    {
      id: 'm_intro',
      label: 'Intro',
      layers: [
        {
          id: 'intro_bg',
          layer: 'pixel',
          source: {
            kind: 'shape', shape: 'rect',
            geom: { x: 0, y: 0, width: 300, height: 533, fill: '#0d0d1a' },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        // Decorative top circle
        {
          id: 'deco_circle',
          layer: 'vector',
          source: {
            kind: 'shape', shape: 'circle',
            geom: { cx: 150, cy: 150, r: 80, fill: 'rgba(99,102,241,0.12)', stroke: 'rgba(99,102,241,0.3)', strokeWidth: 1 },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.float', amplitude_px: 10, period_sec: 3 }],
        },
        // CE2 title
        {
          id: 'txt_title',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'CE2',
              font_size: 80,
              font_weight: '800',
              color: '#ffffff',
              text_align: 'center',
              letter_spacing: -2,
              position: { anchor: 'center', y: -40 },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
        },
        // Subtitle — appears when title reaches "static" phase
        {
          id: 'txt_subtitle',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Composition Language',
              font_size: 16,
              color: '#818cf8',
              text_align: 'center',
              letter_spacing: 2,
              text_transform: 'uppercase',
              position: { anchor: 'center', y: 20 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'txt_title.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.6 },
        },
        // Tagline
        {
          id: 'txt_tag',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'JSON → animated multimedia',
              font_size: 13,
              color: '#475569',
              text_align: 'center',
              position: { anchor: 'center', y: 55 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'txt_subtitle.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_up', duration_sec: 0.4 },
        },
      ],
    },

    // ── Moment 2: Features (5s) ─────────────────────────────────────────────
    {
      id: 'm_features',
      label: 'Features',
      transition_in: { kind: 'fade', duration_sec: 0.4 },
      layers: [
        {
          id: 'feat_bg',
          layer: 'pixel',
          source: {
            kind: 'shape', shape: 'rect',
            geom: { x: 0, y: 0, width: 300, height: 533, fill: '#07071a' },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        // Section heading
        {
          id: 'feat_heading',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'HOW IT WORKS',
              font_size: 11,
              font_weight: '600',
              color: '#4f46e5',
              text_align: 'center',
              letter_spacing: 3,
              text_transform: 'uppercase',
              position: { anchor: 'top', y: 80 },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        // Feature 1 — Moments
        {
          id: 'feat1',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: '◈  Moments',
              font_size: 26,
              font_weight: '700',
              color: '#e2e8f0',
              position: { anchor: 'left', x: 32, y: -40 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat_heading.phase.static', offset_sec: 0.1 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'feat1_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Sequential time units — like slides',
              font_size: 13,
              color: '#64748b',
              position: { anchor: 'left', x: 32, y: -8 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat1.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        // Feature 2 — Anchors
        {
          id: 'feat2',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: '⚓  Anchors',
              font_size: 26,
              font_weight: '700',
              color: '#e2e8f0',
              position: { anchor: 'left', x: 32, y: 40 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat1.start', offset_sec: 0.6 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'feat2_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Relational timing — no raw seconds',
              font_size: 13,
              color: '#64748b',
              position: { anchor: 'left', x: 32, y: 72 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat2.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
        },
        // Feature 3 — Bundles
        {
          id: 'feat3',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: '◉  Bundles',
              font_size: 26,
              font_weight: '700',
              color: '#e2e8f0',
              position: { anchor: 'left', x: 32, y: 88 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat2.start', offset_sec: 0.6 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'slide_left', duration_sec: 0.4, easing: 'back-out' },
        },
        {
          id: 'feat3_desc',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Compound presets as first-class entities',
              font_size: 13,
              color: '#64748b',
              position: { anchor: 'left', x: 32, y: 120 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'feat3.phase.static', offset_sec: 0.05 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.3 },
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
          source: {
            kind: 'shape', shape: 'rect',
            geom: { x: 0, y: 0, width: 300, height: 533, fill: '#0a0a1a' },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        // Glow circle
        {
          id: 'cta_glow',
          layer: 'vector',
          source: {
            kind: 'shape', shape: 'circle',
            geom: { cx: 150, cy: 266, r: 120, fill: 'rgba(99,102,241,0.08)' },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          attached_effects: [{ kind: 'motion.pulse', scale_max: 1.3, period_sec: 1.5 }],
        },
        // "Open Source" headline with neon
        {
          id: 'cta_main',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Open Source',
              font_size: 38,
              font_weight: '800',
              color: '#818cf8',
              text_align: 'center',
              position: { anchor: 'center', y: -30 },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
          attached_effects: [{ kind: 'text.neon', color: '#6366f1', intensity: 0.7 }],
        },
        // MIT label
        {
          id: 'cta_mit',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'MIT License',
              font_size: 12,
              color: '#334155',
              text_align: 'center',
              letter_spacing: 2,
              text_transform: 'uppercase',
              position: { anchor: 'center', y: 10 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'cta_main.phase.static', offset_sec: 0.15 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
        // GitHub URL
        {
          id: 'cta_url',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'github.com/bolhaugrik/ce2',
              font_size: 13,
              color: '#4f46e5',
              text_align: 'center',
              position: { anchor: 'center', y: 50 },
            },
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
statusEl.textContent = `✓ Valid composition · ${composition.moments.length} moments`

// ─── Renderer ────────────────────────────────────────────────────────────────

const totalSec =
  composition.moments.reduce(
    (acc, m) => acc + m.layers.reduce((mx, l) => {
      if (l.duration.kind === 'fixed_sec') return Math.max(mx, l.duration.value)
      return Math.max(mx, 4)
    }, 0),
    0,
  )

const renderer = new BrowserRenderer({
  container: document.getElementById('player-container')!,
  composition,
  loop: true,
  fitContainer: true,
})

// ─── Controls ────────────────────────────────────────────────────────────────

const btnPlay     = document.getElementById('btn-play')!    as HTMLButtonElement
const btnStop     = document.getElementById('btn-stop')!    as HTMLButtonElement
const progressFill = document.getElementById('progress-fill')! as HTMLDivElement
const progressWrap = document.getElementById('progress-wrap')! as HTMLDivElement
const timeLabel   = document.getElementById('time-label')!  as HTMLSpanElement
const momentRow   = document.getElementById('moment-row')!  as HTMLDivElement

// Build moment pills
const pills = new Map<string, HTMLButtonElement>()
for (const moment of composition.moments) {
  const pill = document.createElement('button')
  pill.className = 'moment-pill'
  pill.textContent = moment.label ?? moment.id
  pill.onclick = () => {
    // Jump to moment start — calculate approximate frame
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

// Play/pause toggle
btnPlay.onclick = () => {
  if (renderer.isPlaying) {
    renderer.pause()
    btnPlay.textContent = '▶ Play'
  } else {
    renderer.play()
    btnPlay.textContent = '⏸ Pause'
  }
}

btnStop.onclick = () => {
  renderer.stop()
  btnPlay.textContent = '▶ Play'
}

// Progress bar click to seek
progressWrap.onclick = (e) => {
  const rect = progressWrap.getBoundingClientRect()
  const pct = (e.clientX - rect.left) / rect.width
  const totalFrames = composition.meta.fps * totalSec
  renderer.seek(Math.round(pct * totalFrames))
}

// Update UI on moment-change
renderer.on('moment-change', (id) => {
  pills.forEach((pill, momentId) => {
    pill.classList.toggle('active', momentId === id)
  })
})

renderer.on('end', () => {
  btnPlay.textContent = '▶ Play'
})

// Tick: update progress + time label
const TOTAL_FRAMES = composition.meta.fps * totalSec

function uiTick() {
  const frame = renderer.currentFrame
  const pct = TOTAL_FRAMES > 0 ? (frame / TOTAL_FRAMES) * 100 : 0
  progressFill.style.width = `${Math.min(pct, 100)}%`
  const cur = (frame / composition.meta.fps).toFixed(1)
  timeLabel.textContent = `${cur}s / ${totalSec.toFixed(1)}s`
  requestAnimationFrame(uiTick)
}
requestAnimationFrame(uiTick)

// Auto-start
renderer.play()
btnPlay.textContent = '⏸ Pause'
