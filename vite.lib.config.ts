import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Library build — emits ESM JS + one CSS bundle for the DAW (and any consumer) to use.
// The gallery build (`npm run build`) is separate; this one is `npm run build:lib`.
// Types are emitted separately by `tsc -p tsconfig.lib.json` (run by the build:lib script).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the gallery aliases so components resolve the bridge contract + tokens.
    alias: {
      '@bridge': resolve(__dirname, '../jackdaw/shared/index.ts'),
      '@tokens': resolve(__dirname, 'src/tokens'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false, // one bundled stylesheet (tokens + fonts + every component's CSS)
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'jackdaw-kit.js',
    },
    rollupOptions: {
      // Don't bundle the host's React or the icon set — the consumer provides them
      // (peerDependencies). This keeps one React instance and a lean bundle.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-dom/client',
        '@phosphor-icons/react',
      ],
      output: {
        assetFileNames: (info) =>
          info.name && info.name.endsWith('.css')
            ? 'jackdaw-kit.css'
            : 'assets/[name][extname]',
      },
    },
  },
})
