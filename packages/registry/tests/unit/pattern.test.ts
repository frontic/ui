import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { composesOf } from '@frontic/library-contract/recipe'
import { afterAll, describe, expect, it } from 'vitest'
import { buildRegistry } from '../../scripts/build'

describe('the pattern items', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pattern-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))
  const served = await buildRegistry({ out: join(dir, 'r') })
  const item = (name: string) => served.find((i) => i.name === name)!

  it('serve their demo, their packages and no registry dependency', () => {
    for (const name of ['button', 'badge', 'input', 'textarea']) {
      expect(
        item(name)
          .files.filter((f) => f.type === 'registry:example')
          .map((f) => f.path),
      ).toEqual([`components/ui/${name}/${name}.example.vue`])
      expect(item(name).registryDependencies).toBeUndefined()
    }
    expect(item('button').dependencies).toEqual(['class-variance-authority', 'reka-ui'])
    expect(item('input').dependencies).toEqual(['@vueuse/core', 'class-variance-authority', 'reka-ui'])
  })

  it('own their tree and compose the shared states', () => {
    expect(composesOf(item('button'))).toEqual(['focus-ring', 'disabled', 'invalid'])
    expect(composesOf(item('badge'))).toEqual([])
    expect(composesOf(item('input'))).toEqual(['disabled'])
    expect(composesOf(item('textarea'))).toEqual(['disabled'])
    for (const name of ['button', 'badge', 'input', 'textarea']) expect(Object.keys(item(name).recipes)).toEqual([name])
  })

  it('serve their tree as authored and share every family it uses, a value’s states inside it', () => {
    expect(Object.keys(item('button').library!.recipes)).toEqual(['action', 'disabled', 'focus-ring', 'invalid'])
    expect(item('button').recipes.button).toMatchObject({ base: { extends: 'action' }, variants: { variant: { link: { textDecorationLine: 'underline' } } } })
    expect(item('badge').recipes.badge).toMatchObject({ variants: { variant: { neutral: { hover: { textColor: '{colors.foreground/70}' } } } } })
    expect(Object.keys(item('input').library!.recipes)).toEqual(['control', 'control-line', 'disabled'])
    expect(Object.keys(item('textarea').library!.recipes)).toEqual(['control', 'disabled'])
    expect(item('input').library!.recipes.control).toMatchObject({
      typography: '{typography.control}',
      borderColor: 'transparent',
      borderBottomColor: '{colors.input}',
      focus: { borderBottom: '{border.focus}' },
      invalid: { borderBottomColor: '{colors.destructive}' },
    })
    expect(item('input-group').recipes['input-group']).toMatchObject({ base: { focusWithin: { borderBottom: '{border.focus}' } } })
    expect(item('input').library!.recipes['control-line']).toMatchObject({
      file: { backgroundColor: 'transparent', border: 'none', textColor: '{colors.foreground}', typography: '{typography.ui}' },
    })
  })
})
