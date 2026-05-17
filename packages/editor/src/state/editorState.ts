/**
 * CE2 — közös szerkesztő-state (egyszerű controlled hook, nem Context).
 *
 * Selection model:
 *  - 'composition' — nincs konkrét kiválasztás, globals szerkeszthető
 *  - 'moment' — egy moment header kiválasztva (label, transition_in)
 *  - 'clip' — konkrét clip kiválasztva
 *  - 'bundle' — bundle header kiválasztva
 *  - 'spanning' — átívelő réteg
 */
import type { CE2Composition, Clip, Moment, BundleInstance } from '@ce2/core'

export type Selection =
  | { kind: 'none' }
  | { kind: 'composition' }                  // globals
  | { kind: 'moment'; moment_id: string }
  | { kind: 'clip'; moment_id?: string; clip_id: string }
  | { kind: 'bundle'; bundle_id: string }
  | { kind: 'spanning'; clip_id: string }

export type ViewMode = 'visual' | 'json'

/** Két fő desktop munkamód: Komp (szerkezet építés) / Detail (elem szerkesztés). */
export type EditorMode = 'komp' | 'detail'

export type MobilePane = 'catalog' | 'canvas' | 'detail' | 'preview'

export interface CE2EditorStateValues {
  composition: CE2Composition
  selection: Selection
  viewMode: ViewMode
  mobilePane: MobilePane
}

/* ─────────── Helpers — selection lookup ─────────── */

export function findSelectedClip(
  comp: CE2Composition,
  sel: Selection,
): { clip: Clip; moment?: Moment; spanning: boolean } | null {
  if (sel.kind === 'clip') {
    if (sel.moment_id) {
      const moment = comp.moments.find((m) => m.id === sel.moment_id)
      const clip = moment?.layers.find((c) => c.id === sel.clip_id)
      if (clip) return { clip, moment, spanning: false }
    }
    // Spanning fallback
    const sclip = comp.spanning_layers.find((c) => c.id === sel.clip_id)
    if (sclip) return { clip: sclip, spanning: true }
  }
  if (sel.kind === 'spanning') {
    const c = comp.spanning_layers.find((x) => x.id === sel.clip_id)
    if (c) return { clip: c, spanning: true }
  }
  return null
}

export function findSelectedMoment(comp: CE2Composition, sel: Selection): Moment | null {
  if (sel.kind === 'moment') return comp.moments.find((m) => m.id === sel.moment_id) ?? null
  if (sel.kind === 'clip' && sel.moment_id)
    return comp.moments.find((m) => m.id === sel.moment_id) ?? null
  return null
}

export function findSelectedBundle(comp: CE2Composition, sel: Selection): BundleInstance | null {
  if (sel.kind === 'bundle') return comp.bundles.find((b) => b.id === sel.bundle_id) ?? null
  return null
}

/* ─────────── Selection breadcrumb (UI-hoz) ─────────── */

export function selectionBreadcrumb(comp: CE2Composition, sel: Selection): string {
  if (sel.kind === 'none') return 'Nincs kiválasztás'
  if (sel.kind === 'composition') return 'Globálisok'
  if (sel.kind === 'moment') {
    const m = comp.moments.find((x) => x.id === sel.moment_id)
    return `Pillanat · ${m?.label ?? sel.moment_id}`
  }
  if (sel.kind === 'clip') {
    const found = findSelectedClip(comp, sel)
    if (!found) return 'Hiányzó clip'
    if (found.spanning) return `Átívelő · ${found.clip.id}`
    return `${found.moment?.label ?? found.moment?.id ?? '?'} › ${found.clip.id}`
  }
  if (sel.kind === 'bundle') {
    const b = comp.bundles.find((x) => x.id === sel.bundle_id)
    return `Bundle · ${b?.kind ?? sel.bundle_id}`
  }
  if (sel.kind === 'spanning') return `Átívelő · ${sel.clip_id}`
  return ''
}
