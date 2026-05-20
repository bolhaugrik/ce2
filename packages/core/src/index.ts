// Schema + Types
export * from './schema/index.js'

// Resolver
export { AnchorResolver, CE2CycleError, CE2AnchorMissingError } from './resolver/AnchorResolver.js'
export type { ResolvedClip, AnchorResolverOptions } from './resolver/AnchorResolver.js'

export { BundleResolver } from './resolver/BundleResolver.js'
export { parseSpatialAnchor, isSpatialAnchor, isAbsolutePosition } from './resolver/parseSpatialAnchor.js'
export type { ParsedSpatialAnchor } from './resolver/parseSpatialAnchor.js'

// Validation
export { validateComposition } from './validation/validate.js'
export type { ValidationResult, ValidationError } from './validation/validate.js'
