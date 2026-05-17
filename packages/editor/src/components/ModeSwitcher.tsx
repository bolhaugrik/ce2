/**
 * CE2 — ModeSwitcher.
 *
 * Topbar: Komp / Detail mód váltó.
 */
import React from 'react'
import type { EditorMode } from '../state/editorState.js'

interface Props {
  mode: EditorMode
  onChange: (m: EditorMode) => void
  detailEnabled: boolean
}

export const ModeSwitcher: React.FC<Props> = ({ mode, onChange, detailEnabled }) => {
  const tab = (id: EditorMode, icon: string, label: string, disabled?: boolean) => (
    <button
      onClick={() => !disabled && onChange(id)}
      disabled={disabled}
      className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
        mode === id
          ? 'bg-white text-gray-900 shadow-sm'
          : disabled
          ? 'text-gray-500/40 cursor-not-allowed'
          : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
      }`}
      title={disabled ? 'Válassz egy elemet a Detail módhoz' : undefined}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </button>
  )
  return (
    <div className="inline-flex gap-1 p-0.5 bg-gray-100 rounded">
      {tab('komp', '📝', 'Komp')}
      {tab('detail', '⚙️', 'Detail', !detailEnabled)}
    </div>
  )
}
