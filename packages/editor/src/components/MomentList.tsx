import React, { useState } from 'react'
import type { Clip, Moment } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'
import { PresetCatalogModal } from './PresetCatalogModal.js'

const LAYER_ICON: Record<string, string> = {
  video: '📹', pixel: '🖼', vector: '✏️',
  narration: '🎤', music: '🎵', sfx: '🔊',
}

function clipLabel(clip: Clip): string {
  if (clip.label) return clip.label
  const src = clip.source
  if (src.kind === 'text')     return src.payload.content.slice(0, 24)
  if (src.kind === 'asset')    return src.asset_id || '(no asset)'
  if (src.kind === 'tts')      return src.text.slice(0, 24)
  if (src.kind === 'computed') return src.logic_id
  if (src.kind === 'shape')    return src.shape
  return clip.id
}

// ─── Spanning Layers section ──────────────────────────────────────────────────

function SpanningSection() {
  const { composition, selectedClipId, selectClip, removeSpanningClip } = useEditorStore()
  const [open, setOpen] = useState(true)
  const [presetOpen, setPresetOpen] = useState(false)
  const layers = composition.spanning_layers

  return (
    <div className="ce2-spanning-section-wrap">
      <div className="ce2-spanning-section">
        <span
          className={`ce2-moment-header__arrow ${open ? 'open' : ''}`}
          style={{ fontSize: 10, color: 'var(--ed-text3)', transition: 'transform .15s', cursor: 'pointer', display: 'inline-block' }}
          onClick={() => setOpen(v => !v)}
        >▶</span>
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--ed-text3)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
          Spanning Layers
        </span>
        <span style={{ fontSize: 10, color: 'var(--ed-text3)' }}>{layers.length}</span>
        <button
          className="ce2-btn ce2-btn--ghost ce2-btn--icon"
          title="Add spanning clip"
          onClick={() => setPresetOpen(true)}
        >+</button>
      </div>

      {open && (
        <div className="ce2-clip-list" style={{ paddingLeft: 10 }}>
          {layers.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--ed-text3)', padding: '4px 6px' }}>
              No spanning layers — press + to add
            </div>
          )}
          {layers.map(clip => (
            <div
              key={clip.id}
              className={`ce2-clip-item ${selectedClipId === clip.id ? 'selected' : ''}`}
              onClick={() => selectClip(clip.id)}
            >
              <span className="ce2-clip-item__icon">{LAYER_ICON[clip.layer] ?? '◻'}</span>
              <span className="ce2-clip-item__label">{clipLabel(clip)}</span>
              <span className="ce2-clip-item__layer">{clip.layer}</span>
              <button
                className="ce2-btn ce2-btn--ghost ce2-btn--icon"
                style={{ fontSize: 10, padding: '2px 4px', color: 'var(--ed-text3)' }}
                onClick={e => { e.stopPropagation(); removeSpanningClip(clip.id) }}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <PresetCatalogModal
        isOpen={presetOpen}
        momentId={null}
        onClose={() => setPresetOpen(false)}
      />
    </div>
  )
}

// ─── Moment item ──────────────────────────────────────────────────────────────

function MomentItem({ moment, isFirst, isLast }: { moment: Moment; isFirst: boolean; isLast: boolean }) {
  const {
    selectedClipId, selectedMomentId,
    selectClip, selectMoment,
    removeMoment, removeClip,
    moveMoment, moveClip,
  } = useEditorStore()
  const [open, setOpen] = useState(true)
  const [presetOpen, setPresetOpen] = useState(false)
  const isSelected = selectedMomentId === moment.id && !selectedClipId

  return (
    <div className="ce2-moment-item">
      <div
        className={`ce2-moment-header ${isSelected ? 'selected' : ''}`}
        onClick={() => { selectMoment(moment.id); setOpen(true) }}
      >
        {/* Collapse arrow */}
        <span
          className={`ce2-moment-header__arrow ${open ? 'open' : ''}`}
          onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        >▶</span>

        <span className="ce2-moment-header__label">{moment.label || moment.id}</span>
        <span className="ce2-moment-header__dur">{moment.layers.length}</span>

        {/* Reorder */}
        <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-reorder-btn"
          disabled={isFirst} title="Move up"
          onClick={e => { e.stopPropagation(); moveMoment(moment.id, 'up') }}>↑</button>
        <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-reorder-btn"
          disabled={isLast} title="Move down"
          onClick={e => { e.stopPropagation(); moveMoment(moment.id, 'down') }}>↓</button>

        {/* Add clip via preset catalog */}
        <button className="ce2-btn ce2-btn--ghost ce2-btn--icon" title="Add clip"
          onClick={e => { e.stopPropagation(); setPresetOpen(true) }}>+</button>

        {/* Remove moment */}
        <button className="ce2-btn ce2-btn--ghost ce2-btn--icon" title="Remove moment"
          style={{ color: 'var(--ed-text3)' }}
          onClick={e => { e.stopPropagation(); removeMoment(moment.id) }}>✕</button>
      </div>

      {open && (
        <div className="ce2-clip-list">
          {moment.layers.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--ed-text3)', padding: '4px 6px' }}>No clips — press + to add</div>
          )}
          {moment.layers.map((clip, idx) => (
            <div
              key={clip.id}
              className={`ce2-clip-item ${selectedClipId === clip.id ? 'selected' : ''}`}
              onClick={() => selectClip(clip.id)}
            >
              <span className="ce2-clip-item__icon">{LAYER_ICON[clip.layer] ?? '◻'}</span>
              <span className="ce2-clip-item__label">{clipLabel(clip)}</span>
              <span className="ce2-clip-item__layer">{clip.layer}</span>

              {/* Reorder clip */}
              <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-reorder-btn"
                disabled={idx === 0} title="Move up"
                onClick={e => { e.stopPropagation(); moveClip(clip.id, 'up') }}>↑</button>
              <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-reorder-btn"
                disabled={idx === moment.layers.length - 1} title="Move down"
                onClick={e => { e.stopPropagation(); moveClip(clip.id, 'down') }}>↓</button>

              <button className="ce2-btn ce2-btn--ghost ce2-btn--icon"
                style={{ fontSize: 10, padding: '2px 4px', color: 'var(--ed-text3)' }}
                onClick={e => { e.stopPropagation(); removeClip(clip.id) }} title="Remove">✕</button>
            </div>
          ))}
        </div>
      )}

      <PresetCatalogModal
        isOpen={presetOpen}
        momentId={moment.id}
        onClose={() => setPresetOpen(false)}
      />
    </div>
  )
}

// ─── MomentList root ──────────────────────────────────────────────────────────

export function MomentList() {
  const { composition, selectedMomentId, addMoment } = useEditorStore()
  const moments = composition.moments

  return (
    <>
      <div className="ce2-panel__header">
        Moments
        <button className="ce2-btn ce2-btn--sm ce2-panel__header-action"
          onClick={() => addMoment(selectedMomentId ?? undefined)}>+ Add</button>
      </div>
      <div className="ce2-panel__body">
        <SpanningSection />
        {moments.map((m, i) => (
          <MomentItem key={m.id} moment={m} isFirst={i === 0} isLast={i === moments.length - 1} />
        ))}
      </div>
    </>
  )
}
