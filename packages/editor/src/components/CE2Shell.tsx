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

interface Props {
  composition: CE2Composition
  setComposition: (c: CE2Composition) => void
  selection: Selection
  onSelect: (sel: Selection) => void
  editorMode: EditorMode
  onEditorMode: (m: EditorMode) => void
}

export const CE2Shell: React.FC<Props> = ({
  composition,
  setComposition,
  selection,
  onSelect,
  editorMode,
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

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {editorMode === 'komp' ? (
        /* KOMP mód: 60% Vászon + 40% Preview/MiniMap */
        <>
          <div
            className="bg-white overflow-hidden flex flex-col min-h-0 border-r border-gray-200/50"
            style={{ width: '60%' }}
          >
            <div className="flex-shrink-0">
              <NowStrip composition={composition} onJumpToClip={onSelect} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
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
          <div
            className="bg-gray-100 overflow-hidden flex flex-col min-h-0"
            style={{ width: '40%' }}
          >
            <div className="flex-1 min-h-0 flex items-center justify-center bg-gray-100">
              <PreviewPanel composition={composition} fullScreen onJumpToClip={onSelect} />
            </div>
            <div className="flex-shrink-0">
              <MiniMap composition={composition} onJumpToClip={onSelect} />
            </div>
          </div>
        </>
      ) : (
        /* DETAIL mód: 22% Kontextus + 56% Detail + 22% Preview kicsi */
        <>
          <div
            className="bg-white overflow-hidden border-r border-gray-200/50"
            style={{ width: '22%' }}
          >
            <ContextRail composition={composition} selection={selection} onSelect={onSelect} />
          </div>
          <div
            className="bg-white overflow-hidden flex flex-col min-h-0 border-r border-gray-200/50"
            style={{ width: '56%' }}
          >
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
          <div
            className="bg-gray-100 overflow-hidden flex flex-col min-h-0"
            style={{ width: '22%' }}
          >
            <div className="flex-shrink-0 bg-gray-100">
              <PreviewPanel composition={composition} onJumpToClip={onSelect} />
            </div>
            <div className="flex-shrink-0">
              <MiniMap composition={composition} onJumpToClip={onSelect} />
            </div>
            <div className="flex-1 min-h-0 px-3 py-3 text-[11px] text-gray-500 overflow-y-auto">
              <div className="text-[9px] uppercase font-bold mb-1 text-gray-900">Tipp</div>
              <p className="leading-relaxed">
                Detail módban szerkesztesz egy elemet. A bal oldalon a Komp szerkezete látszik
                (kontextus). Vissza a Komp módba: kattints a 📝 Komp gombra a topbar-on.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
