import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { port: 5175 },
  resolve: {
    alias: {
      '@ce2/core':    resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ce2/browser': resolve(__dirname, '../../packages/browser/src/index.ts'),
      '@ce2/editor':  resolve(__dirname, '../../packages/editor/src/index.ts'),
    },
  },
})
