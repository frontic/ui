import { execFileSync } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

const cli = realpathSync(join(import.meta.dirname, '../..'))
const dist = join(cli, 'dist')

// dist/ is built once per run by tests/setup/build-dist.ts.
// Two tests run the bundle in a child process; 5 s is not enough on a loaded runner.
describe('the bundle', { timeout: 30_000 }, () => {
  it('carries the style presets and the skill beside the entry', () => {
    expect(existsSync(join(dist, 'style-presets/default.json'))).toBe(true)
    expect(existsSync(join(dist, 'skills/frontic-ui/SKILL.md'))).toBe(true)
  })

  it('resolves the default preset from the bundled contract under dist', async () => {
    const { stylePresetPath } = await import(pathToFileURL(join(dist, 'index.js')).href)
    expect(stylePresetPath('default')).toBe(join(dist, 'style-presets/default.json'))
  })

  it('still runs as a program when invoked directly', () => {
    const help = execFileSync(process.execPath, [join(dist, 'index.js'), '--help'], { encoding: 'utf8' })
    expect(help).toContain('frontic-ui')
    expect(help).toContain('install Frontic UI items and build their look from your library')
  })
})
