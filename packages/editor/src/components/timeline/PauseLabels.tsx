/**
 * CE2 — PauseLabels.
 *
 * Pause állapotban a preview-n megjelenik egy floating panel az aktív
 * vizuális clipek nevével + ↗ ugrás gombbal.
 */
import React from 'react'
import type { CE2Composition, Clip } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { usePlayerFrame, usePlayerPlaying } from '../../state/playerSync.js'
import { useResolvedComposition, useActiveClipsAt } from '../../state/compositionTime.js'

// Inline helpers (isVisualLayer/isAudioLayer nem exportált az @ce2/core-ból)
const isVisualLayer = (l: string) => ['video', 'pixel', 'vector'].includes(l)
const isAudioLayer = (l: string) => ['music', 'narration', 'sfx'].includes(l)

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
}

const layerIcons: Record<string, string> = {
  music: '🎵',
  narration: '🎤',
  sfx: '🔊',
  video: '📹',
  pixel: '🖼️',
  vector: '✏️',
}

const labelOrId = (clip: Clip): string => clip.label || clip.id

const handleJump = (
  composition: CE2Composition,
  clipId: string,
  onJumpToClip: (sel: Selection) => void,
) => {
  const moment = composition.moments.find((m) => m.layers.some((c) => c.id === clipId))
  if (moment) {
    onJumpToClip({ kind: 'clip', moment_id: moment.id, clip_id: clipId })
  } else if (composition.spanning_layers.some((c) => c.id === clipId)) {
    onJumpToClip({ kind: 'spanning', clip_id: clipId })
  }
}

const COLLAPSE_KEY = 'ce2.pauseLabels.collapsed'

const loadCollapsed = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(COLLAPSE_KEY) === '1'
}

export const PauseLabelsOverlay: React.FC<Props> = ({ composition, onJumpToClip }) => {
  const isPlaying = usePlayerPlaying()
  const frame = usePlayerFrame()
  const resolved = useResolvedComposition(composition)
  const active = useActiveClipsAt(resolved, frame, 0)
  const [collapsed, setCollapsed] = React.useState<boolean>(loadCollapsed)

  const toggle = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0') } catch { /* ignore */ }
      return next
    })
  }, [])

  if (isPlaying) return null

  const activeNow = active.filter((a) => a.active_now)
  const visualClips = activeNow.filter((a) => isVisualLayer(a.resolved.clip.layer))

  if (visualClips.length === 0) return null

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg w-7 h-7 flex items-center justify-center text-[11px] hover:bg-gray-50 pointer-events-auto"
        title={`⏸ Aktív vizuális (${visualClips.length}) — kibontás`}
      >
        <span className="font-bold text-gray-900">⏸{visualClips.length}</span>
      </button>
    )
  }

  return (
    <div className="absolute top-2 right-2 max-w-[80%] z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded shadow-lg p-1.5 flex flex-col gap-1 pointer-events-auto">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-[8px] uppercase font-bold text-gray-500">⏸ Aktív vizuális</span>
        <button
          onClick={toggle}
          className="text-gray-500 hover:text-gray-900 text-[12px] leading-none w-4 h-4 flex items-center justify-center rounded hover:bg-gray-50"
        >
          −
        </button>
      </div>
      {visualClips.map((a) => (
        <button
          key={a.resolved.clip.id}
          onClick={() => handleJump(composition, a.resolved.clip.id, onJumpToClip)}
          className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] hover:bg-gray-50 text-left"
        >
          <span>{layerIcons[a.resolved.clip.layer]}</span>
          <span className="flex-1 truncate text-gray-900 font-medium">
            {labelOrId(a.resolved.clip)}
          </span>
          <span className="text-gray-500">↗</span>
        </button>
      ))}
    </div>
  )
}

export const AudioActivePanel: React.FC<Props> = ({ composition, onJumpToClip }) => {
  const frame = usePlayerFrame()
  const resolved = useResolvedComposition(composition)
  const active = useActiveClipsAt(resolved, frame, 0)
  const audioClips = active
    .filter((a) => a.active_now)
    .filter((a) => isAudioLayer(a.resolved.clip.layer))

  if (audioClips.length === 0) {
    return (
      <div className="px-3 py-1.5 text-[10px] text-gray-500 text-center bg-gray-900">
        — nincs aktív audio —
      </div>
    )
  }

  return (
    <div className="px-2 py-1.5 flex flex-col gap-1 bg-gray-900/60 border-t border-gray-200/40">
      {audioClips.map((a) => (
        <button
          key={a.resolved.clip.id}
          onClick={() => handleJump(composition, a.resolved.clip.id, onJumpToClip)}
          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] hover:bg-gray-100 text-left"
        >
          <span>{layerIcons[a.resolved.clip.layer]}</span>
          <span className="flex-1 truncate text-gray-200">{labelOrId(a.resolved.clip)}</span>
          <span className="text-gray-400">↗</span>
        </button>
      ))}
    </div>
  )
}
