import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rewriteImport } from '@/src/utils/transformers/transform-import'
import { resolveFilePath } from '@/src/utils/updaters/update-files'
import { getConfig } from '@/src/utils/get-config'

let cwd: string
beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'placement-'))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./app/*'], '~/*': ['./src/*'] } } }))
})
afterEach(() => rm(cwd, { recursive: true, force: true }))

const configWith = async (aliases: Record<string, string>) => {
  await writeFile(join(cwd, 'components.json'), JSON.stringify({ style: 'bare', tailwind: { css: 'app/assets/tailwind.css' }, aliases: { components: '@/components', ...aliases } }))
  return (await getConfig(cwd))!
}

describe('lib and composable files', () => {
  it('places a lib file under the default lib alias, resolved like an import', async () => {
    const config = await configWith({})
    expect(resolveFilePath({ path: 'lib/format.ts' }, config)).toBe(join(cwd, 'app/lib/format.ts'))
    expect(resolveFilePath({ path: 'composables/use-field-control.ts' }, config)).toBe(join(cwd, 'app/composables/use-field-control.ts'))
  })

  it('places and imports them beside the components alias when components.json names no lib alias', async () => {
    const config = await configWith({ components: '~/components' })
    expect(resolveFilePath({ path: 'lib/format.ts' }, config)).toBe(join(cwd, 'src/lib/format.ts'))
    expect(resolveFilePath({ path: 'composables/use-field-control.ts' }, config)).toBe(join(cwd, 'src/composables/use-field-control.ts'))
    expect(rewriteImport('@library/lib/format', config)).toBe('~/lib/format')
    expect(rewriteImport('@library/composables/use-field-control', config)).toBe('~/composables/use-field-control')
  })

  it('places them under the project aliases when set', async () => {
    const config = await configWith({ lib: '~/shared', composables: '~/use' })
    expect(resolveFilePath({ path: 'lib/format.ts' }, config)).toBe(join(cwd, 'src/shared/format.ts'))
    expect(resolveFilePath({ path: 'composables/use-field-control.ts' }, config)).toBe(join(cwd, 'src/use/use-field-control.ts'))
  })

  it('rewrites lib and composable imports to the project aliases', async () => {
    expect(rewriteImport('@library/lib/format', await configWith({}))).toBe('@/lib/format')
    expect(rewriteImport('@library/composables/use-field-control', await configWith({ composables: '~/use' }))).toBe('~/use/use-field-control')
  })
})
