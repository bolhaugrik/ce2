import React, { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserRenderer } from '@ce2/browser'
import { useEditorStore } from '../store/useEditorStore.js'

export function PreviewPanel() {
  const { composition } = useEditorStore()
  const wrapRef       = useRef<HTMLDivElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const rendererRef   = useRef<BrowserRenderer | null>(null)
  const [playing,  setPlaying]  = useState(false)
  const [timeSec,  setTimeSec]  = useState(0)
  const [totalSec, setTotalSec] = useState(1)
  const [momentId, setMomentId] = useState<string | null>(null)
  const [playerSize, setPlayerSize] = useState({ w: 180, h: 320 })

  // Compute player size to fill available space while keeping composition aspect ratio
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const { width: cw, height: ch } = composition.meta
      const aspect = cw / ch
      const availH = height - 80   // reserve space for controls
      const availW = width  - 24
      const byH = { w: availH * aspect, h: availH }
      const byW = { w: availW, h: availW / aspect }
      const fit = byH.w <= availW ? byH : byW
      setPlayerSize({ w: Math.floor(fit.w), h: Math.floor(fit.h) })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [composition.meta.width, composition.meta.height])

  // Rebuild renderer when composition OR player size changes
  useEffect(() => {
    if (!containerRef.current) return
    rendererRef.current?.destroy()

    let renderer: BrowserRenderer
    try {
      renderer = new BrowserRenderer({
        container: containerRef.current,
        composition,
        loop: true,
        fitContainer: true,
      })
    } catch { return }

    rendererRef.current = renderer
    setTimeSec(0)

    const unsubs = [
      renderer.on('play',           () => setPlaying(true)),
      renderer.on('pause',          () => setPlaying(false)),
      renderer.on('stop',           () => { setPlaying(false); setTimeSec(0) }),
      renderer.on('moment-change',  (id) => setMomentId(id as string)),
    ]

    // Estimate total duration
    const allClips = [...composition.spanning_layers, ...composition.moments.flatMap(m => m.layers)]
    const est = allClips.reduce((mx, c) =>
      c.duration.kind === 'fixed_sec' ? Math.max(mx, c.duration.value) : Math.max(mx, 3), 0) * 1.5
    setTotalSec(Math.max(est, 3))
    setMomentId(composition.moments[0]?.id ?? null)

    // Auto-play
    renderer.play()
    setPlaying(true)

    return () => {
      unsubs.forEach(u => u())
      renderer.destroy()
      rendererRef.current = null
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
    else             { r.play();  setPlaying(true)  }
  }

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = rendererRef.current; if (!r) return
    const rect = e.currentTarget.getBoundingClientRect()
    r.seekToSec(((e.clientX - rect.left) / rect.width) * totalSec)
  }, [totalSec])

  const pct = totalSec > 0 ? Math.min((timeSec / totalSec) * 100, 100) : 0

  return (
    <>
      <div className="ce2-panel__header">Preview</div>
      <div className="ce2-preview" ref={wrapRef}>
        <div className="ce2-preview__canvas-wrap">
          <div
            className="ce2-preview__player"
            style={{ width: playerSize.w, height: playerSize.h, position: 'relative', flexShrink: 0 }}
          >
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        <div className="ce2-preview__controls">
          <div className="ce2-preview__progress" onClick={handleProgressClick}>
            <div className="ce2-preview__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="ce2-preview__btn-row">
            <button className="ce2-btn ce2-btn--primary ce2-btn--sm" onClick={togglePlay}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className="ce2-btn ce2-btn--sm" onClick={() => { rendererRef.current?.stop(); setPlaying(false) }}>■</button>
            <span className="ce2-preview__time">{timeSec.toFixed(1)}s / {totalSec.toFixed(1)}s</span>
          </div>
          <div className="ce2-moment-pills">
            {composition.moments.map(m => (
              <button
                key={m.id}
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
              >
                {m.label || m.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
