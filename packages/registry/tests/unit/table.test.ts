// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { Table, TableBody, TableCaption, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '../../ui/table'
import TableDemo from '../../ui/table/table.example.vue'

let app: ReturnType<typeof createApp> | undefined
const mount = async (render: () => unknown) => {
  document.body.innerHTML = '<div id="app"></div>'
  app = createApp({ render })
  app.mount('#app')
  await nextTick()
}
afterEach(() => {
  app?.unmount()
  vi.unstubAllGlobals()
})

const classes = (slot: string) => document.querySelector(`[data-slot="${slot}"]`)!.getAttribute('class')!.split(' ')
const orders = () =>
  h(Table, () => [
    h(TableCaption, () => 'Your recent orders.'),
    h(TableHeader, () => h(TableRow, () => [h(TableHead, () => 'Order'), h(TableHead, { class: 'text-end' }, () => 'Total')])),
    h(TableBody, () => h(TableRow, () => [h(TableCell, () => '#1042'), h(TableCell, { class: 'text-end' }, () => '€149.00')])),
  ])

describe('a table', () => {
  it("leaves a heading's alignment to its recipe, so a caller's text-end wins", async () => {
    await mount(orders)
    expect(classes('table-head')).not.toContain('text-start')
  })

  it('pads its cells from a recipe', async () => {
    await mount(orders)
    expect(classes('table-cell')).toContain('fui-table-cell')
    expect(classes('table-cell')).not.toContain('p-3')
  })

  it('spans its empty message across the columns it is given, spaced by a recipe', async () => {
    await mount(() => h(Table, () => h(TableBody, () => h(TableEmpty, { colspan: 3 }, () => 'No orders yet.'))))
    const empty = document.querySelector('[data-slot="table-empty"]')!
    expect([empty.getAttribute('colspan'), empty.textContent, classes('table-empty').includes('fui-table-empty')]).toEqual(['3', 'No orders yet.', true])
  })

  describe('wider than its box', () => {
    let wide = false
    beforeEach(() => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(private callback: () => void) {}
          observe = () => this.callback()
          unobserve = () => {}
          disconnect = () => {}
        },
      )
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => (wide ? 600 : 300))
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(300)
    })
    afterEach(() => vi.restoreAllMocks())

    it('becomes a focusable region named by its caption, so the keyboard can scroll it', async () => {
      wide = true
      await mount(orders)
      const box = document.querySelector('[data-slot="table-container"]')!
      expect([box.getAttribute('tabindex'), box.getAttribute('role'), box.getAttribute('aria-label')]).toEqual(['0', 'region', 'Your recent orders.'])
    })

    it('adds no tab stop while it fits', async () => {
      wide = false
      await mount(orders)
      const box = document.querySelector('[data-slot="table-container"]')!
      expect([box.getAttribute('tabindex'), box.getAttribute('role')]).toEqual([null, null])
    })
  })
})

describe('the table demo', () => {
  it('lists three orders with status badges and sums them in its footer', async () => {
    await mount(() => h(TableDemo))
    expect([...document.querySelectorAll('[data-slot="table-body"] [data-slot="badge"]')].map((badge) => badge.textContent!.trim())).toEqual(['Shipped', 'Processing', 'Delivered'])
    expect(document.querySelector('[data-slot="table-footer"]')!.textContent!.replace(/\s+/g, ' ')).toContain('€406.00')
    expect(document.querySelector('[data-slot="table-caption"]')!.textContent).toBe('Your recent orders.')
  })
})
