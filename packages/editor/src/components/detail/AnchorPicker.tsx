/**
 * CE2 — AnchorPicker.
 *
 * Modal: a teljes composition publikus anchorait listázza, HARD/SOFT/DERIVED bontásban.
 */
import React, { useMemo, useState } from 'react'
import type { CE2Composition, Clip } from '@ce2/core'

interface Props {
  open: boolean
  composition: CE2Composition
  excludeClipId?: string
  onPick: (anchorRef: string) => void
  onClose: () => void
}

type AnchorClass = 'hard' | 'soft' | 'derived'
type LayerFilter = 'all' | 'narration' | 'music' | 'sfx' | 'video' | 'pixel' | 'vector' | 'moment'

interface AnchorEntry {
  ref: string
  label: string
  class: AnchorClass
  contextLabel: string
  layer: LayerFilter
}

const layerFromClip = (clip: Clip): LayerFilter => {
  const l = clip.layer
  if (l === 'narration' || l === 'music' || l === 'sfx' || l === 'video' || l === 'pixel' || l === 'vector') {
    return l
  }
  return 'all'
}

function collectAnchors(comp: CE2Composition, excludeClipId?: string): AnchorEntry[] {
  const out: AnchorEntry[] = []

  for (const m of comp.moments) {
    const label = m.label ?? m.id
    out.push({ ref: `moment.${m.id}.start`, label: 'Pillanat kezdete', class: 'hard', contextLabel: `Pillanat: ${label}`, layer: 'moment' })
    out.push({ ref: `moment.${m.id}.end`, label: 'Pillanat vége', class: 'hard', contextLabel: `Pillanat: ${label}`, layer: 'moment' })
  }

  const allClips = [
    ...comp.spanning_layers.map((c) => ({ clip: c, momentLabel: '🌊 Átívelő' })),
    ...comp.moments.flatMap((m) => m.layers.map((c) => ({ clip: c, momentLabel: m.label ?? m.id }))),
  ]

  for (const { clip, momentLabel } of allClips) {
    if (clip.id === excludeClipId) continue
    const ctx = `${momentLabel} → ${clip.label ?? clip.id}`
    const lay = layerFromClip(clip)
    out.push({ ref: `${clip.id}.start`, label: 'Kezdete', class: 'soft', contextLabel: ctx, layer: lay })
    out.push({ ref: `${clip.id}.end`, label: 'Vége', class: 'soft', contextLabel: ctx, layer: lay })
    out.push({ ref: `${clip.id}.middle`, label: 'Közepe', class: 'derived', contextLabel: ctx, layer: lay })

    if (clip.source.kind === 'text') {
      out.push({ ref: `${clip.id}.phase.enter`, label: 'Bejövő fázis', class: 'soft', contextLabel: ctx, layer: lay })
      out.push({ ref: `${clip.id}.phase.exit`, label: 'Kimenő fázis', class: 'soft', contextLabel: ctx, layer: lay })
    }

    if (clip.audio_markers && clip.audio_markers.length > 0) {
      for (const mk of clip.audio_markers) {
        const startSec = (mk as any).start_sec ?? (mk as any).time_sec ?? 0
        out.push({ ref: `${clip.id}.mark.${mk.id}.start`, label: `🎯 "${mk.label}" eleje (${startSec.toFixed(2)}s)`, class: 'hard', contextLabel: ctx, layer: lay })
        if (mk.end_sec !== undefined) {
          out.push({ ref: `${clip.id}.mark.${mk.id}.end`, label: `🎯 "${mk.label}" vége (${mk.end_sec.toFixed(2)}s)`, class: 'hard', contextLabel: ctx, layer: lay })
        }
      }
    }
  }

  return out
}

const FILTER_CHIPS: Array<{ id: LayerFilter; label: string }> = [
  { id: 'all', label: 'Mind' },
  { id: 'moment', label: '⏱ pillanat' },
  { id: 'narration', label: '🎤 narráció' },
  { id: 'music', label: '🎵 zene' },
  { id: 'sfx', label: '🔊 sfx' },
  { id: 'video', label: '📹 videó' },
  { id: 'pixel', label: '🖼 kép' },
  { id: 'vector', label: '📝 szöveg/svg' },
]

export const AnchorPicker: React.FC<Props> = ({ open, composition, excludeClipId, onPick, onClose }) => {
  const [search, setSearch] = useState('')
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all')

  const anchors = useMemo(() => collectAnchors(composition, excludeClipId), [composition, excludeClipId])

  const filtered = useMemo(() => {
    let list = anchors
    if (layerFilter !== 'all') list = list.filter((a) => a.layer === layerFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.ref.toLowerCase().includes(q) ||
          a.label.toLowerCase().includes(q) ||
          a.contextLabel.toLowerCase().includes(q),
      )
    }
    return list
  }, [anchors, search, layerFilter])

  const grouped = useMemo(() => ({
    hard: filtered.filter((a) => a.class === 'hard'),
    soft: filtered.filter((a) => a.class === 'soft'),
    derived: filtered.filter((a) => a.class === 'derived'),
  }), [filtered])

  const layerCounts = useMemo(() => {
    const c: Record<LayerFilter, number> = { all: anchors.length, moment: 0, narration: 0, music: 0, sfx: 0, video: 0, pixel: 0, vector: 0 }
    for (const a of anchors) c[a.layer] += 1
    return c
  }, [anchors])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">📍 Válassz anchor-t</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            HARD = stabil ground-truth · SOFT = clip-pozícióból derivált · DERIVED = számított
          </p>
        </header>

        <div className="px-4 py-2 border-b border-gray-200 space-y-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Keresés (ref / label / kontextus)…"
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded"
            autoFocus
          />
          <div className="flex gap-1 flex-wrap">
            {FILTER_CHIPS.map((chip) => {
              const cnt = layerCounts[chip.id]
              const active = layerFilter === chip.id
              const disabled = chip.id !== 'all' && cnt === 0
              return (
                <button
                  key={chip.id}
                  onClick={() => setLayerFilter(chip.id)}
                  disabled={disabled}
                  className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                    active
                      ? 'bg-gray-900 text-white border-gray-900'
                      : disabled
                      ? 'text-gray-500/50 border-gray-200/50 bg-gray-50/30'
                      : 'text-gray-900 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {chip.label} {cnt > 0 && <span className="opacity-70">({cnt})</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {(['hard', 'soft', 'derived'] as const).map((cls) => {
            const items = grouped[cls]
            if (items.length === 0) return null
            return (
              <section key={cls} className="mb-3">
                <div className="px-2 text-[10px] uppercase font-bold text-gray-500 mb-1">
                  {cls === 'hard' ? '🟢 HARD' : cls === 'soft' ? '🟡 SOFT' : '⚪ DERIVED'} ({items.length})
                </div>
                <ul className="space-y-0.5">
                  {items.map((a) => (
                    <li key={a.ref}>
                      <button
                        onClick={() => { onPick(a.ref); onClose() }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100"
                      >
                        <div className="text-xs font-mono text-gray-900">{a.ref}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {a.contextLabel} · {a.label}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-xs text-gray-500 p-4 text-center">Nincs találat.</div>
          )}
        </div>
      </div>
    </div>
  )
}
