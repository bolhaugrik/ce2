# CE2 — Declarative Multimedia Composition Language

CE2 is a JSON-based declarative language for describing animated multimedia compositions — video ads, explainer clips, social content. It separates **what** (the composition JSON) from **how** (the renderer), so a single composition can be played in a browser, exported to MP4, or used as input to an AI generation pipeline.

## Core ideas in 60 seconds

**Moment** — a time unit, like a slide. Moments play sequentially. A composition is a list of moments.

**Layer** — every clip belongs to one of six channels: `video`, `pixel`, `image`, `vector` (text/svg/shape), `narration`, `sfx`, `music`. The renderer stacks them in z-order.

**Anchor** — relational timing. Instead of writing `"start_at_sec": 4.3`, you write `"start": { "kind": "anchor", "anchor_ref": "voiceover.phase.enter" }`. If the voiceover moves, everything attached moves with it.

**Bundle** — a compound preset instance. Multiple clips form one logical unit (e.g. a countdown timer: visual + audio), stored as a first-class entity in `composition.bundles[]`.

**Spanning layer** — a clip that stretches across moment boundaries (e.g. background music). Lives in `composition.spanning_layers[]`.

```
CE2Composition
  ├── meta          { width, height, fps }
  ├── globals       { background_color, base_font, … }
  ├── assets[]      { id, kind, url, duration_sec }
  ├── bundles[]     BundleInstance — compound preset instances
  ├── spanning_layers[]  Clip — cross-moment clips
  └── moments[]
        └── Moment
              └── layers[]  Clip
```

## Design principles

**Relational time over absolute seconds.** Users should never type raw second values. Every clip publishes named anchor points (`clip.start`, `clip.end`, `clip.phase.enter`, etc.) that other clips can reference. The `AnchorResolver` calculates real frame numbers at render time.

**One composition format, many renderers.** The JSON describes what to show and when. A browser renderer, a Remotion renderer, or an ffmpeg pipeline each consume the same JSON. The `@ce2/core` package is renderer-agnostic.

**Preset over template.** A new creative format = a new preset, not a new renderer. Atomic presets emit one clip; compound presets (bundles) emit multiple clips sharing state.

**No timeline editor.** The editing mental model is cards (moments → layers → clips), not a horizontal timeline. A NowStrip shows ±2 seconds of temporal context, but the editor is always structural.

## Packages

| Package | Description |
|---------|-------------|
| [`@ce2/core`](../packages/core) | Schema (Zod), `AnchorResolver`, `BundleResolver`, `validateComposition` |
| `@ce2/browser` *(planned)* | Canvas/CSS renderer — embed a composition in any web page |
| `@ce2/editor` *(planned)* | Reference React editor component |
| `@ce2/ffmpeg` *(planned)* | Node.js CLI + API: CE2 JSON → MP4 |

## Documentation

| Document | Contents |
|----------|----------|
| [spec/schema.md](spec/schema.md) | Complete type reference for all CE2 schema types |
| [spec/anchors.md](spec/anchors.md) | Anchor system — kinds, published anchors, resolution algorithm |
| [spec/bundles.md](spec/bundles.md) | Bundle system — compound presets, `exposes` API, versioning |
| [spec/effects.md](spec/effects.md) | Effect and transition catalog |
| [guides/getting-started.md](guides/getting-started.md) | Install `@ce2/core`, write your first composition, validate and resolve |

## Quick example

```json
{
  "schema_version": "2.0",
  "meta": { "width": 1080, "height": 1920, "fps": 30 },
  "globals": { "background_color": "#0f0f0f" },
  "assets": [
    { "id": "hero", "kind": "video", "url": "/assets/hero.mp4", "duration_sec": 8 }
  ],
  "spanning_layers": [
    {
      "id": "bg_music",
      "layer": "music",
      "source": { "kind": "asset", "asset_id": "bg_track" },
      "start": { "kind": "moment_start" },
      "duration": { "kind": "fixed_sec", "value": 20 },
      "volume": 0.4
    }
  ],
  "moments": [
    {
      "id": "m_intro",
      "label": "Intro",
      "layers": [
        {
          "id": "vid_hero",
          "layer": "video",
          "source": { "kind": "asset", "asset_id": "hero", "trim": { "in_sec": 0, "out_sec": 5 } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "matches_source" }
        },
        {
          "id": "txt_headline",
          "layer": "vector",
          "source": { "kind": "text", "payload": { "content": "Summer Sale", "font_size": 72, "color": "#ffffff", "text_align": "center" } },
          "start": { "kind": "anchor", "anchor_ref": "vid_hero.phase.enter", "offset_sec": 0.3 },
          "duration": { "kind": "until_moment_end" },
          "in_transition": { "kind": "fade", "duration_sec": 0.4 }
        }
      ]
    }
  ],
  "bundles": []
}
```

## License

MIT
