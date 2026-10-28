import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SourceItem } from '../../scripts/lib/items'
import { servedItems } from '../../scripts/build'
import { importedPackages, servedItem, undeclaredDependencies } from '../../scripts/lib/served'

const declared = Object.keys(JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')).dependencies)
const priceRef = (script: string): SourceItem => ({
  name: 'price',
  tier: 'ui',
  type: 'registry:ui',
  files: { 'PriceRef.vue': `<script setup lang="ts">\n${script}\n</script>\n\n<template><span /></template>\n`, 'index.ts': "export { default as PriceRef } from './PriceRef.vue'\n" },
})
const serve = (script: string) => servedItem(priceRef(script), { name: 'price' }, { flat: {}, trees: {} })

describe('the npm packages an item serves', () => {
  it('pass when package.json lists them in dependencies', () => {
    expect(undeclaredDependencies([serve("import { cva } from 'class-variance-authority'")], declared)).toEqual([])
  })

  it('block a dev-only package: an item importing clsx or tailwind-merge', () => {
    expect(undeclaredDependencies([serve("import { clsx } from 'clsx'\nimport { twMerge } from 'tailwind-merge'")], declared)).toEqual([
      'price serves clsx, which package.json does not list in dependencies',
      'price serves tailwind-merge, which package.json does not list in dependencies',
    ])
  })

  it('read a string that holds from or import as text, not as a package', () => {
    const script = "const range = (val: object) => 'from' in val || 'to' in val\nconst note = 'see from \"docs\" first'"
    expect(importedPackages(priceRef(script).files)).toEqual([])
    expect(undeclaredDependencies([serve(script)], declared)).toEqual([])
  })

  it('pin a prerelease to the version the registry runs, since a bare name installs latest', () => {
    const served = servedItem(
      priceRef("import a from 'embla-carousel-vue'\nimport { cva } from 'class-variance-authority'"),
      { name: 'price' },
      { flat: {}, trees: {} },
      {
        'embla-carousel-vue': '9.0.0-rc04',
        'class-variance-authority': '^0.7.1',
      },
    )
    expect(served.dependencies).toEqual(['class-variance-authority', 'embla-carousel-vue@9.0.0-rc04'])
    expect(undeclaredDependencies([served], ['class-variance-authority', 'embla-carousel-vue'])).toEqual([])
  })

  it('serve the carousel with the embla version its code calls', async () => {
    const version = JSON.parse(readFileSync(join(import.meta.dirname, '../../package.json'), 'utf8')).dependencies['embla-carousel-vue']
    const carousel = (await servedItems(join(import.meta.dirname, '../..'))).find((item) => item.name === 'carousel')!
    expect(carousel.dependencies).toContain(/\d-/.test(version) ? `embla-carousel-vue@${version}` : 'embla-carousel-vue')
  }, 30_000)
})
