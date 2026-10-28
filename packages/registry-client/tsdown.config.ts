import { defineConfig } from 'tsdown'

// The contract's recipe rules ship inside dist, so the published client needs no library-contract install.
export default defineConfig({
  entry: ['src/index.ts', 'src/api.ts'],
  format: ['esm'],
  dts: { resolve: ['@frontic/library-contract'] },
  clean: true,
  fixedExtension: false,
  noExternal: ['@frontic/library-contract'],
  inputOptions: { experimental: { attachDebugInfo: 'none' } },
})
