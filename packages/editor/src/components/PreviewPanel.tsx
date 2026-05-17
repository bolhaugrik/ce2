import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserRenderer } from '@ce2/browser'
import { useEditorStore } from '../store/useEditorStore.js'

export function PreviewPanel() {
  const { composition } = useEditorStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef  = useRef<BrowserRenderer | null>(null)
  const [playing,  setPlaying]  = useState(false)
  const [timeSec,  setTimeSec]  = useState(0)
  const [totalSec, setTotalSec] = useState(1)
  const [momentId, setMomentId] = useState<string | null>(null)

  // Rebuild renderer on composition change — preserves play/pause state and position
  useEffect(() => {
    if (!containerRef.current) return

    // Snapshot state before destroying
    const prevTimeSec  = rendererRef.current?.currentTimeSec ?? 0
    const wasPlaying   = rendererRef.current?.isPlaying      ?? true  // auto-play on first load only
    rendererRef.current?.destroy()

    // Build asset URL map from composition.assets
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
    } catch { return }

    rendererRef.current = renderer

    setTotalSec(renderer.totalTimeSec)
    setMomentId(composition.moments[0]?.id ?? null)

    // Restore position (small rebuild → same spot)
    if (prevTimeSec > 0) renderer.seekToSec(prevTimeSec)

    // First load: start paused (browser autoplay policy blocks audio otherwise)
    // Subsequent rebuilds: restore previous play state
    const isFirstLoad = prevTimeSec === 0 && !wasPlaying
    if (!isFirstLoad && wasPlaying) { renderer.play(); setPlaying(true) }
    else                            { setPlaying(false) }

    const unsubs = [
      renderer.on('play',          () => setPlaying(true)),
      renderer.on('pause',         () => setPlaying(false)),
      renderer.on('stop',          () => { setPlaying(false); setTimeSec(0) }),
      renderer.on('moment-change', (id) => setMomentId(id as string)),
    ]

    return () => { unsubs.forEach(u => u()); renderer.destroy(); rendererRef.current = null }
  }, [composition])

  // Refit when panel resizes
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
    const r = rendererRef.current; if (!r) return
    if (r.isPlaying) { r.pause(); setPlaying(false) }
    else             { r.play();  setPlaying(true) }
  }

  // ── Scrubbing ────────────────────────────────────────────────────────────
  const scrubbingRef   = useRef(false)
  const wasPlayingRef  = useRef(false)
  const progressElRef  = useRef<HTMLDivElement>(null)

  const seekFromEvent = useCallback((clientX: number) => {
    const r    = rendererRef.current; if (!r) return
    const rect = progressElRef.current?.getBoundingClientRect(); if (!rect) return
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    r.seekToSec(pct * totalSec)
  }, [totalSec])

  const handleScrubStart = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = rendererRef.current; if (!r) return
    scrubbingRef.current  = true
    wasPlayingRef.current = r.isPlaying
    r.pause()
    setPlaying(false)
    seekFromEvent(e.clientX)

    const onMove = (ev: MouseEvent) => { if (scrubbingRef.current) seekFromEvent(ev.clientX) }
    const onUp   = () => {
      scrubbingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      // Stay paused — let user decide whether to resume
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    seekFromEvent(e.clientX)
  }, [seekFromEvent])

  const pct = totalSec > 0 ? Math.min((timeSec / totalSec) * 100, 100) : 0

  return (
    <>
      <div className="ce2-panel__header">Preview</div>
      <div className="ce2-preview">
        {/* Canvas fills all available space; BrowserRenderer scales canvas inside */}
        <div className="ce2-preview__canvas-wrap">
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        <div className="ce2-preview__controls">
          <div className="ce2-preview__progress" ref={progressElRef}
            onMouseDown={handleScrubStart} onClick={handleProgressClick}
            style={{ cursor: 'ew-resize' }}>
            <div className="ce2-preview__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ce2-preview__btn-row">
            <button className="ce2-btn ce2-btn--primary ce2-btn--sm" onClick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className="ce2-btn ce2-btn--sm"
              onClick={() => { rendererRef.current?.stop(); setPlaying(false) }}>■</button>
            <span className="ce2-preview__time">{timeSec.toFixed(1)}s / {totalSec.toFixed(1)}s</span>
          </div>
          <div className="ce2-moment-pills">
            {composition.moments.map(m => (
              <button key={m.id}
                className={`ce2-moment-pill ${momentId === m.id ? 'active' : ''}`}
                onClick={() => {
                  const r = rendererRef.current; if (!r) return
                  let frame = 0
                  for (const mm of composition.moments) {
                    if (mm.id === m.id) break
                    const dur = mm.layers.reduce((mx, l) =>
                      l.duration.kind === 'fixed_sec' ? Math.max(mx, l.duration.value) : Math.max(mx, 3), 0)
                    frame += dur * composition.meta.fps
                  }
                  r.seek(Math.round(frame))
                }}
              >{m.label || m.id}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
