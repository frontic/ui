// @vitest-environment happy-dom
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Carousel } from '../../ui/carousel'
import { Drawer } from '../../ui/drawer'
import { RadioAccordion } from '../../ui/radio-accordion'
import { SidebarProvider } from '../../ui/sidebar'
import { SwatchRoot } from '../../ui/swatch'

const root = join(import.meta.dirname, '../..')
const parts = execFileSync('git', ['ls-files', 'ui'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file.endsWith('.vue') && !file.endsWith('.example.vue'))
const template = (file: string) => /^<template>\n([\s\S]*)\n<\/template>\s*$/m.exec(readFileSync(join(root, file), 'utf8'))?.[1].trim() ?? ''
/** A root element that holds nothing but the default slot. */
const wrapsSlot = (body: string) => /^<([a-zA-Z][\w-]*)\b(?:[^>"]|"[^"]*")*>\s*<slot\s*(?:v-bind="[^"]*"\s*)?\/>\s*<\/\1>$/.exec(body)?.[1]

// An svg root keeps its element: its children compile in the svg namespace only under a literal <svg>. A <component> is a Reka part chosen at run time.
const plain = parts.filter((file) => /^[a-z]/.test(wrapsSlot(template(file)) ?? '') && !['svg', 'component'].includes(wrapsSlot(template(file))!))
const primitive = parts.filter((file) => wrapsSlot(template(file)) === 'Primitive')
const modules = import.meta.glob<{ default: Component }>('../../ui/*/*.vue', { eager: true })
/** The parent a part needs around it, by folder. */
const PARENTS: Record<string, (child: () => unknown) => unknown> = {
  carousel: (child) => h(Carousel, null, child),
  drawer: (child) => h(Drawer, null, child),
  'radio-accordion': (child) => h(RadioAccordion, null, child),
  sidebar: (child) => h(SidebarProvider, null, child),
  swatch: (child) => h(SwatchRoot, null, child),
}
const render = async (file: string, props: Record<string, unknown>, slot: () => unknown) => {
  const component = modules[`../../${file}`]!.default
  const part = () => h(component, { 'data-probe': '', ...props }, slot)
  const parent = PARENTS[file.split('/')[1]!]
  const host = document.createElement('div')
  const app = createSSRApp({ render: () => (parent ? parent(part) : part()) })
  app.config.warnHandler = () => {}
  host.innerHTML = await renderToString(app)
  return host.querySelector('[data-probe]')
}

describe('every ui part that wraps a slot', () => {
  it('renders through Primitive, never a plain element', () => {
    expect(plain).toEqual([])
    expect(primitive.length).toBeGreaterThan(90)
  })

  it.each(primitive)('%s takes as and asChild', async (file) => {
    expect((await render(file, { as: 'section' }, () => 'x'))?.tagName).toBe('SECTION')
    const child = await render(file, { asChild: true }, () => h('a', { href: '/x' }, 'x'))
    expect(child?.tagName).toBe('A')
    expect(child?.getAttribute('href')).toBe('/x')
  })
})
