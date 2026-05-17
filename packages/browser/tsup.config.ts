import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2022',
    external: ['react', 'react-dom', '@ce2/core'],
  },
  {
    entry: ['src/react/index.tsx'],
    outDir: 'dist/react',
    format: ['esm'],
    dts: true,
    target: 'es2022',
    external: ['react', 'react-dom', '@ce2/core'],
  },
])
