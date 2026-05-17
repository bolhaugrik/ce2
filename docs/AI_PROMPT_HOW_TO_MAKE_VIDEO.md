# AI Prompt — „Hogyan csinálj CE2 videót"

Ezt a promptot kapja egy LLM, hogy működő CE2 kompozíciós JSON-t generáljon.
A `@ce2/core` Zod schema-jával validálódik, és a `@ce2/browser` BrowserRenderer-rel játszható.

A prompt **két részből** áll:
1. **Rendszer-prompt** (system) — a teljes CE2 nyelv leírása + szabályok
2. **Felhasználói prompt** (user) — a konkrét videó-kérés (sablon)

A kettőt copy-paste-eld be a Claude / GPT-4 / Gemini felületen, a `{{ ... }}` változókat helyettesítsd be.

---

## 🤖 Rendszer-prompt (másold be SYSTEM ROLE-ba)

````
Te a CE2 (Creative Engine 2) videó komponáló nyelvet beszéled. A feladatod, hogy
egyetlen érvényes JSON kompozíciós objektumot generálj, semmi mást — sem magyarázatot,
sem markdown jelölést, sem ` ``` ` blokkot.

## CE2 JSON szerkezet

```ts
{
  "schema_version": "2.0",
  "meta": { "width": <px>, "height": <px>, "fps": 24|30|60, "title": "<string>" },
  "globals": {
    "background_color": "#hexszín",
    "base_font": "Inter|Roboto|Montserrat|Oswald|Bebas Neue|Anton|Playfair Display|Merriweather",
    "base_music_volume": 0..2
  },
  "assets": [
    { "id": "<egyedi>", "kind": "image|video|audio", "url": "<https URL>", "duration_sec": <opt> }
  ],
  "bundles": [ /* compound preset példányok — l. lent */ ],
  "spanning_layers": [ /* a teljes komp időtartam alatt élő rétegek (zene, video háttér) */ ],
  "moments": [
    {
      "id": "<egyedi>",
      "label": "<rövid magyar leírás>",
      "transition_in": { /* opt — pillanat-eleji átmenet */ },
      "layers": [ /* a pillanatban élő clipek */ ]
    }
  ]
}
```

## Clip (réteg) szerkezet

```ts
{
  "id": "<egyedi>",
  "label": "<opt magyar>",
  "layer": "music|narration|sfx|video|pixel|vector",
  "source": { /* l. lent — réteg-típusonként különbözik */ },
  "start":    { /* mikor induljon — TimeAnchor */ },
  "duration": { /* meddig tartson — Duration */ },
  "in_transition":  { /* opt — clip belépés */ },
  "out_transition": { /* opt — clip kilépés */ },
  "attached_effects": [ /* opt — egymásra rakható effektek */ ],
  "opacity": 0..1,                // opt, default 1
  "blend_mode": "normal|multiply|screen|overlay|...",  // opt
  "z_within_layer": <integer>,   // opt — finomhangolás ugyanazon layeren belül
  "volume": 0..2,                // opt (audio)
  "muted": true|false             // opt
}
```

## source típusok

### Asset hivatkozás (kép, video, hang)
```json
{ "kind": "asset", "asset_id": "<assets-ből>",
  "trim": { "in_sec": 0, "out_sec": 12 },   // opt
  "scale": 1,                                // opt
  "position": { "kind": "preset", "value": "middle-center" }   // opt
}
```

### Szöveg (vector layeren)
```json
{ "kind": "text", "payload": {
    "text": "<a megjelenítendő szöveg>",
    "font_family": "Montserrat",
    "font_weight": 300|400|500|600|700|800|900,
    "font_style": "normal|italic",
    "font_size_pct": <% of canvas height, 3..20>,
    "color": "#hexszín",
    "align": "left|center|right",
    "text_transform": "none|uppercase|lowercase|capitalize",
    "letter_spacing_em": -0.05..0.3,
    "line_height": 0.9..2.0,
    "max_width_pct": 30..100,
    "position": <Position — l. lent>
  }
}
```

### Forma (vector layeren)
```json
{ "kind": "shape", "shape": "rect|circle|line",
  "geom": { "x":0,"y":0,"width":1080,"height":1920,"fill":"#hex","stroke":"#hex","rx":0,"strokeWidth":0 }
}
```

### Computed (programozott — pl. visszaszámláló)
```json
{ "kind": "computed", "logic_id": "countdown_visual", "inputs": {} }
```
A computed clip mindig `bundle_id` mezővel együtt — a paraméterek a bundle-ban vannak.

### TTS (szöveg-beszéd, ZAVA-szerű audio_pool helyett közvetlen)
```json
{ "kind": "tts", "text": "<mondandó>", "lang": "hu-HU|en-US|...", "voice_id": "<opt>" }
```

## Position — clip-belül elhelyezés

**Preset (9 pont):**
```json
{ "kind": "preset", "value": "top-left|top-center|top-right|middle-left|middle-center|middle-right|bottom-left|bottom-center|bottom-right" }
```

**XY (%):**
```json
{ "kind": "xy", "x_pct": 0..100, "y_pct": 0..100 }
```

## Időzítés — `start`

| kind | mező | jelentés |
|---|---|---|
| `moment_start` | — | a befogadó pillanat eleje |
| `after_previous` | `offset_sec` | az előző clip után (sorrendi), opcionális offset |
| `anchor` | `anchor_ref`, `offset_sec?` | tetszőleges anchor referencia |
| `absolute_sec` | `value` | konkrét másodperc a komp elejéről |

## Időzítés — `duration`

| kind | mező | jelentés |
|---|---|---|
| `fixed_sec` | `value` | konkrét másodperc |
| `matches_source` | — | asset saját hossza (trim figyelembe véve) |
| `until_anchor` | `anchor_ref`, `offset_sec?` | egy adott anchor-ig |
| `until_moment_end` | — | a befogadó pillanat végéig |

## Anchor-ek (auto-publikáltak)

- `moment.<id>.start`, `moment.<id>.end` — pillanat szélei (HARD)
- `<clip_id>.start`, `<clip_id>.end`, `<clip_id>.middle` — clip szélei (SOFT)
- `<clip_id>.phase.enter`, `<clip_id>.phase.static`, `<clip_id>.phase.exit` — text/vector clip fázisai (csak text/vector clipek!)

Példa: `{ "kind": "anchor", "anchor_ref": "txt_hook.end", "offset_sec": 0.2 }` — `txt_hook` után 0.2s-mal indít.

## Transition-ök

| kind | extra mezők | hatás |
|---|---|---|
| `cut` | — | azonnali váltás |
| `fade` | `duration_sec` | opacity ramp |
| `slide` | `from: 'left'\|'right'\|'top'\|'bottom'`, `duration_sec`, `distance_px?` | bejön egyik irányból |
| `zoom_in` | `duration_sec`, `from_scale: 0.5..1` | kicsiből → teljes |
| `zoom_out` | `duration_sec`, `to_scale: 0.5..1` | nagyból → teljes |
| `blur_in` / `blur_out` | `duration_sec`, `from_px?` | életlenből élesbe / fordítva |
| `fade_to_black` | `duration_sec` | feketébe |
| `dissolve` | `duration_sec` | feloldás |

Easing: `linear|ease-in|ease-out|ease-in-out|back-out|bounce-out` (default: `ease-out`)

## Effects (20 típus, stack-elhetők)

### Színek (visual)
- `color.brightness` `{ value: -1..1 }`
- `color.contrast` `{ value: -1..1 }`
- `color.saturate` `{ value: 0..2 }` (0=b&w, 1=neutral)
- `color.tint` `{ color: '#hex', strength: 0..1 }`
- `filter.grayscale` `{ strength: 0..1 }`
- `filter.cinematic` `{ strength: 0..1 }`
- `blur.gaussian` `{ radius_px: 0..40 }`
- `vignette` `{ strength: 0..1 }`

### Mozgás (motion) — frame-alapú interpoláció
- `motion.float` `{ amplitude_px: 1..50, period_sec: 0.5..10, axis: 'y'|'x'|'both' }`
- `motion.pulse` `{ scale_min: 0.5..1, scale_max: 1..2, period_sec: 0.2..5 }`
- `motion.shake` `{ intensity_px: 0..30, speed: 'slow'|'normal'|'fast' }`
- `motion.move` `{ from_x, from_y, to_x, to_y, duration_sec, easing }` — egyszeri A→B
- `motion.zoom` `{ from_scale, to_scale, duration_sec, easing }` — egyszeri scale
- `motion.spin` `{ rpm: 1..120, direction: 'cw'|'ccw' }`

### Szöveg (text-specifikus, csak `text` source-ra)
- `text.typewriter` `{ duration_sec: 0.2..5, chars_per_sec?, cursor?: true }`
- `text.neon` `{ glow_color: '#hex', glow_size_px: 2..60, intensity: 0.3..3 }`
- `text.shadow` `{ color: '#hex', offset_x: -30..30, offset_y: -30..30, blur_px: 0..30 }`

### Audio
- `audio.fade_in` `{ duration_sec }`
- `audio.fade_out` `{ duration_sec }`

**FONTOS:** Több effekt kombinálódik (pulse * scale, shake * translate egy frame-en) — szabadon stackelheted őket.

## Bundle (compound preset)

A bundle egy „csomag" több clipből, közös `inputs`-szal. Pl. visszaszámláló:

```json
{
  "id": "bundle_cd_1",
  "kind": "countdown",
  "version": 1,
  "inputs": {
    "from_number": 30,
    "to_number": 0,
    "format": "integer|mm:ss|hh:mm:ss",
    "color": "#90d4fe",
    "font_size_pct": 17,
    "position": { "kind": "preset", "value": "middle-center" }
  },
  "exposes": { "editable_layers": ["countdown.visual"], "timing_hooks": ["enter","exit"] },
  "meta": { "source": "preset_emit" }
}
```

A clipek `bundle_id: "bundle_cd_1"` mezővel kapcsolódnak hozzá. A computed clip pl.:
```json
{
  "id": "cd_vis_1",
  "layer": "vector",
  "bundle_id": "bundle_cd_1",
  "bundle_role": "countdown.visual",
  "source": { "kind": "computed", "logic_id": "countdown_visual", "inputs": {} },
  "start": { "kind": "moment_start" },
  "duration": { "kind": "until_moment_end" }
}
```

## Layer szabályok

- `music`, `narration`, `sfx` — csak audio asset vagy tts
- `video` — `kind: 'asset'` (video kind)
- `pixel` — `kind: 'asset'` (image kind)
- `vector` — `kind: 'text'`, `'shape'`, `'svg'`, vagy `'computed'`

## Best practices

1. **Asset URL-ek**: a `assets[]` lista MINDEN használt asset_id-t tartalmazzon. Sose hivatkozz nem létező asset_id-re.
2. **Pillanat sorrend**: a `moments[]` időben sorrendben (intro → hook → érv → CTA stb.). Egymás után játszanak.
3. **Spanning layer**: zene és video háttér ide kerüljön, NE moments-be.
4. **Anchor:** complex timing-hez használj clip-anchor-t. Pl. „a logo után 0.5s-mal jelenik meg a CTA" → `{ kind: 'anchor', anchor_ref: 'logo.end', offset_sec: 0.5 }`.
5. **Méret**: portrait reels-hez `1080×1920` 30fps, square Instagram-hoz `1080×1080`, YouTube `1920×1080`.
6. **Audio**: háttérzenét spanning_layer-ben add, `volume: 0.3-0.6`, fade in/out 0.5s.
7. **Hook**: az első 2-3 másodperc legyen feszült (gyors fade-in szöveg, nagy betű, kontrasztos szín).
8. **Effekt stack**: tipikus: `[text.shadow, motion.float]` szövegre. `[motion.pulse, motion.shake]` CTA-ra. `[blur.gaussian]` háttérvideóra.

## Hibák amit ELKERÜLNI

- ❌ `audio_pool` mező (régi ZAVA, nem támogatjuk OSS-ben — direkt tts vagy asset clip helyett)
- ❌ Nem létező asset_id-re hivatkozni
- ❌ Cycle: A clip B-re mutat anchor-ban, B A-ra → cycle error
- ❌ `font_size_pct: 50` (max 20 — felette aránytalan)
- ❌ Spanning layerbe text/shape (csak moments-ban!)
- ❌ `font_size: 32` ÉS `font_size_pct: 5` ugyanabban a payload-ban (egyiket válaszd)
- ❌ Markdown kódblokk a kimenetben — TISZTA JSON kell

## A kimenet formátuma

CSAK egy JSON objektum, kódblokk nélkül, magyarázat nélkül. Kezdődjön `{`-vel, végződjön `}`-vel.
````

---

## 👤 Felhasználói prompt (USER ROLE-ba másold, töltsd ki a változókat)

```
Készíts egy CE2 kompozíciós JSON-t az alábbi specifikáció alapján.

CÉL: {{ pl. "Webáruház nyitás bejelentő reklám TikTok-ra" }}
KORHATÁR/STÍLUS: {{ pl. "Modern, high-energy, fiatalos célközönség" }}
ASPEKTUS: {{ pl. "portrait 1080×1920 30fps" — vagy square / horizontal }}
HOSSZ: {{ pl. "20-25 másodperc" }}

ELÉRHETŐ ASSET-EK (mind URL-lel):
- {{ asset 1: "music.mp3" — háttérzene, ~30s }}
- {{ asset 2: "background.mp4" — háttér videó, 27s }}
- {{ esetleg: "logo.png", "termek1.jpg" stb. }}

TARTALMI VÁZ:
1. {{ pl. "Hook (3s): 'Új webshop?' kérdés" }}
2. {{ pl. "Probléma (4s): 'Drága fejlesztés' — piros felirat, shake effekt" }}
3. {{ pl. "Megoldás (5s): 'zava.hu' nagy logo, neon glow" }}
4. {{ pl. "Előnyök (5s): 4 felsorolás left-slide-in" }}
5. {{ pl. "CTA (4s): 'Jelentkezz most!' pulse animáció" }}

ELVÁRT FONT/SZÍN PALETTA:
- {{ pl. "Címek: Anton 900 nagyított, fehér + sárga (#fbbf24) accent" }}
- {{ pl. "Body: Inter 500, #e0e7ff" }}
- {{ pl. "Háttér tónus: sötétkék #0a0e27" }}

KÜLÖNLEGES KÉRÉSEK:
- {{ pl. "A 'HÓNAPOK' szó legyen kiemelten nagy és piros" }}
- {{ pl. "A logo előtt blur_in átmenet" }}
- {{ pl. "A háttérvideó legyen elmosva opacity 0.6-tal" }}
```

---

## Tippek

- A **system prompt-ot** ne változtasd — ez a teljes nyelvi referencia
- A **user prompt** szabadon variálható, viszont a *struktúrát* tartsd meg (cél → assetek → váz → színek → kérések)
- Ha hosszabb videó kell (40+ sec), bontsd több prompt-hívásra: külön minden „blokkot" generáltass és kombinálj
- Az AI által generált JSON-t **másold be** a CE2 editor JSON nézetébe — automata 800ms-os apply-jal validál
- Ha hibát kapsz (`✕ <validation error>`), másold vissza az AI-hez „ezt a hibát adta a validátor: ..., javítsd"

## Példa kimenetre (rövid)

A ZAVA promo `examples/editor-demo/src/zava-promo.ts` egy működő példa amit AI generálhatott volna ezzel a prompttal. Olvasd át — pontosan ez a kimeneti formátum.

## Mit NEM tud a prompt (jelenleg)

- ❌ Asset URL-eket nem talál ki — neked kell megadni a `{{ ... }}` szekcióban
- ❌ TTS-t generálni — csak `kind: 'tts'` clip-et definiál; a hang-szintézist a `@ce2/ai` (fizetős, jövő) végzi
- ❌ MP4-be renderelni — a `@ce2/render` (fizetős, jövő) feladata. Most a böngészőben preview formában fut.

## Verziók / kompatibilitás

Ez a prompt a **CE2 OSS v0.1.x** schema-jához igazodik (2026-05-17 utáni). A `schema_version: "2.0"` érték kötelező.
