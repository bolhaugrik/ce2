/**
 * CE2 — ContextRail.
 *
 * Detail módban a Vászon helyett ez a kompakt kontextus-sáv jelenik meg.
 */
import React, { useEffect, useRef, useMemo } from 'react'
import type { CE2Composition, Clip } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'

interface Props {
  composition: CE2Composition
  selection: Selection
  onSelect: (sel: Selection) => void
}

const layerIcon: Record<string, string> = {
  music: '🎵',
  narration: '🎤',
  sfx: '🔊',
  video: '📹',
  pixel: '🖼️',
  vector: '✏️',
}

const labelOrId = (clip: Clip): string => clip.label || clip.id

export const ContextRail: React.FC<Props> = ({ composition, selection, onSelect }) => {
  const isCompSel = selection.kind === 'composition'
  const isMomentSel = (id: string) => selection.kind === 'moment' && selection.moment_id === id
  const isClipSel = (id: string) => selection.kind === 'clip' && selection.clip_id === id
  const isSpanningSel = (id: string) => selection.kind === 'spanning' && selection.clip_id === id
  const isBundleSel = (id: string) => selection.kind === 'bundle' && selection.bundle_id === id

  const rowRefs = useRef<Map<string, HTMLElement>>(new Map())
  const setRowRef = (id: string) => (el: HTMLElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }
  useEffect(() => {
    let key: string | null = null
    if (selection.kind === 'clip') key = `clip:${selection.clip_id}`
    else if (selection.kind === 'spanning') key = `clip:${selection.clip_id}`
    else if (selection.kind === 'moment') key = `moment:${selection.moment_id}`
    else if (selection.kind === 'bundle') key = `bundle:${selection.bundle_id}`
    if (!key) return
    const el = rowRefs.current.get(key)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selection])

  const bundleGroupsBy = useMemo(() => {
    const fn = (clips: Clip[]) => {
      const out: Array<{ kind: 'clip' | 'bundle'; clip?: Clip; bundleId?: string; bundleClips?: Clip[] }> = []
      const seen = new Set<string>()
      for (const c of clips) {
        if (c.bundle_id) {
          if (seen.has(c.bundle_id)) continue
          seen.add(c.bundle_id)
          out.push({ kind: 'bundle', bundleId: c.bundle_id, bundleClips: clips.filter((x) => x.bundle_id === c.bundle_id) })
        } else {
          out.push({ kind: 'clip', clip: c })
        }
      }
      return out
    }
    return fn
  }, [])

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      <button
        onClick={() => onSelect({ kind: 'composition' })}
        className={`text-left px-2.5 py-2 border-b border-gray-200 ${
          isCompSel ? 'bg-gray-100' : 'hover:bg-gray-50/50'
        }`}
      >
        <div className="text-[9px] uppercase tracking-wider text-gray-500">Komp</div>
        <div className="text-xs font-semibold text-gray-900 mt-0.5 truncate">
          {composition.meta.title ?? 'Címtelen'}
        </div>
      </button>

      {composition.spanning_layers.length > 0 && (
        <section>
          <div className="px-2.5 pt-2 pb-0.5 text-[9px] uppercase text-gray-500">Átívelő</div>
          {bundleGroupsBy(composition.spanning_layers).map((g) => {
            if (g.kind === 'clip' && g.clip) {
              const c = g.clip
              return (
                <button
                  key={c.id}
                  ref={setRowRef(`clip:${c.id}`)}
                  onClick={() => onSelect({ kind: 'spanning', clip_id: c.id })}
                  className={`w-full text-left px-2.5 py-1 text-[11px] flex items-center gap-1.5 ${
                    isSpanningSel(c.id) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <span>{layerIcon[c.layer]}</span>
                  <span className="truncate flex-1">{labelOrId(c)}</span>
                </button>
              )
            }
            if (g.kind === 'bundle' && g.bundleId) {
              const bundle = composition.bundles.find((b) => b.id === g.bundleId)
              return (
                <button
                  key={g.bundleId}
                  ref={setRowRef(`bundle:${g.bundleId}`)}
                  onClick={() => onSelect({ kind: 'bundle', bundle_id: g.bundleId! })}
                  className={`w-full text-left px-2.5 py-1 text-[11px] flex items-center gap-1.5 ${
                    isBundleSel(g.bundleId) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50/50'
                  }`}
                >
                  <span>📦</span>
                  <span className="truncate flex-1">{bundle?.kind ?? 'bundle'}</span>
                </button>
              )
            }
            return null
          })}
        </section>
      )}

      <section className="mt-1">
        <div className="px-2.5 pt-2 pb-0.5 text-[9px] uppercase text-gray-500">
          Pillanatok ({composition.moments.length})
        </div>
        {composition.moments.map((m, idx) => (
          <div key={m.id} ref={setRowRef(`moment:${m.id}`)} className="border-t border-gray-200/40">
            <button
              onClick={() => onSelect({ kind: 'moment', moment_id: m.id })}
              className={`w-full text-left px-2 py-1.5 flex items-center gap-1.5 text-[11px] ${
                isMomentSel(m.id) ? 'bg-gray-100 font-semibold' : 'bg-gray-50/30 hover:bg-gray-50'
              }`}
            >
              <span className="font-mono text-gray-500">#{idx + 1}</span>
              <span className="truncate flex-1 font-semibold text-gray-900">{m.label ?? m.id}</span>
            </button>
            {bundleGroupsBy(m.layers).map((g) => {
              if (g.kind === 'clip' && g.clip) {
                const c = g.clip
                return (
                  <button
                    key={c.id}
                    ref={setRowRef(`clip:${c.id}`)}
                    onClick={() => onSelect({ kind: 'clip', moment_id: m.id, clip_id: c.id })}
                    className={`w-full text-left pl-5 pr-2 py-1 text-[11px] flex items-center gap-1.5 ${
                      isClipSel(c.id) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <span>{layerIcon[c.layer]}</span>
                    <span className="truncate flex-1">{labelOrId(c)}</span>
                  </button>
                )
              }
              if (g.kind === 'bundle' && g.bundleId) {
                const bundle = composition.bundles.find((b) => b.id === g.bundleId)
                return (
                  <React.Fragment key={g.bundleId}>
                    <button
                      ref={setRowRef(`bundle:${g.bundleId}`)}
                      onClick={() => onSelect({ kind: 'bundle', bundle_id: g.bundleId! })}
                      className={`w-full text-left pl-5 pr-2 py-1 text-[11px] flex items-center gap-1.5 ${
                        isBundleSel(g.bundleId!) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <span>📦</span>
                      <span className="truncate flex-1">{bundle?.kind ?? 'bundle'}</span>
                    </button>
                    {g.bundleClips?.map((c) => (
                      <button
                        key={c.id}
                        ref={setRowRef(`clip:${c.id}`)}
                        onClick={() => onSelect({ kind: 'clip', moment_id: m.id, clip_id: c.id })}
                        className={`w-full text-left pl-9 pr-2 py-1 text-[11px] flex items-center gap-1.5 ${
                          isClipSel(c.id) ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <span>{layerIcon[c.layer]}</span>
                        <span className="truncate flex-1">{labelOrId(c)}</span>
                      </button>
                    ))}
                  </React.Fragment>
                )
              }
              return null
            })}
          </div>
        ))}
      </section>
    </div>
  )
}
