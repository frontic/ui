import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { preFlightAdd } from '@/src/preflights/preflight-add'
import * as ERRORS from '@/src/utils/errors'
import { getTailwindBelowFloor, getTsConfigAliasPrefix } from '@/src/utils/get-project-info'

let cwd: string

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-project-info-'))
})

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true })
})

describe('getTsConfigAliasPrefix', () => {
  it('reads the alias from a vite tsconfig', async () => {
    await writeFile(join(cwd, 'package.json'), '{}')
    await writeFile(join(cwd, 'vite.config.ts'), 'export default {}\n')
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }))

    expect(await getTsConfigAliasPrefix(cwd)).toBe('@')
  })

  it('reads the alias nuxt 4 writes to .nuxt/tsconfig.app.json, where paths point out of .nuxt', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ dependencies: { nuxt: '^4.6.1' } }))
    await writeFile(join(cwd, 'nuxt.config.ts'), 'export default defineNuxtConfig({})\n')
    await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ files: [], references: [{ path: './.nuxt/tsconfig.app.json' }] }))
    await mkdir(join(cwd, '.nuxt'))
    await writeFile(
      join(cwd, '.nuxt/tsconfig.app.json'),
      JSON.stringify({ compilerOptions: { paths: { '@nuxt/devtools': ['../node_modules/@nuxt/devtools'], '~': ['../app'], '~/*': ['../app/*'], '@': ['../app'], '@/*': ['../app/*'] } } }),
    )

    expect(await getTsConfigAliasPrefix(cwd)).toBe('~')
  })
})

const installTailwind = async (dir: string, version: string) => {
  await mkdir(join(dir, 'node_modules/tailwindcss'), { recursive: true })
  await writeFile(join(dir, 'node_modules/tailwindcss/package.json'), JSON.stringify({ name: 'tailwindcss', version }))
}

describe('getTailwindBelowFloor', () => {
  it('reports an installed release below the floor, whatever package.json allows', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '^4.3.0' } }))
    await installTailwind(cwd, '4.1.18')

    expect(getTailwindBelowFloor(cwd)).toBe('4.1.18')
  })

  it('trusts an installed release at the floor over an older range', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '^4.1.0' } }))
    await installTailwind(cwd, '4.3.3')

    expect(getTailwindBelowFloor(cwd)).toBeNull()
  })

  it('finds the release a workspace hoisted to its root', async () => {
    const app = join(cwd, 'apps/web')
    await mkdir(app, { recursive: true })
    await writeFile(join(app, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '^4.1.0' } }))
    await installTailwind(cwd, '4.1.18')

    expect(getTailwindBelowFloor(app)).toBe('4.1.18')
  })

  it('reports a range that cannot reach the floor, before an install', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '~4.1.0' } }))

    expect(getTailwindBelowFloor(cwd)).toBe('~4.1.0')
  })

  it('lets a range that can reach the floor through, before an install', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '^4.1.0' } }))

    expect(getTailwindBelowFloor(cwd)).toBeNull()
  })

  it('is null without tailwindcss, as with only the Nuxt module', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { '@nuxtjs/tailwindcss': '^7.0.0' } }))

    expect(getTailwindBelowFloor(cwd)).toBeNull()
  })
})

describe('preFlightAdd', () => {
  it('refuses a Tailwind CSS older than 4.3, whose missing inset-s/inset-e would drop positions silently', async () => {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ devDependencies: { tailwindcss: '^4.1.0' } }))
    await writeFile(join(cwd, 'components.json'), '{}')
    await installTailwind(cwd, '4.1.18')

    const { errors, tailwindBelowFloor } = await preFlightAdd({ cwd })
    expect([errors[ERRORS.TAILWIND_OUTDATED], tailwindBelowFloor]).toEqual([true, '4.1.18'])
  })
})
