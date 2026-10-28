// Vendors shadcn's registry item schema at a commit: pnpm --filter @frontic/registry schema:refresh <40-character commit sha>.
// Writes public/schema/registry-item.json and pins the commit and its sha256 in upstream.json.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const commit = process.argv[2]
// A full commit sha, so the pin names one file for good; a branch or a short sha could later name another.
if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error('usage: schema:refresh <40-character commit sha>')
const upstreamPath = join(ROOT, 'upstream.json')
const upstream = JSON.parse(readFileSync(upstreamPath, 'utf8'))
const repo = new URL(upstream.schema.repository).pathname.slice(1)
const response = await fetch(`https://raw.githubusercontent.com/${repo}/${commit}/${upstream.schema.path}`)
if (!response.ok) throw new Error(`${upstream.schema.path} at ${commit}: ${response.status}`)
const text = await response.text()
JSON.parse(text)
writeFileSync(join(ROOT, 'public/schema/registry-item.json'), text)
upstream.schema = { ...upstream.schema, commit, sha256: createHash('sha256').update(text).digest('hex') }
writeFileSync(upstreamPath, `${JSON.stringify(upstream, null, 2)}\n`)
console.log(`schema: ${upstream.schema.path} at ${commit}, sha256 ${upstream.schema.sha256}`)
