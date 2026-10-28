// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '../../ui/pagination'

let app: ReturnType<typeof createApp> | undefined
afterEach(() => app?.unmount())

const mount = async (itemProps: (value: number) => Record<string, unknown> = () => ({})) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({
    render: () =>
      h(Pagination, { total: 100, itemsPerPage: 10, defaultPage: 4, showEdges: true }, () =>
        h(PaginationContent, null, {
          default: ({ items }: { items: { type: string; value?: number }[] }) =>
            items.map((item, index) => (item.type === 'page' ? h(PaginationItem, { value: item.value!, ...itemProps(item.value!) }, () => String(item.value)) : h(PaginationEllipsis, { index }))),
        }),
      ),
  })
  app.mount('#app')
  await nextTick()
}
const page = (value: number) => [...document.querySelectorAll<HTMLElement>('[data-slot="pagination-item"]')].find((item) => item.textContent === String(value))!

describe('a pagination item', () => {
  it("marks the pagination's current page without being told", async () => {
    await mount()
    expect(page(4).className).toContain('fui-button-outline')
    expect(page(3).className).toContain('fui-button-ghost')
  })

  it('keeps an isActive it is given', async () => {
    await mount((value) => ({ isActive: value === 1 }))
    expect(page(1).className).toContain('fui-button-outline')
    expect(page(4).className).toContain('fui-button-ghost')
  })
})

describe('a narrow pagination', () => {
  it('keeps only the current page between Previous and Next', async () => {
    await mount()
    expect(page(4).hasAttribute('data-active')).toBe(true)
    expect(page(3).hasAttribute('data-active')).toBe(false)
    expect(page(3).classList.contains('@max-md/pagination:not-data-active:hidden')).toBe(true)
    expect(document.querySelector('[data-slot="pagination-ellipsis"]')!.classList.contains('@max-md/pagination:hidden')).toBe(true)
  })
})
