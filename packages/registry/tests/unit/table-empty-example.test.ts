// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import TableEmptyExample from '../../ui/table/table.empty.example.vue'

it('shows an empty order history as one message across every column', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(TableEmptyExample))
  app.mount('#app')
  await nextTick()

  const columns = document.querySelectorAll('thead th').length
  const empty = document.querySelector('[data-slot="table-empty"]')!
  expect(columns).toBe(3)
  expect(empty.textContent!.trim()).toBe('No orders yet')
  expect(empty.getAttribute('colspan')).toBe(String(columns))
  expect(document.querySelectorAll('tbody tr')).toHaveLength(1)
  app.unmount()
})
