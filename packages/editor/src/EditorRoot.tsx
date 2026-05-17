/**
 * CE2 — EditorRoot.
 *
 * Topbar + CE2Shell. A JSON/Vizuális váltó a jobb oszlop tartalmát cseréli
 * (nem full-screen — CE2Shell-be kerül át a viewMode).
 */
import React, { useState, useCallback } from 'react'
import type { CE2Composition } from '@ce2/core'
import type { Selection, EditorMode, ViewMode } from './state/editorState.js'
import { CE2Shell } from './components/CE2Shell.js'
import { ModeSwitcher } from './components/ModeSwitcher.js'
import { ValidationBadge } from './components/ValidationBadge.js'

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
  const [selection,   setSelection]   = useState<Selection>({ kind: 'none' })
  const [editorMode,  setEditorMode]  = useState<EditorMode>('komp')
  const [viewMode,    setViewMode]    = useState<ViewMode>('visual')

  const detailEnabled = selection.kind !== 'none'

  const handleSave = useCallback(() => { onSave?.(composition) }, [composition, onSave])

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
        ...style,
      }}
      className={className}
    >
      {/* Topbar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', height: 44, background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {composition.meta.title ?? 'Untitled'}
        </span>

        <ValidationBadge composition={composition} onJumpToClip={setSelection} />

        <ModeSwitcher
          mode={editorMode}
          onChange={(m) => {
            setEditorMode(m)
            if (m === 'komp') setSelection({ kind: 'none' })
          }}
          detailEnabled={detailEnabled}
        />

        <div style={{ flex: 1 }} />

        {/* ViewSwitcher — jobb oszlop: Preview ↔ JSON */}
        <div style={{ display: 'flex', gap: 2, padding: 2, background: '#f3f4f6', borderRadius: 4 }}>
          {(['visual', 'json'] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: '3px 10px', fontSize: 11, borderRadius: 3, border: 'none', cursor: 'pointer',
                background: viewMode === v ? '#fff' : 'transparent',
                color:      viewMode === v ? '#111827' : '#6b7280',
                boxShadow:  viewMode === v ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
                fontWeight: viewMode === v ? 600 : 400,
              }}
            >
              {v === 'visual' ? '👁 Vizuális' : '{ } JSON'}
            </button>
          ))}
        </div>

        {onSave && (
          <button
            onClick={handleSave}
            style={{ padding: '4px 12px', fontSize: 11, background: '#111827', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
          >
            💾 Mentés
          </button>
        )}
      </div>

      {/* Main — CE2Shell kapja a viewMode-ot, a jobb oszlop kezeli */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
        <CE2Shell
          composition={composition}
          setComposition={setComposition}
          selection={selection}
          onSelect={setSelection}
          editorMode={editorMode}
          onEditorMode={setEditorMode}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}
