// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import GiftMessage from '../../ui/input-group/input-group.gift-message.example.vue'

it('counts the gift message’s characters against its limit as the user types', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(GiftMessage))
  app.mount('#app')
  await nextTick()
  const textarea = document.querySelector('textarea')!
  const count = () => document.querySelector('[data-slot="input-group-addon"]')!.textContent!.trim()
  expect(textarea.getAttribute('maxlength')).toBe('200')
  expect(count()).toBe('0/200')
  textarea.value = 'Happy birthday!'
  textarea.dispatchEvent(new Event('input'))
  await nextTick()
  expect(count()).toBe('15/200')
  app.unmount()
})
