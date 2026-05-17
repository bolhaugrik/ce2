import type { CE2Composition, BundleInstance, Clip } from '../schema/index.js'

/**
 * Resolves bundle inputs into clips — replaces `inputs_from_bundle` references
 * with the actual values from the bundle's `inputs` map.
 */
export class BundleResolver {
  private bundleMap: Map<string, BundleInstance>

  constructor(composition: CE2Composition) {
    this.bundleMap = new Map(composition.bundles.map(b => [b.id, b]))
  }

  resolveClip(clip: Clip): Clip {
    if (!clip.bundle_id) return clip

    const bundle = this.bundleMap.get(clip.bundle_id)
    if (!bundle) return clip

    let resolved: Clip = { ...clip }

    // Resolve opacity_from_bundle
    if (clip.opacity_from_bundle && bundle.inputs[clip.opacity_from_bundle] !== undefined) {
      resolved = { ...resolved, opacity: bundle.inputs[clip.opacity_from_bundle] as number }
    }

    // Resolve computed source inputs_from_bundle
    if (
      resolved.source.kind === 'computed' &&
      resolved.source.inputs_from_bundle?.length
    ) {
      const mergedInputs: Record<string, unknown> = { ...resolved.source.inputs }
      for (const key of resolved.source.inputs_from_bundle) {
        if (bundle.inputs[key] !== undefined) {
          mergedInputs[key] = bundle.inputs[key]
        }
      }
      resolved = {
        ...resolved,
        source: { ...resolved.source, inputs: mergedInputs },
      }
    }

    return resolved
  }

  resolveAll(clips: Clip[]): Clip[] {
    return clips.map(c => this.resolveClip(c))
  }
}
