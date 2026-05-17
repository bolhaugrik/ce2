/**
 * CE2 — Clip / globals / moment mező-szintű mutációk.
 *
 * Az `updateClip(comp, clipId, fn)` egyetlen helyen kezeli a clip
 * megkeresését (spanning vagy moment-belül) és új CE2Composition-t ad
 * vissza a módosítás után.
 */
import type { CE2Composition, Clip, Moment, BundleInstance } from '@ce2/core'

/** Frissít egy clipet a clip_id alapján. Ha nincs ilyen, változatlanul ad vissza. */
export function updateClip(
  comp: CE2Composition,
  clipId: string,
  updater: (c: Clip) => Clip,
): CE2Composition {
  let changed = false
  const newSpanning = comp.spanning_layers.map((c) => {
    if (c.id === clipId) {
      changed = true
      return updater(c)
    }
    return c
  })
  const newMoments = comp.moments.map((m) => {
    const newLayers = m.layers.map((c) => {
      if (c.id === clipId) {
        changed = true
        return updater(c)
      }
      return c
    })
    return changed ? { ...m, layers: newLayers } : m
  })
  if (!changed) return comp
  return { ...comp, spanning_layers: newSpanning, moments: newMoments }
}

/** Frissít egy moment-et az ID alapján. */
export function updateMoment(
  comp: CE2Composition,
  momentId: string,
  updater: (m: Moment) => Moment,
): CE2Composition {
  return {
    ...comp,
    moments: comp.moments.map((m) => (m.id === momentId ? updater(m) : m)),
  }
}

/** Composition globals frissítése. */
export function updateGlobals(
  comp: CE2Composition,
  updater: (g: CE2Composition['globals']) => CE2Composition['globals'],
): CE2Composition {
  return { ...comp, globals: updater(comp.globals ?? {}) }
}

/** Composition meta frissítése. */
export function updateMeta(
  comp: CE2Composition,
  updater: (m: CE2Composition['meta']) => CE2Composition['meta'],
): CE2Composition {
  return { ...comp, meta: updater(comp.meta) }
}

/** Bundle frissítése az ID alapján. */
export function updateBundle(
  comp: CE2Composition,
  bundleId: string,
  updater: (b: BundleInstance) => BundleInstance,
): CE2Composition {
  return {
    ...comp,
    bundles: comp.bundles.map((b) => (b.id === bundleId ? updater(b) : b)),
  }
}
