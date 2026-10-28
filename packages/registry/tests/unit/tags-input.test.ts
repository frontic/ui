// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { TagsInput, TagsInputItem, TagsInputItemDelete, TagsInputItemText } from '../../ui/tags-input'
import TagsInputDemo from '../../ui/tags-input/tags-input.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => app?.unmount())

const nameOf = (element: Element) =>
  element
    .getAttribute('aria-labelledby')!
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent)
    .join(' ')

describe('a tags input', () => {
  it('names each remove button by what it does and which tag it removes', async () => {
    await mount(() => h(TagsInput, { defaultValue: ['Cotton'] }, () => h(TagsInputItem, { value: 'Cotton' }, () => [h(TagsInputItemText), h(TagsInputItemDelete, { removeLabel: 'Entfernen' })])))
    expect(nameOf(document.querySelector('.fui-tags-input-item-delete')!)).toBe('Entfernen Cotton')
  })

  it('marks its remove glyph as the icon its recipe sizes, and widens the hit area around it', async () => {
    await mount(() => h(TagsInput, { defaultValue: ['Cotton'] }, () => h(TagsInputItem, { value: 'Cotton' }, () => [h(TagsInputItemText), h(TagsInputItemDelete)])))
    const remove = document.querySelector('.fui-tags-input-item-delete')!
    expect(remove.querySelector('svg')!.hasAttribute('data-icon')).toBe(true)
    expect(remove.getAttribute('class')!.split(' ')).toEqual(expect.arrayContaining(['relative', 'after:absolute', 'after:-inset-1.75']))
  })
})

describe('the tags input demo', () => {
  it('lists two materials, each removable by a button named for it, and removes one on click', async () => {
    await mount(() => h(TagsInputDemo))
    const buttons = () => [...document.querySelectorAll('.fui-tags-input-item-delete')]
    expect(buttons().map(nameOf)).toEqual(['Remove Cotton', 'Remove Linen'])
    ;(buttons()[0] as HTMLElement).click()
    await nextTick()
    expect(buttons().map(nameOf)).toEqual(['Remove Linen'])
  })
})
