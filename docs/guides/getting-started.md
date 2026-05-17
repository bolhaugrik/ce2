# Getting Started with `@ce2/core`

This guide walks through installing `@ce2/core`, writing your first CE2 composition, validating it, and resolving it to frame-level data.

---

## Install

```bash
npm install @ce2/core
# or
pnpm add @ce2/core
# or
yarn add @ce2/core
```

`@ce2/core` has a single peer dependency: [Zod](https://github.com/colinhacks/zod) v3.

---

## Your first composition

A CE2 composition is a plain JSON object (or TypeScript object). Start with the required fields:

```ts
import type { CE2Composition } from '@ce2/core'

const composition: CE2Composition = {
  schema_version: '2.0',
  meta: {
    width: 1080,
    height: 1920,
    fps: 30,
    title: 'My First CE2 Composition',
  },
  globals: {
    background_color: '#111111',
  },
  assets: [],
  bundles: [],
  spanning_layers: [],
  moments: [
    {
      id: 'm_intro',
      label: 'Intro',
      layers: [
        {
          id: 'txt_hello',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Hello, CE2!',
              font_size: 72,
              color: '#ffffff',
              text_align: 'center',
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
      ],
    },
  ],
}
```

---

## Validate

`validateComposition` runs the Zod schema check plus seven business-rule checks (asset references, bundle references, duplicate IDs, trim sanity, anchor cycles). It takes raw `unknown` input and returns a typed result.

```ts
import { validateComposition } from '@ce2/core'

const result = validateComposition(composition)

if (!result.ok) {
  for (const error of result.errors) {
    console.error(`[${error.code}] ${error.message}`)
  }
} else {
  console.log('Composition is valid.')
}
```

Error codes:

| Code | Meaning |
|------|---------|
| `SCHEMA` | Zod validation failure |
| `ASSET_REF` | Clip references an asset ID not in `composition.assets[]` |
| `BUNDLE_REF` | Clip references a bundle ID not in `composition.bundles[]` |
| `DUPLICATE_CLIP_ID` | Two clips share the same `id` |
| `DUPLICATE_MOMENT_ID` | Two moments share the same `id` |
| `TRIM_INVALID` | `source.trim.in_sec >= out_sec` |
| `ANCHOR_CYCLE` | Circular anchor dependency detected |
| `ANCHOR_MISSING` | `anchor_ref` references an anchor that doesn't exist |

---

## Resolve anchors

`AnchorResolver` takes a composition and optional asset duration data, then resolves every clip to `(start_frame, end_frame)`.

```ts
import { AnchorResolver } from '@ce2/core'

const resolver = new AnchorResolver({
  composition,
  // Provide durations for any video/audio assets so 'matches_source' works:
  assetDurations: new Map([
    ['hero_video', 8.5],  // asset_id → seconds
    ['bg_music',  60.0],
  ]),
})

const resolved = resolver.resolve()

for (const rc of resolved) {
  console.log(
    `${rc.clip.id} [${rc.moment_id ?? 'spanning'}]`,
    `frames ${rc.start_frame}–${rc.end_frame}`,
    `(${((rc.end_frame - rc.start_frame) / composition.meta.fps).toFixed(2)}s)`,
  )
}
```

Output for the example above:
```
txt_hello [m_intro] frames 0–90 (3.00s)
```

### Inspect anchors

After calling `resolve()`, all published anchors are available:

```ts
const anchors = resolver.getAnchors()

console.log(anchors.get('moment.m_intro.start'))  // 0
console.log(anchors.get('moment.m_intro.end'))    // 90
console.log(anchors.get('txt_hello.start'))       // 0
console.log(anchors.get('txt_hello.end'))         // 90
console.log(anchors.get('txt_hello.phase.enter')) // 0
console.log(anchors.get('txt_hello.phase.exit'))  // 72  (end - 20%)
```

---

## Parse raw JSON

When loading CE2 JSON from a file or API, parse and validate with the Zod schema directly:

```ts
import { CE2CompositionSchema } from '@ce2/core'

const rawJson = await fetch('/compositions/my-comp.json').then(r => r.json())

// throws ZodError on invalid input:
const composition = CE2CompositionSchema.parse(rawJson)

// or use safeParse to get a result object:
const parsed = CE2CompositionSchema.safeParse(rawJson)
if (!parsed.success) {
  console.error(parsed.error.issues)
}
```

---

## Resolve bundles

If your composition uses bundle presets, `BundleResolver` merges `inputs_from_bundle` references into clips before passing them to a renderer:

```ts
import { BundleResolver } from '@ce2/core'

const bundleResolver = new BundleResolver(composition)

const allClips = [
  ...composition.spanning_layers,
  ...composition.moments.flatMap(m => m.layers),
]

const resolvedClips = bundleResolver.resolveAll(allClips)
// resolvedClips[i].source.inputs now has bundle values merged in
```

---

## TypeScript types

All CE2 types are exported from `@ce2/core` and inferred from Zod schemas:

```ts
import type {
  CE2Composition,
  Moment,
  Clip,
  ClipSource,
  TimeAnchor,
  Duration,
  Effect,
  Transition,
  TextPayload,
  AudioMarker,
  BundleInstance,
  AssetRef,
} from '@ce2/core'
```

---

## Next steps

- Add a video clip with `source: { kind: 'asset', ... }` and provide `assetDurations` to the resolver
- Try anchor-based timing: set one clip's `start` to `{ kind: 'anchor', anchor_ref: 'txt_hello.phase.static' }`
- Add a second moment and watch `moment.m_intro.end` become `moment.m_second.start`
- Explore the [Anchor System](../spec/anchors.md) and [Bundle System](../spec/bundles.md)
