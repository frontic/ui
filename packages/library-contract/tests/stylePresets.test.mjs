import { compile } from 'tailwindcss'
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { BRAND_STYLES, brandReferenceProblems, fontPackages, renderBaseCss, resolveBrand, stylePresetPath, stylePresets } from '../src/brand.mjs'
import { textStepProblems } from '../src/recipe.mjs'

const PACKAGE = path.resolve(import.meta.dirname, '..')
const PRESET_TOKENS = [
  ...['sm', 'md', 'lg', 'xl', '2xl'].map((at) => `breakpoint.${at}`),
  'font.family.mono',
  ...['normal', 'medium', 'semibold'].map((weight) => `font.weight.${weight}`),
  'color.surface.popover',
  'color.surface.popover-foreground',
]
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const preset = (name) => ({ $extensions: { 'com.frontic.brand': { version: 2, spec: '2025.10', name, generatedAt: '' } } })

test('SP-1 default is the first preset and the rest follow by id', () => {
  const presets = stylePresets()
  assert.ok(Object.isFrozen(presets) && presets.every(Object.isFrozen))
  assert.equal(presets[0].id, 'default')
  assert.equal(presets[0].name, 'Default')
  const rest = presets.slice(1).map((p) => p.id)
  assert.deepEqual(rest, [...rest].sort())
  assert.ok(presets.some((p) => p.id === 'basecamp-style' && p.name === 'Basecamp style'))
})

test('SP-2 stylePresetPath resolves a known id and throws on an unknown one', () => {
  assert.equal(stylePresetPath('default'), stylePresets()[0].path)
  assert.throws(() => stylePresetPath('nope'), /unknown style preset: nope/)
})

for (const { id, path: file } of stylePresets()) {
  test(`SP-3 ${id} passes the brand checks and builds in every scope`, async () => {
    const brand = read(file)
    assert.deepEqual(textStepProblems(brand.text), [])
    for (const scope of ['experience', 'root', 'project']) renderBaseCss(brand, {}, { scope })
    const css = (await compile(`${renderBaseCss(brand).replace(/^@import[^;]*;\n?/gm, '')}\n@tailwind utilities;\n`)).build(['text-heading', 'text-control', 'shadow-xs', 'bg-primary'])
    for (const utility of ['text-heading', 'text-control', 'shadow-xs', 'bg-primary']) assert.match(css, new RegExp(`\\.${utility} \\{`))
  })

  test(`SP-4 ${id} carries every text style, border, ring, opacity and shadow the generic recipes may name`, () => {
    const brand = read(file)
    for (const group of ['text', 'border', 'ring', 'opacity', 'shadow']) {
      for (const name of Object.keys(BRAND_STYLES[group])) assert.ok(brand[group]?.[name], `${id} lacks ${group}.${name}`)
    }
  })

  test(`SP-8 ${id} carries the breakpoints, mono family, weights and popover colours the brand editor reads`, () => {
    const brand = read(file)
    for (const at of PRESET_TOKENS) assert.ok(at.split('.').reduce((node, key) => node?.[key], brand)?.$value !== undefined, `${id} lacks ${at}`)
  })
}

// A copy of src under the OS temp dir; its node_modules link lets the copy resolve the package's dependencies.
function copySource() {
  const dir = mkdtempSync(path.join(tmpdir(), 'style-presets-'))
  cpSync(path.join(PACKAGE, 'src'), path.join(dir, 'src'), { recursive: true })
  symlinkSync(path.join(PACKAGE, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  return { dir, presets: path.join(dir, 'src', 'style-presets'), load: () => import(pathToFileURL(path.join(dir, 'src', 'brand.mjs')).href) }
}

test('SP-5 the presets are read from the folder: a file added there is listed, sorted after default', async () => {
  const copy = copySource()
  try {
    writeFileSync(path.join(copy.presets, 'aaa-added.json'), JSON.stringify(preset('Added')))
    const listed = (await copy.load()).stylePresets()
    assert.deepEqual(
      listed.map((p) => p.id),
      [
        'default',
        'aaa-added',
        ...stylePresets()
          .slice(1)
          .map((p) => p.id),
      ],
    )
    assert.equal(listed[1].name, 'Added')
  } finally {
    rmSync(copy.dir, { recursive: true, force: true })
  }
})

test('SP-6 a preset without a name fails the read', async () => {
  const copy = copySource()
  try {
    writeFileSync(path.join(copy.presets, 'nameless.json'), JSON.stringify(preset('')))
    const brand = await copy.load()
    assert.throws(() => brand.stylePresets(), /style preset nameless has no \$extensions name/)
  } finally {
    rmSync(copy.dir, { recursive: true, force: true })
  }
})

test('SP-7 the module loads without its presets folder and reads the folder only when asked', async () => {
  const copy = copySource()
  const aside = `${copy.presets}-aside`
  try {
    renameSync(copy.presets, aside)
    const brand = await copy.load()
    assert.equal(typeof brand.renderBaseCss(read(stylePresetPath('default'))), 'string')
    assert.throws(() => brand.stylePresets(), { code: 'ENOENT' })
    renameSync(aside, copy.presets)
    assert.deepEqual(
      brand.stylePresets().map((p) => p.id),
      stylePresets().map((p) => p.id),
    )
  } finally {
    rmSync(copy.dir, { recursive: true, force: true })
  }
})

test('SP-9 the presets install the variable font their sans and heading families render first', () => {
  const expected = { default: '@fontsource-variable/inter', 'basecamp-style': '@fontsource-variable/archivo' }
  for (const { id, path: file } of stylePresets()) {
    const brand = read(file)
    assert.deepEqual(fontPackages(brand), { [expected[id]]: '*' }, id)
    for (const slot of ['sans', 'heading']) assert.match(resolveBrand(brand).brand.font.family[slot].$value[0], / Variable$/, `${id} ${slot}`)
  }
})

test('the presets write a role that means another role as a reference to it, and its stylesheet carries it as a var', () => {
  for (const { id, path: file } of stylePresets()) {
    const brand = read(file)
    assert.deepEqual(brandReferenceProblems(brand), [], id)
    const css = renderBaseCss(brand)
    for (const [role, target] of [
      ['card', 'background'],
      ['popover-foreground', 'foreground'],
      ['buy', 'primary'],
      ['checkout-foreground', 'primary-foreground'],
      ['buy-hover', 'primary-hover'],
      ['price', 'foreground'],
      ['font-heading', 'font-sans'],
      ['text-body-weight', 'font-weight-normal'],
    ])
      assert.match(css, new RegExp(`--fui-${role}: var\\(--fui-${target}\\);`), `${id} ${role}`)
  }
  assert.doesNotMatch(renderBaseCss(read(stylePresetPath('default'))), /--fui-(active|price)-hover:/)
  assert.match(renderBaseCss(read(stylePresetPath('basecamp-style'))), /--fui-ring: var\(--fui-foreground\);/)
})
