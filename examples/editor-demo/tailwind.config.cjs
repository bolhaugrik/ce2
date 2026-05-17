const path = require('path')
const fs   = require('fs')

// Windows: Tailwind glob ne kezelje az abszolút C:/ path-ot — kézzel bővítjük
function scanDir(dir) {
  const result = []
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        result.push(full.replace(/\\/g, '/'))
      }
    }
  }
  walk(dir)
  return result
}

const editorFiles = scanDir(
  path.resolve(__dirname, '../../packages/editor/src'),
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    ...editorFiles,
  ],
  theme: { extend: {} },
  plugins: [],
}
