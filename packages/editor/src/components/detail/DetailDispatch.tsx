/**
 * CE2 — DetailDispatch (DetailPanel adaptáció).
 *
 * Selection szerint:
 *  - composition → GlobalsEditor
 *  - moment      → MomentEditor
 *  - bundle      → BundleDetailPanel
 *  - clip / spanning → ClipDetailPanel (6 tab)
 */
import React from 'react'
import type { CE2Composition, Clip, Moment, BundleInstance } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { findSelectedClip, findSelectedMoment, findSelectedBundle } from '../../state/editorState.js'
import { ClipDetailPanel } from './ClipDetailPanel.js'
import { GlobalsEditor } from './GlobalsEditor.js'
import { MomentEditor } from './MomentEditor.js'
import { BundleDetailPanel } from './BundleDetailPanel.js'

interface Props {
  composition: CE2Composition
  selection: Selection
  onUpdateClip: (clipId: string, updater: (c: Clip) => Clip) => void
  onUpdateMoment: (momentId: string, updater: (m: Moment) => Moment) => void
  onUpdateBundle: (bundleId: string, updater: (b: BundleInstance) => BundleInstance) => void
  onUpdateMeta: (updater: (m: CE2Composition['meta']) => CE2Composition['meta']) => void
  onUpdateGlobals: (updater: (g: CE2Composition['globals']) => CE2Composition['globals']) => void
  onUpdateComposition: (updater: (c: CE2Composition) => CE2Composition) => void
}

export const DetailDispatch: React.FC<Props> = ({
  composition,
  selection,
  onUpdateClip,
  onUpdateMoment,
  onUpdateBundle,
  onUpdateMeta,
  onUpdateGlobals,
  onUpdateComposition,
}) => {
  if (selection.kind === 'none') {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 bg-white">
          <div className="text-[9px] uppercase tracking-wider text-gray-500">Detail</div>
          <div className="text-xs font-semibold text-gray-900 mt-0.5">Nincs kiválasztás</div>
        </div>
        <div className="flex-1 flex items-center justify-center text-center p-6 text-xs text-gray-500">
          Válassz egy elemet a vásznon → részletes szerkesztő.
        </div>
      </div>
    )
  }

  if (selection.kind === 'composition') {
    return (
      <GlobalsEditor
        composition={composition}
        onUpdateMeta={onUpdateMeta}
        onUpdateGlobals={onUpdateGlobals}
      />
    )
  }

  if (selection.kind === 'moment') {
    const moment = findSelectedMoment(composition, selection)
    if (!moment) return null
    return <MomentEditor moment={moment} onUpdate={(updater) => onUpdateMoment(moment.id, updater)} />
  }

  if (selection.kind === 'bundle') {
    const bundle = findSelectedBundle(composition, selection)
    if (!bundle) return null
    return (
      <BundleDetailPanel
        bundle={bundle}
        composition={composition}
        onUpdate={(updater) => onUpdateBundle(bundle.id, updater)}
      />
    )
  }

  if (selection.kind === 'clip' || selection.kind === 'spanning') {
    const found = findSelectedClip(composition, selection)
    if (!found) return null
    return (
      <ClipDetailPanel
        clip={found.clip}
        composition={composition}
        onUpdate={(updater) => onUpdateClip(found.clip.id, updater)}
        onUpdateComposition={onUpdateComposition}
      />
    )
  }

  return null
}
