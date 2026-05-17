# Effect and Transition Catalog

Effects are applied via `clip.attached_effects[]`. Transitions are applied via `clip.in_transition`, `clip.out_transition`, or `moment.transition_in`.

All kinds listed here are built into `@ce2/core`'s registry. Renderers are expected to implement them; unknown kinds are silently skipped by renderers that don't support them.

---

## Common parameters (all effects and transitions)

```ts
{
  kind:              string   // effect/transition identifier
  start_offset_sec?: number   // (effects) seconds into the clip before the effect starts
  duration_sec?:     number   // how long the effect/transition runs
  easing?:           EasingKind
}
```

### Easing kinds

| Value | Curve |
|-------|-------|
| `linear` | Constant speed |
| `ease` | Standard CSS ease |
| `ease-in` | Slow start |
| `ease-out` | Slow end |
| `ease-in-out` | Slow start and end |
| `back-out` | Overshoots then settles |
| `back-in` | Winds up before moving |
| `bounce-out` | Bounces at the end |
| `elastic-out` | Elastic spring at the end |

---

## Effects (`clip.attached_effects[]`)

### Motion

#### `motion.float`
Gentle vertical oscillation. Good for text and image overlays.

```json
{ "kind": "motion.float", "amplitude_px": 8, "period_sec": 3 }
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `amplitude_px` | number | 6 | Vertical travel distance in pixels |
| `period_sec` | number | 2.5 | Full oscillation period |

#### `motion.pulse`
Periodic scale pulse. Draws attention to a clip.

```json
{ "kind": "motion.pulse", "scale_max": 1.08, "period_sec": 1 }
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `scale_max` | number | 1.1 | Maximum scale factor |
| `period_sec` | number | 1.2 | Full pulse period |

#### `motion.shake`
Rapid horizontal jitter. Use for emphasis or error states.

```json
{ "kind": "motion.shake", "intensity_px": 6, "speed": "fast" }
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `intensity_px` | number | 5 | Horizontal jitter amplitude |
| `speed` | `"slow"` \| `"normal"` \| `"fast"` | `"normal"` | Oscillation frequency |

#### `motion.move`
Linear translation over the clip's duration (or `duration_sec`).

```json
{ "kind": "motion.move", "from_x": 0, "from_y": 40, "to_x": 0, "to_y": 0, "easing": "ease-out" }
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `from_x`, `from_y` | number | 0 | Start offset in pixels |
| `to_x`, `to_y` | number | 0 | End offset in pixels |

#### `motion.zoom`
Scale animation over time.

```json
{ "kind": "motion.zoom", "from_scale": 1, "to_scale": 1.15, "easing": "ease-in-out" }
```

### Visual

#### `visual.fade`
Opacity change over time (useful as a sustained effect, not just on enter/exit).

```json
{ "kind": "visual.fade", "from_opacity": 1, "to_opacity": 0.3 }
```

#### `visual.blur`
CSS blur over time.

```json
{ "kind": "visual.blur", "from_px": 0, "to_px": 8, "easing": "ease-in" }
```

#### `visual.color_correction`
Adjust brightness, contrast, saturation (CSS filter).

```json
{ "kind": "visual.color_correction", "brightness": 1.1, "contrast": 1.2, "saturation": 0.9 }
```

### Text-specific

#### `text.typewriter`
Characters appear one by one.

```json
{ "kind": "text.typewriter", "chars_per_sec": 20, "cursor": true }
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `chars_per_sec` | number | 15 | Typing speed |
| `cursor` | boolean | false | Show blinking cursor while typing |

#### `text.neon`
Glowing neon text effect.

```json
{ "kind": "text.neon", "color": "#ff00ff", "intensity": 1.2, "flicker": false }
```

#### `text.shadow`
Drop shadow with animated parameters.

```json
{ "kind": "text.shadow", "offset_x": 4, "offset_y": 4, "blur": 8, "color": "rgba(0,0,0,0.6)" }
```

### Glitch

#### `glitch.pixelate`
Pixelation distortion (CSS + SVG approximation).

```json
{ "kind": "glitch.pixelate", "intensity": 0.5, "duration_sec": 0.3 }
```

---

## Look presets (curated effect stacks)

Look presets apply a pre-built combination of effects to a clip in one step. They are named stacks, not a new primitive — the resolver expands them to `attached_effects[]` entries.

| Kind | Effect stack |
|------|-------------|
| `look.cinematic` | Slight blur vignette + desaturation + slow motion.zoom |
| `look.high_energy` | motion.shake (fast) + visual.color_correction (high contrast) + short pulse |
| `look.clean` | No effects — clears any inherited effects |
| `look.dreamy` | visual.blur (soft) + visual.fade (slight) + motion.float |
| `look.urgent` | motion.shake (medium) + text.neon (red) |

---

## Transitions (`in_transition` / `out_transition`)

Applied to a single clip's enter or exit animation.

### Fade

```json
{ "kind": "fade", "duration_sec": 0.4 }
```

### Slide

```json
{ "kind": "slide_left",  "duration_sec": 0.4, "distance_px": 60 }
{ "kind": "slide_right", "duration_sec": 0.4, "distance_px": 60 }
{ "kind": "slide_up",    "duration_sec": 0.4, "distance_px": 60 }
{ "kind": "slide_down",  "duration_sec": 0.4, "distance_px": 60 }
```

### Zoom

```json
{ "kind": "zoom_in",  "duration_sec": 0.5, "from_scale": 0.7 }
{ "kind": "zoom_out", "duration_sec": 0.5, "to_scale": 0.7 }
```

### Blur

```json
{ "kind": "blur_in",  "duration_sec": 0.4, "from_px": 12 }
{ "kind": "blur_out", "duration_sec": 0.4, "to_px": 12 }
```

---

## Moment transitions (`moment.transition_in`)

How the moment enters from the previous one. Applied at the moment boundary, not to individual clips.

| Kind | Description |
|------|-------------|
| `cut` | Instant switch (default) |
| `fade` | Cross-fade between moments |
| `fade_to_black` | Fade out → black → fade in |
| `slide_left` | New moment slides in from right |
| `slide_right` | New moment slides in from left |
| `wipe` | Horizontal wipe |
| `dissolve` | Pixel-level dissolve |

```json
{ "kind": "fade", "duration_sec": 0.5 }
```

---

## Adding custom effects (renderer implementors)

Register a custom effect by:

1. Adding a JSON descriptor to `registry/effects/` in `@ce2/core`:

```json
{
  "kind": "custom.sparkle",
  "category": "visual",
  "label": "Sparkle",
  "params": {
    "density": { "type": "number", "default": 10, "min": 1, "max": 50 }
  }
}
```

2. Implementing the render logic in your renderer package (`@ce2/browser`, `@ce2/ffmpeg`, etc.) by registering a handler for `"custom.sparkle"`.

The `@ce2/core` registry makes the effect available in validation and editor UI automatically. Unknown effects in a composition pass schema validation but are ignored by renderers that don't know them.
