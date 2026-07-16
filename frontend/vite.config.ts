// vite.config.ts
// NOTE: defineConfig must come from 'vitest/config' (not 'vite') — it accepts
// everything Vite's does PLUS the `test` block. Without that block, vitest
// runs with no DOM (jsdom) and every page test fails with
// "document/window/localStorage is not defined".
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom', // simulates a browser DOM
    globals: true, // lets you use `test`/`expect` without importing them
    setupFiles: './src/test/setup.ts',
  },
})
