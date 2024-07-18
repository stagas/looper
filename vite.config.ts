import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defineConfig } from 'vite'
import { coopCoep } from 'vite-coop-coep'
import { openInEditor } from 'vite-open-in-editor'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { printUrlsPlugin } from 'vite-print-urls'
import { viteUsing } from 'vite-using'

import type { Plugin } from 'vite'

const homedir = os.homedir()

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  define: {
    'import.meta.vitest': 'undefined',
  },
  assetsInclude: ['public/**/*'],
  server: {
    host: true,
    fs: {
      allow: [
        '/',
      ]
    },
    https: {
      key: fs.readFileSync(path.join(homedir, '.ssl-certs', 'devito.test-key.pem')),
      cert: fs.readFileSync(path.join(homedir, '.ssl-certs', 'devito.test.pem')),
    }
  },
  esbuild: {
    jsx: 'automatic'
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      treeshake: { propertyReadSideEffects: 'always' }
    }
  },
  plugins: [
    // coopCoep() as Plugin,
    nodePolyfills(),
    viteUsing() as Plugin,
    openInEditor(),
    printUrlsPlugin() as Plugin,
  ],
})
