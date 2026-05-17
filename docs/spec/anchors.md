# Anchor System

Anchors are **named points in time** — frame numbers identified by a string key. Instead of hard-coding `"start_at_sec": 4.3`, a clip says `"start": { "kind": "anchor", "anchor_ref": "voiceover.phase.enter" }`. If the voiceover later shifts by half a second, every clip anchored to it shifts automatically.

---

## Anchor classes

Every anchor has an implied stability class. These are **heuristics, not hard rules** — any clip can reference any anchor — but they guide AI generation and editor UI sorting.

| Class | When to use | Stability |
|-------|-------------|-----------|
| **HARD** | Ground-truth timestamps known at author time or from external data: moment boundaries, TTS word timestamps, manually placed video markers, audio region markers | Highest — move these when the clip itself moves |
| **SOFT** | Derived from clip position — if the clip moves, these move too. Enter/exit phase of text clips, clip start/end. | Medium — safe to reference for sequential placement |
| **DERIVED** | Calculated from other anchors: middle, percent, static phase. | Lowest — use for fine positioning, avoid as chain parents |

---

## Auto-published anchors

Every clip automatically publishes the following anchors when it is resolved:

### All clips

| Anchor | Class | Value |
|--------|-------|-------|
| `<clip_id>.start` | SOFT | Clip's start frame |
| `<clip_id>.end` | SOFT | Clip's end frame |
| `<clip_id>.middle` | DERIVED | `round((start + end) / 2)` |

### `vector` / `text` clips

| Anchor | Class | Value |
|--------|-------|-------|
| `<clip_id>.phase.enter` | SOFT | Clip start (= start of enter animation) |
| `<clip_id>.phase.static` | DERIVED | Clip start + 20% of duration |
| `<clip_id>.phase.exit` | SOFT | Clip end − 20% of duration |

These three phases let you synchronize narration, SFX, or other clips to the *semantic* state of a text clip rather than raw frame numbers.

### Moments

| Anchor | Class | Value |
|--------|-------|-------|
| `moment.<id>.start` | HARD | Frame where this moment begins |
| `moment.<id>.end` | HARD | Frame where this moment ends (= max end_frame of its clips) |

### `narration` clips with word timestamps

If the TTS backend provides word-level timing (after an `asset` conversion from `tts` source), the clip exposes:

| Anchor | Class | Value |
|--------|-------|-------|
| `<clip_id>.word.<idx>.start` | HARD | Frame of word N's start |

### Audio markers (`audio_markers[]`)

Manually placed markers on any audio clip publish HARD anchors:

| Anchor | Class | Value |
|--------|-------|-------|
| `<clip_id>.mark.<marker_id>.start` | HARD | `clip.start_frame + marker.time_sec * fps` |
| `<clip_id>.mark.<marker_id>.end` | HARD | `clip.start_frame + marker.end_sec * fps` (region only) |

### Custom anchors

A clip can publish additional anchor IDs via `publish_anchors: ["my_anchor_id"]`. These are set to the clip's start frame unless overridden in a future preset's `emit()`.

---

## Reference syntax in composition JSON

### `TimeAnchor` — when the clip starts

```json
{ "kind": "anchor", "anchor_ref": "voiceover.phase.enter", "offset_sec": 0.2 }
```

`offset_sec` shifts the resolved frame: positive = later, negative = earlier.

### `Duration` — when the clip ends

```json
{ "kind": "until_anchor", "anchor_ref": "moment.m_cta.end", "offset_sec": -0.1 }
```

---

## Resolution algorithm

`AnchorResolver` (in `@ce2/core`) resolves all clips to `(start_frame, end_frame)` pairs.

### Step 1 — Sequential moment pass

Moments are processed in array order. Each moment's start frame = the previous moment's `end_frame`.

```
moment[0].start_frame = 0
moment[i].start_frame = moment[i-1].end_frame
```

### Step 2 — Per-moment topological sort

Within a moment, clips may depend on each other via `anchor_ref`. The resolver builds a dependency graph and applies **Kahn's algorithm** to find a valid processing order.

A clip `B` depends on clip `A` if `B.start.anchor_ref` or `B.duration.anchor_ref` references any anchor published by `A` (e.g. `A.end`).

Clips with `moment_start` or `after_previous` starts have no intra-moment dependencies and are scheduled first.

### Step 3 — Anchor registration

After each clip is resolved, its anchors are registered in the anchor map before the next clip is processed. This allows later clips to reference earlier clips' positions.

### Step 4 — `until_moment_end` second pass

After all clips in a moment are resolved, the moment's end frame is known. Any clip with `duration: { kind: 'until_moment_end' }` is updated in a second pass.

### Step 5 — Spanning layers

Resolved last, after all moments. At this point all `moment.<id>.start/end` anchors are available, so spanning layers can anchor to any moment boundary.

### Cycle detection

If two clips reference each other's anchors — forming a cycle — the resolver throws `CE2CycleError` with the participating clip IDs.

```
CE2CycleError: Anchor dependency cycle detected: clip_a → clip_b → clip_a
```

---

## Anchor picker UI guidance (for editor implementors)

When displaying an anchor picker, sort anchors as:
1. **HARD** anchors — top (stable, AI prefers)
2. **SOFT** anchors — middle
3. **DERIVED** anchors — bottom

Group by source: moment anchors first, then per-clip, then bundle hooks.

Show the class as a badge (📍 HARD · ⚓ SOFT · 〰 DERIVED).

---

## AI generation guidance

When an LLM generates CE2 JSON:

- **Prefer HARD anchors** as `anchor_ref` targets — they don't shift if an adjacent clip is trimmed.
- Use `moment.<id>.start` and `moment.<id>.end` when a clip should align to the overall moment boundary, not to a specific clip.
- Use `after_previous` for simple sequential placement — it avoids an explicit `anchor_ref` and is more resilient to clip reordering.
- Avoid long `anchor_ref` chains (A → B → C → D) — a break in the chain is hard to debug.

---

## Example: synchronized text + narration

```json
{
  "moments": [{
    "id": "m_list",
    "layers": [
      {
        "id": "narr1",
        "layer": "narration",
        "source": { "kind": "tts", "text": "Here are three reasons.", "voice_id": "en-us-1" },
        "start": { "kind": "moment_start" },
        "duration": { "kind": "matches_source" }
      },
      {
        "id": "txt_title",
        "layer": "vector",
        "source": { "kind": "text", "payload": { "content": "3 Reasons" } },
        "start": { "kind": "anchor", "anchor_ref": "narr1.phase.enter" },
        "duration": { "kind": "until_anchor", "anchor_ref": "narr1.end" },
        "in_transition": { "kind": "fade", "duration_sec": 0.3 }
      }
    ]
  }]
}
```

`txt_title` starts exactly when `narr1`'s enter phase begins, and ends when the narration ends — without any hard-coded seconds.
