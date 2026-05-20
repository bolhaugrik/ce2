import { CE2CompositionSchema } from '../schema/index.js'
import type { CE2Composition, Clip } from '../schema/index.js'
import { AnchorResolver } from '../resolver/AnchorResolver.js'
import { parseSpatialAnchor } from '../resolver/parseSpatialAnchor.js'

export interface ValidationError {
  code: string
  message: string
  path?: string
}

export interface ValidationResult {
  ok: boolean
  errors: ValidationError[]
}

export function validateComposition(raw: unknown): ValidationResult {
  const errors: ValidationError[] = []

  // 1. Zod schema validation
  const parsed = CE2CompositionSchema.safeParse(raw)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push({
        code: 'SCHEMA',
        message: issue.message,
        path: issue.path.join('.'),
      })
    }
    return { ok: false, errors }
  }

  const comp = parsed.data as CE2Composition

  // 2a. Text payload must have content OR text
  for (const clip of allClips(comp)) {
    if (clip.source.kind === 'text') {
      const p = clip.source.payload as any
      if (!p.content && !p.text) {
        errors.push({
          code: 'TEXT_MISSING_CONTENT',
          message: `Clip "${clip.id}" text payload has neither 'content' nor 'text' field`,
          path: `clips.${clip.id}.source.payload`,
        })
      }
    }
  }

  // 2. Asset reference integrity
  const assetIds = new Set(comp.assets.map(a => a.id))
  for (const clip of allClips(comp)) {
    if (clip.source.kind === 'asset' && !assetIds.has(clip.source.asset_id)) {
      errors.push({
        code: 'ASSET_REF',
        message: `Clip "${clip.id}" references unknown asset "${clip.source.asset_id}"`,
        path: `clips.${clip.id}.source.asset_id`,
      })
    }
  }

  // 3. Bundle reference integrity
  const bundleIds = new Set(comp.bundles.map(b => b.id))
  for (const clip of allClips(comp)) {
    if (clip.bundle_id && !bundleIds.has(clip.bundle_id)) {
      errors.push({
        code: 'BUNDLE_REF',
        message: `Clip "${clip.id}" references unknown bundle "${clip.bundle_id}"`,
        path: `clips.${clip.id}.bundle_id`,
      })
    }
  }

  // 4. Clip ID uniqueness
  const clipIds = new Set<string>()
  for (const clip of allClips(comp)) {
    if (clipIds.has(clip.id)) {
      errors.push({
        code: 'DUPLICATE_CLIP_ID',
        message: `Duplicate clip id "${clip.id}"`,
        path: `clips.${clip.id}`,
      })
    }
    clipIds.add(clip.id)
  }

  // 5. Moment ID uniqueness
  const momentIds = new Set<string>()
  for (const moment of comp.moments) {
    if (momentIds.has(moment.id)) {
      errors.push({
        code: 'DUPLICATE_MOMENT_ID',
        message: `Duplicate moment id "${moment.id}"`,
        path: `moments.${moment.id}`,
      })
    }
    momentIds.add(moment.id)
  }

  // 6. Trim sanity
  for (const clip of allClips(comp)) {
    if (clip.source.kind === 'asset' && clip.source.trim) {
      const { in_sec, out_sec } = clip.source.trim
      if (in_sec >= out_sec) {
        errors.push({
          code: 'TRIM_INVALID',
          message: `Clip "${clip.id}" trim.in_sec (${in_sec}) must be < trim.out_sec (${out_sec})`,
          path: `clips.${clip.id}.source.trim`,
        })
      }
    }
  }

  // 6b. SpatialAnchor ref integrity
  const clipNames = new Set(
    allClips(comp)
      .map(c => (c as any).name as string | undefined)
      .filter((n): n is string => !!n)
  )
  for (const clip of allClips(comp)) {
    const pos = (clip as any).position
    if (!pos) continue
    const parsed = parseSpatialAnchor(pos)
    if (!parsed) continue
    if (parsed.ref !== 'screen' && !clipNames.has(parsed.ref)) {
      errors.push({
        code: 'SPATIAL_ANCHOR_REF',
        message: `Clip "${clip.id}" position references unknown name "${parsed.ref}" — add name: "${parsed.ref}" to the target clip, or use "screen"`,
        path: `clips.${clip.id}.position`,
      })
    }
  }

  // 7. Anchor cycle / missing anchor detection via AnchorResolver dry-run
  if (errors.length === 0) {
    try {
      new AnchorResolver({ composition: comp }).resolve()
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = err.constructor.name === 'CE2CycleError' ? 'ANCHOR_CYCLE' : 'ANCHOR_MISSING'
        errors.push({ code, message: err.message })
      }
    }
  }

  return { ok: errors.length === 0, errors }
}

function allClips(comp: CE2Composition): Clip[] {
  return [
    ...comp.spanning_layers,
    ...comp.moments.flatMap(m => m.layers),
  ]
}
