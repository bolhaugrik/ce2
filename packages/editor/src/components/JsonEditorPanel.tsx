import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { CE2Composition } from '@ce2/core'

interface Props {
  composition: CE2Composition
  onApply: (comp: CE2Composition) => void
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color:#6ee7b7'          // number  (green)
        if (/^"/.test(match)) {
          if (/:$/.test(match)) cls = 'color:#93c5fd'  // key  (blue)
          else                  cls = 'color:#fde68a'  // string (yellow)
        } else if (/true|false/.test(match)) {
          cls = 'color:#f9a8d4'             // bool (pink)
        } else if (/null/.test(match)) {
          cls = 'color:#94a3b8'             // null (gray)
        }
        return `<span style="${cls}">${match}</span>`
      }
    )
}

export function JsonEditorPanel({ composition, onApply }: Props) {
  const [text,   setText]   = useState(() => JSON.stringify(composition, null, 2))
  const [error,  setError]  = useState<string | null>(null)
  const [mode,   setMode]   = useState<'edit' | 'view'>('view')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const prevRef     = useRef(composition)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync when composition changes externally
  useEffect(() => {
    if (prevRef.current !== composition) {
      prevRef.current = composition
      setText(JSON.stringify(composition, null, 2))
      setError(null)
    }
  }, [composition])

  const tryApply = useCallback((value: string) => {
    try {
      const parsed = JSON.parse(value)
      // basic check
      if (typeof parsed !== 'object' || !parsed.schema_version) {
        setError('Hiányzó schema_version')
        return
      }
      setError(null)
      prevRef.current = parsed as CE2Composition
      onApply(parsed as CE2Composition)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON parse error')
    }
  }, [onApply])

  const handleChange = (value: string) => {
    setText(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => tryApply(value), 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      clearTimeout(debounceRef.current)
      tryApply(text)
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const s  = el.selectionStart
      const next = text.slice(0, s) + '  ' + text.slice(el.selectionEnd)
      setText(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
  }

  const highlighted = syntaxHighlight(text)

  const S = {
    root: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: '#0f172a', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 } as React.CSSProperties,
    topbar: { flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid #1e293b', background: '#0f172a' } as React.CSSProperties,
    body: { flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' } as React.CSSProperties,
    textarea: {
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      background: 'transparent', color: 'transparent', caretColor: '#fff',
      border: 'none', outline: 'none', padding: '12px 16px',
      fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
      resize: 'none', overflowY: 'auto', whiteSpace: 'pre', tabSize: 2,
      zIndex: 2,
    } as React.CSSProperties,
    pre: {
      position: 'absolute', inset: 0, margin: 0,
      padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.6,
      whiteSpace: 'pre', overflowY: 'auto', pointerEvents: 'none',
      color: '#e2e8f0', background: 'transparent', zIndex: 1,
    } as React.CSSProperties,
  }

  return (
    <div style={S.root}>
      <div style={S.topbar}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>JSON</span>
        {error
          ? <span style={{ color: '#f87171', fontSize: 10 }}>✕ {error}</span>
          : <span style={{ color: '#4ade80', fontSize: 10 }}>✓ valid</span>
        }
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569' }}>Ctrl+S alkalmaz · auto 800ms</span>
        <button
          onClick={() => {
            const blob = new Blob([text], { type: 'application/json' })
            const a    = document.createElement('a'); a.href = URL.createObjectURL(blob)
            a.download = `composition-${Date.now()}.json`; a.click()
          }}
          style={{ padding: '2px 8px', fontSize: 10, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 3, cursor: 'pointer' }}
        >
          ⬇ Export
        </button>
      </div>

      <div style={S.body}>
        {/* Highlight layer (read-only, below) */}
        <pre
          style={S.pre}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
        {/* Editable textarea (transparent text, on top) */}
        <textarea
          ref={textareaRef}
          style={S.textarea}
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  )
}
