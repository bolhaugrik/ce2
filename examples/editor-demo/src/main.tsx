import React from 'react'
import { createRoot } from 'react-dom/client'
import { CE2Editor } from '@ce2/editor'
import type { CE2Composition } from '@ce2/core'

import '../../../packages/editor/src/styles/editor.css'

const initialComposition: CE2Composition = {
  schema_version: '2.0',
  meta: { width: 390, height: 844, fps: 30, title: 'My Composition' },
  globals: { background_color: '#0d0d1a' },
  assets: [],
  bundles: [],
  spanning_layers: [],
  moments: [
    {
      id: 'm_intro',
      label: 'Intro',
      layers: [
        {
          id: 'bg',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 390, height: 844, fill: '#0d0d1a' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        {
          id: 'headline',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Hello CE2',
              font_size: 64,
              font_weight: '800',
              color: '#ffffff',
              text_align: 'center',
              position: { anchor: 'center', y: -40 },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 4 },
          in_transition: { kind: 'zoom_in', duration_sec: 0.5, easing: 'back-out' },
        },
        {
          id: 'subtitle',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Edit me in the detail panel →',
              font_size: 18,
              color: '#818cf8',
              text_align: 'center',
              position: { anchor: 'center', y: 20 },
            },
          },
          start: { kind: 'anchor', anchor_ref: 'headline.phase.static', offset_sec: 0.2 },
          duration: { kind: 'until_moment_end' },
          in_transition: { kind: 'fade', duration_sec: 0.4 },
        },
      ],
    },
    {
      id: 'm_second',
      label: 'Second',
      layers: [
        {
          id: 'bg2',
          layer: 'pixel',
          source: { kind: 'shape', shape: 'rect', geom: { x: 0, y: 0, width: 390, height: 844, fill: '#07071a' } },
          start: { kind: 'moment_start' },
          duration: { kind: 'until_moment_end' },
        },
        {
          id: 'txt2',
          layer: 'vector',
          source: {
            kind: 'text',
            payload: {
              content: 'Second moment',
              font_size: 40,
              font_weight: '700',
              color: '#e2e8f0',
              text_align: 'center',
              position: { anchor: 'center' },
            },
          },
          start: { kind: 'moment_start' },
          duration: { kind: 'fixed_sec', value: 3 },
          in_transition: { kind: 'slide_left', duration_sec: 0.4 },
        },
      ],
    },
  ],
}

function App() {
  const handleSave = (comp: CE2Composition) => {
    console.log('Saved:', JSON.stringify(comp, null, 2))
    alert(`Saved! ${comp.moments.length} moments, JSON logged to console.`)
  }

  return (
    <CE2Editor
      initialComposition={initialComposition}
      onSave={handleSave}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(<App />)
