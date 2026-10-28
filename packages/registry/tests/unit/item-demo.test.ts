// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import ItemDemo from '../../ui/item/item.example.vue'

it('lists past orders as a group, each with its status above, its ship-to below and a separator between them; the order on its way offers Track, the delivered ones link to their page', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(ItemDemo))
  app.mount('#app')
  await nextTick()
  const group = document.querySelector('[data-slot="item-group"]')!
  const rows = [...group.querySelectorAll('[data-slot="item"]')]
  expect(rows.length).toBeGreaterThan(1)
  expect(group.querySelectorAll('[data-slot="item-separator"]')).toHaveLength(rows.length - 1)
  const text = (row: Element, slot: string) => row.querySelector(`[data-slot="${slot}"]`)?.textContent?.trim()
  expect(rows.map((row) => [text(row, 'item-header'), text(row, 'item-title'), text(row, 'item-footer')])[0]).toEqual(['Arriving Thursday', 'Order #10482', 'To Hauptstraße 12, Munich'])
  for (const row of rows) expect(row.querySelector('[data-slot="item-media"] [data-slot="image"]')).not.toBeNull()
  expect(rows.map((row) => [row.tagName, text(row, 'item-actions')])).toEqual([
    ['DIV', 'Track'],
    ['A', ''],
    ['A', ''],
  ])
  app.unmount()
})
