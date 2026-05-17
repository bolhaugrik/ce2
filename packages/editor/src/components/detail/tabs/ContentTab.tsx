/**
 * CE2 — Detail / Tartalom tab.
 *
 * Source.kind szerinti dinamikus form.
 * AssetLibraryModal helyett egyszerű URL input van.
 */
import React from 'react'
import type { Clip, ClipSource, CE2Composition } from '@ce2/core'
import { Field, TextInput, NumberInput, ColorInput, SelectInput, Section, Toggle } from '../../primitives.js'

interface Props {
  clip: Clip
  composition?: CE2Composition
  onUpdate: (updater: (c: Clip) => Clip) => void
  onUpdateComposition?: (updater: (c: CE2Composition) => CE2Composition) => void
}

type Position = Extract<ClipSource, { kind: 'text' }>['payload']['position']

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
]

const WEIGHT_OPTIONS = [
  { value: '300', label: '300 — Light' },
  { value: '400', label: '400 — Regular' },
  { value: '500', label: '500 — Medium' },
  { value: '600', label: '600 — Semibold' },
  { value: '700', label: '700 — Bold' },
  { value: '800', label: '800 — Extrabold' },
  { value: '900', label: '900 — Black' },
]

const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'Eredeti (Aa)' },
  { value: 'uppercase', label: 'NAGYBETŰS (AA)' },
  { value: 'lowercase', label: 'kisbetűs (aa)' },
  { value: 'capitalize', label: 'Szókezdő Nagy (Aa Aa)' },
]

type PositionPreset =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

const PRESET_GRID: PositionPreset[][] = [
  ['top-left', 'top-center', 'top-right'],
  ['middle-left', 'middle-center', 'middle-right'],
  ['bottom-left', 'bottom-center', 'bottom-right'],
]

const PositionPicker: React.FC<{
  value: Position | undefined
  onChange: (v: Position | undefined) => void
}> = ({ value, onChange }) => {
  const isPreset = !value || (value as any).kind === 'preset'
  const currentPreset = (value as any)?.kind === 'preset' ? (value as any).value : 'middle-center'
  const xy = (value as any)?.kind === 'xy' ? (value as any) : null

  const [mode, setMode] = React.useState<'preset' | 'xy'>(isPreset ? 'preset' : 'xy')

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-0.5 bg-gray-100 rounded">
        <button
          onClick={() => {
            setMode('preset')
            onChange({ kind: 'preset', value: currentPreset } as any)
          }}
          className={`flex-1 px-2 py-1 text-[11px] rounded ${mode === 'preset' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          9-pont
        </button>
        <button
          onClick={() => {
            setMode('xy')
            onChange({ kind: 'xy', x_pct: xy?.x_pct ?? 50, y_pct: xy?.y_pct ?? 50 } as any)
          }}
          className={`flex-1 px-2 py-1 text-[11px] rounded ${mode === 'xy' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
        >
          X / Y %
        </button>
      </div>

      {mode === 'preset' && (
        <div className="grid grid-cols-3 gap-1 max-w-[140px]">
          {PRESET_GRID.flat().map((p) => (
            <button
              key={p}
              onClick={() => onChange({ kind: 'preset', value: p } as any)}
              className={`aspect-square rounded border ${
                currentPreset === p
                  ? 'bg-gray-900 border-gray-900'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              title={p}
            >
              <span
                className={`block w-1.5 h-1.5 rounded-full mx-auto ${currentPreset === p ? 'bg-white' : 'bg-gray-500'}`}
              />
            </button>
          ))}
        </div>
      )}

      {mode === 'xy' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-3">X</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={xy?.x_pct ?? 50}
              onChange={(e) =>
                onChange({ kind: 'xy', x_pct: parseInt(e.target.value, 10), y_pct: xy?.y_pct ?? 50 } as any)
              }
              className="flex-1"
            />
            <span className="text-[10px] text-gray-900 w-8 text-right">{xy?.x_pct ?? 50}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-3">Y</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={xy?.y_pct ?? 50}
              onChange={(e) =>
                onChange({ kind: 'xy', x_pct: xy?.x_pct ?? 50, y_pct: parseInt(e.target.value, 10) } as any)
              }
              className="flex-1"
            />
            <span className="text-[10px] text-gray-900 w-8 text-right">{xy?.y_pct ?? 50}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const ContentTab: React.FC<Props> = ({ clip, composition, onUpdate, onUpdateComposition }) => {
  const s = clip.source

  if (s.kind === 'text') {
    const updateTextPayload = (patch: Partial<Extract<ClipSource, { kind: 'text' }>['payload']>) => {
      onUpdate((c) => {
        if (c.source.kind !== 'text') return c
        return { ...c, source: { ...c.source, payload: { ...c.source.payload, ...patch } } }
      })
    }
    return (
      <>
        <Section title="Szöveg">
          <Field label="Szöveg">
            <TextInput
              multiline
              value={s.payload.text ?? ''}
              onChange={(v) => updateTextPayload({ text: v })}
            />
          </Field>
        </Section>

        <Section title="Tipográfia">
          <Field label="Font család">
            <SelectInput
              value={s.payload.font_family ?? 'Inter'}
              onChange={(v) => updateTextPayload({ font_family: v })}
              options={FONT_OPTIONS}
            />
          </Field>
          <Field label="Vastagság (weight)">
            <SelectInput
              value={String(s.payload.font_weight ?? 700)}
              onChange={(v) => updateTextPayload({ font_weight: v })}
              options={WEIGHT_OPTIONS}
            />
          </Field>
          <Field label=" ">
            <Toggle
              label="Dőlt (italic)"
              value={s.payload.font_style === 'italic'}
              onChange={(v) => updateTextPayload({ font_style: v ? 'italic' : 'normal' })}
            />
          </Field>
          <Field label="Nagy/kis betűk">
            <SelectInput
              value={s.payload.text_transform ?? 'none'}
              onChange={(v) => updateTextPayload({ text_transform: v as any })}
              options={TRANSFORM_OPTIONS}
            />
          </Field>
          <Field label="Méret (% vászon-magasság)">
            <NumberInput
              value={s.payload.font_size_pct ?? 9}
              onChange={(v) => updateTextPayload({ font_size_pct: v })}
              min={3}
              max={20}
              step={0.5}
              showSlider
            />
          </Field>
          <Field label="Betűköz (em)" helper="Negatív → szorosabb, pozitív → tágabb">
            <NumberInput
              value={s.payload.letter_spacing_em ?? 0}
              onChange={(v) => updateTextPayload({ letter_spacing_em: v })}
              min={-0.1}
              max={0.5}
              step={0.01}
              showSlider
            />
          </Field>
          <Field label="Sortávolság">
            <NumberInput
              value={s.payload.line_height ?? 1.15}
              onChange={(v) => updateTextPayload({ line_height: v })}
              min={0.8}
              max={2.5}
              step={0.05}
              showSlider
            />
          </Field>
        </Section>

        <Section title="Szín & igazítás">
          <Field label="Szín">
            <ColorInput
              value={s.payload.color ?? '#ffffff'}
              onChange={(v) => updateTextPayload({ color: v })}
            />
          </Field>
          <Field label="Vízszintes igazítás">
            <SelectInput
              value={s.payload.align ?? 'center'}
              onChange={(v) => updateTextPayload({ align: v as 'left' | 'center' | 'right' })}
              options={[
                { value: 'left', label: 'Bal' },
                { value: 'center', label: 'Közép' },
                { value: 'right', label: 'Jobb' },
              ]}
            />
          </Field>
          <Field label="Max szélesség (%)">
            <NumberInput
              value={s.payload.max_width_pct ?? 80}
              onChange={(v) => updateTextPayload({ max_width_pct: v })}
              min={10}
              max={100}
              step={1}
              showSlider
            />
          </Field>
        </Section>

        <Section title="Pozíció">
          <PositionPicker
            value={s.payload.position as any}
            onChange={(v) => updateTextPayload({ position: v as any })}
          />
        </Section>
      </>
    )
  }

  if (s.kind === 'asset') {
    const isImageOrVideo = clip.layer === 'pixel' || clip.layer === 'video'
    const linkedAsset = composition?.assets.find((a) => a.id === s.asset_id) ?? null
    const isPlaceholder =
      !!linkedAsset &&
      typeof linkedAsset.url === 'string' &&
      linkedAsset.url.includes('PLACEHOLDER')

    return (
      <>
        <Section title="Asset hivatkozás">
          {isPlaceholder && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900 mb-2">
              ⚠ <strong>Placeholder asset.</strong> Cseréld le igazi képre / videóra.
            </div>
          )}
          <Field
            label="Asset ID"
            helper={
              linkedAsset
                ? `URL: ${linkedAsset.url.slice(0, 60)}…`
                : 'Az asset nem található a kompozícióban.'
            }
          >
            <TextInput value={s.asset_id} onChange={() => undefined} />
          </Field>

          {/* URL-alapú asset csere — egyszerű megoldás AssetLibraryModal nélkül */}
          {onUpdateComposition && (
            <Field label="Csere — URL beillesztés">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://... URL a cseréhez"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded"
                  onBlur={(e) => {
                    const url = e.target.value.trim()
                    if (!url) return
                    const newId = `asset_${Date.now()}`
                    onUpdateComposition((comp) => {
                      const swap = (c: Clip): Clip => {
                        if (c.id !== clip.id || c.source.kind !== 'asset') return c
                        return { ...c, source: { ...c.source, asset_id: newId } }
                      }
                      return {
                        ...comp,
                        assets: [
                          ...comp.assets,
                          {
                            id: newId,
                            url,
                            kind: (clip.layer === 'pixel' ? 'image' : clip.layer === 'video' ? 'video' : 'audio') as any,
                          },
                        ],
                        spanning_layers: comp.spanning_layers.map(swap),
                        moments: comp.moments.map((m) => ({ ...m, layers: m.layers.map(swap) })),
                      }
                    })
                    e.target.value = ''
                  }}
                />
              </div>
            </Field>
          )}

          {s.trim && (
            <>
              <Field label="Trim in (s)">
                <NumberInput
                  value={s.trim.in_sec}
                  onChange={(v) =>
                    onUpdate((c) => {
                      if (c.source.kind !== 'asset' || !c.source.trim) return c
                      return { ...c, source: { ...c.source, trim: { ...c.source.trim, in_sec: v } } }
                    })
                  }
                  min={0}
                  step={0.05}
                />
              </Field>
              <Field label="Trim out (s)">
                <NumberInput
                  value={s.trim.out_sec}
                  onChange={(v) =>
                    onUpdate((c) => {
                      if (c.source.kind !== 'asset' || !c.source.trim) return c
                      return { ...c, source: { ...c.source, trim: { ...c.source.trim, out_sec: v } } }
                    })
                  }
                  min={0}
                  step={0.05}
                />
              </Field>
            </>
          )}
        </Section>

        {isImageOrVideo && (
          <>
            <Section title="Méret">
              <Field
                label="Alap nagyítottság (scale)"
                helper="1 = teljes vászon (cover), 0.5 = fél, 2 = duplázott"
              >
                <NumberInput
                  value={s.scale ?? 1}
                  onChange={(v) =>
                    onUpdate((c) => {
                      if (c.source.kind !== 'asset') return c
                      return { ...c, source: { ...c.source, scale: v } }
                    })
                  }
                  min={0.1}
                  max={3}
                  step={0.05}
                  showSlider
                />
              </Field>
            </Section>
            <Section title="Pozíció">
              <PositionPicker
                value={s.position as any}
                onChange={(v) =>
                  onUpdate((c) => {
                    if (c.source.kind !== 'asset') return c
                    return { ...c, source: { ...c.source, position: v as any } }
                  })
                }
              />
            </Section>
          </>
        )}
      </>
    )
  }

  if (s.kind === 'shape') {
    const geom = (s.geom as { color?: string; size_pct?: number }) ?? {}
    return (
      <Section title="Forma tartalom">
        <Field label="Forma">
          <SelectInput
            value={s.shape}
            onChange={(v) =>
              onUpdate((c) => {
                if (c.source.kind !== 'shape') return c
                return { ...c, source: { ...c.source, shape: v as 'rect' | 'circle' | 'line' } }
              })
            }
            options={[
              { value: 'rect', label: 'Négyzet' },
              { value: 'circle', label: 'Kör' },
              { value: 'line', label: 'Vonal' },
            ]}
          />
        </Field>
        <Field label="Szín">
          <ColorInput
            value={geom.color ?? '#4fc3f7'}
            onChange={(v) =>
              onUpdate((c) => {
                if (c.source.kind !== 'shape') return c
                return { ...c, source: { ...c.source, geom: { ...(c.source.geom as object), color: v } } }
              })
            }
          />
        </Field>
        <Field label="Méret (%)">
          <NumberInput
            value={geom.size_pct ?? 30}
            onChange={(v) =>
              onUpdate((c) => {
                if (c.source.kind !== 'shape') return c
                return { ...c, source: { ...c.source, geom: { ...(c.source.geom as object), size_pct: v } } }
              })
            }
            min={5}
            max={100}
            step={1}
            showSlider
          />
        </Field>
      </Section>
    )
  }

  if (s.kind === 'tts') {
    return (
      <Section title="TTS narráció">
        <Field label="Beszéd-szöveg">
          <TextInput
            multiline
            value={s.text}
            onChange={(v) =>
              onUpdate((c) => {
                if (c.source.kind !== 'tts') return c
                return { ...c, source: { ...c.source, text: v } }
              })
            }
          />
        </Field>
        <Field label="Voice ID">
          <TextInput
            value={s.voice_id}
            onChange={(v) =>
              onUpdate((c) => {
                if (c.source.kind !== 'tts') return c
                return { ...c, source: { ...c.source, voice_id: v } }
              })
            }
          />
        </Field>
      </Section>
    )
  }

  if (s.kind === 'computed') {
    // Computed source: a bundle.inputs-okat szerkesztjük (countdown, stb.)
    const bundle = clip.bundle_id ? composition?.bundles.find(b => b.id === clip.bundle_id) : undefined
    if (!bundle || !onUpdateComposition) {
      return (
        <Section title={`↻ Computed (${s.logic_id})`}>
          <div className="text-xs text-gray-500 italic">
            Programozott source. Bundle nem található vagy nem szerkeszthető.
          </div>
          <Field label="Logic ID">
            <TextInput value={s.logic_id} onChange={() => undefined} />
          </Field>
        </Section>
      )
    }
    const updateInput = (key: string, value: unknown) => {
      onUpdateComposition(comp => ({
        ...comp,
        bundles: comp.bundles.map(b => b.id === bundle.id ? { ...b, inputs: { ...b.inputs, [key]: value } } : b),
      }))
    }
    return (
      <Section title={`↻ ${bundle.kind} (computed)`}>
        <div className="text-[11px] text-gray-500 italic mb-2">
          Bundle: {bundle.id} · v{bundle.version}
        </div>
        {Object.entries(bundle.inputs).map(([key, value]) => {
          const t = typeof value
          if (t === 'number') {
            return (
              <Field key={key} label={key}>
                <NumberInput value={value as number} onChange={(v) => updateInput(key, v)} step={1} />
              </Field>
            )
          }
          if (t === 'string' && (value as string).startsWith('#') && (value as string).length <= 9) {
            return (
              <Field key={key} label={key}>
                <ColorInput value={value as string} onChange={(v) => updateInput(key, v)} />
              </Field>
            )
          }
          if (t === 'boolean') {
            return (
              <Field key={key} label={key}>
                <Toggle label={key} value={value as boolean} onChange={(v) => updateInput(key, v)} />
              </Field>
            )
          }
          return (
            <Field key={key} label={key}>
              <TextInput value={String(value)} onChange={(v) => updateInput(key, v)} />
            </Field>
          )
        })}
      </Section>
    )
  }

  return (
    <div className="text-xs text-gray-500 p-3 italic">
      Source típus ({s.kind}) szerkesztője még nincs.
    </div>
  )
}
