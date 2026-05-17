/**
 * CE2 — Player ↔ NowStrip/MiniMap synkron.
 *
 * BrowserRenderer-alapú implementáció.
 * Egyszerű global state (zustand-szerű, csak React useSyncExternalStore-ral).
 */
import { useSyncExternalStore, useCallback } from 'react'
import type { BrowserRenderer } from '@ce2/browser'

let rendererRef: BrowserRenderer | null = null
let rafId: number | null = null
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((cb) => cb())

function startPolling(): void {
  const tick = () => {
    emit()
    if (rendererRef?.isPlaying) {
      rafId = requestAnimationFrame(tick)
    } else {
      rafId = null
    }
  }
  if (rafId === null) rafId = requestAnimationFrame(tick)
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function setRendererRef(r: BrowserRenderer | null): void {
  rendererRef = r
  if (r) {
    r.on('play', () => {
      emit()
      startPolling()
    })
    r.on('pause', () => emit())
    r.on('stop', () => emit())
    r.on('seek', () => emit())
  }
  emit()
}

/** Visszaadja az aktuális Player frame-et — frame-pontosan reaktív. */
export function usePlayerFrame(): number {
  return useSyncExternalStore(
    subscribe,
    () => rendererRef?.currentFrame ?? 0,
    () => 0,
  )
}

/** Visszaadja, hogy a Player éppen játszik-e. */
export function usePlayerPlaying(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => rendererRef?.isPlaying ?? false,
    () => false,
  )
}

/** Seek-elj a Player-ben (frame-egységben). */
export function useSeekPlayer(): (frame: number) => void {
  return useCallback((frame: number) => {
    rendererRef?.seek(frame)
    emit()
  }, [])
}

/** Pause/play helper. */
export function usePauseResume(): { pause: () => void; play: () => void; isPlaying: () => boolean } {
  return {
    pause: () => rendererRef?.pause(),
    play: () => rendererRef?.play(),
    isPlaying: () => rendererRef?.isPlaying ?? false,
  }
}
