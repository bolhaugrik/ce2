/**
 * CE2 — EditorRoot (fő entry point).
 *
 * Topbar: cím + ValidationBadge + ModeSwitcher + ViewSwitcher + Mentés gomb
 * CE2Shell a vizuális módhoz
 * JsonEditorPanel a JSON módhoz
 */
import React, { useState, useCallback } from 'react'
import type { CE2Composition } from '@ce2/core'
import type { Selection, EditorMode, ViewMode } from './state/editorState.js'
import { CE2Shell } from './components/CE2Shell.js'
import { ModeSwitcher } from './components/ModeSwitcher.js'
import { ValidationBadge } from './components/ValidationBadge.js'
import { JsonEditorPanel } from './components/JsonEditorPanel.js'

export interface CE2EditorProps {
  initialComposition: CE2Composition
  onSave?: (comp: CE2Composition) => void
  style?: React.CSSProperties
  className?: string
}

const EMPTY_COMP: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 1080, height: 1920, fps: 30, title: 'Untitled' },
  globals: {},
  assets: [],
  bundles: [],
  spanning_layers: [],
  moments: [{ id: 'm_1', label: 'Moment 1', layers: [] }],
}

export function CE2Editor({ initialComposition, onSave, style, className }: CE2EditorProps) {
  const [composition, setComposition] = useState<CE2Composition>(
    initialComposition ?? EMPTY_COMP,
  )
  const [selection, setSelection] = useState<Selection>({ kind: 'none' })
  const [editorMode, setEditorMode] = useState<EditorMode>('komp')
  const [viewMode, setViewMode] = useState<ViewMode>('visual')

  const detailEnabled = selection.kind !== 'none'

  const handleSave = useCallback(() => {
    onSave?.(composition)
  }, [composition, onSave])

  const handleSetCompositionFromJson = useCallback((comp: CE2Composition) => {
    setComposition(comp)
    setSelection({ kind: 'none' })
    setEditorMode('komp')
  }, [])

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white ${className ?? ''}`}
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif', ...style }}
    >
      {/* Topbar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-3 h-11 bg-white border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">
          {composition.meta.title ?? 'Untitled'}
        </span>

        <ValidationBadge composition={composition} onJumpToClip={setSelection} />

        {viewMode === 'visual' && (
          <ModeSwitcher
            mode={editorMode}
            onChange={(m) => {
              setEditorMode(m)
              // Komp módba váltáskor töröljük a kiválasztást — különben CE2Shell
              // auto-switch effectje azonnal visszavált Detail-be
              if (m === 'komp') setSelection({ kind: 'none' })
            }}
            detailEnabled={detailEnabled}
          />
        )}

        <div className="flex-1" />

        {/* ViewSwitcher */}
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'visual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            👁 Vizuális
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === 'json'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {'{ }'} JSON
          </button>
        </div>

        {onSave && (
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded font-semibold hover:bg-gray-700 transition-colors"
          >
            💾 Mentés
          </button>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
        {viewMode === 'visual' ? (
          <CE2Shell
            composition={composition}
            setComposition={setComposition}
            selection={selection}
            onSelect={setSelection}
            editorMode={editorMode}
            onEditorMode={setEditorMode}
          />
        ) : (
          <JsonEditorPanel
            composition={composition}
            onApply={handleSetCompositionFromJson}
          />
        )}
      </div>
    </div>
  )
}
