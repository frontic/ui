// The library's typecheck: components, their composition, and one example's static data on request.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exampleFile, mainFile } from './item.mjs'
import { ASSETS_SHIM, SOURCE_SHIM } from './sourceShim.mjs'
import { installedDir } from './resolve.mjs'

const TIER_TYPES = new Set(['registry:ui', 'registry:component', 'registry:block'])
const NAME = /^[a-z0-9][a-z0-9-]*$/
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const DIAGNOSTIC = /^(.+)\((\d+),(\d+)\): error (TS\d+): (.*)$/
export const LIBRARY_TSCONFIG = fileURLToPath(new URL('./tsconfig.library.json', import.meta.url))
const vueTsc = () => path.join(installedDir('vue-tsc'), 'bin', 'vue-tsc.js')

/** The check file and the prop each of its lines assigns. */
function checkFile({ mainPath, examplePath, fromOf }, source, data) {
  const lines = []
  if (mainPath) {
    lines.push(`import type Main from ${JSON.stringify(mainPath)};`, `type MainProps = InstanceType<typeof Main>["$props"];`)
  }
  if (examplePath) {
    lines.push(`import type Example from ${JSON.stringify(examplePath)};`, `type ExampleProps = InstanceType<typeof Example>["$props"];`)
  }
  lines.push(`// @source ${source}`)
  const typeOf = (prop) => (mainPath && fromOf.get(prop) !== 'example' ? 'MainProps' : 'ExampleProps')
  const props = []
  let line = lines.length
  Object.entries(data).forEach(([prop, value], index) => {
    const name = IDENTIFIER.test(prop) ? `$${prop}` : `$${index}`
    const json = JSON.stringify(value, null, 2) ?? 'undefined'
    const statement = `export const ${name}: ${typeOf(prop)}[${JSON.stringify(prop)}] = ${json};`
    props.push({ prop, from: line + 1 })
    line += statement.split('\n').length
    lines.push(statement)
  })
  return { text: lines.join('\n') + '\n', props }
}

function propAt(props, line) {
  return props.findLast((p) => p.from <= line)?.prop ?? null
}

function runVueTsc(workDir, vueTscBin) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [vueTscBin, '-p', 'tsconfig.json', '--pretty', 'false'], {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('error', reject)
    child.on('close', (code) => resolve({ code, out }))
  })
}

function parse(output, { workDir, contentDir, checks }) {
  const problems = []
  let last = null
  for (const line of output.split('\n')) {
    const m = DIAGNOSTIC.exec(line)
    if (!m) {
      // tsc indents the elaboration of the diagnostic above.
      if (last && /^\s+\S/.test(line)) last.message += `\n${line.trim()}`
      else last = null
      continue
    }
    const file = path.resolve(workDir, m[1])
    const check = checks.get(file)
    const prop = check ? propAt(check.props, Number(m[2])) : null
    last = {
      file: check ? check.source : path.relative(contentDir, file).split(path.sep).join('/'),
      line: check ? 1 : Number(m[2]),
      column: check ? 1 : Number(m[3]),
      ruleId: m[4],
      message: prop ? `${prop}: ${m[5]}` : m[5],
    }
    problems.push(last)
  }
  return problems
}

function within(dir, parent) {
  const rel = path.relative(parent, dir)
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel))
}

// workDir is wiped each run: never a root, the content repo, or a dir holding it.
function checkWorkDir(workDir, contentDir) {
  const refuse = (why) => {
    throw new Error(`refusing workDir ${JSON.stringify(workDir)}: ${why}`)
  }
  if (typeof workDir !== 'string' || !path.isAbsolute(workDir)) refuse('not an absolute path')
  const dir = path.resolve(workDir)
  const content = path.resolve(contentDir)
  if (path.parse(dir).root === dir) refuse('a filesystem root')
  if (within(dir, content) || within(content, dir)) refuse(`overlaps the content dir ${content}`)
  return dir
}

function overrideOf(overrides) {
  if (overrides == null) return null
  const { item, example, data } = overrides
  if (!NAME.test(item ?? '') || !NAME.test(example ?? '') || !data || typeof data !== 'object') {
    throw new Error('typecheck overrides need { item, example, data }')
  }
  return { item, example, data }
}

/** `overrides` checks one example's static data against its component, for this run only.
 * `paths` maps modules the library imports from its runtime (`@frontic/specimens`) to their types; the contract's own mappings stay.
 * `workDir` holds the generated files and is wiped each run; keep it out of the content repo. */
export async function typecheckLibrary({ contentDir, workDir, overrides = null, paths = {}, vueTscBin = vueTsc() }) {
  const checkDir = checkWorkDir(workDir, contentDir)
  const override = overrideOf(overrides)
  const libraryDir = path.join(contentDir, 'library')
  const own = {
    '@library/*': [path.join(libraryDir, '*')],
    '@frontic/source': [SOURCE_SHIM],
  }
  for (const key of Object.keys(paths)) if (key in own) throw new Error(`typecheck paths: ${key} is the contract's own mapping`)
  await rm(checkDir, { recursive: true, force: true })
  await mkdir(checkDir, { recursive: true })

  const registryFile = path.join(libraryDir, 'registry.json')
  const registry = existsSync(registryFile) ? JSON.parse(await readFile(registryFile, 'utf8')) : { items: [] }
  const checks = new Map()
  let overridden = false
  for (const item of registry.items ?? []) {
    if (!TIER_TYPES.has(item?.type) || !NAME.test(item.name ?? '')) continue
    const existing = (rel) => (rel && existsSync(path.join(libraryDir, rel)) ? path.join(libraryDir, rel) : null)
    const mainPath = existing(mainFile(item))
    const examplePath = existing(exampleFile(item))
    if (!mainPath && !examplePath) continue
    if (override?.item !== item.name || Object.keys(override.data).length === 0) continue
    overridden = true
    const fromOf = new Map((item.meta?.frontic?.props ?? []).map((p) => [p.name, p.from]))
    const source = `examples/${override.item}/${override.example}`
    const { text, props } = checkFile({ mainPath, examplePath, fromOf }, source, override.data)
    const file = path.join(checkDir, `${item.name}.${override.example}.check.ts`)
    await writeFile(file, text)
    checks.set(file, { source, props })
  }
  if (override && !overridden && Object.keys(override.data).length > 0) {
    throw new Error(`no library item ${override.item} to check`)
  }

  const generatedTypes = path.join(contentDir, '.frontic', 'generated-types.d.ts')
  const tsconfig = {
    extends: LIBRARY_TSCONFIG,
    compilerOptions: {
      noEmit: true,
      paths: { ...paths, ...own },
    },
    // Spelled out: `**` skips dot-dirs, so the generated types never match a glob.
    include: [path.join(libraryDir, '**/*.vue'), path.join(libraryDir, '**/*.ts'), ...(existsSync(generatedTypes) ? [generatedTypes] : []), ASSETS_SHIM, '*.check.ts'],
  }
  await writeFile(path.join(checkDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2) + '\n')

  const { code, out } = await runVueTsc(workDir, vueTscBin)
  const problems = parse(out, { workDir, contentDir, checks })
  if (code !== 0 && problems.length === 0 && !/\bTS18003\b/.test(out)) {
    throw new Error(`vue-tsc exited ${code}: ${out.trim().split('\n')[0] ?? ''}`)
  }
  return { problems }
}
