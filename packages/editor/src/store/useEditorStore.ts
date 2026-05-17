import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CE2Composition, Clip, Moment } from '@ce2/core'
import { validateComposition } from '@ce2/core'

export interface ValidationState {
  ok: boolean
  errors: Array<{ code: string; message: string; path?: string }>
}

export interface EditorStore {
  composition:       CE2Composition
  selectedClipId:    string | null
  selectedMomentId:  string | null
  validation:        ValidationState
  isDirty:           boolean

  // ── Selection ─────────────────────────────────────────────────────────────
  selectClip:   (id: string | null) => void
  selectMoment: (id: string | null) => void

  // ── Load / replace ────────────────────────────────────────────────────────
  setComposition: (comp: CE2Composition) => void

  // ── Moment mutations ──────────────────────────────────────────────────────
  addMoment:    (after?: string) => void
  removeMoment: (momentId: string) => void
  updateMoment: (momentId: string, patch: Partial<Pick<Moment, 'label' | 'transition_in'>>) => void

  // ── Clip mutations ────────────────────────────────────────────────────────
  addClip:    (momentId: string, clip: Clip) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, patch: Partial<Clip>) => void

  // ── Reorder ───────────────────────────────────────────────────────────────
  moveMoment: (id: string, dir: 'up' | 'down') => void
  moveClip:   (clipId: string, dir: 'up' | 'down') => void

  // ── Globals ───────────────────────────────────────────────────────────────
  updateGlobals: (patch: Partial<CE2Composition['globals']>) => void

  // ── Internal ──────────────────────────────────────────────────────────────
  _revalidate: () => void
}

function newMomentId(comp: CE2Composition): string {
  const ids = new Set(comp.moments.map(m => m.id))
  let i = comp.moments.length + 1
  while (ids.has(`m_${i}`)) i++
  return `m_${i}`
}

function newClipId(comp: CE2Composition): string {
  const all = [...comp.spanning_layers, ...comp.moments.flatMap(m => m.layers)]
  const ids = new Set(all.map(c => c.id))
  let i = all.length + 1
  while (ids.has(`clip_${i}`)) i++
  return `clip_${i}`
}

function findAndMutateClip(
  comp: CE2Composition,
  clipId: string,
  fn: (clip: Clip) => void,
): void {
  for (const moment of comp.moments) {
    const clip = moment.layers.find(c => c.id === clipId)
    if (clip) { fn(clip); return }
  }
  const span = comp.spanning_layers.find(c => c.id === clipId)
  if (span) fn(span)
}

const EMPTY_COMP: CE2Composition = {
  schema_version: '2.0',
  meta:   { width: 1080, height: 1920, fps: 30, title: 'Untitled' },
  globals: {},
  assets: [],
  bundles: [],
  spanning_layers: [],
  moments: [{ id: 'm_1', label: 'Moment 1', layers: [] }],
}

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    composition:      EMPTY_COMP,
    selectedClipId:   null,
    selectedMomentId: EMPTY_COMP.moments[0].id,
    validation:       { ok: true, errors: [] },
    isDirty:          false,

    selectClip: (id) => set(s => {
      s.selectedClipId   = id
      s.selectedMomentId = id
        ? s.composition.moments.find(m => m.layers.some(c => c.id === id))?.id ?? s.selectedMomentId
        : s.selectedMomentId
    }),

    selectMoment: (id) => set(s => {
      s.selectedMomentId = id
      s.selectedClipId   = null
    }),

    setComposition: (comp) => set(s => {
      s.composition      = comp as any
      s.selectedClipId   = null
      s.selectedMomentId = comp.moments[0]?.id ?? null
      s.isDirty          = false
      const v = validateComposition(comp)
      s.validation = { ok: v.ok, errors: v.errors }
    }),

    addMoment: (after) => set(s => {
      const id  = newMomentId(s.composition as CE2Composition)
      const m: Moment = { id, label: `Moment ${s.composition.moments.length + 1}`, layers: [] }
      if (after) {
        const idx = s.composition.moments.findIndex(m => m.id === after)
        s.composition.moments.splice(idx + 1, 0, m as any)
      } else {
        s.composition.moments.push(m as any)
      }
      s.selectedMomentId = id
      s.selectedClipId   = null
      s.isDirty          = true
    }),

    removeMoment: (momentId) => set(s => {
      s.composition.moments = s.composition.moments.filter(m => m.id !== momentId)
      if (s.selectedMomentId === momentId) {
        s.selectedMomentId = s.composition.moments[0]?.id ?? null
        s.selectedClipId   = null
      }
      s.isDirty = true
    }),

    updateMoment: (momentId, patch) => set(s => {
      const m = s.composition.moments.find(m => m.id === momentId)
      if (m) Object.assign(m, patch)
      s.isDirty = true
    }),

    addClip: (momentId, clip) => set(s => {
      const id = newClipId(s.composition as CE2Composition)
      const newClip = { ...clip, id } as any
      const m = s.composition.moments.find(m => m.id === momentId)
      if (m) {
        m.layers.push(newClip)
        s.selectedClipId   = id
        s.selectedMomentId = momentId
      }
      s.isDirty = true
    }),

    removeClip: (clipId) => set(s => {
      for (const m of s.composition.moments) {
        const idx = m.layers.findIndex(c => c.id === clipId)
        if (idx !== -1) { m.layers.splice(idx, 1); break }
      }
      if (s.selectedClipId === clipId) s.selectedClipId = null
      s.isDirty = true
    }),

    updateClip: (clipId, patch) => set(s => {
      findAndMutateClip(s.composition as CE2Composition, clipId, clip => {
        Object.assign(clip, patch)
      })
      s.isDirty = true
    }),

    moveMoment: (id, dir) => set(s => {
      const arr = s.composition.moments
      const idx = arr.findIndex(m => m.id === id)
      const to  = dir === 'up' ? idx - 1 : idx + 1
      if (idx < 0 || to < 0 || to >= arr.length) return
      ;[arr[idx], arr[to]] = [arr[to], arr[idx]]
      s.isDirty = true
    }),

    moveClip: (clipId, dir) => set(s => {
      for (const m of s.composition.moments) {
        const idx = m.layers.findIndex(c => c.id === clipId)
        if (idx === -1) continue
        const to = dir === 'up' ? idx - 1 : idx + 1
        if (to < 0 || to >= m.layers.length) break
        ;[m.layers[idx], m.layers[to]] = [m.layers[to], m.layers[idx]]
        s.isDirty = true
        break
      }
    }),

    updateGlobals: (patch) => set(s => {
      Object.assign(s.composition.globals, patch)
      s.isDirty = true
    }),

    _revalidate: () => {
      const v = validateComposition(get().composition)
      set(s => { s.validation = { ok: v.ok, errors: v.errors } })
    },
  })),
)
