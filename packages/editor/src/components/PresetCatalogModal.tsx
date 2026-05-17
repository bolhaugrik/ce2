import React from 'react'
import { useEditorStore } from '../store/useEditorStore.js'
import { ATOMIC_PRESETS, COMPOUND_PRESETS } from '../presets/index.js'
import type { PresetDef } from '../presets/index.js'

export interface PresetCatalogModalProps {
  isOpen: boolean
  /** momentId null = spanning layer */
  momentId: string | null
  onClose: () => void
  onAddSpanning?: () => void
}

export function PresetCatalogModal({ isOpen, momentId, onClose, onAddSpanning }: PresetCatalogModalProps) {
  const { addClip, addSpanningClip, composition } = useEditorStore()

  if (!isOpen) return null

  function handleSelect(preset: PresetDef) {
    // Generate a stable temporary id; store will re-assign proper ids
    const clipId = `preset_${preset.kind}_${Date.now()}`
    const { clips, bundle } = preset.emit(clipId)

    if (momentId === null) {
      // Spanning layer — add all clips to spanning_layers
      for (const clip of clips) {
        addSpanningClip(clip)
      }
    } else {
      for (const clip of clips) {
        addClip(momentId, clip)
      }
    }

    // Attach bundle if produced
    if (bundle) {
      // Directly mutate via store setComposition workaround — use updateClip-side store access
      useEditorStore.setState(s => {
        s.composition.bundles = [...(s.composition.bundles ?? []), bundle]
        s.isDirty = true
      })
    }

    onClose()
  }

  const isSpanning = momentId === null

  return (
    <div className="ce2-modal-overlay" onClick={onClose}>
      <div className="ce2-modal" onClick={e => e.stopPropagation()}>
        <div className="ce2-modal__header">
          <span className="ce2-modal__title">
            {isSpanning ? 'Add Spanning Layer' : 'Add Clip'}
          </span>
          <button className="ce2-btn ce2-btn--ghost ce2-btn--icon" onClick={onClose}>✕</button>
        </div>

        <div className="ce2-modal__body">
          {/* Atomic presets */}
          <div className="ce2-section-title">Atomic</div>
          {ATOMIC_PRESETS.map(preset => (
            <div
              key={preset.kind}
              className="ce2-preset-item"
              onClick={() => handleSelect(preset)}
            >
              <span className="ce2-preset-item__icon">{preset.icon}</span>
              <div className="ce2-preset-item__info">
                <div className="ce2-preset-item__name">{preset.label}</div>
                <div className="ce2-preset-item__desc">{preset.description}</div>
              </div>
              <span className="ce2-preset-item__badge">atomic</span>
            </div>
          ))}

          {/* Compound presets — only for moment layers, not spanning */}
          {!isSpanning && (
            <>
              <div className="ce2-section-title" style={{ marginTop: 8 }}>Compound</div>
              {COMPOUND_PRESETS.map(preset => (
                <div
                  key={preset.kind}
                  className="ce2-preset-item"
                  onClick={() => handleSelect(preset)}
                >
                  <span className="ce2-preset-item__icon">{preset.icon}</span>
                  <div className="ce2-preset-item__info">
                    <div className="ce2-preset-item__name">{preset.label}</div>
                    <div className="ce2-preset-item__desc">{preset.description}</div>
                  </div>
                  <span className="ce2-preset-item__badge">compound</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
