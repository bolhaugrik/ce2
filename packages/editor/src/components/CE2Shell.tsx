/**
 * CE2 — Editor shell (2-módos layout: Komp / Detail).
 *
 * Komp mód (default): 60% Vászon + 40% Preview/MiniMap.
 * Detail mód (auto-switch kiválasztáskor): 22% Kontextus-rail + 56% Detail + 22% Preview kicsi.
 */
import React, { useState, useCallback, useEffect } from 'react'
import type { CE2Composition, Clip, Moment, BundleInstance } from '@ce2/core'
import type { Selection, EditorMode } from '../state/editorState.js'
import {
  applyEmitResult,
  deleteClip,
  deleteMoment,
  deleteBundle,
  addEmptyMoment,
  type EmitResult,
} from '../state/compositionMutations.js'
import { updateClip, updateMoment, updateBundle, updateGlobals, updateMeta } from '../state/clipMutations.js'
import { CanvasPanel } from './panels/CanvasPanel.js'
import { DetailDispatch } from './detail/DetailDispatch.js'
import { PreviewPanel } from './panels/PreviewPanel.js'
import { ContextRail } from './panels/ContextRail.js'
import { NowStrip } from './timeline/NowStrip.js'
import { MiniMap } from './timeline/MiniMap.js'
import { JsonEditorPanel } from './JsonEditorPanel.js'

interface Props {
  composition: CE2Composition
  setComposition: (c: CE2Composition) => void
  selection: Selection
  onSelect: (sel: Selection) => void
  editorMode: EditorMode
  onEditorMode: (m: EditorMode) => void
  viewMode?: 'visual' | 'json'
}

export const CE2Shell: React.FC<Props> = ({
  composition,
  setComposition,
  selection,
  onSelect,
  editorMode,
  viewMode = 'visual',
  onEditorMode,
}) => {
  /* Auto mode-switch: kiválasztáskor Komp → Detail */
  useEffect(() => {
    if (editorMode === 'komp' && selection.kind !== 'none') {
      onEditorMode('detail')
    }
  }, [selection, editorMode, onEditorMode])

  /* Selection törlése visszaüt Komp módba */
  useEffect(() => {
    if (editorMode === 'detail' && selection.kind === 'none') {
      onEditorMode('komp')
    }
  }, [selection, editorMode, onEditorMode])

  const handleDeleteClip = useCallback(
    (clipId: string) => {
      setComposition(deleteClip(composition, clipId))
      onSelect({ kind: 'none' })
    },
    [composition, setComposition, onSelect],
  )

  const handleDeleteMoment = useCallback(
    (momentId: string) => {
      setComposition(deleteMoment(composition, momentId))
      onSelect({ kind: 'none' })
    },
    [composition, setComposition, onSelect],
  )

  const handleDeleteBundle = useCallback(
    (bundleId: string) => {
      setComposition(deleteBundle(composition, bundleId))
      onSelect({ kind: 'none' })
    },
    [composition, setComposition, onSelect],
  )

  const handleAddMoment = useCallback(() => {
    setComposition(addEmptyMoment(composition))
  }, [composition, setComposition])

  const handleAddSpanning = useCallback(() => {
    // Show a simple prompt to add from preset catalog — for now just emit a music clip
    const newId = `span_${Date.now()}`
    const clip: Clip = {
      id: newId,
      layer: 'music',
      source: { kind: 'asset', asset_id: '' },
      start: { kind: 'moment_start' },
      duration: { kind: 'matches_source' },
    }
    const result: EmitResult = {
      clips: [clip],
      placement_resolved: { kind: 'spanning' },
    }
    setComposition(applyEmitResult(composition, result))
    onSelect({ kind: 'spanning', clip_id: newId })
  }, [composition, setComposition, onSelect])

  const handleUpdateClip = useCallback(
    (clipId: string, updater: (c: Clip) => Clip) => {
      setComposition(updateClip(composition, clipId, updater))
    },
    [composition, setComposition],
  )
  const handleUpdateMoment = useCallback(
    (momentId: string, updater: (m: Moment) => Moment) => {
      setComposition(updateMoment(composition, momentId, updater))
    },
    [composition, setComposition],
  )
  const handleUpdateBundle = useCallback(
    (bundleId: string, updater: (b: BundleInstance) => BundleInstance) => {
      setComposition(updateBundle(composition, bundleId, updater))
    },
    [composition, setComposition],
  )
  const handleUpdateMeta = useCallback(
    (updater: (m: CE2Composition['meta']) => CE2Composition['meta']) => {
      setComposition(updateMeta(composition, updater))
    },
    [composition, setComposition],
  )
  const handleUpdateGlobals = useCallback(
    (updater: (g: CE2Composition['globals']) => CE2Composition['globals']) => {
      setComposition(updateGlobals(composition, updater))
    },
    [composition, setComposition],
  )

  const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }

  // Jobb oszlop tartalma INLINE (NEM inner component — különben minden render remountolja
  // a PreviewPanel-t, ami audio-t újraindítja, gombokat tönkreteszi)
  const rightColumn = (width: string, showPreviewFull: boolean) => (
    <div style={{ ...col, width, background: viewMode === 'json' ? '#0f172a' : '#f3f4f6' }}>
      {viewMode === 'json' ? (
        <JsonEditorPanel composition={composition} onApply={setComposition} />
      ) : (
        <>
          <div style={{
            flexShrink: 0,
            display: 'flex', justifyContent: 'center',
            padding: showPreviewFull ? 0 : 8,
            background: '#f3f4f6',
          }}>
            <div style={{
              width: '100%',
              maxWidth: showPreviewFull ? '100%' : 240,
              display: 'flex', flexDirection: 'column',
              ...(showPreviewFull ? { flex: 1, minHeight: 0 } : {}),
            }}>
              <PreviewPanel composition={composition} fullScreen={showPreviewFull} onJumpToClip={onSelect} />
            </div>
          </div>
          {showPreviewFull && <div style={{ flex: 1, minHeight: 0 }} />}
          <div style={{ flexShrink: 0 }}>
            <MiniMap composition={composition} onJumpToClip={onSelect} />
          </div>
          {!showPreviewFull && (
            <div style={{ flex: 1, minHeight: 0, padding: '12px', fontSize: 11, color: '#6b7280', overflowY: 'auto' }}>
              <div style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4, color: '#111827' }}>Tipp</div>
              <p style={{ lineHeight: 1.5 }}>Detail mód: egy elemet szerkesztesz. Vissza → 📝 Komp.</p>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {editorMode === 'komp' ? (
        /* KOMP mód: 60% Vászon + 40% jobb oszlop */
        <>
          <div style={{ ...col, width: '60%', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
            <div style={{ flexShrink: 0 }}>
              <NowStrip composition={composition} onJumpToClip={onSelect} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <CanvasPanel
                composition={composition}
                selection={selection}
                onSelect={onSelect}
                onAddMoment={handleAddMoment}
                onDeleteClip={handleDeleteClip}
                onDeleteMoment={handleDeleteMoment}
                onDeleteBundle={handleDeleteBundle}
                onAddSpanning={handleAddSpanning}
                onUpdateComposition={(updater) => setComposition(updater(composition))}
              />
            </div>
          </div>
          {rightColumn('40%', true)}
        </>
      ) : (
        /* DETAIL mód: 22% Kontextus + 56% Detail + 22% jobb oszlop */
        <>
          <div style={{ ...col, width: '22%', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
            <ContextRail composition={composition} selection={selection} onSelect={onSelect} />
          </div>
          <div style={{ ...col, width: '56%', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
            <DetailDispatch
              composition={composition}
              selection={selection}
              onUpdateClip={handleUpdateClip}
              onUpdateMoment={handleUpdateMoment}
              onUpdateBundle={handleUpdateBundle}
              onUpdateMeta={handleUpdateMeta}
              onUpdateGlobals={handleUpdateGlobals}
              onUpdateComposition={(updater) => setComposition(updater(composition))}
            />
          </div>
          {rightColumn('22%', false)}
        </>
      )}
    </div>
  )
}
