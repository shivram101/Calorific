// vite.config.ts
// defineConfig comes from 'vitest/config' (not 'vite') so the test block
// type-checks — vitest extends vite's config with the test settings.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // simulates a browser DOM
    globals: true, // lets you use test/expect without importing them
    setupFiles: './src/test/setup.ts',
  },
})
