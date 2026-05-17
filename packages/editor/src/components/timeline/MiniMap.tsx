/**
 * CE2 — MiniMap.
 *
 * Vékony csík a teljes komp-ot megjelenítve.
 */
import React, { useState, useMemo, useRef } from 'react'
import type { CE2Composition } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { usePlayerFrame, useSeekPlayer } from '../../state/playerSync.js'
import { useResolvedComposition, useAnchorMarkers } from '../../state/compositionTime.js'

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
}

export const MiniMap: React.FC<Props> = ({ composition, onJumpToClip }) => {
  const [open, setOpen] = useState(false)
  const resolved = useResolvedComposition(composition)
  const frame = usePlayerFrame()
  const seek = useSeekPlayer()
  const containerRef = useRef<HTMLDivElement>(null)
  const fps = resolved.fps

  const anchors = useAnchorMarkers(resolved)
  const visibleAnchors = useMemo(() => anchors.filter((a) => a.class !== 'derived'), [anchors])

  const totalFrames = resolved.total_frames
  const playheadPct = totalFrames > 0 ? (frame / totalFrames) * 100 : 0

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seek(Math.round(pct * totalFrames))
  }

  const handleAnchorClick = (e: React.MouseEvent, name: string, anchorFrame: number) => {
    e.stopPropagation()
    seek(anchorFrame)
    const parts = name.split('.')
    if (parts[0] === 'moment' && parts[1]) {
      onJumpToClip({ kind: 'moment', moment_id: parts[1] })
      return
    }
    const clipId = parts[0]
    const moment = composition.moments.find((m) => m.layers.some((c) => c.id === clipId))
    if (moment) {
      onJumpToClip({ kind: 'clip', moment_id: moment.id, clip_id: clipId })
    } else if (composition.spanning_layers.some((c) => c.id === clipId)) {
      onJumpToClip({ kind: 'spanning', clip_id: clipId })
    }
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-center gap-2 px-3 py-1 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
      >
        <span>{open ? '▾' : '▴'}</span>
        <span>MiniMap (teljes komp · {(totalFrames / fps).toFixed(1)}s)</span>
        {!open && (
          <span className="font-mono text-gray-900">⏱ {(frame / fps).toFixed(2)}s</span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-2 space-y-1">
          {/* Pillanat-szegmensek */}
          <div className="flex h-3 rounded overflow-hidden bg-gray-200/30">
            {composition.moments.map((m, idx) => {
              const mt = resolved.moment_times[m.id]
              if (!mt) return null
              const widthPct = ((mt.end - mt.start) / totalFrames) * 100
              return (
                <div
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    seek(mt.start)
                    onJumpToClip({ kind: 'moment', moment_id: m.id })
                  }}
                  className="border-r border-white/40 hover:opacity-80 cursor-pointer flex items-center justify-center text-[8px] text-white font-bold"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: idx % 2 === 0 ? '#0b4858' : '#1a6b80',
                  }}
                  title={`${m.label ?? m.id} (${(mt.start / fps).toFixed(1)}–${(mt.end / fps).toFixed(1)}s)`}
                >
                  {widthPct > 8 && (m.label ?? `#${idx + 1}`)}
                </div>
              )
            })}
          </div>

          {/* Time bar with anchors + playhead */}
          <div
            ref={containerRef}
            onClick={handleBarClick}
            className="relative h-6 bg-white border border-gray-200 rounded cursor-pointer"
          >
            {visibleAnchors.map((a) => {
              const leftPct = (a.frame / totalFrames) * 100
              const isHard = a.class === 'hard'
              return (
                <button
                  key={a.name}
                  onClick={(e) => handleAnchorClick(e, a.name, a.frame)}
                  className={`absolute top-1 bottom-1 w-1 rounded ${
                    isHard ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                  style={{ left: `calc(${leftPct}% - 2px)` }}
                  title={`${a.name} @ ${(a.frame / fps).toFixed(2)}s (${a.class})`}
                />
              )
            })}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-600 pointer-events-none"
              style={{ left: `calc(${playheadPct}% - 1px)` }}
            />
            <div
              className="absolute -top-1 w-2.5 h-2.5 bg-red-600 rounded-full pointer-events-none"
              style={{ left: `calc(${playheadPct}% - 5px)` }}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-gray-500">
            <span>0s</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-600 rounded inline-block"></span> HARD
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded inline-block"></span> SOFT
              </span>
            </span>
            <span>{(totalFrames / fps).toFixed(1)}s</span>
          </div>
        </div>
      )}
    </div>
  )
}
