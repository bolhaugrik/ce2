import React, { useState } from 'react'
import type { Clip, Moment } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'

const LAYER_ICON: Record<string, string> = {
  video: '📹', pixel: '🖼', vector: '✏️',
  narration: '🎤', music: '🎵', sfx: '🔊',
}

function clipLabel(clip: Clip): string {
  if (clip.label) return clip.label
  const src = clip.source
  if (src.kind === 'text')     return src.payload.content.slice(0, 24)
  if (src.kind === 'asset')    return src.asset_id
  if (src.kind === 'tts')      return src.text.slice(0, 24)
  if (src.kind === 'computed') return src.logic_id
  if (src.kind === 'shape')    return src.shape
  return clip.id
}

function MomentItem({ moment, isFirst, isLast }: { moment: Moment; isFirst: boolean; isLast: boolean }) {
  const {
    composition, selectedClipId, selectedMomentId,
    selectClip, selectMoment,
    addMoment, removeMoment, addClip, removeClip,
    moveMoment, moveClip,
  } = useEditorStore()
  const [open, setOpen] = useState(true)
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

        {/* Add clip */}
        <button className="ce2-btn ce2-btn--ghost ce2-btn--icon" title="Add text clip"
          onClick={e => {
            e.stopPropagation()
            addClip(moment.id, {
              id: '__new__', layer: 'vector',
              source: { kind: 'text', payload: { content: 'New text', font_size: 32, color: '#ffffff', text_align: 'center', position: { anchor: 'center' } } },
              start: { kind: 'moment_start' },
              duration: { kind: 'fixed_sec', value: 3 },
            })
          }}>+</button>

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
    </div>
  )
}

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
        {moments.map((m, i) => (
          <MomentItem key={m.id} moment={m} isFirst={i === 0} isLast={i === moments.length - 1} />
        ))}
      </div>
    </>
  )
}
