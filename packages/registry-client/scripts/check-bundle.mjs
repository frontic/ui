import process from 'node:process'
import { readFileSync } from 'node:fs'
import { importsOf } from '@frontic/library-contract/item'

// The published client depends only on these; anything else in dist is an unbundled import.
const ALLOWED = new Set(['fuzzysort', 'zod'])

let failed = false
for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/api.js', 'dist/api.d.ts']) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  for (const { specifier } of importsOf(file, source)) {
    if (specifier.startsWith('.') || specifier.startsWith('node:')) continue
    const pkg = specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]
    if (!ALLOWED.has(pkg)) {
      console.error(`${file} imports ${specifier}; the client may import only ${[...ALLOWED].join(', ')}`)
      failed = true
    }
  }
}
process.exit(failed ? 1 : 0)
