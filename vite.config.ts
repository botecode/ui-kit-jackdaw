import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: { port: 5273, strictPort: true },
  plugins: [react()],
  resolve: {
    alias: {
      '@bridge': resolve(__dirname, '../jackdaw/shared/index.ts'),
      '@tokens': resolve(__dirname, 'src/tokens'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
