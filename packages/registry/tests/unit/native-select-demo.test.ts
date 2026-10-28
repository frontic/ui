// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import Demo from '../../ui/native-select/native-select.example.vue'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

it('groups the countries inside and outside the EU, with the placeholder above both groups', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(Demo) })
  app.mount('#app')
  await nextTick()
  const select = document.querySelector('select')!
  const children = [...select.children].map((child) =>
    child.tagName === 'OPTGROUP' ? [child.getAttribute('label'), [...child.children].map((option) => option.textContent!.trim())] : child.textContent!.trim(),
  )
  expect(children).toEqual(['Select a country', ['EU', ['Germany', 'Austria', 'Netherlands']], ['Outside the EU', ['Switzerland']]])
  expect(document.querySelector('[data-slot="field-description"]')!.textContent!.trim()).toBe('We ship within the EU and Switzerland.')
})
