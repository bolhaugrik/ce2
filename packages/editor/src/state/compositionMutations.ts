/**
 * CE2 — Composition mutációk (preset emit + clip törlés + moment ops).
 *
 * Tisztán funkcionális (immutable update) — minden függvény új CE2Composition-t
 * ad vissza.
 */
import type { CE2Composition, Clip, Moment } from '@ce2/core'

let momentCounter = 0

const nextMomentId = (existing: Moment[]): string => {
  momentCounter += 1
  let candidate = `m_${momentCounter}`
  const ids = new Set(existing.map((m) => m.id))
  while (ids.has(candidate)) {
    momentCounter += 1
    candidate = `m_${momentCounter}`
  }
  return candidate
}

/* ─────────── Preset emit types ─────────── */

export interface ResolvedPlacement {
  kind: 'spanning' | 'new_moment' | 'existing_moment'
  moment_id?: string
  insert_at_index?: number
}

export interface EmitResult {
  clips: Clip[]
  bundle?: import('@ce2/core').BundleInstance
  new_assets?: import('@ce2/core').AssetRef[]
  placement_resolved: ResolvedPlacement
}

/* ─────────── Preset emit alkalmazása ─────────── */

export function applyEmitResult(
  composition: CE2Composition,
  result: EmitResult,
): CE2Composition {
  let next: CE2Composition = {
    ...composition,
    moments: [...composition.moments],
    spanning_layers: [...composition.spanning_layers],
    bundles: [...composition.bundles],
    assets: [...composition.assets],
  }

  // Új asset-ek hozzáadása (dedup)
  if (result.new_assets && result.new_assets.length > 0) {
    const existingIds = new Set(next.assets.map((a) => a.id))
    for (const a of result.new_assets) {
      if (!existingIds.has(a.id)) next.assets.push(a)
    }
  }

  // Bundle hozzáadása
  if (result.bundle) {
    next.bundles.push(result.bundle)
  }

  // Clipek elhelyezése
  const placement = result.placement_resolved
  if (placement.kind === 'spanning') {
    next.spanning_layers.push(...result.clips)
  } else if (placement.kind === 'new_moment') {
    const newMoment: Moment = {
      id: nextMomentId(next.moments),
      label: undefined,
      layers: result.clips,
    }
    const insertIdx = placement.insert_at_index ?? next.moments.length
    next.moments = [
      ...next.moments.slice(0, insertIdx),
      newMoment,
      ...next.moments.slice(insertIdx),
    ]
  } else if (placement.kind === 'existing_moment' && placement.moment_id) {
    next.moments = next.moments.map((m) =>
      m.id === placement.moment_id ? { ...m, layers: [...m.layers, ...result.clips] } : m,
    )
  }

  return next
}

/* ─────────── Clip / Moment törlése ─────────── */

export function deleteClip(composition: CE2Composition, clipId: string): CE2Composition {
  return {
    ...composition,
    spanning_layers: composition.spanning_layers.filter((c) => c.id !== clipId),
    moments: composition.moments.map((m) => ({
      ...m,
      layers: m.layers.filter((c) => c.id !== clipId),
    })),
  }
}

export function deleteMoment(composition: CE2Composition, momentId: string): CE2Composition {
  return {
    ...composition,
    moments: composition.moments.filter((m) => m.id !== momentId),
  }
}

export function deleteBundle(composition: CE2Composition, bundleId: string): CE2Composition {
  return {
    ...composition,
    bundles: composition.bundles.filter((b) => b.id !== bundleId),
    spanning_layers: composition.spanning_layers.filter((c) => c.bundle_id !== bundleId),
    moments: composition.moments.map((m) => ({
      ...m,
      layers: m.layers.filter((c) => c.bundle_id !== bundleId),
    })),
  }
}

/* ─────────── Új üres pillanat ─────────── */

export function addEmptyMoment(composition: CE2Composition): CE2Composition {
  const newMoment: Moment = {
    id: nextMomentId(composition.moments),
    layers: [],
  }
  return { ...composition, moments: [...composition.moments, newMoment] }
}
