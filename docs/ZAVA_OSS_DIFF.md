# ZAVA CE2 ↔ OSS CE2 — különbség leltár

Forrás-méret összevetés (2026-05-17):

| | ZAVA `creative-v2/` | OSS `packages/editor/src/` |
|---|---:|---:|
| Sorok | 12 446 | 8 138 |
| Fájlok | 67 | ~35 |

A 35% sor-méret különbség ​**majdnem teljes egészében** ​​a ZAVA-specifikus rendszerek hiányából ered (l. lent „Hiányzó modulok"), nem core editor funkcionalitásból.

---

## 1. Render engine (a legmélyebb különbség)

| | ZAVA | OSS |
|---|---|---|
| Preview renderer | **Remotion `<Player>`** | **`@ce2/browser` `BrowserRenderer`** (saját DOM + RAF) |
| Animáció módszer | **Frame-alapú JS** — minden frame React komponens, `interpolate(frame,[from,to])` | **Frame-alapú JS** (5f1cd6c után — előtte CSS animáció volt) |
| Pause = | konkrét frame render | konkrét frame render |
| MP4 export | Remotion Lambda | `@ce2/render` (még nincs) |
| Több effekt egyszerre | minden frame-en JS-ben kombinálódik | ugyanaz: `translate(...) scale(...) rotate(...)` egy string |

A korai OSS CSS-animáció implementáció elvi okból volt rossz (CSS `transform` property override), most ugyanazt a frame-alapú számítást használjuk amit a Remotion. **Funkcionálisan azonos.** A különbség: ZAVA Remotion-alapú JSX renderelés, OSS imperatív DOM-frissítés inline style-okon.

---

## 2. Editor szerkezet — fájlonkénti összevetés

### ✅ TELJESEN átvéve (1:1 paritás)

| ZAVA fájl | OSS fájl | Megjegyzés |
|---|---|---|
| `CE2Shell.tsx` | `components/CE2Shell.tsx` | 2-módos layout (Komp 60/40, Detail 22/56/22), auto Komp↔Detail switch |
| `state/CE2EditorState.ts` | `state/editorState.ts` | Selection union, findSelectedClip/Moment/Bundle helpers |
| `state/clipMutations.ts` | `state/clipMutations.ts` | updateClip/Moment/Bundle/Globals/Meta — immutable |
| `state/compositionMutations.ts` | `state/compositionMutations.ts` | applyEmitResult, deleteClip/Moment/Bundle, addEmptyMoment |
| `state/compositionTime.ts` | `state/compositionTime.ts` | useResolvedComposition + useActiveClipsAt + useAnchorMarkers (OSS AnchorResolver-ben adaptálva) |
| `registry/effects.ts` | `registry/effects.ts` | 20 effekt definíció |
| `registry/transitions.ts` | `registry/transitions.ts` | 10 átmenet definíció |
| `registry/looks.ts` | `registry/looks.ts` | 5 Look preset |
| `detail/primitives.tsx` | `components/primitives.tsx` | Field, TextInput, NumberInput, ColorInput, SelectInput, Toggle, Section |
| `detail/ClipDetailPanel.tsx` | `components/detail/ClipDetailPanel.tsx` | 6 tab dispatch (audio-nak nincs Megjelenés stb.) |
| `panels/DetailPanel.tsx` | `components/detail/DetailDispatch.tsx` | Selection → editor dispatch |
| `detail/GlobalsEditor.tsx` | `components/detail/GlobalsEditor.tsx` | Aspect preset, FPS, BG color, base font, music volume |
| `detail/MomentEditor.tsx` | `components/detail/MomentEditor.tsx` | Label + transition_in |
| `detail/AnchorPicker.tsx` | `components/detail/AnchorPicker.tsx` | HARD/SOFT/DERIVED filter, layer chip-ek, keresés |
| `detail/TransitionPicker.tsx` | `components/detail/TransitionPicker.tsx` | 10 átmenet rács |
| `detail/EffectPicker.tsx` | `components/detail/EffectPicker.tsx` | ⭐ Look / ⚙ Advanced kategória-tabokkal |
| `detail/tabs/GeneralTab.tsx` | `components/detail/tabs/GeneralTab.tsx` | Label, ID readonly, layer/source/bundle info |
| `detail/tabs/ContentTab.tsx` | `components/detail/tabs/ContentTab.tsx` | Text/Asset/Shape/TTS/Computed (asset csere CSAK URL input, l. lent) |
| `detail/tabs/AppearanceTab.tsx` | `components/detail/tabs/AppearanceTab.tsx` | Opacity, blend, z_within_layer |
| `detail/tabs/TimingTab.tsx` | `components/detail/tabs/TimingTab.tsx` | Start/Duration/Transitions, anchor + ClipPicker |
| `detail/tabs/EffectsTab.tsx` | `components/detail/tabs/EffectsTab.tsx` | Effect stack, paraméter szerkesztés, EffectPicker (AudioLinkSection NÉLKÜL) |
| `detail/tabs/AudioTab.tsx` | `components/detail/tabs/AudioTab.tsx` | Volume, mute, fade in/out |
| `panels/CanvasPanel.tsx` | `components/panels/CanvasPanel.tsx` | Bundle-aware clip lista (NarrationPoolPanel és AnchorBadge/AnchorLink nélkül) |
| `panels/ContextRail.tsx` | `components/panels/ContextRail.tsx` | Detail mód kompakt kontextus |
| `panels/SpanningLayersPanel.tsx` | `components/panels/SpanningLayersPanel.tsx` | 🌊 Átívelő rétegek kollapszábilis kártya |
| `MiniMap.tsx` | `components/timeline/MiniMap.tsx` | Anchor pötty-ök, playhead, pillanat-szegmensek |
| `NowStrip.tsx` | `components/timeline/NowStrip.tsx` | ±2.5s időszelet layer-bontással |
| `PauseLabels.tsx` | `components/timeline/PauseLabels.tsx` | PauseLabelsOverlay + AudioActivePanel |
| `ModeSwitcher.tsx` | `components/ModeSwitcher.tsx` | Komp ⇄ Detail toggle |
| `ValidationBadge.tsx` | `components/ValidationBadge.tsx` | ✅ OK / ⚠ N hiba pill |
| `state/playerSync.ts` | `state/playerSync.ts` | **Adaptált**: Remotion `PlayerRef` → `BrowserRenderer`. RAF-alapú polling. saveState/getSavedState cross-mount perzisztencia. |
| `JsonView.tsx` | `components/JsonEditorPanel.tsx` | **Bővítve**: szintaxis kiemelő (kulcs/string/szám/bool színezés), Export gomb |
| `detail/BundleDetailPanel.tsx` | `components/detail/BundleDetailPanel.tsx` | **Egyszerűsített**: bundle.inputs generic szerkesztő (preset-catalog nélkül) |

---

### ⚠️ Részlegesen átvéve

| ZAVA modul | OSS állapot | Mi maradt ki |
|---|---|---|
| `modals/CatalogModal.tsx` (összetett, kategória-fa) | `CatalogModal.tsx` egyszerűsített | Kategória-szűrés, keresés, kép preview-k hiányoznak |
| Preview kontrollok | Egyszerűsített: ▶ ⏸ ■ 🔊 | Sebesség (0.5x/1x/2x), loop toggle nincs |

---

### ❌ Hiányzó modulok (ZAVA-specifikus)

| Modul | Funkció | Miért nincs OSS-ben |
|---|---|---|
| `intent/*.ts` (~600 sor) | AI varázsló: cél/stílus/felépítés választás → starter komp generálás | ZAVA-specifikus AI mentor flow |
| `modals/AssetLibraryModal.tsx` | Szerver-oldali asset könyvtár (S3, képek, videók, hangok) | OSS-ben file URL input van helyette |
| `modals/SaveLoadModals.tsx` | Backend mentés/betöltés (project_id alapján) | OSS-ben `onSave` callback, mentés a host alkalmazásra van bízva |
| `modals/RenderModal.tsx` | AWS Lambda render trigger | `@ce2/render` (még nem létezik OSS) |
| `modals/TtsGenerateModal.tsx` | OpenAI/ElevenLabs TTS generálás | `@ce2/ai` (még nem létezik OSS) |
| `modals/TrimModal.tsx` | Asset trim előnézet (audio waveform, video timeline) | Egyszerű trim mezők a ContentTab-ban |
| `panels/NarrationPoolPanel.tsx` | Audio narráció pool (clip-független TTS bank) | `composition.audio_pool` ZAVA-specifikus |
| `panels/CatalogPanel.tsx` | Sticky panel a Komp módban (a régi UI, lecserélve modal-ra) | A 2-módos UI miatt feleslegessé vált |
| `detail/AudioLinkSection.tsx` | Vizuális clip ↔ audio narráció kapcsolás (audio_link) | `audio_pool` rendszer nélkül nincs értelme |
| `detail/SceneEditorModal.tsx` | Egész scene full-screen szerkesztő (mobile-ra szabva) | Mobile flow nem prioritás OSS-ben |
| `preset-catalog/` (~1500 sor) | 7 atomic + 8 compound preset definíció **bemeneti mezőkkel** (countdown, cta_pulse, intro_outro, list_with_icons, question_answer, talking_head, text_sequence, video_collage) | OSS-ben `presets/index.ts` 15 egyszerűsített preset, mezőkijelölés nélkül. Ez a legmélyebb feature-hiány. |
| `validators/anchorGraph.ts` | Cycle detection részletes hibajelentéssel | OSS `validateComposition` szintetikus hibákat ad — kevésbé jó UX |
| `state/projectStorage.ts` | localStorage / API mentés | `onSave` callback-re bízva |
| `MobileBottomNav.tsx` | Mobil layout 4-tab navigáció | Desktop-first OSS |

---

## 3. Funkcionális paritás táblázat

| Funkció | ZAVA | OSS | Megjegyzés |
|---|:---:|:---:|---|
| **Layout** | | | |
| Komp/Detail 2-mód | ✅ | ✅ | |
| Auto Komp→Detail kiválasztásra | ✅ | ✅ | |
| 60/40 + 22/56/22 oszlopok | ✅ | ✅ | |
| Mobile 4-tab | ✅ | ❌ | nem prioritás |
| **Komponens-fa szerkesztés** | | | |
| Moments listázás | ✅ | ✅ | |
| Spanning layers szekció | ✅ | ✅ | |
| Bundle-aware groupping | ✅ | ✅ | |
| Anchor badge a klipeken | ✅ | ❌ | |
| Anchor link „ugrás" gomb | ✅ | ❌ | |
| Drag-and-drop átrendezés | ❌ | ❌ | ZAVA-ban sem volt |
| **Preview** | | | |
| Frame-pontos render | ✅ | ✅ | |
| Play/Pause/Stop | ✅ | ✅ | |
| Scrub | ✅ | ✅ | |
| Pause labels overlay | ✅ | ✅ | |
| Audio active panel | ✅ | ✅ | |
| Mute toggle | ❌ | ✅ | **OSS előny!** |
| Loop | ✅ (Remotion) | ✅ | |
| Sebesség kontroll | ✅ | ❌ | |
| **Timeline** | | | |
| NowStrip (±N sec) | ✅ | ✅ | |
| MiniMap | ✅ | ✅ | |
| Anchor pöttyök | ✅ | ✅ | |
| **Clip Detail Editor** | | | |
| 6-tab szerkezet | ✅ | ✅ | |
| Tipográfia (font/weight/spacing/line-height) | ✅ | ✅ | |
| Pozíció (9-pont preset + xy%) | ✅ | ✅ | text, asset, computed-ben is |
| Color picker | ✅ | ✅ | |
| Asset csere | ✅ AssetLibrary | ⚠️ URL input | OSS egyszerűsítve |
| Trim editor | ✅ vizuális | ⚠️ NumberInput | |
| Timing anchor picker | ✅ | ✅ | |
| Transition picker | ✅ | ✅ | |
| Effect stack + paraméterek | ✅ | ✅ | |
| Effect Look preset | ✅ | ✅ | |
| Audio link narrációhoz | ✅ | ❌ | audio_pool kell |
| **Bundle / Compound presets** | | | |
| Countdown szerkesztő | ✅ definícióval | ⚠️ generic | inputs kulcs alapján auto-detektálás |
| CTA pulse, intro/outro stb. | ✅ | ❌ | preset-catalog hiányzik |
| **AI / Backend** | | | |
| Új projekt varázsló | ✅ | ❌ | intent/ modul |
| TTS narráció generálás | ✅ | ❌ | @ce2/ai |
| Lambda MP4 render | ✅ | ❌ | @ce2/render |
| Project mentés/betöltés | ✅ | ⚠️ onSave callback | host alkalmazás dolga |
| **JSON nézet** | | | |
| Szerkesztés + auto-apply | ✅ | ✅ | |
| Szintaxis kiemelés | ❌ | ✅ | **OSS előny!** |
| Export gomb | ❌ | ✅ | **OSS előny!** |
| **Validáció** | | | |
| Cycle detection | ✅ részletes | ⚠️ szintetikus | OSS hiba-üzenet kevésbé hasznos |
| Live ✅/⚠ badge | ✅ | ✅ | |

---

## 4. Architektúra különbségek

| | ZAVA | OSS |
|---|---|---|
| Stack | Next.js App Router, csak Next 14+ | Vite + React, framework-agnoszticus |
| State | `useState` propon át a page.tsx-ben | Ugyanaz |
| Stílus | Tailwind + custom `za-*` Tailwind tokenek | Tailwind v3 (PostCSS) + inline style a kritikus layoutban |
| Backend kapcsolat | API `/api/v1/...` endpoint-ok | NINCS — csak callback (`onSave`) |
| Asset feltöltés | Multi-part S3 presigned URL | Filesystem URL vagy data URL (felhasználói gond) |
| MP4 export | AWS Lambda + Remotion Render API | `@ce2/render` csomag (még nincs) |

---

## 5. OSS-előnyök (ahol jobb mint a ZAVA)

1. **Mute toggle a preview-n** — ZAVA-ban nincs, OSS-ben 🔊/🔇 gomb
2. **JSON szintaxis kiemelés** — ZAVA `JsonView.tsx` egyszerű textarea
3. **JSON Export gomb** — egy click letöltés
4. **Frame-alapú renderer NEM Remotion-függő** — szabadon hostolható, NPM csomag (`@ce2/browser`)
5. **Standalone npm-csomag** — bármilyen React appban használható (`<CE2Editor />`)
6. **Tailwind v3 explicit content** — működik a packages mappa szerkezetben (Windows-fix)

---

## 6. Roadmap — mit kell még csinálni a teljes paritáshoz

### Sürgős
- [ ] `@ce2/render` csomag: Puppeteer + ffmpeg vagy Remotion Lambda integráció MP4 exporthoz
- [ ] Preset-catalog: 8 compound preset definíciókkal (countdown, cta_pulse, intro_outro, list_with_icons, question_answer, talking_head, text_sequence, video_collage) — bemeneti mezőkkel
- [ ] AnchorBadge / AnchorLink a CanvasPanel-be

### Közepes prioritás
- [ ] AssetLibraryModal (legalább lokális file picker + drag&drop URL feltöltés)
- [ ] TrimModal (waveform vagy timeline preview)
- [ ] Preview sebesség (0.25x, 0.5x, 1x, 2x)
- [ ] Validation hibák jobb UX (cycle detection részletes hibaüzenet, „Jump to clip" link)
- [ ] Project Save/Load modal (localStorage backend opcionálisan)

### Alacsony prioritás (ZAVA-specifikus)
- [ ] `audio_pool` rendszer + NarrationPoolPanel + AudioLinkSection
- [ ] Mobile bottom nav (csak ha mobile target)
- [ ] AI varázsló (intent module) — csak ha `@ce2/ai` készen van
- [ ] TtsGenerateModal — csak ha `@ce2/ai` készen van

---

## 7. Üzletileg fontos megjegyzés

A ZAVA editor a `creative-v2` minden részletével **specifikusan a ZAVA webshop platformhoz** van szabva (backend API, S3 asset library, Lambda render, OpenAI/ElevenLabs TTS). Az OSS editor szándékosan **platform-agnoszticus**:

- A `<CE2Editor>` komponens props-on át kapja az `initialComposition`-t és `onSave` callback-et
- Asset feltöltés / MP4 export / TTS generálás: **a host alkalmazás felelőssége**, OSS opcionális csomagokkal: `@ce2/render`, `@ce2/ai` (jövőben, fizetős tier)
- A free OSS rész (`@ce2/core` + `@ce2/browser` + `@ce2/editor`) bárki használhatja MIT licensz alatt

Az OSS editor **funkcionálisan 80%-ban** elkészült (alap szerkesztés, preview, JSON). A maradék 20%-uk specifikus rendszerek (render pipeline, asset library, AI) amik vagy a fizetős tier-be kerülnek (`@ce2/render`, `@ce2/ai`) vagy a host alkalmazás integrálja.
