// @vitest-environment happy-dom
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { readRegistryRecipes } from '../../scripts/lib/recipes'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList } from '../../ui/breadcrumb'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('a Breadcrumb', () => {
  it('names its navigation and gives each item a recipe for its spacing', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Breadcrumb, null, () => h(BreadcrumbList, null, () => h(BreadcrumbItem))) })
    app.mount('#app')
    await nextTick()
    expect(document.querySelector('nav')!.getAttribute('aria-label')).toBe('Breadcrumb')
    const item = document.querySelector('[data-slot="breadcrumb-item"]')!
    expect(item.classList.contains('fui-breadcrumb-item')).toBe(true)
    expect([...item.classList].filter((c) => /^gap-/.test(c))).toEqual([])
  })

  it('sets its trail in the brand’s caption style, not in literal sizes', () => {
    const { trees } = readRegistryRecipes(join(import.meta.dirname, '../..'))
    const list = trees['breadcrumb-list']!.base as Record<string, unknown>
    expect(list.typography).toBe('{typography.caption}')
    expect([list.fontSize, list.lineHeight]).toEqual([undefined, undefined])
  })
})
