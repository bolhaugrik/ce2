# Bundle System

A **bundle** is a compound preset instance — multiple clips that form one logical unit, stored as a first-class entity in `composition.bundles[]`. Example: a countdown timer is one bundle containing a visual clip (vector) and a tick audio clip (sfx).

---

## Why bundles exist

Without bundles, a compound preset would scatter its parameters across N individual clips:

```jsonc
// Without bundles — the number "5" lives in 3 places:
{ "id": "cd_vis", "source": { "inputs": { "from_number": 5 } } },
{ "id": "cd_audio", "source": { "inputs": { "tick_count": 5 } } },
{ "id": "cd_label", "source": { "payload": { "content": "5" } } }
```

With bundles, `inputs` live in one place, clips only reference them:

```jsonc
// BundleInstance in composition.bundles[]:
{ "id": "b_cd", "kind": "countdown", "inputs": { "from_number": 5, "tick_enabled": true } }

// Clips reference the bundle — input is resolved at render time:
{ "id": "cd_vis", "bundle_id": "b_cd", "bundle_role": "countdown.visual",
  "source": { "kind": "computed", "logic_id": "countdown_visual",
              "inputs_from_bundle": ["from_number"] } }
```

Benefits:
- Parameters are edited in one place, not scattered
- `exposes.editable_layers` declares what the user can directly manipulate
- `version` enables non-breaking preset migrations
- AI tools can generate/modify one `BundleInstance` object instead of N clips

---

## BundleInstance anatomy

```ts
interface BundleInstance {
  id:      string          // unique within composition, e.g. "b_42"
  kind:    string          // preset registry key, e.g. "countdown"
  version: number          // preset version (for migration)
  inputs:  Record<string, unknown>   // all user-facing config in one place

  exposes: {
    editable_layers: string[]   // bundle_role values the editor shows expanded
    locked_layers?:  string[]   // internal clips — not directly editable
    timing_hooks:    string[]   // named timing anchors this bundle publishes
  }

  meta?: {
    created_at?: string
    source?:     'user' | 'ai' | 'preset_emit' | 'imported'
  }
}
```

---

## Clip ↔ Bundle linkage

A clip joins a bundle by setting `bundle_id` (reference to `BundleInstance.id`) and `bundle_role` (its semantic role within the bundle, e.g. `'countdown.visual'`).

```json
{
  "id": "cd_visual_clip",
  "layer": "vector",
  "bundle_id": "b_42",
  "bundle_role": "countdown.visual",
  "source": {
    "kind": "computed",
    "logic_id": "countdown_visual",
    "inputs": {},
    "inputs_from_bundle": ["from_number", "to_number", "format"]
  },
  "opacity_from_bundle": "opacity"
}
```

`inputs_from_bundle` lists the keys to pull from `bundle.inputs` instead of the clip's own `source.inputs`. `BundleResolver.resolveClip()` merges them before the clip reaches the renderer.

---

## `exposes` API

### `editable_layers`

Bundle roles the editor exposes for direct editing when the bundle is expanded. Roles not in this list are implementation details — the user only sees the bundle-level `inputs` form.

```json
"editable_layers": ["countdown.visual"]
```

The editor renders a direct clip editor for `countdown.visual`, but hides `countdown.tick` (which is in `locked_layers`).

### `locked_layers`

Clips that are internal to the preset. The user cannot edit them directly, only through the bundle's `inputs` form. Typically audio SFX, internal structural clips.

### `timing_hooks`

Named timing anchors this bundle publicly exposes. Other clips can reference them by `<bundle_id>.<hook_name>`:

```json
"timing_hooks": ["enter", "cta_pulse", "exit"]
```

Allows referencing: `"anchor_ref": "b_42.enter"` — decoupled from internal clip IDs.

Timing hooks are registered in the anchor map by the preset's `emit()` function or by bundle-aware clips publishing `publish_anchors: ["b_42.enter"]`.

---

## Preset definition (registry side)

> Preset definitions live in `@ce2/core`'s `registry/presets/` directory. This section documents the interface for authors adding new presets.

```ts
interface PresetDefinition {
  kind:            string                  // 'countdown', 'cta_pulse', …
  category:        'atomic' | 'compound'
  label:           string
  icon:            string                  // emoji or short string
  description:     string
  version:         number
  occupies_layers: LayerKind[]
  inputs_schema:   ZodSchema               // user-facing config schema
  exposes_template: {
    editable_layers: string[]
    locked_layers?:  string[]
    timing_hooks:    string[]
  }
  emit: (ctx: EmitContext, inputs: unknown) => { bundle: BundleInstance; clips: Clip[] }
  publishes_anchors?: (inputs: unknown) => string[]
  migrate?:        (oldInputs: unknown, oldVersion: number) => unknown
}
```

### `emit()`

Called when the user adds a preset to a moment. Returns the `BundleInstance` to add to `composition.bundles[]` and the `Clip[]` to add to the moment's `layers[]`.

### `migrate()`

Called by `BundleResolver` when loading a composition that has a bundle with an older `version` than the currently registered preset. Upgrades `inputs` to the current shape without breaking the composition.

---

## Version migration

When a preset changes its `inputs` shape (rename a field, add a required field), increment `version` and add a `migrate()` function:

```ts
// countdown v1 → v2: renamed "from_number" to "start_value"
migrate(oldInputs: unknown, oldVersion: number) {
  if (oldVersion === 1) {
    return { ...oldInputs, start_value: (oldInputs as any).from_number }
  }
  return oldInputs
}
```

`BundleResolver` calls `migrate()` when `bundle.version < preset.version`. The user's saved compositions continue working transparently.

---

## Full example: countdown bundle

```json
{
  "bundles": [
    {
      "id": "b_42",
      "kind": "countdown",
      "version": 1,
      "inputs": {
        "from_number": 5,
        "to_number": 0,
        "format": "integer",
        "tick_enabled": true,
        "tick_asset_id": "tick_sound",
        "opacity": 0.9
      },
      "exposes": {
        "editable_layers": ["countdown.visual"],
        "locked_layers": ["countdown.tick"],
        "timing_hooks": ["enter", "exit"]
      },
      "meta": { "source": "preset_emit" }
    }
  ],
  "moments": [{
    "id": "m_intro",
    "layers": [
      {
        "id": "cd_vis",
        "layer": "vector",
        "bundle_id": "b_42",
        "bundle_role": "countdown.visual",
        "source": {
          "kind": "computed",
          "logic_id": "countdown_visual",
          "inputs": {},
          "inputs_from_bundle": ["from_number", "to_number", "format"]
        },
        "start": { "kind": "moment_start" },
        "duration": { "kind": "until_moment_end" },
        "opacity_from_bundle": "opacity",
        "publish_anchors": ["b_42.enter", "b_42.exit"]
      },
      {
        "id": "cd_sfx",
        "layer": "sfx",
        "bundle_id": "b_42",
        "bundle_role": "countdown.tick",
        "source": {
          "kind": "computed",
          "logic_id": "countdown_audio",
          "inputs": {},
          "inputs_from_bundle": ["from_number", "tick_asset_id"]
        },
        "start": { "kind": "anchor", "anchor_ref": "b_42.enter" },
        "duration": { "kind": "until_moment_end" }
      }
    ]
  }]
}
```
