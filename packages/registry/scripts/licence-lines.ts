import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { readSourceItems, sourcePath } from './lib/items'
import { licenceLines, withoutLicence } from './lib/licence'

const ROOT = join(import.meta.dirname, '..')
let changed = 0
for (const item of readSourceItems(ROOT)) {
  for (const [file, text] of Object.entries(item.files)) {
    const next = `${licenceLines(item, file).join('\n')}\n${withoutLicence(text)}`
    if (next === text) continue
    writeFileSync(join(ROOT, sourcePath(item, file)), next)
    changed++
  }
}
console.log(`licence lines: ${changed} files changed`)
