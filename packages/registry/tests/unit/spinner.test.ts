// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Spinner } from '../../ui/spinner'
import SpinnerDemo from '../../ui/spinner/spinner.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

describe('a spinner', () => {
  it('is a status named by its label, Loading when left out, and spins on its recipe', async () => {
    await mount(() => [h(Spinner), h(Spinner, { label: 'Loading your orders' })])
    const [plain, named] = [...document.querySelectorAll('.fui-spinner')]
    expect([plain!.getAttribute('role'), plain!.getAttribute('aria-label'), named!.getAttribute('aria-label')]).toEqual(['status', 'Loading', 'Loading your orders'])
    expect(plain!.getAttribute('class')!.split(' ')).toEqual(expect.arrayContaining(['fui-spinner', 'animate-spin']))
  })
})

describe('the spinner demo', () => {
  it('is an add-to-cart button while the cart answers, its text naming it and the spinner in its icon slot', async () => {
    await mount(() => h(SpinnerDemo))
    const button = document.querySelector<HTMLButtonElement>('[data-slot="button"]')!
    const spinner = button.querySelector('.fui-spinner')!
    expect(button.disabled).toBe(true)
    expect(button.textContent!.trim()).toBe('Adding to cart')
    expect([spinner.getAttribute('data-icon'), spinner.getAttribute('aria-hidden')]).toEqual(['inline-start', 'true'])
  })
})
