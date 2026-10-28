import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const vueFiles = (dir: string): string[] =>
  readdirSync(join(root, dir), { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.vue'))
    .map((e) => join(e.parentPath, e.name))

describe('Pagination consumers', () => {
  it('never give the pagination a shrink-to-fit width, which collapses its inline-size container to nothing', () => {
    const tags = ['sections', 'templates', 'blocks', 'ui']
      .flatMap((dir) => {
        try {
          return vueFiles(dir)
        } catch {
          return []
        }
      })
      .flatMap((file) => [...readFileSync(file, 'utf8').matchAll(/<Pagination\s(?:[^>"]|"[^"]*")*>/g)].map((m) => ({ file: file.slice(root.length + 1), tag: m[0] })))
    expect(tags.length).toBeGreaterThanOrEqual(2)
    expect(tags.filter(({ tag }) => /class="[^"]*\b(w-auto|w-fit|inline-flex)\b/.test(tag))).toEqual([])
  })
})
