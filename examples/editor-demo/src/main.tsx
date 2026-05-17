import React from 'react'
import { createRoot } from 'react-dom/client'
import { CE2Editor } from '@ce2/editor'
import type { CE2Composition } from '@ce2/core'
import { CE2_PROMO } from './ce2-promo.js'

import '../../../packages/editor/src/styles/editor.css'

function App() {
  const handleSave = (comp: CE2Composition) => {
    console.log('Saved:', JSON.stringify(comp, null, 2))
    alert(`Saved! ${comp.moments.length} moments, JSON logged to console.`)
  }

  return (
    <CE2Editor
      initialComposition={CE2_PROMO}
      onSave={handleSave}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(<App />)
