/// <reference types='vitest' />
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defineConfig, Plugin } from 'vite'
import { assemblyScriptPlugin } from 'vite-assemblyscript'
import { coopCoep } from 'vite-coop-coep'
import { hexLoader } from 'vite-hex-loader'
import { openInEditor } from 'vite-open-in-editor'
import externalize from 'vite-plugin-externalize-dependencies'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { printUrlsPlugin } from 'vite-print-urls'
import tsconfigPaths from 'vite-tsconfig-paths'
import { viteUsing } from 'vite-using'

const homedir = os.homedir()

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  define: {
    'import.meta.vitest': 'undefined',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    includeSource: ['src/**/*.{js,jsx,ts,tsx}'],
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
    coopCoep() as Plugin,
    nodePolyfills(),
    viteUsing() as Plugin,
    openInEditor() as Plugin,
    printUrlsPlugin() as Plugin,
    hexLoader() as Plugin,
    tsconfigPaths(),
    externalize({
      externals: [
        'node:fs/promises',
        (moduleName) => moduleName.startsWith('node:')
      ],
    }),
    assemblyScriptPlugin({
      configFile: 'asconfig-seq.json',
      projectRoot: '.',
      srcMatch: 'as/assembly/seq',
      srcEntryFile: 'as/assembly/seq/index.ts',
      mapFile: './as/build/seq.wasm.map',
      // extra: [
      //   '--transform', './vendor/unroll.js',
      // ]
    }) as Plugin,
  ],
})
