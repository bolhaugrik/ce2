import React, { useState } from 'react'
import type { AssetRef } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'

const KIND_OPTIONS: AssetRef['kind'][] = ['video', 'image', 'audio', 'font']

const KIND_BADGE_COLOR: Record<AssetRef['kind'], string> = {
  video: 'rgba(239,68,68,.15)',
  image: 'rgba(34,197,94,.15)',
  audio: 'rgba(99,102,241,.15)',
  font:  'rgba(245,158,11,.15)',
}
const KIND_TEXT_COLOR: Record<AssetRef['kind'], string> = {
  video: '#f87171',
  image: '#4ade80',
  audio: '#a5b4fc',
  font:  '#fcd34d',
}

function KindBadge({ kind }: { kind: AssetRef['kind'] }) {
  return (
    <span
      className="ce2-badge"
      style={{
        background: KIND_BADGE_COLOR[kind],
        color: KIND_TEXT_COLOR[kind],
      }}
    >
      {kind}
    </span>
  )
}

interface AddAssetFormState {
  id: string
  kind: AssetRef['kind']
  url: string
}

export function AssetManagerPanel() {
  const { composition, addAsset, removeAsset, updateAsset } = useEditorStore()
  const assets = composition.assets

  const [form, setForm] = useState<AddAssetFormState>({ id: '', kind: 'image', url: '' })
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setError(null)
    if (!form.id.trim()) { setError('ID is required'); return }
    if (!form.url.trim()) { setError('URL is required'); return }
    if (assets.some(a => a.id === form.id.trim())) {
      setError('An asset with this ID already exists')
      return
    }
    addAsset({ id: form.id.trim(), kind: form.kind, url: form.url.trim() })
    setForm({ id: '', kind: 'image', url: '' })
  }

  return (
    <div className="ce2-asset-manager">
      <div className="ce2-panel__header">
        Assets
        <span style={{ marginLeft: 4, color: 'var(--ed-text3)', fontWeight: 400 }}>
          ({assets.length})
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {assets.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ed-text3)' }}>
            No assets. Add one below.
          </div>
        )}

        {assets.map(asset => (
          <div key={asset.id} className="ce2-asset-row">
            <KindBadge kind={asset.kind} />
            <span className="ce2-asset-row__id">{asset.id}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                className="ce2-input"
                value={asset.url}
                placeholder="URL"
                onChange={e => updateAsset(asset.id, { url: e.target.value })}
              />
              {(asset.kind === 'video' || asset.kind === 'audio') && (
                <input
                  type="number"
                  className="ce2-input"
                  step="0.1"
                  min="0"
                  placeholder="Duration (sec)"
                  value={asset.duration_sec ?? ''}
                  onChange={e => updateAsset(asset.id, {
                    duration_sec: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
              )}
            </div>
            <button
              className="ce2-btn ce2-btn--ghost ce2-btn--icon ce2-btn--sm ce2-btn--danger"
              title="Remove asset"
              onClick={() => removeAsset(asset.id)}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add asset form */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--ed-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ce2-section-title">Add Asset</div>

        {error && (
          <div style={{ fontSize: 11, color: 'var(--ed-danger)' }}>{error}</div>
        )}

        <div className="ce2-row2">
          <div className="ce2-field">
            <label className="ce2-label">ID</label>
            <input
              className="ce2-input"
              placeholder="my_asset_1"
              value={form.id}
              onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
            />
          </div>
          <div className="ce2-field">
            <label className="ce2-label">Kind</label>
            <select
              className="ce2-select"
              value={form.kind}
              onChange={e => setForm(f => ({ ...f, kind: e.target.value as AssetRef['kind'] }))}
            >
              {KIND_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ce2-field">
          <label className="ce2-label">URL</label>
          <input
            className="ce2-input"
            placeholder="https://..."
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>

        <button className="ce2-btn ce2-btn--primary" onClick={handleAdd}>
          + Add Asset
        </button>
      </div>
    </div>
  )
}
