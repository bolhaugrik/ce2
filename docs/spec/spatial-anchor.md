# CE2 — SpatialAnchor pozicionálás

## Áttekintés

A SpatialAnchor lehetővé teszi, hogy egy clip más clip-ekhez (vagy a vászonhoz) képest relatívan helyezkedjen el, pixelszámítás nélkül. Az időhorgony (`TimeAnchor`) térbeli párja.

## Szintaxis

### Abszolút pozíció (meglévő)

```json
{ "position": { "x": 540, "y": 1600 } }
```

### String shorthand — AI-barát

```json
{ "position": "CTA.below" }
{ "position": "screen.bottom-center" }
{ "position": "logo.right-of" }
```

Formátum: `"<ref>.<align>"`

- `<ref>` — egy másik clip `name` mezője, vagy `"screen"` (a vászon)
- `<align>` — térbeli igazítás értéke (lásd alább)

### Full form — offsettel

```json
{
  "position": {
    "anchor": "CTA.below",
    "offset": { "x": 0, "y": 16 }
  }
}
```

## `align` értékek

### Belül igazítás — CSS background-position konvenció

| Érték | Elhelyezés |
|-------|-----------|
| `top-left` | bal-felső sarokba (belül) |
| `top-center` | felső szélen, középre (belül) |
| `top-right` | jobb-felső sarokba (belül) |
| `center` | ref közepére |
| `bottom-left` | bal-alsó sarokba (belül) |
| `bottom-center` | alsó szélen, középre (belül) |
| `bottom-right` | jobb-alsó sarokba (belül) |
| `inside-top` | = top-center |
| `inside-bottom` | = bottom-center |
| `inside-left` | bal szélén, függőlegesen középre |
| `inside-right` | jobb szélén, függőlegesen középre |

**Leggyakoribb `screen` referencia értékek:**
- `screen.center` → középen
- `screen.bottom-center` → alul, középen (pl. felirat)
- `screen.top-center` → felül, középen (pl. cím)

### Kívül igazítás — clip-to-clip

| Érték | Elhelyezés |
|-------|-----------|
| `above` | ref felett, vízszintesen középre |
| `below` | ref alatt, vízszintesen középre |
| `left-of` | ref bal oldalán, függőlegesen középre |
| `right-of` | ref jobb oldalán, függőlegesen középre |

### Vizuális diagram

```
 [TL] [TC] [TR]
 [LO]  ┌────────┐  [RO]
       │ [IT]   │
       │[IL][C][IR]│
       │ [IB]   │
       └────────┘
 [BL] [BC] [BR]
```

## `screen` — built-in referencia

A `"screen"` kulcsszó mindig elérhető, a kompozíció vásznát jelenti (`meta.width × meta.height`).

```json
{ "position": "screen.center" }
{ "position": "screen.bottom-center" }
{ "position": { "anchor": "screen.top-right", "offset": { "x": -20, "y": 20 } } }
```

## `clip.name` — referencia alias

Ahhoz, hogy más clip-ek hivatkozhassanak egy elemre, adjunk neki `name` mezőt:

```json
{
  "id": "clip_abc",
  "name": "CTA",
  "layer": "vector",
  "source": { "kind": "text", "payload": { "content": "Vásárlás" } },
  ...
}
```

Ezután más clip-ek position-jük hivatkozhatnak rá: `"CTA.below"`.

**Szabályok:**
- `name` opcionális, csak ha mások hivatkoznak rá
- `name` betű, szám, kötőjel lehet: `CTA`, `title-1`, `logo`
- A `name` és az `id` különböző: `id` az időhorgony referencia, `name` a térbeli
- Ha `name` nincs beállítva, a clip nem hivatkozható SpatialAnchor-ból

## Validáció

A `validateComposition()` ellenőrzi:
- Az `anchor` stringben szereplő `<ref>` létezik-e a composition clip-jei között (vagy `"screen"`)  
- Ha nem → `SPATIAL_ANCHOR_REF` hiba

```typescript
import { validateComposition } from '@ce2/core'

const result = validateComposition(composition)
// result.errors[0] → { code: 'SPATIAL_ANCHOR_REF', message: '...' }
```

## Példa kompozíció

```json
{
  "schema_version": "2.0",
  "meta": { "width": 1080, "height": 1920, "fps": 30, "title": "Promo reel" },
  "globals": { "background_color": "#0a0a0a" },
  "spanning_layers": [],
  "moments": [
    {
      "id": "m1",
      "label": "Főjelenet",
      "layers": [
        {
          "id": "logo_clip",
          "name": "logo",
          "label": "Logó",
          "layer": "pixel",
          "source": { "kind": "asset", "asset_id": "img_logo" },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "until_moment_end" },
          "position": "screen.top-center",
          "z_within_layer": 10
        },
        {
          "id": "title_clip",
          "name": "title",
          "label": "Cím",
          "layer": "vector",
          "source": { "kind": "text", "payload": { "content": "Nyári akció", "font_size": 96, "color": "#fff" } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 5 },
          "position": "screen.center"
        },
        {
          "id": "subtitle_clip",
          "name": "subtitle",
          "label": "Alcím",
          "layer": "vector",
          "source": { "kind": "text", "payload": { "content": "−40% minden termékre", "font_size": 48, "color": "#ffcc00" } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 5 },
          "position": { "anchor": "title.below", "offset": { "x": 0, "y": 24 } }
        },
        {
          "id": "cta_clip",
          "name": "CTA",
          "label": "Gomb",
          "layer": "vector",
          "source": { "kind": "text", "payload": { "content": "Megnézem →", "font_size": 36, "color": "#000" } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 5 },
          "position": "screen.bottom-center"
        },
        {
          "id": "badge_clip",
          "label": "Kedvezmény badge",
          "layer": "vector",
          "source": { "kind": "text", "payload": { "content": "SALE", "font_size": 24, "color": "#ff0000" } },
          "start": { "kind": "moment_start" },
          "duration": { "kind": "fixed_sec", "value": 5 },
          "position": { "anchor": "CTA.top-right", "offset": { "x": 8, "y": -8 } }
        }
      ]
    }
  ],
  "bundles": [],
  "assets": [
    { "id": "img_logo", "kind": "image", "url": "https://example.com/logo.png", "width": 200, "height": 80 }
  ]
}
```

## Render-time feloldás (`@ce2/browser`)

A `BrowserRenderer` két-pass layoutot alkalmaz:

1. **Pass 1** — abszolút `{ x, y }` clip-ek elhelyezése, SpatialAnchor clip-ek `auto` méretre váltása
2. **Pass 2** — a referencia elem `getBoundingClientRect()` alapján kiszámítja az igazítási pontot, max. 3 sweep az egymásra hivatkozó láncok feloldásához

A térbeli feloldás a konstruktorban egyszer fut le. Kompozíció frissítésekor a `BrowserRenderer`-t újra kell példányosítani.

## Programozói API

```typescript
import { parseSpatialAnchor, isSpatialAnchor, isAbsolutePosition } from '@ce2/core'

parseSpatialAnchor('CTA.below')
// → { ref: 'CTA', align: 'below' }

parseSpatialAnchor({ anchor: 'screen.top-right', offset: { x: -20, y: 20 } })
// → { ref: 'screen', align: 'top-right', offset: { x: -20, y: 20 } }

parseSpatialAnchor({ x: 100, y: 200 })
// → null  (abszolút pozíció, nem SpatialAnchor)

isSpatialAnchor('CTA.below')      // → true
isAbsolutePosition({ x: 0, y: 0 }) // → true
```
