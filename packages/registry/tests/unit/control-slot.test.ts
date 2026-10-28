// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, FieldDescription, FieldLabel } from '../../ui/field'
import { Input } from '../../ui/input'
import { InputGroup, InputGroupInput, InputGroupTextarea } from '../../ui/input-group'
import { SidebarInput, SidebarProvider } from '../../ui/sidebar'
import { Textarea } from '../../ui/textarea'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())

const slotOf = (tag: string) => document.querySelector(tag)!.getAttribute('data-slot')

describe('a control another component wraps', () => {
  it.each([
    ['InputGroupInput', 'input', () => h(InputGroup, null, () => h(InputGroupInput)), 'input-group-control'],
    ['InputGroupTextarea', 'textarea', () => h(InputGroup, null, () => h(InputGroupTextarea)), 'input-group-control'],
    ['SidebarInput', 'input', () => h(SidebarProvider, null, () => h(SidebarInput)), 'sidebar-input'],
  ])('%s renders its own data-slot, not the wrapped control’s', async (_, tag, render, slot) => {
    await mount(render)
    expect(slotOf(tag)).toBe(slot)
  })

  it('keeps its own slot inside a Field, which still names and describes it', async () => {
    await mount(() => h(Field, null, () => [h(FieldLabel, null, () => 'Promo code'), h(InputGroup, null, () => h(InputGroupInput)), h(FieldDescription, null, () => 'One per order.')]))
    const input = document.querySelector('input')!
    expect(input.getAttribute('data-slot')).toBe('input-group-control')
    expect(document.querySelector('[data-slot="field-label"]')!.getAttribute('for')).toBe(input.id)
    expect(input.getAttribute('aria-describedby')).toBe(document.querySelector('[data-slot="field-description"]')!.id)
  })
})

describe('a control on its own', () => {
  it.each([
    ['Input', 'input', Input],
    ['Textarea', 'textarea', Textarea],
  ])('%s renders its own data-slot', async (_, tag, Control) => {
    await mount(() => h(Control))
    expect(slotOf(tag)).toBe(tag)
  })
})
