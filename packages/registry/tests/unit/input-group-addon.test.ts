// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, InputGroupTextarea } from '../../ui/input-group'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const clickAddon = async (control: typeof InputGroupInput | typeof InputGroupTextarea) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render: () => h(InputGroup, null, () => [h(control), h(InputGroupAddon, { align: 'block-end' }, () => h(InputGroupText, null, () => '120 characters left'))]) })
  app.mount('#app')
  await nextTick()
  ;(document.querySelector('.fui-input-group-text') as HTMLElement).click()
  return document.activeElement?.tagName
}

describe('an InputGroup addon', () => {
  it.each([
    ['input', InputGroupInput, 'INPUT'],
    ['textarea', InputGroupTextarea, 'TEXTAREA'],
  ])('focuses the group’s %s when clicked', async (_, control, tag) => {
    expect(await clickAddon(control)).toBe(tag)
  })
})
