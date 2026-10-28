// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import FiltersDemo from '../../sections/filters/filters.example.vue'

describe('filters demo', () => {
  it('leaves out the sold-out jackets when In stock only is on', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    createApp(FiltersDemo).mount(host)
    const shown = () => host.querySelector('[data-slot="card-footer"] button')!.textContent!.trim()
    const before = shown()
    ;(host.querySelector('[data-slot="filter-switch"] [role="switch"]') as HTMLElement).click()
    await nextTick()
    expect(before).toBe('Show 19 products')
    expect(shown()).toBe('Show 15 products')
  })
})
