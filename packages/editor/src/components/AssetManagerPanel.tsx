import React, { useState, useRef } from 'react'
import type { AssetRef } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'

const KIND_OPTIONS: AssetRef['kind'][] = ['video', 'image', 'audio', 'font']

const KIND_COLOR: Record<AssetRef['kind'], { bg: string; text: string }> = {
  video: { bg: 'rgba(239,68,68,.15)',   text: '#f87171' },
  image: { bg: 'rgba(34,197,94,.15)',   text: '#4ade80' },
  audio: { bg: 'rgba(99,102,241,.15)',  text: '#a5b4fc' },
  font:  { bg: 'rgba(245,158,11,.15)',  text: '#fcd34d' },
}

function KindBadge({ kind }: { kind: AssetRef['kind'] }) {
  const c = KIND_COLOR[kind]
  return (
    <span className="ce2-badge" style={{ background: c.bg, color: c.text, flexShrink: 0 }}>
      {kind}
    </span>
  )
}

function AssetPreview({ asset }: { asset: AssetRef }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  if (!asset.url) return null

  if (asset.kind === 'audio') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <audio ref={audioRef} src={asset.url} style={{ display: 'none' }}
          onEnded={() => setPlaying(false)} />
        <button
          className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-btn--sm"
          onClick={() => {
            const a = audioRef.current
            if (!a) return
            if (playing) { a.pause(); a.currentTime = 0; setPlaying(false) }
            else { a.play().catch(() => {}); setPlaying(true) }
          }}
          title={playing ? 'Stop' : 'Preview'}
        >
          {playing ? '⏹' : '▶'}
        </button>
      </div>
    )
  }

  if (asset.kind === 'image') {
    return (
      <img
        src={asset.url}
        alt={asset.id}
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ed-border)', flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  if (asset.kind === 'video') {
    return (
      <video
        src={asset.url}
        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--ed-border)', flexShrink: 0 }}
        muted
        onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
        onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
      />
    )
  }

  return null
}

interface AddForm { id: string; kind: AssetRef['kind']; url: string }

export function AssetManagerPanel() {
  const { composition, addAsset, removeAsset, updateAsset } = useEditorStore()
  const assets = composition.assets
  const [form, setForm]   = useState<AddForm>({ id: '', kind: 'image', url: '' })
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setError(null)
    if (!form.id.trim())  { setError('ID is required'); return }
    if (!form.url.trim()) { setError('URL is required'); return }
    if (assets.some(a => a.id === form.id.trim())) { setError('ID already exists'); return }
    addAsset({ id: form.id.trim(), kind: form.kind, url: form.url.trim() })
    setForm({ id: '', kind: 'image', url: '' })
  }

  return (
    <div className="ce2-asset-manager">
      <div className="ce2-panel__header">
        Assets
        <span style={{ marginLeft: 4, color: 'var(--ed-text3)', fontWeight: 400 }}>({assets.length})</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {assets.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ed-text3)' }}>
            No assets yet — add one below.
          </div>
        )}

        {assets.map(asset => (
          <div key={asset.id} className="ce2-asset-row">
            <AssetPreview asset={asset} />
            <KindBadge kind={asset.kind} />
            <span className="ce2-asset-row__id">{asset.id}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                className="ce2-input"
                value={asset.url}
                placeholder="URL or path"
                onChange={e => updateAsset(asset.id, { url: e.target.value })}
              />
              {(asset.kind === 'video' || asset.kind === 'audio') && (
                <input
                  type="number" className="ce2-input" step="0.1" min="0"
                  placeholder="Duration (sec)"
                  value={asset.duration_sec ?? ''}
                  onChange={e => updateAsset(asset.id, {
                    duration_sec: e.target.value ? parseFloat(e.target.value) : undefined,
                  })}
                />
              )}
            </div>
            <button className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-btn--sm ce2-btn--danger"
              onClick={() => removeAsset(asset.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--ed-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ce2-section-title">Add Asset</div>
        {error && <div style={{ fontSize: 11, color: 'var(--ed-danger)' }}>{error}</div>}
        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">ID</label>
            <input className="ce2-input" placeholder="my_video" value={form.id}
              onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Kind</label>
            <select className="ce2-select" value={form.kind}
              onChange={e => setForm(f => ({ ...f, kind: e.target.value as AssetRef['kind'] }))}>
              {KIND_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
        <div className="ce2-field">
          <label className="ce2-label">URL</label>
          <input className="ce2-input" placeholder="https://... or /assets/..." value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        </div>
        <button className="ce2-btn ce2-btn--primary" onClick={handleAdd}>+ Add Asset</button>
      </div>
    </div>
  )
}
