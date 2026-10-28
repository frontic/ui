// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import Demo from '../../ui/label/label.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('the Label demo', () => {
  it('names the sort select beside it, which sits outside a Field', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(Demo) })
    app.mount('#app')
    await nextTick()
    const label = document.querySelector<HTMLLabelElement>('[data-slot="label"]')!
    const trigger = document.querySelector<HTMLButtonElement>('[data-slot="select-trigger"]')!
    expect([label.textContent, label.htmlFor]).toEqual(['Sort by', trigger.id])
    expect(trigger.id).not.toBe('')
    expect(trigger.closest('[data-slot="field"]')).toBeNull()
  })
})
