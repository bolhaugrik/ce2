/**
 * CE2 — PreviewPanel.
 *
 * BrowserRenderer-alapú preview panel.
 * PauseLabelsOverlay és AudioActivePanel overlay-ekkel.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserRenderer } from '@ce2/browser'
import type { CE2Composition } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { setRendererRef, usePauseResume } from '../../state/playerSync.js'
import { PauseLabelsOverlay, AudioActivePanel } from '../timeline/PauseLabels.js'

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
  fullScreen?: boolean
}

export const PreviewPanel: React.FC<Props> = ({ composition, onJumpToClip, fullScreen }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<BrowserRenderer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [timeSec, setTimeSec] = useState(0)
  const [totalSec, setTotalSec] = useState(1)
  const pauseResume = usePauseResume()

  // Build renderer on composition change
  useEffect(() => {
    if (!containerRef.current) return

    const prevTimeSec = rendererRef.current?.currentTimeSec ?? 0
    const wasPlaying = rendererRef.current?.isPlaying ?? false
    rendererRef.current?.destroy()
    setRendererRef(null)

    const assetMap: Record<string, string> = {}
    for (const a of composition.assets) {
      if (a.url) assetMap[a.id] = a.url
    }

    let renderer: BrowserRenderer
    try {
      renderer = new BrowserRenderer({
        container: containerRef.current,
        composition,
        assets: assetMap,
        loop: true,
        fitContainer: true,
      })
    } catch {
      return
    }

    rendererRef.current = renderer
    setRendererRef(renderer)
    setTotalSec(renderer.totalTimeSec)

    if (prevTimeSec > 0) renderer.seekToSec(prevTimeSec)

    const isFirstLoad = prevTimeSec === 0 && !wasPlaying
    if (!isFirstLoad && wasPlaying) {
      renderer.play()
      setPlaying(true)
    } else {
      setPlaying(false)
    }

    const unsubs = [
      renderer.on('play', () => setPlaying(true)),
      renderer.on('pause', () => setPlaying(false)),
      renderer.on('stop', () => { setPlaying(false); setTimeSec(0) }),
    ]

    return () => {
      unsubs.forEach((u) => u())
      renderer.destroy()
      rendererRef.current = null
      setRendererRef(null)
    }
  }, [composition])

  // ResizeObserver → refit
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => rendererRef.current?.refit())
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Progress tick
  const rafRef = useRef<number>()
  useEffect(() => {
    const tick = () => {
      if (rendererRef.current) setTimeSec(rendererRef.current.currentTimeSec)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const togglePlay = () => {
    const r = rendererRef.current
    if (!r) return
    if (r.isPlaying) { r.pause(); setPlaying(false) }
    else { r.play(); setPlaying(true) }
  }

  // Scrubbing
  const scrubbingRef = useRef(false)
  const progressElRef = useRef<HTMLDivElement>(null)

  const seekFromEvent = useCallback((clientX: number) => {
    const r = rendererRef.current; if (!r) return
    const rect = progressElRef.current?.getBoundingClientRect(); if (!rect) return
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    r.seekToSec(pct * totalSec)
  }, [totalSec])

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = rendererRef.current; if (!r) return
    scrubbingRef.current = true
    r.pause(); setPlaying(false)
    seekFromEvent(e.clientX)
    const onMove = (ev: MouseEvent) => { if (scrubbingRef.current) seekFromEvent(ev.clientX) }
    const onUp = () => {
      scrubbingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const pct = totalSec > 0 ? Math.min((timeSec / totalSec) * 100, 100) : 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', background: '#000',
      width: '100%', ...(fullScreen ? { flex: 1, minHeight: 0 } : {}),
    }}>
      {/* containerRef IS the flex-1 wrapper — clientHeight is the flex-computed value (not 0) */}
      <div
        ref={containerRef}
        style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}
      >
        {/* PauseLabels overlay sits on top of the BrowserRenderer canvas */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          <PauseLabelsOverlay composition={composition} onJumpToClip={onJumpToClip} />
        </div>
      </div>

      {/* Audio active panel */}
      <AudioActivePanel composition={composition} onJumpToClip={onJumpToClip} />

      {/* Controls */}
      <div className="flex-shrink-0 bg-gray-900 px-2 py-1.5">
        {/* Progress bar */}
        <div
          ref={progressElRef}
          className="h-1.5 bg-gray-700 rounded cursor-ew-resize mb-1.5 relative"
          onMouseDown={handleScrubStart}
        >
          <div className="h-full bg-white rounded" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className="px-2 py-0.5 text-xs bg-white text-gray-900 rounded font-semibold hover:bg-gray-100"
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            onClick={() => { rendererRef.current?.stop(); setPlaying(false) }}
            className="px-2 py-0.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            ■
          </button>
          <span className="text-[10px] text-gray-400 font-mono ml-1">
            {timeSec.toFixed(1)}s / {totalSec.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  )
}
