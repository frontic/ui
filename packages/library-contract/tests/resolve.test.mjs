import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { installedDir } from '../src/resolve.mjs'

const temps = []
const tempDir = () => {
  const dir = mkdtempSync(join(tmpdir(), 'resolve-'))
  temps.push(dir)
  return dir
}

afterAll(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true })
})

describe('installedDir', () => {
  it('walks up from the directory it is given', () => {
    const root = tempDir()
    mkdirSync(join(root, 'node_modules', 'axe-like'), { recursive: true })
    writeFileSync(join(root, 'node_modules', 'axe-like', 'package.json'), '{}')
    mkdirSync(join(root, 'a', 'b'), { recursive: true })
    expect(installedDir('axe-like', join(root, 'a', 'b'))).toBe(join(root, 'node_modules', 'axe-like'))
  })

  it('names where it looked when nothing is there', () => {
    const empty = tempDir()
    expect(() => installedDir('nope-not-installed', empty)).toThrow(`nope-not-installed is not installed beside ${empty}`)
  })

  it('finds the contract’s own dependencies by default', () => {
    expect(installedDir('vue-tsc')).toMatch(/node_modules[\\/]vue-tsc$/)
  })
})
