import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@ce2/core':    resolve(__dirname, '../../packages/core/src/index.ts'),
      '@ce2/browser': resolve(__dirname, '../../packages/browser/src/index.ts'),
    },
  },
})
