import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('size names', () => {
  it("never fall back to a size called 'default': an unset size is md", () => {
    const files = execSync('git ls-files ui sections templates', { cwd: `${import.meta.dirname}/../..`, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter((file) => file.endsWith('.vue') || file.endsWith('.ts'))
    const fallbacks = files.filter((file) => /size\s*\?\?\s*'default'/.test(readFileSync(`${import.meta.dirname}/../../${file}`, 'utf8')))
    expect(fallbacks).toEqual([])
  })
})
