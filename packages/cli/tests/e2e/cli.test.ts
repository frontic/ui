import { spawn } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { itemManifestText, recipeFileText } from '@frontic/library-contract/recipe'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const cli = resolve(import.meta.dirname, '../..')
const bin = join(cli, 'dist/index.js')
const registry = resolve(cli, '../registry/public/v1')

let server: Server
let registryUrl: string
let cwd: string

/** Serves the built registry as the static site the client reads: every path is a file under public/v1, anything else, and any path in `hidden`, is 404. */
function serveRegistry(hidden: string[] = []) {
  return createServer((request, response) => {
    const path = new URL(request.url!, 'http://registry').pathname
    const file = resolve(registry, `.${path}`)
    if (hidden.includes(path) || !file.startsWith(registry) || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'content-type': file.endsWith('.json') ? 'application/json' : 'text/plain' }).end(readFileSync(file))
  })
}

/** The CLI as a user runs it: the bundle in a child process, reading the local registry and announcing installs instead of running them. The child is awaited, not blocked on, so the server in this process can answer it. */
function run(...args: string[]) {
  return runAt(registryUrl, ...args)
}

function runAt(url: string, ...args: string[]) {
  return new Promise<{ status: number | null; stdout: string; output: string }>((done) => {
    const child = spawn(process.execPath, [bin, ...args, '--cwd', cwd], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...inherited, REGISTRY_URL: url, FRONTIC_SKIP_INSTALL: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
      timeout: 50_000,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk))
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk))
    child.on('close', (status) => done({ status, stdout, output: `${stdout}${stderr}` }))
  })
}

const read = (file: string) => readFileSync(join(cwd, file), 'utf8')

// Under NODE_ENV=test or TEST, which vitest sets, consola drops the log lines the commands report with.
const { NODE_ENV: _nodeEnv, TEST: _test, ...inherited } = process.env

beforeAll(async () => {
  server = serveRegistry()
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  registryUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`

  cwd = await mkdtemp(join(tmpdir(), 'frontic-ui-e2e-'))
  await writeFile(join(cwd, 'package.json'), JSON.stringify({ name: 'shop', private: true, devDependencies: { tailwindcss: '^4.3.0', typescript: '^5.7.2', vite: '^7.0.0' } }, null, 2))
  await writeFile(join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['./src/*'] } } }))
  await writeFile(join(cwd, 'vite.config.ts'), 'export default {}\n')
  await mkdir(join(cwd, 'src/assets/css'), { recursive: true })
  await writeFile(join(cwd, 'src/assets/css/tailwind.css'), '@import "tailwindcss";\n')
})

afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()))
  await rm(cwd, { recursive: true, force: true })
})

// Each test spawns the built CLI; 5 s is not enough on a loaded runner.
describe('the CLI against the built registry', { timeout: 30_000 }, () => {
  it('init writes the project files and names the base packages', async () => {
    const { status, output } = await run('init', '-d', '-y')
    expect(output).toContain('Would install: reka-ui, class-variance-authority, @lucide/vue')
    expect(output).toContain('Would install (dev): tw-animate-css')
    expect(status).toBe(0)

    expect(JSON.parse(read('components.json'))).toMatchObject({ style: 'bare', tailwind: { css: 'src/assets/css/tailwind.css' }, iconLibrary: 'lucide', library: 'library' })
    expect(existsSync(join(cwd, 'library/brand.json'))).toBe(true)
    expect(read('library/DESIGN.md')).not.toContain('components:')
    expect(existsSync(join(cwd, 'library/recipes'))).toBe(true)
    expect(read('src/assets/css/frontic.css')).toContain('@theme')
    expect(read('src/assets/css/tailwind.css')).toBe('@import "tailwindcss";\n@import "./frontic.css";\n')
  })

  it('add button installs the source, its recipes and the utilities, without the demo', async () => {
    const { status, output } = await run('add', 'button')
    expect(output).toMatch(/Would install: (class-variance-authority, reka-ui|reka-ui, class-variance-authority)/)
    expect(status).toBe(0)

    expect(existsSync(join(cwd, 'src/components/ui/button/Button.vue'))).toBe(true)
    expect(existsSync(join(cwd, 'src/components/ui/button/index.ts'))).toBe(true)
    expect(existsSync(join(cwd, 'src/components/ui/button/button.example.vue'))).toBe(false)
    expect(JSON.parse(read('src/components/ui/button/button.json'))).toMatchObject({
      $schema: 'https://registry.ui.frontic.com/item.schema.json',
      title: 'Button',
      recipes: { button: { base: { extends: 'action' } } },
    })
    expect(JSON.parse(read('library/recipes/action.json'))).toMatchObject({ $schema: 'https://registry.ui.frontic.com/recipe.schema.json', action: expect.any(Object) })
    expect(existsSync(join(cwd, 'library/recipes/shared'))).toBe(false)
    expect(existsSync(join(cwd, 'library/recipes/button.json'))).toBe(false)
    expect(read('library/DESIGN.md')).not.toContain('components:')
    expect(read('src/assets/css/frontic.css')).toContain('@utility fui-button')
    expect(read('src/assets/css/tailwind.css')).toContain('@import "./frontic.css";')
  })

  it('add dialog installs what its files import, not what its example uses', async () => {
    const { status } = await run('add', 'dialog')
    expect(status).toBe(0)

    expect(existsSync(join(cwd, 'src/components/ui/dialog/Dialog.vue'))).toBe(true)
    expect(read('src/lib/focus.ts')).toContain('export function usingKeyboard')
    for (const name of ['field', 'input', 'native-select', 'switch']) expect(existsSync(join(cwd, `src/components/ui/${name}`))).toBe(false)
  })

  it('build finds the stylesheet current and names the font packages', async () => {
    const { status, output } = await run('build')
    expect(output).toContain('frontic.css is current')
    expect(output).toContain('Would install: @fontsource-variable/inter')
    expect(status).toBe(0)
  })

  it('add card accordion writes each manifest beside its files as served, and build drops card once its folder is gone', async () => {
    expect((await run('add', 'card', 'accordion', '--yes')).status).toBe(0)
    for (const name of ['card', 'accordion']) {
      const served = JSON.parse(readFileSync(join(registry, `${name}.json`), 'utf8'))
      expect(read(`src/components/ui/${name}/${name}.json`)).toBe(itemManifestText({ title: served.title, description: served.description, recipes: served.recipes }))
    }
    expect(read('src/assets/css/frontic.css')).toContain('@utility fui-card {')
    await rm(join(cwd, 'src/components/ui/card'), { recursive: true })
    const { status, output } = await run('build')
    expect(output).toContain('Wrote src/assets/css/frontic.css')
    expect(status).toBe(0)
    expect(read('src/assets/css/frontic.css')).not.toContain('@utility fui-card {')
    expect(read('src/assets/css/frontic.css')).toContain('@utility fui-accordion {')
  }, 60_000)

  it('build and check name a recipe file of the layout before 1.0 and the add to run', async () => {
    await writeFile(join(cwd, 'library/recipes/accordion.json'), recipeFileText(JSON.parse(read('src/components/ui/accordion/accordion.json')).recipes))
    try {
      for (const command of ['build', 'check']) {
        const { status, output } = await run(command)
        expect(output, command).toContain('library/recipes/accordion.json: holds the component tree')
        expect(output, command).toMatch(/run `?npx @frontic\/ui add accordion`? again/)
        expect(status, command).toBe(1)
      }
    } finally {
      await rm(join(cwd, 'library/recipes/accordion.json'))
    }
  }, 60_000)

  it('check runs from the bundle', async () => {
    await writeFile(join(cwd, 'src/App.vue'), '<template>\n  <Button>{{ $t("buy") }}</Button>\n</template>\n')
    const clean = await run('check')
    expect(clean.output).toContain('check: 0 errors, 0 warnings in')
    expect(clean.status).toBe(0)
    await writeFile(join(cwd, 'src/App.vue'), '<template>\n  <div class="bg-blue-500" />\n</template>\n')
    const drift = await run('check')
    expect(drift.stdout).toContain('drift')
    expect(drift.status).toBe(1)
    await rm(join(cwd, 'src/App.vue'))
  }, 60_000)

  it('info --json reports the project', async () => {
    const { status, stdout } = await run('info', '--json')
    expect(status).toBe(0)
    expect(JSON.parse(stdout)).toMatchObject({
      framework: 'vite',
      library: 'library',
      brand: true,
      design: true,
      installed: ['accordion', 'button', 'dialog'],
      stylesheet: 'current',
      contrast: expect.any(Array),
    })
  })

  it('docs button prints its markdown, view button its registry record', async () => {
    const docs = await run('docs', 'button')
    expect(docs.status).toBe(0)
    expect(docs.stdout).toMatch(/^---\nname: button\n[\s\S]*?\n---\n\n# Button\n/)
    expect(docs.stdout).toContain('npx @frontic/ui add button')
    expect(docs.stdout).toContain('## Examples')
    const view = await run('view', 'button')
    expect(view.status).toBe(0)
    expect(JSON.parse(view.stdout)).toMatchObject([{ name: 'button', type: 'registry:ui', files: expect.any(Array) }])
  })

  it('docs still prints an item whose example uses an item the registry cannot serve, leaving out only that item’s API', async () => {
    const full = await run('docs', 'dialog')
    expect(full.stdout).toContain('## API of the items the example uses\n\n### Button\n')
    const partial = serveRegistry(['/field.json'])
    await new Promise<void>((done) => partial.listen(0, '127.0.0.1', done))
    try {
      const docs = await runAt(`http://127.0.0.1:${(partial.address() as AddressInfo).port}`, 'docs', 'dialog')
      expect(docs.status).toBe(0)
      expect(docs.stdout).toContain('\n# Dialog\n')
      expect(docs.stdout).toContain('\n### Button\n')
      expect(docs.stdout).not.toContain('\n### Field\n')
    } finally {
      partial.close()
    }
  })

  it('search button --json finds it', async () => {
    const { status, stdout } = await run('search', 'button', '--json')
    expect(status).toBe(0)
    expect(JSON.parse(stdout).items.map((item: { name: string }) => item.name)).toContain('button')
  })

  it('mcp and skills without --client and without a terminal name the flag instead of prompting', async () => {
    for (const command of ['mcp', 'skills']) {
      const result = await run(command)
      expect(result.status, command).not.toBe(0)
      expect(result.output, command).toContain('--client is required without a terminal. Available clients: claude, cursor, vscode, codex, opencode')
    }
  })

  it('mcp and skill write the client files', async () => {
    expect((await run('mcp', '--client', 'cursor')).status).toBe(0)
    expect((await run('skills', '--client', 'cursor')).status).toBe(0)
    expect(JSON.parse(read('.cursor/mcp.json')).mcpServers['frontic-ui']).toMatchObject({ command: 'npx' })
    expect(read('.cursor/skills/frontic-ui/SKILL.md')).toBe(readFileSync(join(cli, 'dist/skills/frontic-ui/SKILL.md'), 'utf8'))
    expect(read('.cursor/skills/design-system/SKILL.md')).toBe(readFileSync(join(cli, 'dist/skills/design-system/SKILL.md'), 'utf8'))
    expect(read('.cursor/skills/frontic-ui-review/SKILL.md')).toBe(readFileSync(join(cli, 'dist/skills/frontic-ui-review/SKILL.md'), 'utf8'))
    expect((await run('skill', '--client', 'codex')).status).toBe(0)
    expect(existsSync(join(cwd, '.codex/skills/design-system/SKILL.md'))).toBe(true)
  })
})
