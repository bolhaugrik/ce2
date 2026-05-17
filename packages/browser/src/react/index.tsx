import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { CE2Composition } from '@ce2/core'
import { BrowserRenderer } from '../BrowserRenderer.js'

export interface CE2PlayerProps {
  composition: CE2Composition
  assets?: Record<string, string>
  assetDurations?: Map<string, number>
  autoPlay?: boolean
  loop?: boolean
  style?: React.CSSProperties
  className?: string
  onReady?: () => void
  onMomentChange?: (momentId: string) => void
  onEnd?: () => void
}

export interface CE2PlayerHandle {
  play: () => void
  pause: () => void
  stop: () => void
  seek: (frame: number) => void
  seekToSec: (sec: number) => void
  readonly isPlaying: boolean
  readonly currentFrame: number
  readonly currentTimeSec: number
}

export const CE2Player = forwardRef<CE2PlayerHandle, CE2PlayerProps>(
  function CE2Player(props, ref) {
    const {
      composition,
      assets,
      assetDurations,
      autoPlay = false,
      loop = false,
      style,
      className,
      onReady,
      onMomentChange,
      onEnd,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<BrowserRenderer | null>(null)

    useImperativeHandle(ref, () => ({
      play:          ()        => rendererRef.current?.play(),
      pause:         ()        => rendererRef.current?.pause(),
      stop:          ()        => rendererRef.current?.stop(),
      seek:          (f)       => rendererRef.current?.seek(f),
      seekToSec:     (s)       => rendererRef.current?.seekToSec(s),
      get isPlaying()          { return rendererRef.current?.isPlaying ?? false },
      get currentFrame()       { return rendererRef.current?.currentFrame ?? 0 },
      get currentTimeSec()     { return rendererRef.current?.currentTimeSec ?? 0 },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      const renderer = new BrowserRenderer({
        container: containerRef.current,
        composition,
        assets,
        assetDurations,
        loop,
        fitContainer: true,
      })

      const unsubs: Array<() => void> = []

      if (onReady)         unsubs.push(renderer.on('ready',         () => onReady()))
      if (onMomentChange)  unsubs.push(renderer.on('moment-change', (id) => onMomentChange(id as string)))
      if (onEnd)           unsubs.push(renderer.on('end',           () => onEnd()))

      rendererRef.current = renderer

      if (autoPlay) renderer.play()

      return () => {
        unsubs.forEach(u => u())
        renderer.destroy()
        rendererRef.current = null
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [composition])

    return (
      <div
        ref={containerRef}
        style={{ position: 'relative', overflow: 'hidden', ...style }}
        className={className}
      />
    )
  },
)
