import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = join(import.meta.dirname, '../..')
const SOURCES = ['ui', 'sections', 'templates', 'composables', 'lib']

/** The source files an item ships. */
const files = SOURCES.filter((dir) => existsSync(join(root, dir))).flatMap((dir) =>
  (readdirSync(join(root, dir), { recursive: true }) as string[]).filter((file) => /\.(vue|ts)$/.test(file)).map((file) => join(dir, file)),
)
/** Whether a text holds `typeof window`, which the docs build rewrites to "undefined" even inside the source it embeds as a string. */
const rewritten = (text: string) => /\btypeof\s+window\b/.test(text)

describe('a registry source file', () => {
  it('never writes `typeof window`: the docs build breaks on it; @vueuse/core’s defaultWindow guards the client instead', () => {
    expect(files.length).toBeGreaterThan(100)
    expect(files.filter((file) => rewritten(readFileSync(join(root, file), 'utf8')))).toEqual([])
  })

  it('is caught on the guard that broke the build', () => {
    expect(rewritten("if (typeof window !== 'undefined') {")).toBe(true)
    expect(rewritten("defaultWindow?.addEventListener('keydown', onKey)")).toBe(false)
  })
})
