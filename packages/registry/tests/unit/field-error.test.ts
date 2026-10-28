// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Field, FieldError } from '../../ui/field'
import { Form } from '../../ui/form'
import Input from '../../ui/input/Input.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())

const shown = () => [...document.querySelectorAll('[data-slot="field-error"]')].map((node) => node.textContent?.trim())

describe('a FieldError given errors', () => {
  it("shows a form library's messages without a Field, duplicates and blanks dropped", async () => {
    await mount(() => h(FieldError, { errors: ['Too short.', { message: 'Too short.' }, undefined, { message: 'No digits.' }] }))
    expect(document.querySelectorAll('[data-slot="field-error"] li')).toHaveLength(2)
    expect(shown()).toEqual(['Too short.No digits.'])
  })

  it('renders nothing for no messages', async () => {
    await mount(() => h(FieldError, { errors: [undefined] }))
    expect(shown()).toEqual([])
  })

  it("shows them instead of the Field's own", async () => {
    await mount(() => h(Form, { errors: { name: 'From the server.' } }, () => h(Field, { name: 'name' }, () => [h(Input), h(FieldError, { errors: ['From the library.'] })])))
    expect(shown()).toEqual(['From the library.'])
  })
})
