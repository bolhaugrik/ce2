/**
 * CE2 — Composition idő-helper hook-ok.
 *
 * useResolvedComposition: a komp + bundle resolved formája (memoizált)
 * useActiveClipsAt(frame, windowFrames): a megadott frame körüli ablakban
 *   aktív clipek + relatív pozíciójuk
 * useAllAnchorPositions: minden auto-publikált anchor abszolút frame-ben
 */
import { useMemo } from 'react'
import { AnchorResolver, BundleResolver } from '@ce2/core'
import type { CE2Composition, Clip, ResolvedClip } from '@ce2/core'

export interface ResolvedCompositionResult {
  total_frames: number
  fps: number
  resolved_clips: ResolvedClip[]
  anchor_table: Record<string, number>
  moment_times: Record<string, { start: number; end: number }>
}

export function useResolvedComposition(comp: CE2Composition): ResolvedCompositionResult {
  return useMemo(() => {
    try {
      const bundleResolver = new BundleResolver(comp)
      const resolver = new AnchorResolver({ composition: comp })
      const resolved_clips = resolver.resolve().map((rc) => ({
        ...rc,
        clip: bundleResolver.resolveClip(rc.clip),
      }))
      const anchors = resolver.getAnchors()
      const total_frames =
        resolved_clips.length > 0
          ? Math.max(...resolved_clips.map((c) => c.end_frame))
          : comp.meta.fps
      const moment_times: Record<string, { start: number; end: number }> = {}
      for (const m of comp.moments) {
        moment_times[m.id] = {
          start: anchors.get(`moment.${m.id}.start`) ?? 0,
          end: anchors.get(`moment.${m.id}.end`) ?? 0,
        }
      }
      const anchor_table: Record<string, number> = {}
      for (const [k, v] of anchors.entries()) anchor_table[k] = v
      return { total_frames, fps: comp.meta.fps, resolved_clips, anchor_table, moment_times }
    } catch {
      return {
        total_frames: comp.meta.fps,
        fps: comp.meta.fps,
        resolved_clips: [],
        anchor_table: {},
        moment_times: {},
      }
    }
  }, [comp])
}

export interface ActiveClipInWindow {
  resolved: ResolvedClip
  /** Aktív-e a window CENTER frame-ben (vs csak átfedi az ablakot). */
  active_now: boolean
  /** A clip kezdete a window-bázishoz képest, frame-ben (lehet negatív). */
  relative_start: number
  /** A clip vége a window-bázishoz képest, frame-ben. */
  relative_end: number
}

export function useActiveClipsAt(
  resolved: ResolvedCompositionResult,
  centerFrame: number,
  windowFrames: number,
): ActiveClipInWindow[] {
  return useMemo(() => {
    const halfWindow = windowFrames / 2
    const winStart = centerFrame - halfWindow
    const winEnd = centerFrame + halfWindow
    return resolved.resolved_clips
      .filter((c) => c.end_frame >= winStart && c.start_frame <= winEnd)
      .map((c) => ({
        resolved: c,
        active_now: c.start_frame <= centerFrame && c.end_frame >= centerFrame,
        relative_start: c.start_frame - winStart,
        relative_end: c.end_frame - winStart,
      }))
  }, [resolved, centerFrame, windowFrames])
}

/** Anchor-pozíció listája (MiniMap-hez) — minden auto anchor frame-ben. */
export function useAnchorMarkers(
  resolved: ResolvedCompositionResult,
): Array<{ name: string; frame: number; class: 'hard' | 'soft' | 'derived' }> {
  return useMemo(() => {
    const out: Array<{ name: string; frame: number; class: 'hard' | 'soft' | 'derived' }> = []
    for (const [name, frame] of Object.entries(resolved.anchor_table)) {
      let cls: 'hard' | 'soft' | 'derived' = 'soft'
      if (name.startsWith('moment.')) cls = 'hard'
      else if (
        name.endsWith('.middle') ||
        name.includes('.percent.') ||
        name.endsWith('.phase.static')
      )
        cls = 'derived'
      out.push({ name, frame, class: cls })
    }
    return out.sort((a, b) => a.frame - b.frame)
  }, [resolved])
}

/** Layer-csoportosítás aktív clipekre (NowStrip-hez). */
export function groupActiveByLayer(
  items: ActiveClipInWindow[],
): Record<Clip['layer'], ActiveClipInWindow[]> {
  const out: Record<Clip['layer'], ActiveClipInWindow[]> = {
    music: [],
    narration: [],
    sfx: [],
    video: [],
    pixel: [],
    vector: [],
  }
  for (const item of items) {
    out[item.resolved.clip.layer].push(item)
  }
  return out
}
