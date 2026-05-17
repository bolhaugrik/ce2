# CE2 Schema Reference

All types are defined in `@ce2/core` and inferred from Zod schemas. The canonical source of truth is [`packages/core/src/schema/index.ts`](../../packages/core/src/schema/index.ts).

---

## CE2Composition

The root object. Every CE2 document is a `CE2Composition`.

```ts
interface CE2Composition {
  schema_version: '2.0'
  meta:            CompositionMeta
  globals:         CompositionGlobals
  assets:          AssetRef[]
  bundles:         BundleInstance[]
  spanning_layers: Clip[]
  moments:         Moment[]          // min 1
}
```

### CompositionMeta

```ts
interface CompositionMeta {
  width:   number   // canvas width in pixels, e.g. 1080
  height:  number   // canvas height in pixels, e.g. 1920
  fps:     number   // frames per second, e.g. 30
  title?:  string
}
```

### CompositionGlobals

Defaults inherited by clips unless overridden.

```ts
interface CompositionGlobals {
  background_color?:  string   // CSS color, e.g. "#000000"
  base_font?:         string   // font family name
  base_voice_id?:     string   // default TTS voice
  base_music_volume?: number   // 0–2, default volume for music clips
}
```

---

## Moment

A time unit. Moments play sequentially. The moment's duration equals the maximum `end_frame` of its clips.

```ts
interface Moment {
  id:            string       // unique within composition
  label?:        string       // display name, e.g. "Intro"
  transition_in?: Transition  // how this moment enters from the previous
  layers:        Clip[]
}
```

---

## Clip

The fundamental unit — a single media element placed in time.

```ts
interface Clip {
  id:               string       // unique within entire composition
  label?:           string       // display name
  layer:            LayerKind
  source:           ClipSource
  start:            TimeAnchor
  duration:         Duration
  z_within_layer?:  number       // overrides default layer z-order
  bundle_id?:       string       // reference to BundleInstance.id
  bundle_role?:     string       // semantic role inside the bundle, e.g. 'text.main'
  attached_effects?: Effect[]
  publish_anchors?:  string[]    // additional anchor IDs this clip publishes
  in_transition?:    Transition
  out_transition?:   Transition
  blend_mode?:       string      // CSS blend mode, e.g. 'multiply'
  opacity?:          number      // 0–1
  opacity_from_bundle?: string   // read opacity from bundle.inputs[key]
  muted?:            boolean
  volume?:           number      // 0–2
  audio_markers?:    AudioMarker[]
}
```

### LayerKind

```ts
type LayerKind = 'video' | 'pixel' | 'vector' | 'narration' | 'sfx' | 'music'
```

Default z-order (back to front): `video` → `pixel` → `vector`. Audio layers (`music`, `narration`, `sfx`) have no visual z-order. Override per-clip with `z_within_layer`.

---

## ClipSource

Discriminated union — `kind` determines the shape.

### `asset`

References an `AssetRef` in `composition.assets[]`.

```ts
{ kind: 'asset'; asset_id: string; trim?: { in_sec: number; out_sec: number } }
```

`trim.in_sec` must be < `trim.out_sec`. When `duration: { kind: 'matches_source' }`, the effective duration is `out_sec - in_sec`.

### `text`

Inline text with styling. Rendered as vector (CSS/SVG).

```ts
{ kind: 'text'; payload: TextPayload }

interface TextPayload {
  content:          string
  font_size?:       number
  font_family?:     string
  font_weight?:     string | number
  font_style?:      'normal' | 'italic'
  color?:           string
  text_align?:      'left' | 'center' | 'right'
  line_height?:     number
  letter_spacing?:  number
  text_transform?:  'none' | 'uppercase' | 'lowercase' | 'capitalize'
  position?: {
    anchor?: 'top-left' | 'top' | 'top-right' | 'left' | 'center' |
             'right' | 'bottom-left' | 'bottom' | 'bottom-right'
    x?: number   // pixel offset from anchor point
    y?: number
  }
}
```

### `tts`

Text-to-speech. The renderer generates an audio clip from the text at render time (or the pipeline does it beforehand and converts to `asset`).

```ts
{ kind: 'tts'; text: string; voice_id: string; lang?: string }
```

### `svg`

Raw SVG string, rendered as a vector clip.

```ts
{ kind: 'svg'; payload: string }
```

### `shape`

Primitive shapes.

```ts
{ kind: 'shape'; shape: 'rect' | 'circle' | 'line'; geom: Record<string, unknown> }
```

`geom` is shape-specific: `{ x, y, width, height, fill, stroke, strokeWidth }` for rect, `{ cx, cy, r, fill }` for circle, etc.

### `computed`

Logic-driven source (e.g. countdown timer, animated counter). The `logic_id` maps to a registered computed renderer in `@ce2/core`'s registry.

```ts
{
  kind: 'computed'
  logic_id: string
  inputs: Record<string, unknown>
  inputs_from_bundle?: string[]   // keys to pull from bundle.inputs instead
}
```

---

## TimeAnchor

When does the clip start?

```ts
type TimeAnchor =
  | { kind: 'moment_start' }
  | { kind: 'after_previous'; offset_sec?: number }
  | { kind: 'anchor'; anchor_ref: string; offset_sec?: number }
  | { kind: 'absolute_sec'; value: number }
```

| Kind | Meaning |
|------|---------|
| `moment_start` | At the start of the containing moment (frame 0 of the moment) |
| `after_previous` | Immediately after the previous clip in the same moment. Optional offset (positive = gap, negative = overlap) |
| `anchor` | At the frame of a named anchor. See [Anchor System](anchors.md). |
| `absolute_sec` | Fixed position in the global timeline. Avoid unless necessary — breaks relative editing. |

---

## Duration

How long does the clip last?

```ts
type Duration =
  | { kind: 'fixed_sec'; value: number }
  | { kind: 'matches_source' }
  | { kind: 'until_anchor'; anchor_ref: string; offset_sec?: number }
  | { kind: 'until_moment_end' }
```

| Kind | Meaning |
|------|---------|
| `fixed_sec` | Exactly N seconds |
| `matches_source` | For `asset` source: `trim.out - trim.in` (or full asset duration if no trim). For `tts`/`computed`: resolved from the source at render time. |
| `until_anchor` | Ends at the given anchor frame. Optional `offset_sec` nudges the end earlier/later. |
| `until_moment_end` | Fills to the end of the containing moment (resolved after all other clips in the moment). |

---

## AudioMarker

Manual time markers on an audio clip. Published as **HARD** anchors — the renderer can rely on their exact positions.

```ts
interface AudioMarker {
  id:        string
  kind:      'point' | 'region'
  label?:    string
  time_sec:  number   // offset from clip start
  end_sec?:  number   // for 'region' only
}
```

Published anchors: `<clip_id>.mark.<marker.id>.start` (and `.end` for regions).

---

## BundleInstance

A compound preset instance. See [Bundle System](bundles.md) for full documentation.

```ts
interface BundleInstance {
  id:      string
  kind:    string    // preset registry key, e.g. 'countdown', 'cta_pulse'
  version: number    // for migration
  inputs:  Record<string, unknown>
  exposes: {
    editable_layers: string[]   // bundle_role values the editor exposes
    locked_layers?:  string[]   // internal — not directly editable
    timing_hooks:    string[]   // named timing anchors this bundle publishes
  }
  meta?: {
    created_at?: string
    source?:     'user' | 'ai' | 'preset_emit' | 'imported'
  }
}
```

---

## AssetRef

An external media file used by clips.

```ts
interface AssetRef {
  id:           string
  kind:         'video' | 'image' | 'audio' | 'font'
  url:          string
  duration_sec?: number   // required for audio/video to resolve 'matches_source'
  width?:       number
  height?:      number
}
```

Asset URLs are resolved by the renderer at runtime. They can be absolute URLs, relative paths, or asset-service IDs depending on your setup.

---

## Effect

An effect applied to a clip. Open-ended (`passthrough`) — the `kind` key maps to a registered effect in the renderer's registry. See [Effect Catalog](effects.md).

```ts
interface Effect {
  kind:          string
  start_offset_sec?: number  // effect starts N seconds into the clip
  duration_sec?:     number  // effect lasts N seconds (default: full clip)
  easing?:           EasingKind
  [param: string]:   unknown  // effect-specific parameters
}
```

---

## Transition

An enter (`in_transition`) or exit (`out_transition`) animation on a clip, or a between-moment transition (`moment.transition_in`).

```ts
interface Transition {
  kind:         string    // e.g. 'fade', 'slide_left', 'zoom_in'
  duration_sec?: number
  easing?:       EasingKind
  [param: string]: unknown
}

type EasingKind =
  | 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  | 'back-out' | 'back-in' | 'bounce-out' | 'elastic-out'
```

See [Effect Catalog](effects.md) for all built-in transition kinds.
