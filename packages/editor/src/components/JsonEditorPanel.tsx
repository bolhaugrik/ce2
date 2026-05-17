import React, { useState, useEffect, useRef } from 'react'
import { CE2CompositionSchema } from '@ce2/core'
import type { CE2Composition } from '@ce2/core'
import { useEditorStore } from '../store/useEditorStore.js'

interface JsonEditorPanelProps {
  composition?: CE2Composition
  onApply?: (comp: CE2Composition) => void
}

export function JsonEditorPanel({ composition: propComp, onApply }: JsonEditorPanelProps = {}) {
  const store = useEditorStore()
  const composition = propComp ?? store.composition
  const setComposition = onApply ?? store.setComposition
  const [text, setText]     = useState(() => JSON.stringify(composition, null, 2))
  const [error, setError]   = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Sync when composition changes externally (e.g. user edits a clip in DetailPanel)
  const prevComp = useRef(composition)
  useEffect(() => {
    if (prevComp.current !== composition) {
      prevComp.current = composition
      setText(JSON.stringify(composition, null, 2))
      setError(null)
    }
  }, [composition])

  const handleChange = (value: string) => {
    setText(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      tryApply(value)
    }, 600)
  }

  const tryApply = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      const result = CE2CompositionSchema.safeParse(parsed)
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Invalid schema')
        return
      }
      setError(null)
      prevComp.current = result.data as any
      setComposition(result.data as any)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'JSON parse error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      tryApply(text)
    }
    // Allow tab indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget as HTMLTextAreaElement
      const start = el.selectionStart
      const end   = el.selectionEnd
      const next  = text.slice(0, start) + '  ' + text.slice(end)
      setText(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2
      })
    }
  }

  return (
    <>
      <div className="ce2-panel__header">
        JSON
        {error
          ? <span style={{ marginLeft: 6, color: 'var(--ed-danger)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>✕ {error}</span>
          : <span style={{ marginLeft: 6, color: 'var(--ed-success)', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>✓ valid</span>
        }
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ed-text3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Ctrl+S apply</span>
      </div>
      <textarea
        className="ce2-json-editor"
        value={text}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
      />
    </>
  )
}
