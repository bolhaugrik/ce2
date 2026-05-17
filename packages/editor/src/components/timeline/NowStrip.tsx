/**
 * CE2 — NowStrip.
 *
 * Lokális ±N másodperces időszelet a vászon tetején.
 */
import React from 'react'
import type { CE2Composition } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { usePlayerFrame, useSeekPlayer } from '../../state/playerSync.js'
import {
  useResolvedComposition,
  useActiveClipsAt,
  groupActiveByLayer,
  type ActiveClipInWindow,
} from '../../state/compositionTime.js'

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
  windowSec?: number
}

const layerIcons: Record<string, string> = {
  music: '🎵',
  narration: '🎤',
  sfx: '🔊',
  video: '📹',
  pixel: '🖼️',
  vector: '✏️',
}

const LAYER_ORDER = ['music', 'narration', 'sfx', 'video', 'pixel', 'vector'] as const

export const NowStrip: React.FC<Props> = ({ composition, onJumpToClip, windowSec = 2.5 }) => {
  const resolved = useResolvedComposition(composition)
  const frame = usePlayerFrame()
  const seek = useSeekPlayer()
  const fps = resolved.fps

  const windowFrames = windowSec * 2 * fps
  const activeItems = useActiveClipsAt(resolved, frame, windowFrames)
  const grouped = groupActiveByLayer(activeItems)

  const totalSec = resolved.total_frames / fps
  const currentSec = frame / fps

  const handleStripClick = (item: ActiveClipInWindow) => {
    const target = item.active_now ? frame : item.resolved.start_frame
    seek(target)
    if (item.resolved.moment_id) {
      onJumpToClip({
        kind: 'clip',
        moment_id: item.resolved.moment_id,
        clip_id: item.resolved.clip.id,
      })
    } else {
      onJumpToClip({ kind: 'spanning', clip_id: item.resolved.clip.id })
    }
  }

  const handleSeekRelative = (deltaSec: number) => {
    seek(frame + Math.round(deltaSec * fps))
  }

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2 flex flex-col gap-1.5 text-[10px]">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSeekRelative(-0.5)}
          className="px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-900"
          title="-0.5s"
        >
          ◀
        </button>
        <span className="text-gray-500">-{windowSec}s</span>
        <span className="flex-1 text-center font-mono text-gray-900">
          ⏱ {currentSec.toFixed(2)}s / {totalSec.toFixed(1)}s
        </span>
        <span className="text-gray-500">+{windowSec}s</span>
        <button
          onClick={() => handleSeekRelative(0.5)}
          className="px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-900"
          title="+0.5s"
        >
          ▶
        </button>
      </div>

      <div className="relative bg-gray-50 rounded p-1">
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-900/60 pointer-events-none"
          style={{ left: '50%' }}
        />
        <div className="space-y-0.5">
          {LAYER_ORDER.map((layer) => {
            const items = grouped[layer]
            if (items.length === 0) return null
            return (
              <div key={layer} className="flex items-center gap-1.5 h-4">
                <span className="w-4 flex-shrink-0 text-center text-[11px]">
                  {layerIcons[layer]}
                </span>
                <div className="flex-1 relative h-3.5 bg-gray-200/20 rounded overflow-hidden">
                  {items.map((item) => {
                    const totalWindow = windowFrames
                    const left = Math.max(0, item.relative_start)
                    const right = Math.min(totalWindow, item.relative_end)
                    const widthPct = ((right - left) / totalWindow) * 100
                    const leftPct = (left / totalWindow) * 100
                    return (
                      <button
                        key={item.resolved.clip.id}
                        onClick={() => handleStripClick(item)}
                        className={`absolute top-0 bottom-0 rounded text-[9px] px-1 truncate ${
                          item.active_now
                            ? 'bg-gray-900/80 text-white font-semibold'
                            : 'bg-gray-500/40 text-gray-900 hover:bg-gray-500/60'
                        }`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={item.resolved.clip.label || item.resolved.clip.id}
                      >
                        {item.resolved.clip.label || item.resolved.clip.id}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {activeItems.length === 0 && (
            <div className="text-[10px] text-gray-500 text-center py-1">
              Nincs aktív clip a ±{windowSec}s ablakban
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
