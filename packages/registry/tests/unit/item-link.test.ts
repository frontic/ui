// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import Demo from '../../ui/item/item.example.vue'

describe('the Item demo', () => {
  it('links a delivered order to its page, with the link hover and no link nested inside', async () => {
    const host = document.createElement('div')
    host.innerHTML = await renderToString(h(Demo))
    const item = host.querySelector<HTMLElement>('a[data-slot="item"]')!
    expect([item.tagName, item.getAttribute('href'), item.classList.contains('fui-item-link'), item.querySelectorAll('a').length]).toEqual(['A', '#order-10317', true, 0])
  })
})
