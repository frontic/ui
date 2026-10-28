// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { Textarea } from '../../ui/textarea'
import TextareaDemo from '../../ui/textarea/textarea.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

describe('a textarea', () => {
  it('grows with its content and binds its value both ways', async () => {
    const text = ref('Hi')
    await mount(() => h(Textarea, { modelValue: text.value, 'onUpdate:modelValue': (v: string | number) => (text.value = String(v)) }))
    const area = document.querySelector('textarea')!
    expect(area.getAttribute('class')!.split(' ')).toEqual(expect.arrayContaining(['fui-textarea', 'field-sizing-content']))
    expect(area.value).toBe('Hi')
    area.value = 'Hi Sam'
    area.dispatchEvent(new Event('input'))
    await nextTick()
    expect(text.value).toBe('Hi Sam')
  })
})

describe('the textarea demo', () => {
  it('is a gift message named for screen readers and capped at 200 characters', async () => {
    await mount(() => h(TextareaDemo))
    const area = document.querySelector('textarea')!
    expect([area.getAttribute('aria-label'), area.getAttribute('placeholder'), area.getAttribute('maxlength')]).toEqual(['Gift message', 'Add a gift message', '200'])
  })
})
