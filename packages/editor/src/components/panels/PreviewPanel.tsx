/**
 * CE2 — PreviewPanel (BrowserRenderer-alapú).
 *
 * A containerRef div megbízható méretét ResizeObserver biztosítja a wrapperRef-en:
 * a wrapper mérete mindig explicit px-ben van beállítva a containerRef-en,
 * így clientHeight != 0 még a flex layout esetén is.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserRenderer } from '@ce2/browser'
import type { CE2Composition } from '@ce2/core'
import type { Selection } from '../../state/editorState.js'
import { setRendererRef } from '../../state/playerSync.js'
import { PauseLabelsOverlay, AudioActivePanel } from '../timeline/PauseLabels.js'

interface Props {
  composition: CE2Composition
  onJumpToClip: (sel: Selection) => void
  fullScreen?: boolean
}

export const PreviewPanel: React.FC<Props> = ({ composition, onJumpToClip, fullScreen }) => {
  const wrapperRef    = useRef<HTMLDivElement>(null)   // tracks actual size
  const containerRef  = useRef<HTMLDivElement>(null)   // BrowserRenderer container
  const rendererRef   = useRef<BrowserRenderer | null>(null)
  const [playing,  setPlaying]  = useState(false)
  const [timeSec,  setTimeSec]  = useState(0)
  const [totalSec, setTotalSec] = useState(1)

  // Sync wrapperRef → explicit px size on containerRef + refit
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const obs = new ResizeObserver(([entry]) => {
      if (!containerRef.current) return
      const { width, height } = entry.contentRect
      containerRef.current.style.width  = `${width}px`
      containerRef.current.style.height = `${height}px`
      rendererRef.current?.refit()
    })
    obs.observe(wrapper)
    return () => obs.disconnect()
  }, [])

  // Build/rebuild renderer on composition change
  useEffect(() => {
    if (!containerRef.current) return

    const prevTimeSec = rendererRef.current?.currentTimeSec ?? 0
    const wasPlaying  = rendererRef.current?.isPlaying      ?? false
    rendererRef.current?.destroy()
    setRendererRef(null)

    const assetMap: Record<string, string> = {}
    for (const a of composition.assets) {
      if (a.url) assetMap[a.id] = a.url
    }

    let renderer: BrowserRenderer
    try {
      renderer = new BrowserRenderer({
        container:    containerRef.current,
        composition,
        assets:       assetMap,
        loop:         true,
        fitContainer: true,
      })
    } catch { return }

    rendererRef.current = renderer
    setRendererRef(renderer)
    setTotalSec(renderer.totalTimeSec)

    if (prevTimeSec > 0) renderer.seekToSec(prevTimeSec)

    const isFirstLoad = prevTimeSec === 0 && !wasPlaying
    if (!isFirstLoad && wasPlaying) { renderer.play(); setPlaying(true) }
    else                            { setPlaying(false) }

    const unsubs = [
      renderer.on('play',  () => setPlaying(true)),
      renderer.on('pause', () => setPlaying(false)),
      renderer.on('stop',  () => { setPlaying(false); setTimeSec(0) }),
    ]

    return () => {
      unsubs.forEach(u => u())
      renderer.destroy()
      rendererRef.current = null
      setRendererRef(null)
    }
  }, [composition])

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
    const r = rendererRef.current; if (!r) return
    if (r.isPlaying) { r.pause(); setPlaying(false) }
    else             { r.play();  setPlaying(true) }
  }

  const scrubbingRef  = useRef(false)
  const progressElRef = useRef<HTMLDivElement>(null)

  const seekFromEvent = useCallback((clientX: number) => {
    const r    = rendererRef.current; if (!r) return
    const rect = progressElRef.current?.getBoundingClientRect(); if (!rect) return
    r.seekToSec(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * totalSec)
  }, [totalSec])

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = rendererRef.current; if (!r) return
    scrubbingRef.current = true
    r.pause(); setPlaying(false)
    seekFromEvent(e.clientX)
    const onMove = (ev: MouseEvent) => { if (scrubbingRef.current) seekFromEvent(ev.clientX) }
    const onUp   = () => {
      scrubbingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  const pct = totalSec > 0 ? Math.min((timeSec / totalSec) * 100, 100) : 0
  const { width: cw, height: ch } = composition.meta

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', background: '#000',
      width: '100%',
      ...(fullScreen
        ? { flex: 1, minHeight: 0 }
        : { aspectRatio: `${cw}/${ch}` }),
    }}>
      {/* wrapperRef: tracks actual pixel dimensions via ResizeObserver */}
      <div
        ref={wrapperRef}
        style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}
      >
        {/* containerRef: explicit px size set by ResizeObserver → clientHeight != 0 */}
        <div
          ref={containerRef}
          style={{ position: 'absolute', top: 0, left: 0 }}
        />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          <PauseLabelsOverlay composition={composition} onJumpToClip={onJumpToClip} />
        </div>
      </div>

      <AudioActivePanel composition={composition} onJumpToClip={onJumpToClip} />

      {/* Controls */}
      <div style={{ flexShrink: 0, background: '#111827', padding: '6px 8px' }}>
        <div
          ref={progressElRef}
          style={{ height: 6, background: '#374151', borderRadius: 3, cursor: 'ew-resize', marginBottom: 6, position: 'relative' }}
          onMouseDown={handleScrubStart}
        >
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: '#fff', borderRadius: 3, width: `${pct}%` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={togglePlay} style={{ padding: '2px 8px', fontSize: 11, background: '#fff', color: '#111', borderRadius: 3, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            {playing ? '⏸' : '▶'}
          </button>
          <button onClick={() => { rendererRef.current?.stop(); setPlaying(false) }} style={{ padding: '2px 8px', fontSize: 11, background: '#374151', color: '#fff', borderRadius: 3, border: 'none', cursor: 'pointer' }}>
            ■
          </button>
          <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginLeft: 4 }}>
            {timeSec.toFixed(1)}s / {totalSec.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  )
}
