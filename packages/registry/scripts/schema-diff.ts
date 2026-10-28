// The field diff between two copies of shadcn's registry item schema, as Markdown: `pnpm schema:diff <before.json> <after.json>`.
// The schema watch puts it in the pull request that refreshes the vendored copy.
import { readFileSync } from 'node:fs'
import { schemaDiff, schemaDiffMarkdown } from './lib/schema-diff'

const [before, after] = process.argv.slice(2)
if (!before || !after) throw new Error('usage: schema:diff <before.json> <after.json>')
const read = (path: string) => JSON.parse(readFileSync(path, 'utf8'))
console.log(schemaDiffMarkdown(schemaDiff(read(before), read(after))))
