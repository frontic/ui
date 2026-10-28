import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { addDependency } from 'nypm'
import prompts from 'prompts'
import { x } from 'tinyexec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NUXT_PROJECT } from '@/src/project-config'
import { addAliasToTsconfig, addTailwindToNuxtConfig, addTailwindToViteConfig, createProject, importTailwindInMain } from '@/src/utils/create-project'
import { getTailwindCssFile } from '@/src/utils/get-project-info'

vi.mock('nypm', () => ({ addDependency: vi.fn(async () => {}), detectPackageManager: vi.fn(async () => ({ name: 'npm' })) }))
vi.mock('prompts', () => ({ default: vi.fn() }))
vi.mock('tinyexec', () => ({ x: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '' })) }))

// What `npm create vite@latest -- --template vue-ts` and `nuxi init --template minimal` write today.
const VITE_CONFIG = `import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
})
`

const TSCONFIG = `{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
`

const TSCONFIG_APP = `{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": ["vite/client"],
    "allowArbitraryExtensions": true,

    /* Linting */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
`

const MAIN_TS = `import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
`

const NUXT_CONFIG = `// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
`

/** The tsconfig as TypeScript reads it: the template's comment lines and trailing commas dropped. */
const parseJsonc = (source: string) => JSON.parse(source.replace(/^\s*\/\*.*\*\/\s*$/gm, '').replace(/,(\s*[}\]])/g, '$1'))

describe('addTailwindToViteConfig', () => {
  it('imports the plugin, registers it and aliases @ to src', () => {
    const result = addTailwindToViteConfig(VITE_CONFIG)

    expect(result).toMatch(/^import tailwindcss from '@tailwindcss\/vite'\n/)
    expect(result).toContain("import { fileURLToPath, URL } from 'node:url'")
    expect(result).toContain('plugins: [vue(), tailwindcss()],')
    expect(result).toContain("resolve: {\n    alias: {\n      '@': fileURLToPath(new URL('./src', import.meta.url)),\n    },\n  },")
    expect(result).toContain("import vue from '@vitejs/plugin-vue'")
  })

  it('refuses a config without the vue plugin list', () => {
    expect(() => addTailwindToViteConfig('export default {}\n')).toThrow(/plugins: \[vue\(\)\]/)
  })
})

describe('addAliasToTsconfig', () => {
  it('adds compilerOptions.paths to a solution tsconfig that has none', () => {
    const result = addAliasToTsconfig(TSCONFIG)

    expect(parseJsonc(result)).toEqual({ compilerOptions: { paths: { '@/*': ['./src/*'] } }, files: [], references: [{ path: './tsconfig.app.json' }, { path: './tsconfig.node.json' }] })
  })

  it('adds paths to existing compilerOptions and keeps the rest of the file', () => {
    const result = addAliasToTsconfig(TSCONFIG_APP)

    const parsed = parseJsonc(result)
    expect(parsed.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(parsed.compilerOptions.baseUrl).toBeUndefined()
    expect(parsed.compilerOptions.noUnusedLocals).toBe(true)
    expect(parsed.include).toEqual(['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'])
    expect(result).toContain('/* Linting */')
  })

  it('refuses a tsconfig that already has paths', () => {
    expect(() => addAliasToTsconfig('{ "compilerOptions": { "paths": {} } }')).toThrow(/paths/)
  })

  it('refuses a file that is not an object', () => {
    expect(() => addAliasToTsconfig('[]')).toThrow(/\{/)
  })
})

describe('importTailwindInMain', () => {
  it('imports the tailwind stylesheet in place of the template stylesheet', () => {
    expect(importTailwindInMain(MAIN_TS)).toBe(`import { createApp } from 'vue'
import './assets/css/tailwind.css'
import App from './App.vue'

createApp(App).mount('#app')
`)
  })

  it('refuses an entry without the template stylesheet import', () => {
    expect(() => importTailwindInMain("import { createApp } from 'vue'\n")).toThrow(/style\.css/)
  })
})

describe('addTailwindToNuxtConfig', () => {
  it('imports the plugin, registers it and lists the stylesheet', () => {
    const result = addTailwindToNuxtConfig(NUXT_CONFIG)

    expect(result).toBe(`import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/tailwind.css'],
  vite: { plugins: [tailwindcss()] },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
`)
  })

  it('refuses a config without defineNuxtConfig', () => {
    expect(() => addTailwindToNuxtConfig('export default {}\n')).toThrow(/defineNuxtConfig\(\{/)
  })
})

const tty = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
const setTty = (value: boolean) => Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })

describe('createProject', () => {
  let cwd: string

  /** The scaffold the mocked generator leaves behind: the vue-ts template for npm create vite, the minimal template for nuxi init. */
  async function scaffoldOnRun() {
    vi.mocked(x).mockImplementation((async (command: string, args: string[], options: { nodeOptions: { cwd: string } }) => {
      const dir = resolve(options.nodeOptions.cwd, args[2] ?? '')
      if (command === 'npm' && args[0] === 'create') {
        await mkdir(join(dir, 'src/assets'), { recursive: true })
        await writeFile(join(dir, 'package.json'), '{ "name": "shop", "private": true }\n')
        await writeFile(join(dir, 'vite.config.ts'), VITE_CONFIG)
        await writeFile(join(dir, 'tsconfig.json'), TSCONFIG)
        await writeFile(join(dir, 'tsconfig.app.json'), TSCONFIG_APP)
        await writeFile(join(dir, 'src/main.ts'), MAIN_TS)
        await writeFile(join(dir, 'src/style.css'), ':root { color: red }\n')
        await mkdir(join(dir, 'src/components'), { recursive: true })
        await mkdir(join(dir, 'public'), { recursive: true })
        await writeFile(join(dir, 'src/App.vue'), '<script setup lang="ts">\nimport HelloWorld from \'./components/HelloWorld.vue\'\n</script>\n\n<template>\n  <HelloWorld />\n</template>\n')
        await writeFile(join(dir, 'src/components/HelloWorld.vue'), '<template><section id="center" class="hero" /></template>\n')
        for (const asset of ['src/assets/hero.png', 'src/assets/vite.svg', 'src/assets/vue.svg', 'public/icons.svg', 'public/favicon.svg']) await writeFile(join(dir, asset), '')
      }
      if (command === 'npx' && args[1] === 'init') {
        await mkdir(join(dir, 'app'), { recursive: true })
        await writeFile(join(dir, 'package.json'), '{ "name": "shop", "private": true }\n')
        await writeFile(join(dir, 'nuxt.config.ts'), NUXT_CONFIG)
        await writeFile(join(dir, 'app/app.vue'), '<template><div /></template>\n')
      }
      return { exitCode: 0, stdout: '', stderr: '' }
    }) as never)
  }

  const read = (file: string) => readFile(join(cwd, 'shop', file), 'utf8')

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-create-project-'))
    await scaffoldOnRun()
  })

  afterEach(async () => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    if (tty) Object.defineProperty(process.stdin, 'isTTY', tty)
    else delete (process.stdin as { isTTY?: boolean }).isTTY
    await rm(cwd, { recursive: true, force: true })
  })

  it('finishes the vite template as a tailwind v4 project', async () => {
    const result = await createProject({ cwd, name: 'shop', template: 'vite', force: true })

    expect(result).toEqual({ projectPath: join(cwd, 'shop'), projectName: 'shop', template: 'vite' })
    expect(x).toHaveBeenCalledWith('npm', ['create', 'vite@latest', 'shop', '--', '--template', 'vue-ts'], { nodeOptions: { cwd }, throwOnError: true })
    expect(addDependency).toHaveBeenCalledTimes(1)
    expect(addDependency).toHaveBeenCalledWith(['tailwindcss', '@tailwindcss/vite'], { cwd: join(cwd, 'shop'), packageManager: 'npm', dev: true, silent: true })
    expect(await read('vite.config.ts')).toContain('plugins: [vue(), tailwindcss()]')
    expect(parseJsonc(await read('tsconfig.json')).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(parseJsonc(await read('tsconfig.app.json')).compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(await read('src/main.ts')).toContain("import './assets/css/tailwind.css'")
    expect(await read('src/assets/css/tailwind.css')).toBe('@import "tailwindcss";\n')
    expect(existsSync(join(cwd, 'shop/src/style.css'))).toBe(false)
  })

  it('drops the vite template demo, so a fresh project passes check', async () => {
    await createProject({ cwd, name: 'shop', template: 'vite', force: true })

    for (const file of ['src/components/HelloWorld.vue', 'src/assets/hero.png', 'src/assets/vite.svg', 'src/assets/vue.svg', 'public/icons.svg'])
      expect(existsSync(join(cwd, 'shop', file)), file).toBe(false)
    expect(existsSync(join(cwd, 'shop/public/favicon.svg'))).toBe(true)
    expect(await read('src/App.vue')).toBe('<template>\n  <main />\n</template>\n')
  })

  it('takes the template and the default name without a terminal, without asking', async () => {
    setTty(false)
    const result = await createProject({ cwd, template: 'vite', force: false })

    expect(prompts).not.toHaveBeenCalled()
    expect(result).toEqual({ projectPath: join(cwd, 'my-app'), projectName: 'my-app', template: 'vite' })
  })

  it('needs --template without a terminal', async () => {
    setTty(false)
    await expect(createProject({ cwd, force: false })).rejects.toThrow('--template is required without a terminal. Available templates: nuxt, vite, vite-router')
    expect(prompts).not.toHaveBeenCalled()
  })

  it('asks for the template and the name on a terminal', async () => {
    setTty(true)
    vi.mocked(prompts).mockResolvedValueOnce({ type: 'vite', name: 'shop' })
    const result = await createProject({ cwd, force: false })

    expect(prompts).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ projectPath: join(cwd, 'shop'), projectName: 'shop', template: 'vite' })
  })

  it('adds vue-router for the vite-router template', async () => {
    await createProject({ cwd, name: 'shop', template: 'vite-router', force: true })

    expect(addDependency).toHaveBeenCalledWith(['vue-router'], { cwd: join(cwd, 'shop'), packageManager: 'npm', dev: false, silent: true })
    expect(addDependency).toHaveBeenCalledWith(['tailwindcss', '@tailwindcss/vite'], { cwd: join(cwd, 'shop'), packageManager: 'npm', dev: true, silent: true })
    expect(await read('src/assets/css/tailwind.css')).toBe('@import "tailwindcss";\n')
  })

  it('finishes the nuxt template as a tailwind v4 project under app/', async () => {
    const result = await createProject({ cwd, name: 'shop', template: 'nuxt', force: true })

    expect(result.template).toBe('nuxt')
    expect(x).toHaveBeenCalledWith('npx', ['nuxi', 'init', 'shop', '--template', 'minimal', '--packageManager', 'npm', '--no-gitInit', '--no-install'], { nodeOptions: { cwd }, throwOnError: true })
    expect(addDependency).toHaveBeenCalledWith(['tailwindcss', '@tailwindcss/vite', 'typescript@^6'], { cwd: join(cwd, 'shop'), packageManager: 'npm', dev: true, silent: true })
    expect(await read('nuxt.config.ts')).toContain("css: ['~/assets/css/tailwind.css']")
    expect(await read('nuxt.config.ts')).toContain('vite: { plugins: [tailwindcss()] }')
    expect(await read('app/assets/css/tailwind.css')).toBe('@import "tailwindcss";\n')
    expect(await getTailwindCssFile(join(cwd, 'shop'))).toBe(NUXT_PROJECT.tailwindCssFile)
  })

  it('writes the nuxt stylesheet at the root without an app/ directory', async () => {
    vi.mocked(x).mockImplementation((async (_command: string, args: string[], options: { nodeOptions: { cwd: string } }) => {
      if (args[1] === 'init') {
        const dir = resolve(options.nodeOptions.cwd, args[2]!)
        await mkdir(dir, { recursive: true })
        await writeFile(join(dir, 'package.json'), '{ "name": "shop", "private": true }\n')
        await writeFile(join(dir, 'nuxt.config.ts'), NUXT_CONFIG)
      }
      return { exitCode: 0, stdout: '', stderr: '' }
    }) as never)

    await createProject({ cwd, name: 'shop', template: 'nuxt', force: true })

    expect(await read('assets/css/tailwind.css')).toBe('@import "tailwindcss";\n')
    expect(existsSync(join(cwd, 'shop/app'))).toBe(false)
  })

  it('only announces the packages under FRONTIC_SKIP_INSTALL', async () => {
    vi.stubEnv('FRONTIC_SKIP_INSTALL', '1')

    await createProject({ cwd, name: 'shop', template: 'vite-router', force: true })

    expect(addDependency).not.toHaveBeenCalled()
    expect(await read('src/assets/css/tailwind.css')).toBe('@import "tailwindcss";\n')
  })

  it('names the file when a generated config has no anchor', async () => {
    vi.mocked(x).mockImplementation((async (_command: string, args: string[], options: { nodeOptions: { cwd: string } }) => {
      const dir = resolve(options.nodeOptions.cwd, args[2]!)
      await mkdir(join(dir, 'src'), { recursive: true })
      await writeFile(join(dir, 'package.json'), '{}\n')
      await writeFile(join(dir, 'vite.config.ts'), 'export default {}\n')
      return { exitCode: 0, stdout: '', stderr: '' }
    }) as never)

    await expect(createProject({ cwd, name: 'shop', template: 'vite', force: true })).rejects.toThrow(/vite\.config\.ts/)
  })
})
