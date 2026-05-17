import React, { useState } from 'react'
import type { Clip, TimeAnchor, Duration } from '@ce2/core'
import { AnchorResolver } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'

type Tab = 'content' | 'timing' | 'effects' | 'general'

// ─── Anchor picker ────────────────────────────────────────────────────────────

function getAnchors(composition: ReturnType<typeof useEditorStore.getState>['composition']) {
  try {
    const resolver = new AnchorResolver({ composition })
    resolver.resolve()
    const map = resolver.getAnchors()
    return Array.from(map.keys()).sort((a, b) => {
      const hardScore = (k: string) =>
        k.startsWith('moment.') ? 2 : k.includes('.phase.enter') || k.includes('.phase.static') ? 1 : 0
      return hardScore(b) - hardScore(a)
    })
  } catch { return [] }
}

function anchorClass(key: string) {
  if (key.startsWith('moment.') || key.includes('.mark.')) return 'hard'
  if (key.endsWith('.start') || key.endsWith('.end') || key.includes('.phase.')) return 'soft'
  return 'derived'
}

function AnchorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { composition } = useEditorStore()
  const anchors = getAnchors(composition)
  return (
    <div className="ce2-anchor-picker">
      {anchors.map(a => (
        <div
          key={a}
          className={`ce2-anchor-option ${value === a ? 'selected' : ''}`}
          onClick={() => onChange(a)}
        >
          <span className={`ce2-anchor-badge ce2-anchor-badge--${anchorClass(a)}`}>
            {anchorClass(a).toUpperCase().slice(0, 1)}
          </span>
          {a}
        </div>
      ))}
    </div>
  )
}

// ─── Timing tab ───────────────────────────────────────────────────────────────

function TimingTab({ clip }: { clip: Clip }) {
  const { updateClip } = useEditorStore()

  const setStart = (start: TimeAnchor) => updateClip(clip.id, { start })
  const setDur   = (duration: Duration) => updateClip(clip.id, { duration })

  const startKind   = clip.start.kind
  const durKind     = clip.duration.kind

  return (
    <div className="ce2-detail-body">
      <div className="ce2-section-title">Start</div>

      <div className="ce2-field">
        <label className="ce2-label">Kind</label>
        <select className="ce2-select" value={startKind} onChange={e => {
          const k = e.target.value as TimeAnchor['kind']
          if (k === 'moment_start')    setStart({ kind: 'moment_start' })
          if (k === 'after_previous')  setStart({ kind: 'after_previous', offset_sec: 0 })
          if (k === 'absolute_sec')    setStart({ kind: 'absolute_sec', value: 0 })
          if (k === 'anchor')          setStart({ kind: 'anchor', anchor_ref: '', offset_sec: 0 })
        }}>
          <option value="moment_start">moment_start</option>
          <option value="after_previous">after_previous</option>
          <option value="anchor">anchor</option>
          <option value="absolute_sec">absolute_sec</option>
        </select>
      </div>

      {startKind === 'after_previous' && (
        <div className="ce2-field">
          <label className="ce2-label">Offset (sec)</label>
          <input type="number" className="ce2-input" step="0.1"
            value={'offset_sec' in clip.start ? (clip.start.offset_sec ?? 0) : 0}
            onChange={e => setStart({ kind: 'after_previous', offset_sec: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )}

      {startKind === 'absolute_sec' && (
        <div className="ce2-field">
          <label className="ce2-label">Value (sec)</label>
          <input type="number" className="ce2-input" step="0.1"
            value={'value' in clip.start ? (clip.start as any).value : 0}
            onChange={e => setStart({ kind: 'absolute_sec', value: parseFloat(e.target.value) || 0 })}
          />
        </div>
      )}

      {startKind === 'anchor' && (
        <>
          <div className="ce2-field">
            <label className="ce2-label">Anchor ref</label>
            <AnchorPicker
              value={'anchor_ref' in clip.start ? clip.start.anchor_ref : ''}
              onChange={ref => setStart({ kind: 'anchor', anchor_ref: ref, offset_sec: 'offset_sec' in clip.start ? clip.start.offset_sec : 0 })}
            />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Offset (sec)</label>
            <input type="number" className="ce2-input" step="0.1"
              value={'offset_sec' in clip.start ? (clip.start.offset_sec ?? 0) : 0}
              onChange={e => setStart({ kind: 'anchor', anchor_ref: ('anchor_ref' in clip.start ? clip.start.anchor_ref : ''), offset_sec: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </>
      )}

      <div className="ce2-section-title" style={{ marginTop: 4 }}>Duration</div>

      <div className="ce2-field">
        <label className="ce2-label">Kind</label>
        <select className="ce2-select" value={durKind} onChange={e => {
          const k = e.target.value as Duration['kind']
          if (k === 'fixed_sec')       setDur({ kind: 'fixed_sec', value: 3 })
          if (k === 'matches_source')  setDur({ kind: 'matches_source' })
          if (k === 'until_moment_end') setDur({ kind: 'until_moment_end' })
          if (k === 'until_anchor')    setDur({ kind: 'until_anchor', anchor_ref: '' })
        }}>
          <option value="fixed_sec">fixed_sec</option>
          <option value="until_moment_end">until_moment_end</option>
          <option value="matches_source">matches_source</option>
          <option value="until_anchor">until_anchor</option>
        </select>
      </div>

      {durKind === 'fixed_sec' && (
        <div className="ce2-field">
          <label className="ce2-label">Seconds</label>
          <input type="number" className="ce2-input" step="0.1" min="0.1"
            value={'value' in clip.duration ? clip.duration.value : 3}
            onChange={e => setDur({ kind: 'fixed_sec', value: Math.max(0.1, parseFloat(e.target.value) || 1) })}
          />
        </div>
      )}

      {durKind === 'until_anchor' && (
        <div className="ce2-field">
          <label className="ce2-label">Anchor ref</label>
          <AnchorPicker
            value={'anchor_ref' in clip.duration ? clip.duration.anchor_ref : ''}
            onChange={ref => setDur({ kind: 'until_anchor', anchor_ref: ref })}
          />
        </div>
      )}

      <div className="ce2-section-title" style={{ marginTop: 4 }}>Transitions</div>
      <div className="ce2-row2">
        <div className="ce2-field">
          <label className="ce2-label">In</label>
          <select className="ce2-select"
            value={clip.in_transition?.kind ?? ''}
            onChange={e => updateClip(clip.id, {
              in_transition: e.target.value ? { kind: e.target.value, duration_sec: 0.4 } : undefined,
            })}
          >
            <option value="">None</option>
            <option value="fade">fade</option>
            <option value="slide_left">slide_left</option>
            <option value="slide_right">slide_right</option>
            <option value="slide_up">slide_up</option>
            <option value="slide_down">slide_down</option>
            <option value="zoom_in">zoom_in</option>
            <option value="blur_in">blur_in</option>
          </select>
        </div>
        <div className="ce2-field">
          <label className="ce2-label">Out</label>
          <select className="ce2-select"
            value={clip.out_transition?.kind ?? ''}
            onChange={e => updateClip(clip.id, {
              out_transition: e.target.value ? { kind: e.target.value, duration_sec: 0.4 } : undefined,
            })}
          >
            <option value="">None</option>
            <option value="fade">fade</option>
            <option value="zoom_out">zoom_out</option>
            <option value="blur_out">blur_out</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// ─── Content tab ──────────────────────────────────────────────────────────────

function ContentTab({ clip }: { clip: Clip }) {
  const { updateClip } = useEditorStore()
  const src = clip.source

  if (src.kind === 'text') {
    const p = src.payload
    const setPayload = (patch: Partial<typeof p>) =>
      updateClip(clip.id, { source: { ...src, payload: { ...p, ...patch } } })
    const setPosition = (patch: Partial<NonNullable<typeof p.position>>) =>
      setPayload({ position: { ...(p.position ?? {}), ...patch } })

    return (
      <div className="ce2-detail-body">
        <div className="ce2-field">
          <label className="ce2-label">Content</label>
          <textarea className="ce2-textarea" value={p.content}
            onChange={e => setPayload({ content: e.target.value })} />
        </div>

        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">Font size</label>
            <input type="number" className="ce2-input" min="6" max="300"
              value={p.font_size ?? 32}
              onChange={e => setPayload({ font_size: parseInt(e.target.value) || 32 })} />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Weight</label>
            <select className="ce2-select" value={p.font_weight ?? '400'}
              onChange={e => setPayload({ font_weight: e.target.value })}>
              <option value="300">300 Light</option>
              <option value="400">400 Regular</option>
              <option value="500">500 Medium</option>
              <option value="600">600 SemiBold</option>
              <option value="700">700 Bold</option>
              <option value="800">800 ExtraBold</option>
            </select>
          </div>
        </div>

        <div className="ce2-field">
          <label className="ce2-label">Color</label>
          <div className="ce2-color-row">
            <div className="ce2-color-swatch" style={{ background: p.color ?? '#ffffff' }}
              onClick={() => document.getElementById(`color-${clip.id}`)?.click()} />
            <input type="color" id={`color-${clip.id}`} className="ce2-color-native"
              value={p.color ?? '#ffffff'}
              onChange={e => setPayload({ color: e.target.value })} />
            <input className="ce2-input" value={p.color ?? '#ffffff'}
              onChange={e => setPayload({ color: e.target.value })} />
          </div>
        </div>

        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">Align</label>
            <select className="ce2-select" value={p.text_align ?? 'center'}
              onChange={e => setPayload({ text_align: e.target.value as any })}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Transform</label>
            <select className="ce2-select" value={p.text_transform ?? 'none'}
              onChange={e => setPayload({ text_transform: e.target.value as any })}>
              <option value="none">None</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </select>
          </div>
        </div>

        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">Letter spacing</label>
            <input type="number" className="ce2-input" step="0.5"
              value={p.letter_spacing ?? 0}
              onChange={e => setPayload({ letter_spacing: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Line height</label>
            <input type="number" className="ce2-input" step="0.1" min="0.5"
              value={p.line_height ?? 1.2}
              onChange={e => setPayload({ line_height: parseFloat(e.target.value) || 1.2 })} />
          </div>
        </div>

        <div className="ce2-section-title">Position</div>
        <div className="ce2-field">
          <label className="ce2-label">Anchor</label>
          <select className="ce2-select" value={p.position?.anchor ?? 'center'}
            onChange={e => setPosition({ anchor: e.target.value as any })}>
            {['top-left','top','top-right','left','center','right','bottom-left','bottom','bottom-right'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">Offset X</label>
            <input type="number" className="ce2-input" step="1"
              value={p.position?.x ?? 0}
              onChange={e => setPosition({ x: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Offset Y</label>
            <input type="number" className="ce2-input" step="1"
              value={p.position?.y ?? 0}
              onChange={e => setPosition({ y: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
      </div>
    )
  }

  // Fallback for non-text sources
  return (
    <div className="ce2-detail-body">
      <div className="ce2-section-title">Source: {src.kind}</div>
      <pre style={{ fontSize: 10, color: 'var(--ed-text3)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {JSON.stringify(src, null, 2)}
      </pre>
    </div>
  )
}

// ─── General tab ──────────────────────────────────────────────────────────────

function GeneralTab({ clip }: { clip: Clip }) {
  const { updateClip } = useEditorStore()
  return (
    <div className="ce2-detail-body">
      <div className="ce2-field">
        <label className="ce2-label">ID</label>
        <input className="ce2-input" value={clip.id} readOnly
          style={{ color: 'var(--ed-text3)', cursor: 'default' }} />
      </div>
      <div className="ce2-field">
        <label className="ce2-label">Label</label>
        <input className="ce2-input" value={clip.label ?? ''}
          placeholder="Optional display name"
          onChange={e => updateClip(clip.id, { label: e.target.value || undefined })} />
      </div>
      <div className="ce2-field">
        <label className="ce2-label">Layer</label>
        <select className="ce2-select" value={clip.layer}
          onChange={e => updateClip(clip.id, { layer: e.target.value as Clip['layer'] })}>
          {(['video','pixel','vector','narration','sfx','music'] as const).map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="ce2-row2">
        <div className="ce2-field">
          <label className="ce2-label">Opacity</label>
          <input type="number" className="ce2-input" step="0.05" min="0" max="1"
            value={clip.opacity ?? 1}
            onChange={e => updateClip(clip.id, { opacity: parseFloat(e.target.value) })} />
        </div>
        <div className="ce2-field">
          <label className="ce2-label">Z-order</label>
          <input type="number" className="ce2-input" step="1"
            value={clip.z_within_layer ?? 0}
            onChange={e => updateClip(clip.id, { z_within_layer: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
    </div>
  )
}

// ─── Effects tab ──────────────────────────────────────────────────────────────

const QUICK_EFFECTS = [
  { kind: 'motion.float',  label: 'Float',   params: { amplitude_px: 6, period_sec: 2.5 } },
  { kind: 'motion.pulse',  label: 'Pulse',   params: { scale_max: 1.08, period_sec: 1.2 } },
  { kind: 'motion.shake',  label: 'Shake',   params: { intensity_px: 5, speed: 'normal' } },
  { kind: 'text.typewriter', label: 'Typewriter', params: { chars_per_sec: 15 } },
  { kind: 'text.neon',     label: 'Neon',    params: { color: '#6366f1', intensity: 1 } },
  { kind: 'text.shadow',   label: 'Shadow',  params: { offset_x: 2, offset_y: 2, blur: 6, color: 'rgba(0,0,0,0.5)' } },
]

function EffectsTab({ clip }: { clip: Clip }) {
  const { updateClip } = useEditorStore()
  const effects = clip.attached_effects ?? []

  const addEffect = (template: typeof QUICK_EFFECTS[0]) => {
    updateClip(clip.id, {
      attached_effects: [...effects, { kind: template.kind, ...template.params }],
    })
  }
  const removeEffect = (idx: number) => {
    updateClip(clip.id, { attached_effects: effects.filter((_, i) => i !== idx) })
  }

  return (
    <div className="ce2-detail-body">
      {effects.length === 0 && (
        <div style={{ color: 'var(--ed-text3)', fontSize: 12 }}>No effects</div>
      )}
      {effects.map((ef, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: 'var(--ed-surface2)', borderRadius: 6, border: '1px solid var(--ed-border)' }}>
          <span style={{ fontSize: 11, flex: 1, fontFamily: 'var(--ed-mono)', color: 'var(--ed-text2)' }}>{ef.kind}</span>
          <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-btn--sm ce2-btn--danger" onClick={() => removeEffect(i)}>✕</button>
        </div>
      ))}
      <div className="ce2-section-title" style={{ marginTop: 4 }}>Add effect</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {QUICK_EFFECTS.map(e => (
          <button key={e.kind} className="ce2-btn ce2-btn--sm" onClick={() => addEffect(e)}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Detail panel root ────────────────────────────────────────────────────────

export function DetailPanel() {
  const { composition, selectedClipId } = useEditorStore()
  const [tab, setTab] = useState<Tab>('content')

  const clip = selectedClipId
    ? composition.moments.flatMap(m => m.layers).find(c => c.id === selectedClipId) ??
      composition.spanning_layers.find(c => c.id === selectedClipId)
    : null

  if (!clip) {
    return (
      <>
        <div className="ce2-panel__header">Detail</div>
        <div className="ce2-detail-empty">Select a clip to edit</div>
      </>
    )
  }

  return (
    <>
      <div className="ce2-panel__header">
        <span style={{ marginRight: 6 }}>
          {clip.layer === 'vector' ? '✏️' : clip.layer === 'video' ? '📹' :
           clip.layer === 'pixel'  ? '🖼'  : clip.layer === 'music' ? '🎵' :
           clip.layer === 'narration' ? '🎤' : '🔊'}
        </span>
        {clip.label || clip.id}
        <span style={{ marginLeft: 6, color: 'var(--ed-text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
          {clip.source.kind}
        </span>
      </div>
      <div className="ce2-tabs">
        {(['content','timing','effects','general'] as Tab[]).map(t => (
          <button key={t} className={`ce2-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'content'  && <ContentTab  clip={clip} />}
      {tab === 'timing'   && <TimingTab   clip={clip} />}
      {tab === 'effects'  && <EffectsTab  clip={clip} />}
      {tab === 'general'  && <GeneralTab  clip={clip} />}
    </>
  )
}
