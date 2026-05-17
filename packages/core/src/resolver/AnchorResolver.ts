import type { CE2Composition, Clip, Moment, TimeAnchor, Duration } from '../schema/index.js'

export interface ResolvedClip {
  clip: Clip
  moment_id: string | null
  start_frame: number
  end_frame: number
}

export interface AnchorResolverOptions {
  composition: CE2Composition
  /** asset_id → duration in seconds (needed for 'matches_source' durations) */
  assetDurations?: Map<string, number>
}

export class CE2CycleError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Anchor dependency cycle detected: ${cycle.join(' → ')}`)
    this.name = 'CE2CycleError'
  }
}

export class CE2AnchorMissingError extends Error {
  constructor(public readonly anchor_ref: string, public readonly clip_id: string) {
    super(`Clip "${clip_id}" references unknown anchor "${anchor_ref}"`)
    this.name = 'CE2AnchorMissingError'
  }
}

export class AnchorResolver {
  private fps: number
  private composition: CE2Composition
  private assetDurations: Map<string, number>
  private anchors = new Map<string, number>()

  constructor({ composition, assetDurations }: AnchorResolverOptions) {
    this.composition = composition
    this.fps = composition.meta.fps
    this.assetDurations = assetDurations ?? new Map()
  }

  resolve(): ResolvedClip[] {
    this.anchors.clear()
    const result: ResolvedClip[] = []

    // Resolve moments sequentially — each moment starts where the previous ended
    let momentStartFrame = 0

    for (const moment of this.composition.moments) {
      this.anchors.set(`moment.${moment.id}.start`, momentStartFrame)

      const resolved = this.resolveMomentClips(moment, momentStartFrame)
      result.push(...resolved)

      const momentEndFrame =
        resolved.length > 0
          ? Math.max(...resolved.map(c => c.end_frame))
          : momentStartFrame

      this.anchors.set(`moment.${moment.id}.end`, momentEndFrame)
      momentStartFrame = momentEndFrame
    }

    const totalEndFrame = momentStartFrame

    // Spanning layers resolved last — they can reference any moment anchor
    for (const clip of this.composition.spanning_layers) {
      const startFrame = this.resolveStartFrame(clip, 0, 0, totalEndFrame)
      const endFrame = this.resolveEndFrame(clip, startFrame, 0, totalEndFrame)
      this.registerClipAnchors(clip, startFrame, endFrame)
      result.push({ clip, moment_id: null, start_frame: startFrame, end_frame: endFrame })
    }

    return result
  }

  // ─── Moment clip resolution ─────────────────────────────────────────────────

  private resolveMomentClips(moment: Moment, momentStartFrame: number): ResolvedClip[] {
    const clips = moment.layers
    if (clips.length === 0) return []

    const ordered = this.topologicalSort(clips, moment.id)
    const result: ResolvedClip[] = []
    let lastEndFrame = momentStartFrame

    for (const clip of ordered) {
      const startFrame = this.resolveStartFrame(
        clip,
        momentStartFrame,
        lastEndFrame,
        undefined,
        moment.id,
      )
      // moment_end not yet known → 'until_moment_end' gets resolved in a second pass
      const endFrame = this.resolveEndFrame(clip, startFrame, momentStartFrame, undefined, moment.id)
      this.registerClipAnchors(clip, startFrame, endFrame)
      result.push({ clip, moment_id: moment.id, start_frame: startFrame, end_frame: endFrame })
      lastEndFrame = endFrame
    }

    // Second pass: resolve 'until_moment_end' durations now that we know the moment end
    const momentEndFrame = Math.max(...result.map(c => c.end_frame))
    this.anchors.set(`moment.${moment.id}.end`, momentEndFrame)

    for (const rc of result) {
      if (rc.clip.duration.kind === 'until_moment_end') {
        const newEndFrame = momentEndFrame
        this.registerClipAnchors(rc.clip, rc.start_frame, newEndFrame)
        rc.end_frame = newEndFrame
      }
    }

    return result
  }

  // ─── Topological sort ───────────────────────────────────────────────────────

  private topologicalSort(clips: Clip[], momentId: string): Clip[] {
    const clipById = new Map(clips.map(c => [c.id, c]))

    // Infer publisher clip from anchor_ref prefix: "feat2.phase.static" → "feat2"
    // This handles ALL derived anchors (.phase.*, .mark.*, .middle, etc.) automatically.
    const getPublisher = (anchorRef: string): string | undefined => {
      const dotIdx = anchorRef.indexOf('.')
      const candidateId = dotIdx !== -1 ? anchorRef.slice(0, dotIdx) : anchorRef
      return clipById.has(candidateId) ? candidateId : undefined
    }

    const deps = new Map<string, Set<string>>()
    for (const clip of clips) {
      const d = new Set<string>()

      const startRef = this.getAnchorRef(clip.start)
      if (startRef) {
        const publisher = getPublisher(startRef)
        if (publisher && publisher !== clip.id) d.add(publisher)
      }

      const durRef = this.getAnchorRef(clip.duration)
      if (durRef) {
        const publisher = getPublisher(durRef)
        if (publisher && publisher !== clip.id) d.add(publisher)
      }

      deps.set(clip.id, d)
    }

    // Kahn's algorithm
    const inDegree = new Map<string, number>()
    for (const clip of clips) inDegree.set(clip.id, 0)
    for (const [, ds] of deps) {
      for (const d of ds) {
        inDegree.set(d, (inDegree.get(d) ?? 0) + 1)
      }
    }
    // inDegree for clip = how many clips depend on IT (reverse)
    // We need: deps[clip] = set of clips that clip depends on
    const reverseDeps = new Map<string, Set<string>>()
    for (const clip of clips) reverseDeps.set(clip.id, new Set())
    for (const [clipId, ds] of deps) {
      for (const dep of ds) {
        reverseDeps.get(dep)!.add(clipId)
      }
    }

    const inDeg = new Map<string, number>()
    for (const clip of clips) {
      inDeg.set(clip.id, deps.get(clip.id)!.size)
    }

    const queue: string[] = []
    for (const [id, deg] of inDeg) {
      if (deg === 0) queue.push(id)
    }

    const ordered: Clip[] = []
    while (queue.length > 0) {
      const id = queue.shift()!
      const clip = clipById.get(id)
      if (clip) ordered.push(clip)
      for (const dependent of reverseDeps.get(id) ?? []) {
        const newDeg = (inDeg.get(dependent) ?? 0) - 1
        inDeg.set(dependent, newDeg)
        if (newDeg === 0) queue.push(dependent)
      }
    }

    if (ordered.length !== clips.length) {
      // Cycle exists — collect participating clip IDs
      const remaining = clips.filter(c => !ordered.includes(c)).map(c => c.id)
      throw new CE2CycleError(remaining)
    }

    return ordered
  }

  private getAnchorRef(anchor: TimeAnchor | Duration): string | null {
    if ('anchor_ref' in anchor) return anchor.anchor_ref
    return null
  }

  // ─── Frame resolution ───────────────────────────────────────────────────────

  private resolveStartFrame(
    clip: Clip,
    momentStartFrame: number,
    lastEndFrame: number,
    totalEndFrame?: number,
    momentId?: string,
  ): number {
    const start = clip.start

    switch (start.kind) {
      case 'moment_start':
        return momentStartFrame

      case 'after_previous':
        return lastEndFrame + this.secToFrames(start.offset_sec ?? 0)

      case 'absolute_sec':
        return this.secToFrames(start.value)

      case 'anchor': {
        const frame = this.anchors.get(start.anchor_ref)
        if (frame === undefined) {
          throw new CE2AnchorMissingError(start.anchor_ref, clip.id)
        }
        return frame + this.secToFrames(start.offset_sec ?? 0)
      }
    }
  }

  private resolveEndFrame(
    clip: Clip,
    startFrame: number,
    momentStartFrame: number,
    totalEndFrame?: number,
    momentId?: string,
  ): number {
    const dur = clip.duration

    switch (dur.kind) {
      case 'fixed_sec':
        return startFrame + this.secToFrames(dur.value)

      case 'matches_source': {
        const src = clip.source
        if (src.kind === 'asset') {
          let durationSec: number
          if (src.trim) {
            durationSec = src.trim.out_sec - src.trim.in_sec
          } else {
            durationSec = this.assetDurations.get(src.asset_id) ?? 0
          }
          return startFrame + this.secToFrames(durationSec)
        }
        // tts / computed — duration unknown without backend, fallback 3s
        return startFrame + this.secToFrames(3)
      }

      case 'until_moment_end': {
        // Will be resolved in second pass; return placeholder
        const momentEnd = momentId ? this.anchors.get(`moment.${momentId}.end`) : undefined
        return momentEnd ?? startFrame + this.secToFrames(3)
      }

      case 'until_anchor': {
        const frame = this.anchors.get(dur.anchor_ref)
        if (frame === undefined) {
          // Special case: until_anchor referencing the CURRENT moment's end
          // → treat like until_moment_end (resolved in second pass)
          if (momentId && dur.anchor_ref === `moment.${momentId}.end`) {
            return this.anchors.get(`moment.${momentId}.end`) ?? startFrame + this.secToFrames(3)
          }
          throw new CE2AnchorMissingError(dur.anchor_ref, clip.id)
        }
        return frame + this.secToFrames(dur.offset_sec ?? 0)
      }
    }
  }

  // ─── Anchor registration ────────────────────────────────────────────────────

  private registerClipAnchors(clip: Clip, startFrame: number, endFrame: number): void {
    this.anchors.set(`${clip.id}.start`, startFrame)
    this.anchors.set(`${clip.id}.end`, endFrame)
    this.anchors.set(`${clip.id}.middle`, Math.round((startFrame + endFrame) / 2))

    // Audio markers (HARD anchors — CE2.16d)
    for (const marker of clip.audio_markers ?? []) {
      const markerStart = startFrame + this.secToFrames(marker.time_sec)
      this.anchors.set(`${clip.id}.mark.${marker.id}.start`, markerStart)
      if (marker.kind === 'region' && marker.end_sec !== undefined) {
        this.anchors.set(`${clip.id}.mark.${marker.id}.end`, startFrame + this.secToFrames(marker.end_sec))
      }
    }

    // Phase anchors for vector/text clips
    if (clip.layer === 'vector' || clip.source.kind === 'text') {
      const duration = endFrame - startFrame
      const enterEnd = startFrame + Math.round(duration * 0.2)
      const exitStart = endFrame - Math.round(duration * 0.2)
      this.anchors.set(`${clip.id}.phase.enter`, startFrame)
      this.anchors.set(`${clip.id}.phase.static`, enterEnd)
      this.anchors.set(`${clip.id}.phase.exit`, exitStart)
    }

    // Custom published anchors
    for (const anchorId of clip.publish_anchors ?? []) {
      if (!this.anchors.has(anchorId)) {
        this.anchors.set(anchorId, startFrame)
      }
    }
  }

  /** All resolved anchor frames (useful for editor inspection / tests) */
  getAnchors(): ReadonlyMap<string, number> {
    return this.anchors
  }

  private secToFrames(sec: number): number {
    return Math.round(sec * this.fps)
  }
}
