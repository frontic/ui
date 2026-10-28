// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import TabsDemo from '../../ui/tabs/tabs.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const twoTabs = (props: { orientation?: 'horizontal' | 'vertical'; variant?: 'default' | 'line' }) =>
  h(Tabs, { defaultValue: 'a', orientation: props.orientation }, () => [
    h(TabsList, { variant: props.variant }, () => [h(TabsTrigger, { value: 'a' }, () => 'A'), h(TabsTrigger, { value: 'b' }, () => 'B')]),
    h(TabsContent, { value: 'a' }, () => 'Panel A'),
  ])

describe('tabs', () => {
  it('mark their orientation so the list and indicator lay out as a row or a column', async () => {
    await mount(() => [twoTabs({}), twoTabs({ orientation: 'vertical' })])
    const [row, column] = [...document.querySelectorAll('[data-slot="tabs"]')]
    expect([row!.hasAttribute('data-horizontal'), column!.hasAttribute('data-vertical')]).toEqual([true, true])
  })

  it('draw the underline only in the line variant', async () => {
    await mount(() => [twoTabs({}), twoTabs({ variant: 'line' })])
    const [filled, line] = [...document.querySelectorAll('[data-slot="tabs-list"]')]
    expect([filled!.querySelectorAll('[data-slot="tabs-trigger-indicator"]').length, line!.querySelectorAll('[data-slot="tabs-trigger-indicator"]').length]).toEqual([0, 2])
  })
})

describe('the tabs demo', () => {
  it("shows a product's description and details, reviews not yet open, and an account menu as a vertical line list", async () => {
    await mount(() => h(TabsDemo))
    const [product, account] = [...document.querySelectorAll('[data-slot="tabs-list"]')]
    const tabs = [...product!.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute('aria-selected'), tab.disabled])).toEqual([
      ['Description', 'true', false],
      ['Details', 'false', false],
      ['Reviews', 'false', true],
    ])
    expect([account!.getAttribute('aria-label'), account!.getAttribute('aria-orientation'), account!.getAttribute('data-variant')]).toEqual(['Account', 'vertical', 'line'])
  })
})
