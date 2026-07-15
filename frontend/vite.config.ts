import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',       // simulates a browser DOM
        globals: true,              // lets you use `test`/`expect` without importing them
        setupFiles: './src/test/setup.ts',
    },
});