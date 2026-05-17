import React from 'react'
import { useEditorStore } from '../store/useEditorStore.js'
import type { CE2Composition } from '@ce2/core'

interface ToolbarProps {
  onSave?: (comp: CE2Composition) => void
  jsonOpen: boolean
  onToggleJson: () => void
}

export function Toolbar({ onSave, jsonOpen, onToggleJson }: ToolbarProps) {
  const { composition, validation, isDirty, _revalidate } = useEditorStore()

  return (
    <div className="ce2-toolbar">
      <span className="ce2-toolbar__title">
        {composition.meta.title || 'Untitled'}
        {isDirty && <span style={{ color: 'var(--ed-text3)', marginLeft: 4 }}>•</span>}
      </span>

      <button className="ce2-btn" onClick={_revalidate}>Validate</button>

      <span
        className={`ce2-valid-badge ${validation.ok ? 'ce2-valid-badge--ok' : 'ce2-valid-badge--err'}`}
        title={validation.ok ? 'Valid' : validation.errors.map(e => e.message).join('\n')}
      >
        {validation.ok
          ? '✓ Valid'
          : `✕ ${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''}`}
      </span>

      <button
        className={`ce2-btn ${jsonOpen ? 'ce2-btn--primary' : ''}`}
        onClick={onToggleJson}
        title="Toggle JSON editor"
      >
        {'{ } JSON'}
      </button>

      {onSave && (
        <button className="ce2-btn ce2-btn--primary" onClick={() => onSave(composition)}>
          Save
        </button>
      )}
    </div>
  )
}
