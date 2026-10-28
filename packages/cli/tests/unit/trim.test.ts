import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { create } from '@/src/commands/create'
import { init } from '@/src/commands/init'

const cli = join(import.meta.dirname, '../..')

describe('the trimmed CLI', () => {
  it('has no shadcn registry machinery, presets, templates or subpath exports', () => {
    for (const path of ['src/registry', 'src/presets', 'src/migrations', 'src/templates', 'src/styles', 'src/utils/registries.ts', 'src/utils/env-loader.ts', 'src/utils/updaters/update-css-vars.ts'])
      expect(existsSync(join(cli, path)), path).toBe(false)
    expect(Object.keys(JSON.parse(readFileSync(join(cli, 'package.json'), 'utf8')).exports)).toEqual(['.', './tailwind.css'])
  })

  it('registers no preset, style, base colour, palette, colour, css-variables or dark-mode option', () => {
    const colours = ['buy', 'checkout', 'promo', 'discount', 'new', 'price', 'active', 'info', 'positive', 'warning', 'theme'].map((token) => `--${token}-color`)
    const gone = ['--preset', '--style', '--base', '--base-color', '--font', '--color-palette', '--css-variables', '--dark-mode', '--rtl', '--monorepo', ...colours]
    for (const command of [init, create]) {
      const flags = command.options.flatMap((option) => [option.long, option.short])
      for (const flag of gone) expect(flags, `${command.name()} ${flag}`).not.toContain(flag)
    }
  })
})
