import { defineConfig } from 'tsdown'

// The contract and the registry client ship inside dist, so the published CLI needs neither GitHub Packages install.
// The contract reads style-presets/ beside its own module, so the folder is copied next to the bundle.
export default defineConfig({
  entry: ['src/index.ts'],
  dts: { resolve: ['@frontic/library-contract', '@frontic/registry-client'] },
  sourcemap: true,
  shims: true,
  nodeProtocol: 'strip',
  fixedExtension: false,
  deps: { alwaysBundle: ['@frontic/library-contract', '@frontic/registry-client'] },
  copy: [
    { from: '../library-contract/src/style-presets', to: 'dist' },
    { from: '../../skills/frontic-ui', to: 'dist/skills' },
    { from: '../../skills/design-system', to: 'dist/skills' },
    { from: '../../skills/frontic-ui-review', to: 'dist/skills' },
    { from: 'content/AGENTS.md', to: 'dist' },
  ],
})
