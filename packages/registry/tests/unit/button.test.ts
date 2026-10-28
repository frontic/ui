// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Button } from '../../ui/button'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
const $ = (selector: string) => document.querySelector<HTMLElement>(selector)!
afterEach(() => app?.unmount())

describe('a Button', () => {
  it('does not submit the form it sits in unless it says so', async () => {
    const onSubmit = vi.fn((event: Event) => event.preventDefault())
    await mount(() => h('form', { onSubmit }, [h(Button, { class: 'remove' }, () => 'Remove'), h(Button, { type: 'submit', class: 'send' }, () => 'Send')]))
    expect($('.remove').getAttribute('type')).toBe('button')
    $('.remove').click()
    expect(onSubmit).not.toHaveBeenCalled()
    expect($('.send').getAttribute('type')).toBe('submit')
    $('.send').click()
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('sets no type on a link or a child it styles', async () => {
    await mount(() => [h(Button, { as: 'a', href: '#', class: 'link' }, () => 'Go'), h(Button, { asChild: true }, () => h('a', { href: '#', class: 'child' }, 'Go'))])
    expect($('.link').hasAttribute('type')).toBe(false)
    expect($('.child').hasAttribute('type')).toBe(false)
  })
})
