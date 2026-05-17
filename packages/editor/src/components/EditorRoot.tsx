import React, { useEffect, useState } from 'react'
import type { CE2Composition } from '@ce2/core'
import { useEditorStore }    from '../store/useEditorStore.js'
import { Toolbar }           from './Toolbar.js'
import { MomentList }        from './MomentList.js'
import { PreviewPanel }      from './PreviewPanel.js'
import { DetailPanel }       from './DetailPanel.js'
import { JsonEditorPanel }   from './JsonEditorPanel.js'
import { AssetManagerPanel } from './AssetManagerPanel.js'

export interface CE2EditorProps {
  initialComposition?: CE2Composition
  onSave?: (composition: CE2Composition) => void
  className?: string
  style?: React.CSSProperties
}

export function CE2Editor({ initialComposition, onSave, className, style }: CE2EditorProps) {
  const { setComposition, composition } = useEditorStore()
  const [jsonOpen, setJsonOpen]   = useState(false)
  const [assetOpen, setAssetOpen] = useState(false)

  useEffect(() => {
    if (initialComposition) setComposition(initialComposition)
  }, [initialComposition])

  return (
    <div className={`ce2-editor ${className ?? ''}`} style={style}>
      <Toolbar
        onSave={onSave}
        jsonOpen={jsonOpen}
        onToggleJson={() => setJsonOpen(v => !v)}
        assetOpen={assetOpen}
        onToggleAssets={() => setAssetOpen(v => !v)}
        assetCount={composition.assets.length}
      />
      <div className="ce2-body">
        <div className="ce2-panel ce2-panel--moments">
          <MomentList />
        </div>
        <div className="ce2-panel ce2-panel--preview">
          <PreviewPanel />
        </div>
        <div className="ce2-panel ce2-panel--detail">
          {assetOpen
            ? <AssetManagerPanel />
            : jsonOpen
              ? <JsonEditorPanel />
              : <DetailPanel />
          }
        </div>
      </div>
    </div>
  )
}
