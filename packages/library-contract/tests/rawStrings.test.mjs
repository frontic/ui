import { afterAll, beforeAll, test } from 'vitest'
import assert from 'node:assert/strict'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { renderBaseCss, stylePresetPath } from '../src/brand.mjs'
import * as checks from '../src/lint.mjs'
import { RAW_TEXT, RAW_TEXT_HINT } from '../src/rawStrings.mjs'
import { createContent } from './content.mjs'
import { writeRecipes } from './yaml-recipes.mjs'

const UNKNOWN = 'better-tailwindcss/no-unknown-classes'
let ws

beforeAll(async () => {
  const brand = JSON.parse(await readFile(stylePresetPath('default'), 'utf8'))
  ws = await createContent('.fx-rawstrings-', { baseCss: renderBaseCss(brand, {}) })
})

afterAll(async () => {
  await rm(ws.ws, { recursive: true, force: true })
})

async function lintFile(rel, source) {
  const file = path.join(ws.content, rel)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, source)
  return checks.lintWorkspace(ws.content, { files: [rel], workDir: ws.workDir })
}

const sfc = (template, script = '') => `<script setup lang="ts">\n${script}\n</script>\n<template>\n${template}\n</template>\n`
const CARD = 'library/components/ui/card/Card.vue'
const raw = async (template, script, rel = CARD) => (await lintFile(rel, sfc(template, script))).filter((p) => p.ruleId === RAW_TEXT).map((p) => p.message.split('. ')[0])

test("RS-01 text in a library component's template is raw text, and the message says what to do", async () => {
  const problems = await lintFile(CARD, sfc('  <span>Only {{ stock }}</span>', 'defineProps<{ stock: number }>();'))
  assert.deepEqual(
    problems.map((p) => [p.file, p.line, p.ruleId]),
    [[CARD, 5, RAW_TEXT]],
  )
  assert.equal(problems[0].message, `raw text 'Only' is used. ${RAW_TEXT_HINT}`)
})

test('RS-02 a literal or a ternary of literals in a template expression is raw text', async () => {
  assert.deepEqual(await raw("  <span>{{ 'Sold out' }}</span>"), ["raw text 'Sold out' is used"])
  assert.deepEqual(await raw('  <span>{{ `Sold out` }}</span>'), ["raw text 'Sold out' is used"])
  assert.deepEqual(await raw("  <span>{{ low ? 'Low stock' : 'In stock' }}</span>", 'defineProps<{ low: boolean }>();'), ["raw text 'Low stock' is used", "raw text 'In stock' is used"])
  assert.deepEqual(await raw('  <slot>Read more</slot>'), ["raw text 'Read more' is used"])
})

test('RS-03 a literal in each named attribute is raw text, on an element and on a component', async () => {
  for (const attr of ['alt', 'title', 'placeholder', 'aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'aria-placeholder']) {
    assert.deepEqual(await raw(`  <div ${attr}="Close" />`), ["raw text 'Close' is used"], attr)
  }
  assert.deepEqual(await raw('  <Badge aria-label="New" />', 'import { Badge } from "@library/components/ui/badge";'), ["raw text 'New' is used"])
})

test('RS-04 bound attributes, an empty alt, other attributes, punctuation and whitespace pass', async () => {
  assert.deepEqual(
    await raw(
      [
        '  <img :alt="name" :title="name" src="x.png" />',
        '  <img alt="" src="x.png" />',
        '  <a href="#" class="block" data-kind="Card" :aria-label="name">→</a>',
        '  <span>{{ price }} · {{ name }}</span>',
        '  <span>&nbsp;</span>',
      ].join('\n'),
      'defineProps<{ name: string; price: number }>();',
    ),
    [],
  )
})

test('RS-05 concatenation and an interpolated template literal pass: the known gaps', async () => {
  assert.deepEqual(await raw("  <span>{{ 'Only ' + stock }}</span>\n  <span>{{ `Only ${stock}` }}</span>\n  <span>{{ label }}</span>", 'defineProps<{ stock: number }>();\nconst label = "Only";'), [])
})

test('RS-06 examples, experience code and files that are not Vue SFCs are not judged', async () => {
  assert.deepEqual(await raw('  <span>Add to cart</span>', '', 'library/components/ui/card/card.example.vue'), [])
  assert.deepEqual(await raw('  <span>Add to cart</span>', '', 'src/components/Promo.vue'), [])
  const astro = await lintFile('src/experiences/promo/index.astro', '---\n---\n<section>Add to cart</section>\n')
  assert.deepEqual(astro, [])
})

test('RS-07 an eslint-disable comment does not silence it', async () => {
  assert.deepEqual(await raw('  <span>Add to cart</span>', '/* eslint-disable */'), ["raw text 'Add to cart' is used"])
})

test("RS-08 the save's lint answers raw text and class problems in one pass", async () => {
  await mkdir(path.join(ws.content, 'library'), { recursive: true })
  await writeRecipes(path.join(ws.content, 'library'), "  button-primary:\n    backgroundColor: '{colors.primary}'")
  await lintFile(CARD, sfc('  <span class="flxe">Only</span>'))
  const problems = await checks.lintLibrary(ws.content, { workDir: ws.workDir })
  assert.deepEqual(
    problems
      .filter((p) => p.file === CARD)
      .map((p) => p.ruleId)
      .sort(),
    [RAW_TEXT, UNKNOWN].sort(),
  )
})
