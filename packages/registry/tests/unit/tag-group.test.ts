// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { TagGroup, TagGroupItem, TagGroupItemDelete, TagGroupItemText } from '../../ui/tag-group'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
  await nextTick()
}
afterEach(() => app?.unmount())

const FILTERS = ['Jackets', 'Northridge', 'Size M']
const group = (props: Record<string, unknown>) =>
  h(TagGroup, { 'aria-label': 'Active filters', ...props }, () =>
    FILTERS.map((filter) => h(TagGroupItem, { key: filter, value: filter }, () => [h(TagGroupItemText, null, () => filter), h(TagGroupItemDelete)])),
  )
const tag = (text: string) => [...document.querySelectorAll<HTMLElement>('[role="row"]')].find((row) => row.textContent === text)!
const press = (target: HTMLElement, key: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

describe('a TagGroup', () => {
  it('removes a tag by its delete button or Backspace when it listens for remove', async () => {
    const onRemove = vi.fn()
    await mount(() => group({ onRemove }))
    tag('Northridge').querySelector('button')!.click()
    press(tag('Size M'), 'Backspace')
    expect(onRemove.mock.calls).toEqual([[['Northridge']], [['Size M']]])
  })

  it('keeps a selected tag selected on Backspace when nothing listens for remove', async () => {
    const onUpdate = vi.fn()
    await mount(() => group({ selectionMode: 'multiple', defaultValue: ['Jackets'], 'onUpdate:modelValue': onUpdate }))
    press(tag('Jackets'), 'Backspace')
    await nextTick()
    expect(onUpdate).not.toHaveBeenCalled()
    expect(tag('Jackets').getAttribute('aria-selected')).toBe('true')
  })

  it('selects tags on click when a selection mode is set', async () => {
    const onUpdate = vi.fn()
    await mount(() => group({ selectionMode: 'multiple', 'onUpdate:modelValue': onUpdate }))
    tag('Jackets').click()
    await nextTick()
    tag('Size M').click()
    await nextTick()
    expect(onUpdate.mock.calls.at(-1)).toEqual([['Jackets', 'Size M']])
    expect(tag('Size M').getAttribute('aria-selected')).toBe('true')
  })
})
