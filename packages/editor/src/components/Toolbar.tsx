import React, { useState } from 'react'
import { useEditorStore } from '../store/useEditorStore.js'

interface ToolbarProps {
  onSave?: (comp: ReturnType<typeof useEditorStore.getState>['composition']) => void
}

export function Toolbar({ onSave }: ToolbarProps) {
  const { composition, validation, isDirty, _revalidate } = useEditorStore()
  const [copied, setCopied] = useState(false)

  const handleValidate = () => _revalidate()

  const handleExport = () => {
    const json = JSON.stringify(composition, null, 2)
    navigator.clipboard?.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSave = () => onSave?.(composition)

  return (
    <div className="ce2-toolbar">
      <span className="ce2-toolbar__title">
        {composition.meta.title || 'Untitled'}
        {isDirty && <span style={{ color: 'var(--ed-text3)', marginLeft: 4 }}>•</span>}
      </span>

      <button className="ce2-btn" onClick={handleValidate}>
        Validate
      </button>

      <span
        className={`ce2-valid-badge ${validation.ok ? 'ce2-valid-badge--ok' : 'ce2-valid-badge--err'}`}
        title={validation.ok ? 'Valid' : validation.errors.map(e => e.message).join('\n')}
        onClick={!validation.ok ? handleValidate : undefined}
      >
        {validation.ok ? '✓ Valid' : `✕ ${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''}`}
      </span>

      <button className="ce2-btn" onClick={handleExport}>
        {copied ? '✓ Copied' : '{} JSON'}
      </button>

      {onSave && (
        <button className="ce2-btn ce2-btn--primary" onClick={handleSave}>
          Save
        </button>
      )}
    </div>
  )
}
