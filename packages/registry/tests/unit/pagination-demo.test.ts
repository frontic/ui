// @vitest-environment happy-dom
import { expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import PaginationDemo from '../../ui/pagination/pagination.example.vue'

it('puts First and Last at the ends of the row, outside Previous and Next', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(PaginationDemo))
  app.mount('#app')
  await nextTick()
  const ends = [...document.querySelectorAll('[data-slot="pagination-content"] [data-slot]')]
    .map((e) => e.getAttribute('data-slot'))
    .filter((slot) => /^pagination-(first|previous|next|last)$/.test(slot!))
  expect(ends).toEqual(['pagination-first', 'pagination-previous', 'pagination-next', 'pagination-last'])
  app.unmount()
})

it('shows the edge pages with an ellipsis on each side of the current page, so every part shows and the row fits a 504px stage', async () => {
  document.body.innerHTML = '<div id="app"></div>'
  const app = createApp(() => h(PaginationDemo))
  app.mount('#app')
  await nextTick()
  const pages = [...document.querySelectorAll('[data-slot="pagination-item"]')].map((e) => e.textContent!.trim())
  expect(pages).toEqual(['1', '4', '10'])
  expect(document.querySelectorAll('[data-slot="pagination-ellipsis"]')).toHaveLength(2)
  app.unmount()
})
