/**
 * CE2 — CanvasPanel.
 *
 * Bundle-aware pillanat + clip fa-nézettel.
 * AnchorBadge/AnchorLink kihagyva; NarrationPoolPanel kihagyva.
 */
import React, { useMemo, useState, useEffect, useRef } from 'react'
import type { CE2Composition, Clip } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { SpanningLayersPanel } from './SpanningLayersPanel.js'

interface Props {
  composition: CE2Composition
  selection: Selection
  onSelect: (sel: Selection) => void
  onAddMoment: () => void
  onDeleteClip: (clipId: string) => void
  onDeleteMoment: (momentId: string) => void
  onDeleteBundle: (bundleId: string) => void
  onAddSpanning: () => void
  onUpdateComposition?: (updater: (c: CE2Composition) => CE2Composition) => void
}

const layerIcon: Record<string, string> = {
  music: '🎵',
  narration: '🎤',
  sfx: '🔊',
  video: '📹',
  pixel: '🖼️',
  vector: '✏️',
}

const sourceSummary = (clip: Clip): string => {
  const s = clip.source
  switch (s.kind) {
    case 'asset': return s.asset_id
    case 'text': return `"${(s.payload.text ?? '').slice(0, 28)}${s.payload.text && s.payload.text.length > 28 ? '…' : ''}"`
    case 'tts': return `🎤 "${s.text.slice(0, 22)}${s.text.length > 22 ? '…' : ''}"`
    case 'shape': return `${s.shape}`
    case 'svg': return 'SVG'
    case 'computed': return `↻ ${s.logic_id}`
    default: return ''
  }
}

interface ClipGroup {
  kind: 'clip' | 'bundle'
  clip?: Clip
  bundleId?: string
  bundleKind?: string
  bundleClips?: Clip[]
}

function groupByBundle(clips: Clip[], composition: CE2Composition): ClipGroup[] {
  const out: ClipGroup[] = []
  const seenBundles = new Set<string>()
  for (const c of clips) {
    if (c.bundle_id) {
      if (seenBundles.has(c.bundle_id)) continue
      seenBundles.add(c.bundle_id)
      const bundleClips = clips.filter((x) => x.bundle_id === c.bundle_id)
      const bundle = composition.bundles.find((b) => b.id === c.bundle_id)
      out.push({ kind: 'bundle', bundleId: c.bundle_id, bundleKind: bundle?.kind ?? 'bundle', bundleClips })
    } else {
      out.push({ kind: 'clip', clip: c })
    }
  }
  return out
}

const ClipRow: React.FC<{
  clip: Clip
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  indent?: 'normal' | 'deep'
}> = ({ clip, isSelected, onClick, onDelete, indent }) => {
  const [hover, setHover] = useState(false)
  const padLeft = indent === 'deep' ? 'pl-12' : indent === 'normal' ? 'pl-8' : 'pl-4'
  return (
    <div
      className={`group w-full flex items-center gap-1 text-sm border-b border-gray-200/40 ${
        isSelected ? 'bg-gray-100' : 'hover:bg-gray-50/50'
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={onClick}
        className={`flex-1 text-left flex items-center gap-2 ${padLeft} pr-2 py-1.5 min-w-0`}
      >
        <span className="w-5 flex-shrink-0">{layerIcon[clip.layer]}</span>
        <span className="flex-1 truncate text-xs" title={clip.id}>
          {clip.label || clip.id}
        </span>
        <span className="text-[10px] text-gray-500 truncate max-w-[40%]">{sourceSummary(clip)}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (confirm(`Törlöd ezt a réteget? (${clip.id})`)) onDelete()
        }}
        className={`px-2 py-1 text-xs text-red-700 ${hover ? 'opacity-100' : 'opacity-0'} transition-opacity flex-shrink-0`}
      >
        🗑
      </button>
    </div>
  )
}

const BundleRow: React.FC<{
  bundleId: string
  bundleKind: string
  clipCount: number
  isSelected: boolean
  expanded: boolean
  onToggle: () => void
  onClick: () => void
  onDelete: () => void
  indent?: 'normal' | 'deep'
}> = ({ bundleId, bundleKind, clipCount, isSelected, expanded, onToggle, onClick, onDelete, indent }) => {
  const [hover, setHover] = useState(false)
  const padLeft = indent === 'normal' ? 'pl-8' : 'pl-4'
  return (
    <div
      className={`group w-full flex items-center gap-1 text-sm border-b border-gray-200/40 ${
        isSelected ? 'bg-gray-100' : 'bg-gray-50/30 hover:bg-gray-50/60'
      }`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button onClick={(e) => { e.stopPropagation(); onToggle() }} className={`${padLeft} pr-1 py-1.5 text-xs text-gray-500 hover:text-gray-900`}>
        {expanded ? '▾' : '▸'}
      </button>
      <button onClick={onClick} className="flex-1 text-left flex items-center gap-2 pr-3 py-1.5">
        <span className="text-base">📦</span>
        <span className="flex-1 truncate text-xs font-semibold text-gray-900">{bundleKind}</span>
        <span className="text-[10px] text-gray-500">{clipCount} clip</span>
        <span className="text-[10px] font-mono text-gray-500">{bundleId}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (confirm(`Törlöd ezt a bundle-t? (${bundleId})`)) onDelete()
        }}
        className={`px-2 py-1 text-xs text-red-700 ${hover ? 'opacity-100' : 'opacity-0'} transition-opacity`}
      >
        🗑
      </button>
    </div>
  )
}

export const CanvasPanel: React.FC<Props> = ({
  composition,
  selection,
  onSelect,
  onAddMoment,
  onDeleteClip,
  onDeleteMoment,
  onDeleteBundle,
  onAddSpanning,
}) => {
  const isCompSel = selection.kind === 'composition'
  const isSpanningSel = (id: string) => selection.kind === 'spanning' && selection.clip_id === id
  const isMomentSel = (id: string) => selection.kind === 'moment' && selection.moment_id === id
  const isClipSel = (id: string) => selection.kind === 'clip' && selection.clip_id === id
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
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selection])

  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set())
  const toggleBundle = (id: string) => {
    setExpandedBundles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderClipsOrBundles = (clips: Clip[], momentId?: string) => {
    const groups = groupByBundle(clips, composition)
    return groups.map((g) => {
      if (g.kind === 'clip' && g.clip) {
        return (
          <div key={g.clip.id} ref={setRowRef(`clip:${g.clip.id}`)}>
            <ClipRow
              clip={g.clip}
              isSelected={isClipSel(g.clip.id) || (!momentId && isSpanningSel(g.clip.id))}
              onClick={() =>
                onSelect(
                  momentId
                    ? { kind: 'clip', moment_id: momentId, clip_id: g.clip!.id }
                    : { kind: 'spanning', clip_id: g.clip!.id },
                )
              }
              onDelete={() => onDeleteClip(g.clip!.id)}
              indent={momentId ? 'normal' : undefined}
            />
          </div>
        )
      }
      if (g.kind === 'bundle' && g.bundleId) {
        const expanded = expandedBundles.has(g.bundleId)
        return (
          <React.Fragment key={g.bundleId}>
            <div ref={setRowRef(`bundle:${g.bundleId}`)}>
              <BundleRow
                bundleId={g.bundleId}
                bundleKind={g.bundleKind ?? 'bundle'}
                clipCount={g.bundleClips?.length ?? 0}
                isSelected={isBundleSel(g.bundleId)}
                expanded={expanded}
                onToggle={() => toggleBundle(g.bundleId!)}
                onClick={() => onSelect({ kind: 'bundle', bundle_id: g.bundleId! })}
                onDelete={() => onDeleteBundle(g.bundleId!)}
                indent={momentId ? 'normal' : undefined}
              />
            </div>
            {expanded &&
              g.bundleClips?.map((c) => (
                <div key={c.id} ref={setRowRef(`clip:${c.id}`)}>
                  <ClipRow
                    clip={c}
                    isSelected={isClipSel(c.id)}
                    onClick={() =>
                      onSelect(
                        momentId
                          ? { kind: 'clip', moment_id: momentId, clip_id: c.id }
                          : { kind: 'spanning', clip_id: c.id },
                      )
                    }
                    onDelete={() => onDeleteClip(c.id)}
                    indent={momentId ? 'deep' : 'normal'}
                  />
                </div>
              ))}
          </React.Fragment>
        )
      }
      return null
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 max-h-[55%] overflow-y-auto border-b-2 border-gray-200/60">
        {/* Composition header */}
        <button
          onClick={() => onSelect({ kind: 'composition' })}
          className={`w-full text-left px-4 py-3 border-b border-gray-200 ${
            isCompSel ? 'bg-gray-100' : 'bg-white hover:bg-gray-50/50'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Globálisok</div>
          <div className="text-sm font-semibold text-gray-900 mt-0.5">
            {composition.meta.title ?? 'Címtelen kreatív'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {composition.meta.width}×{composition.meta.height} · {composition.meta.fps}fps
          </div>
        </button>

        <SpanningLayersPanel
          composition={composition}
          selection={selection}
          onSelect={onSelect}
          onDeleteClip={onDeleteClip}
          onDeleteBundle={onDeleteBundle}
          onAddSpanning={onAddSpanning}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <section>
          <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500 sticky top-0 bg-white z-10 border-b border-gray-200/40">
            Pillanatok ({composition.moments.length})
          </div>
          {composition.moments.length === 0 ? (
            <div className="mx-4 my-2 px-3 py-3 text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded text-center">
              Még nincs pillanat. Kattints egy presetre → Új pillanat.
            </div>
          ) : (
            composition.moments.map((m, idx) => (
              <div
                key={m.id}
                className="border-b border-gray-200/40"
                ref={setRowRef(`moment:${m.id}`)}
              >
                <div
                  className={`group w-full flex items-center ${
                    isMomentSel(m.id) ? 'bg-gray-100' : 'bg-gray-50/40 hover:bg-gray-50'
                  }`}
                >
                  <button
                    onClick={() => onSelect({ kind: 'moment', moment_id: m.id })}
                    className="flex-1 text-left px-4 py-2 flex items-center gap-2"
                  >
                    <span className="text-xs font-mono text-gray-500">#{idx + 1}</span>
                    <span className="text-sm font-semibold text-gray-900">{m.label ?? m.id}</span>
                    <span className="ml-auto text-xs text-gray-500">{m.layers.length} réteg</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Törlöd ezt a pillanatot? (${m.id})`)) onDeleteMoment(m.id)
                    }}
                    className="px-3 py-1 text-xs text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    🗑
                  </button>
                </div>
                {renderClipsOrBundles(m.layers, m.id)}
              </div>
            ))
          )}
        </section>

        <button
          onClick={onAddMoment}
          className="mx-4 mt-3 mb-6 px-3 py-2 text-sm text-gray-900 border border-dashed border-gray-200 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          + Új pillanat
        </button>
      </div>
    </div>
  )
}
