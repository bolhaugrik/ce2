/**
 * CE2 — Katalógus modal: preset választó.
 *
 * Megjeleníti az atomic és compound preset-eket, és emit-kor a megadott
 * placement-re (spanning / új pillanat / létező pillanat) helyezi a clipeket.
 */
import React, { useState } from 'react'
import type { CE2Composition, Clip } from '@ce2/core'
import { ATOMIC_PRESETS, COMPOUND_PRESETS, type PresetDef } from '../presets/index.js'
import { applyEmitResult, type EmitResult } from '../state/compositionMutations.js'
import type { Selection } from '../state/editorState.js'

interface Props {
  open: boolean
  composition: CE2Composition
  selection: Selection
  onClose: () => void
  onApply: (next: CE2Composition, firstClipId?: string) => void
}

type Placement = 'auto' | 'spanning' | 'new_moment'

export function CatalogModal({ open, composition, selection, onClose, onApply }: Props) {
  const [placement, setPlacement] = useState<Placement>('auto')
  const [category,  setCategory]  = useState<'atomic' | 'compound'>('atomic')

  if (!open) return null

  const handlePick = (preset: PresetDef) => {
    const clipId = `${preset.kind}_${Date.now().toString(36)}`
    const { clips, bundle } = preset.emit(clipId)

    // Resolve placement
    let resolved: EmitResult['placement_resolved']
    if (placement === 'spanning') {
      resolved = { kind: 'spanning' }
    } else if (placement === 'new_moment') {
      resolved = { kind: 'new_moment' }
    } else {
      // auto: ha van kiválasztott pillanat/clip → létező pillanat; egyébként új pillanat
      if (selection.kind === 'moment') {
        resolved = { kind: 'existing_moment', moment_id: selection.moment_id }
      } else if (selection.kind === 'clip' && selection.moment_id) {
        resolved = { kind: 'existing_moment', moment_id: selection.moment_id }
      } else if (selection.kind === 'spanning') {
        resolved = { kind: 'spanning' }
      } else {
        resolved = { kind: 'new_moment' }
      }
    }

    const result: EmitResult = { clips: clips as Clip[], bundle, placement_resolved: resolved }
    const next = applyEmitResult(composition, result)
    onApply(next, clips[0]?.id)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 640, maxWidth: '100%', maxHeight: '85vh',
          background: '#fff', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,.4)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>📚 Hozzáadás — Preset katalógus</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Válassz egy preset-et a komp-hoz adáshoz</div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 4, border: 'none', background: '#f3f4f6', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {/* Placement + category tabs */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Elhelyezés:</span>
          {(['auto', 'spanning', 'new_moment'] as Placement[]).map(p => (
            <button
              key={p}
              onClick={() => setPlacement(p)}
              style={{
                padding: '3px 10px', fontSize: 11, borderRadius: 3, border: '1px solid', cursor: 'pointer',
                background: placement === p ? '#111827' : '#fff',
                color:      placement === p ? '#fff'     : '#374151',
                borderColor: placement === p ? '#111827' : '#d1d5db',
              }}
            >
              {p === 'auto' ? 'Automatikus' : p === 'spanning' ? '🌊 Átívelő' : '＋ Új pillanat'}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {(['atomic', 'compound'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '3px 10px', fontSize: 11, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: category === c ? '#e5e7eb' : 'transparent',
                color:      category === c ? '#111827' : '#6b7280',
                fontWeight: category === c ? 600 : 400,
              }}
            >
              {c === 'atomic' ? 'Atomic' : 'Compound'}
            </button>
          ))}
        </div>

        {/* Preset grid */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
          {(category === 'atomic' ? ATOMIC_PRESETS : COMPOUND_PRESETS).map(preset => (
            <button
              key={preset.kind}
              onClick={() => handlePick(preset)}
              style={{
                textAlign: 'left', padding: 10, borderRadius: 4,
                border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 4, minHeight: 80,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#111827' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb' }}
            >
              <div style={{ fontSize: 20 }}>{preset.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{preset.label}</div>
              <div style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.3 }}>{preset.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
