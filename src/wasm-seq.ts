import { wasmAlloc, wasmImport } from 'utils'
import { instantiate } from '../as/build/seq.js'
import url from '../as/build/seq.wasm?url'

const mod = await wasmImport(url, '/as/build/seq')
const wasm = wasmAlloc(await instantiate(mod, {
  env: {
    log: console.log,
  }
}))

export default wasm

if (import.meta.vitest) {
  describe('alloc', () => {
    it('works', () => {
      const buf = wasm.alloc(Float32Array, 32)
      expect(buf.length).toBe(32)
      expect(buf).toBeInstanceOf(Float32Array)
    })
  })
}
