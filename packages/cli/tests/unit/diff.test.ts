import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { installedItems } from '@/src/commands/diff'
import { getConfig } from '@/src/utils/get-config'

let cwd: string
beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'diff-'))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./*'] } } }))
  await writeFile(join(cwd, 'components.json'), JSON.stringify({ style: 'bare', tailwind: { css: 'assets/css/tailwind.css' }, aliases: { components: '@/components' } }))
})
afterEach(() => rm(cwd, { recursive: true, force: true }))

it('checks the installed ui folders, lib files and composable files', async () => {
  await mkdir(join(cwd, 'components/ui/button'), { recursive: true })
  await mkdir(join(cwd, 'lib'), { recursive: true })
  await writeFile(join(cwd, 'lib/format.ts'), 'export {}\n')
  await mkdir(join(cwd, 'composables'), { recursive: true })
  await writeFile(join(cwd, 'composables/use-field-control.ts'), 'export {}\n')
  const index = [
    { name: 'button', type: 'registry:ui' },
    { name: 'badge', type: 'registry:ui' },
    { name: 'format', type: 'registry:lib' },
    { name: 'cart', type: 'registry:lib' },
    { name: 'use-field-control', type: 'registry:composable' },
  ] as const
  expect(installedItems([...index], (await getConfig(cwd))!)).toEqual(['button', 'format', 'use-field-control'])
})
