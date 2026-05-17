/**
 * CE2 — SpanningLayersPanel.
 *
 * Külön vizuális kártya az átívelő rétegekhez.
 * AnchorBadge/AnchorLink kihagyva (ZAVA-specifikus).
 */
import React, { useState } from 'react'
import type { CE2Composition, Clip, BundleInstance } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'

interface Props {
  composition: CE2Composition
  selection: Selection
  onSelect: (sel: Selection) => void
  onDeleteClip: (clipId: string) => void
  onDeleteBundle: (bundleId: string) => void
  onAddSpanning: () => void
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

const sourceSummary = (clip: Clip): string => {
  const s = clip.source
  if (s.kind === 'asset') return s.asset_id
  if (s.kind === 'computed') return `↻ ${s.logic_id}`
  return ''
}

export const SpanningLayersPanel: React.FC<Props> = ({
  composition,
  selection,
  onSelect,
  onDeleteClip,
  onDeleteBundle,
  onAddSpanning,
}) => {
  const layers = composition.spanning_layers
  const [open, setOpen] = useState<boolean>(layers.length > 0)

  const seenBundles = new Set<string>()
  const groups: Array<
    { kind: 'clip'; clip: Clip } | { kind: 'bundle'; bundle: BundleInstance; clips: Clip[] }
  > = []

  for (const c of layers) {
    if (c.bundle_id) {
      if (seenBundles.has(c.bundle_id)) continue
      seenBundles.add(c.bundle_id)
      const bundle = composition.bundles.find((b) => b.id === c.bundle_id)
      if (bundle) {
        groups.push({
          kind: 'bundle',
          bundle,
          clips: layers.filter((x) => x.bundle_id === c.bundle_id),
        })
      }
    } else {
      groups.push({ kind: 'clip', clip: c })
    }
  }

  const isClipSel = (id: string) =>
    (selection.kind === 'spanning' && selection.clip_id === id) ||
    (selection.kind === 'clip' && selection.clip_id === id)
  const isBundleSel = (id: string) => selection.kind === 'bundle' && selection.bundle_id === id

  return (
    <div className="border border-amber-200/60 bg-amber-50/30 rounded mx-2 my-2 overflow-hidden">
      <div className="flex items-center px-2 py-1.5 bg-amber-100/40 border-b border-amber-200/50">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-xs text-gray-500 hover:text-gray-900 px-1"
        >
          {open ? '▾' : '▸'}
        </button>
        <div className="flex-1 text-[10px] uppercase tracking-wider text-amber-900 font-bold ml-1">
          🌊 Átívelő rétegek
          <span className="ml-1.5 font-normal normal-case text-amber-700">({layers.length})</span>
        </div>
        <button
          onClick={onAddSpanning}
          className="text-[10px] px-2 py-0.5 rounded bg-white border border-amber-200 text-gray-900 hover:bg-amber-50"
          title="Új átívelő réteg"
        >
          + Hozzáad
        </button>
      </div>

      {open && (
        <div>
          {layers.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-gray-500 italic">
              Nincs átívelő réteg. Kattints a + Hozzáad gombra.
            </div>
          ) : (
            groups.map((g) => {
              if (g.kind === 'clip') {
                const c = g.clip
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center text-sm border-t border-amber-200/40 ${
                      isClipSel(c.id) ? 'bg-amber-100/60' : 'hover:bg-amber-50/60'
                    }`}
                  >
                    <button
                      onClick={() => onSelect({ kind: 'spanning', clip_id: c.id })}
                      className="flex-1 text-left flex items-center gap-2 px-3 py-1.5 min-w-0"
                    >
                      <span className="w-5">{layerIcon[c.layer]}</span>
                      <span className="flex-1 truncate text-xs">{labelOrId(c)}</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[35%]">
                        {sourceSummary(c)}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Törlöd? (${labelOrId(c)})`)) onDeleteClip(c.id)
                      }}
                      className="px-2 py-1 text-xs text-red-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                )
              }
              return (
                <div
                  key={g.bundle.id}
                  className={`group flex items-center text-sm border-t border-amber-200/40 ${
                    isBundleSel(g.bundle.id) ? 'bg-amber-100/60' : 'hover:bg-amber-50/60'
                  }`}
                >
                  <button
                    onClick={() => onSelect({ kind: 'bundle', bundle_id: g.bundle.id })}
                    className="flex-1 text-left flex items-center gap-2 px-3 py-1.5"
                  >
                    <span>📦</span>
                    <span className="flex-1 truncate text-xs font-semibold">{g.bundle.kind}</span>
                    <span className="text-[10px] text-gray-500">{g.clips.length} clip</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Bundle törlése? (${g.bundle.kind})`))
                        onDeleteBundle(g.bundle.id)
                    }}
                    className="px-2 py-1 text-xs text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
