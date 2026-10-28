// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const mount = async (trigger: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Collapsible, null, () => [trigger(), h(CollapsibleContent, null, () => 'Two items')]) })
  app.mount('#app')
  await nextTick()
  return document.querySelector('[data-slot="collapsible-trigger"]')!
}

describe('a CollapsibleTrigger', () => {
  it('shows the focus ring on keyboard focus, so a plain trigger needs no ring of its own', async () => {
    const trigger = await mount(() => h(CollapsibleTrigger, { class: 'flex w-full' }, () => 'Show order summary'))
    expect(trigger.className.split(' ')).toEqual(expect.arrayContaining(['outline-none', 'focus-visible:fui-focus-ring', 'flex', 'w-full']))
  })

  it('hands the ring to the element it renders as', async () => {
    const trigger = await mount(() => h(CollapsibleTrigger, { asChild: true }, () => h('button', { type: 'button', class: 'fui-part-title' }, 'Colour')))
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.className.split(' ')).toEqual(expect.arrayContaining(['focus-visible:fui-focus-ring', 'fui-part-title']))
  })
})
