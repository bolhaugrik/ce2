/**
 * CE2 — ValidationBadge.
 *
 * Topbar-ban: live validáció. Ha 0 hiba → ✅ badge, ha >0 → ⚠️ piros badge.
 */
import React, { useMemo, useState } from 'react'
import type { CE2Composition } from '@ce2/core'
import { validateComposition } from '@ce2/core'
import type { Selection } from '../state/editorState.js'

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
}

export const ValidationBadge: React.FC<Props> = ({ composition, onJumpToClip }) => {
  const result = useMemo(() => validateComposition(composition), [composition])
  const [open, setOpen] = useState(false)

  const errors = result.errors ?? []
  const errorCount = errors.length

  const handleJump = (err: { path?: string }) => {
    // Try to extract a clip_id from the path
    const path = err.path ?? ''
    const match = path.match(/layers\[(\d+)\]/)
    if (!match) return

    // Try to find clip by path traversal
    const momentMatch = path.match(/moments\[(\d+)\]/)
    if (momentMatch) {
      const momentIdx = parseInt(momentMatch[1], 10)
      const layerIdx = parseInt(match[1], 10)
      const moment = composition.moments[momentIdx]
      const clip = moment?.layers[layerIdx]
      if (moment && clip) {
        onJumpToClip({ kind: 'clip', moment_id: moment.id, clip_id: clip.id })
      }
    }
    setOpen(false)
  }

  if (errorCount === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-green-50 text-green-700 border border-green-200"
        title="Minden anchor-referencia érvényes"
      >
        ✅ <span className="hidden sm:inline">OK</span>
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
        title={`${errorCount} hiba`}
      >
        ⚠️ <span className="font-semibold">{errorCount}</span>
      </button>
      {open && (
        <div
          className="absolute z-50 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-xl p-2 w-80 max-h-64 overflow-y-auto"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="text-[9px] uppercase font-bold text-gray-500 mb-1.5 px-1">
            {errorCount} probléma
          </div>
          <ul className="space-y-1">
            {errors.map((err, idx) => (
              <li
                key={idx}
                className="px-2 py-1.5 rounded bg-red-50 border border-red-200 text-[11px] cursor-pointer hover:bg-red-100"
                onClick={() => handleJump(err)}
              >
                <div className="flex items-start gap-2">
                  <span>🔴</span>
                  <div className="flex-1 min-w-0">
                    {err.path && (
                      <div className="font-mono text-gray-900 truncate">{err.path}</div>
                    )}
                    <div className="text-gray-500 leading-tight">{err.message}</div>
                  </div>
                  <span className="text-[10px] text-gray-500">↗</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
