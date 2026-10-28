// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import ButtonGroupDemo from '../../ui/button-group/button-group.example.vue'

it('names the order after the back arrow and splits Reorder from its menu with a separator, both solid', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(ButtonGroupDemo))
  app.mount('#app')
  await nextTick()
  const group = document.querySelector('[data-slot="button-group"]')!
  const children = [...group.children]
  expect(children.map((e) => e.getAttribute('data-slot')).slice(0, 2)).toEqual(['button-group', 'button-group-text'])
  expect(children[0]!.querySelector('[aria-label="Back to orders"]')).not.toBeNull()
  expect(children[1]!.textContent!.trim()).toBe('#10482')
  expect(children[1]!.className).toContain('whitespace-nowrap')
  const split = document.querySelector('[data-slot="button-group-separator"]')!.parentElement!
  expect([...split.children].map((e) => e.getAttribute('data-slot'))).toEqual(['button', 'button-group-separator', 'dropdown-menu-trigger'])
  expect(split.querySelectorAll('button')).toHaveLength(2)
  for (const button of split.querySelectorAll('button')) expect(button.className).toContain('fui-button-solid')
  app.unmount()
})
