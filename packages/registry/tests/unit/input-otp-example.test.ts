// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import InputOtpDemo from '../../ui/input-otp/input-otp.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

describe('the input otp example', () => {
  it('takes digits only, matching the numeric keypad it opens', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    app = createApp({ render: () => h(InputOtpDemo) })
    app.mount('#app')
    await nextTick()
    const input = document.querySelector<HTMLInputElement>('input[data-input-otp]')!
    expect(input.inputMode).toBe('numeric')
    expect(input.getAttribute('pattern')).toBe('^\\d+$')
  })
})
