/**
 * CE2 — ClipDetailPanel.
 *
 * 6 tab egy clip-hez: Általános / Tartalom / Megjelenés / Időzítés / Effekt / Hang.
 */
import React, { useState, useEffect } from 'react'
import type { Clip, CE2Composition } from '@ce2/core'
import { GeneralTab } from './tabs/GeneralTab.js'
import { ContentTab } from './tabs/ContentTab.js'
import { AppearanceTab } from './tabs/AppearanceTab.js'
import { TimingTab } from './tabs/TimingTab.js'
import { EffectsTab } from './tabs/EffectsTab.js'
import { AudioTab } from './tabs/AudioTab.js'

const isAudioLayer = (l: string) => ['music', 'narration', 'sfx'].includes(l)

type TabId = 'general' | 'content' | 'appearance' | 'timing' | 'effects' | 'audio'

interface Props {
  clip: Clip
  composition: CE2Composition
  onUpdate: (updater: (c: Clip) => Clip) => void
  onUpdateComposition: (updater: (c: CE2Composition) => CE2Composition) => void
}

const TABS_ALL: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'general', label: 'Általános', icon: '🪪' },
  { id: 'content', label: 'Tartalom', icon: '📝' },
  { id: 'appearance', label: 'Megjelenés', icon: '🎨' },
  { id: 'timing', label: 'Időzítés', icon: '⏱' },
  { id: 'effects', label: 'Effekt', icon: '🎬' },
  { id: 'audio', label: 'Hang', icon: '🎵' },
]

export const ClipDetailPanel: React.FC<Props> = ({ clip, composition, onUpdate, onUpdateComposition }) => {
  const isAudio = isAudioLayer(clip.layer)
  const isVideo = clip.layer === 'video'

  const visibleTabs = TABS_ALL.filter((t) => {
    if (t.id === 'appearance' && isAudio) return false
    if (t.id === 'audio' && !isAudio && !isVideo) return false
    return true
  })

  const [tab, setTab] = useState<TabId>(visibleTabs[0].id)

  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === tab)) {
      setTab(visibleTabs[0].id)
    }
  }, [tab, visibleTabs])

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex border-b border-gray-200 bg-gray-50 px-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-2.5 py-1.5 text-[11px] font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-white">
        {tab === 'general' && <GeneralTab clip={clip} onUpdate={onUpdate} />}
        {tab === 'content' && (
          <ContentTab
            clip={clip}
            composition={composition}
            onUpdate={onUpdate}
            onUpdateComposition={onUpdateComposition}
          />
        )}
        {tab === 'appearance' && <AppearanceTab clip={clip} onUpdate={onUpdate} />}
        {tab === 'timing' && (
          <TimingTab
            clip={clip}
            composition={composition}
            onUpdate={onUpdate}
            onUpdateComposition={onUpdateComposition}
          />
        )}
        {tab === 'effects' && (
          <EffectsTab clip={clip} composition={composition} onUpdate={onUpdate} />
        )}
        {tab === 'audio' && <AudioTab clip={clip} onUpdate={onUpdate} />}
      </div>
    </div>
  )
}
