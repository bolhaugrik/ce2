// Main export: new ZAVA-style CE2 editor
export { CE2Editor } from './EditorRoot.js'
export type { CE2EditorProps } from './EditorRoot.js'

// Legacy exports (backwards compat)
export { useEditorStore } from './store/useEditorStore.js'
export type { EditorStore, ValidationState } from './store/useEditorStore.js'

export { PresetCatalogModal } from './components/PresetCatalogModal.js'
export type { PresetCatalogModalProps } from './components/PresetCatalogModal.js'

export { AssetManagerPanel } from './components/AssetManagerPanel.js'

export { PRESETS, ATOMIC_PRESETS, COMPOUND_PRESETS } from './presets/index.js'
export type { PresetDef } from './presets/index.js'
