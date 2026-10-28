// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { ButtonGroup, ButtonGroupText } from '../../ui/button-group'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('a ButtonGroupText', () => {
  it('takes its group’s orientation and is a plain label, not a group of its own', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(ButtonGroup, { orientation: 'vertical' }, () => h(ButtonGroupText, null, () => 'Order #10482')) })
    app.mount('#app')
    await nextTick()
    const text = document.querySelector('[data-slot="button-group-text"]')!
    expect(text.getAttribute('data-orientation')).toBe('vertical')
    expect(text.hasAttribute('role')).toBe(false)
    expect(document.querySelectorAll('[role="group"]')).toHaveLength(1)
  })
})

describe('a nested ButtonGroup', () => {
  const mount = async (orientation?: 'horizontal' | 'vertical') => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(ButtonGroup, { orientation: 'vertical' }, () => [h(ButtonGroup, { orientation }), h(ButtonGroup)]) })
    app.mount('#app')
    await nextTick()
    return [...document.querySelectorAll('[data-slot="button-group"] > [data-slot="button-group"]')]
  }

  it('stacks with a vertical parent, each segment the column’s full width', async () => {
    const groups = await mount()
    expect(groups.map((group) => group.getAttribute('data-orientation'))).toEqual(['vertical', 'vertical'])
    expect(document.querySelector('[data-slot="button-group"]')!.className.split(' ')).toContain('*:w-full')
  })

  it('keeps an orientation of its own', async () => {
    const groups = await mount('horizontal')
    expect(groups.map((group) => group.getAttribute('data-orientation'))).toEqual(['horizontal', 'vertical'])
  })
})
