import React from 'react'
import { createRoot } from 'react-dom/client'
import { CE2Editor } from '@ce2/editor'
import type { CE2Composition } from '@ce2/core'
import { ZAVA_PROMO } from './zava-promo.js'

import './tw.css'

function App() {
  const handleSave = (comp: CE2Composition) => {
    console.log('Saved:', JSON.stringify(comp, null, 2))
  }

  return (
    <CE2Editor
      initialComposition={ZAVA_PROMO}
      onSave={handleSave}
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}

createRoot(document.getElementById('root')!).render(<App />)
