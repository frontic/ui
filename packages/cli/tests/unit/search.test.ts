import { describe, expect, it } from 'vitest'
import { searchTable } from '../../src/commands/search'

describe('searchTable', () => {
  it('names each item by its tier folder, the word --tier takes', () => {
    const table = searchTable([
      { name: 'button', type: 'registry:ui', title: 'Button', description: 'A button.' },
      { name: 'cart-summary', type: 'registry:component', title: 'Cart Summary', description: 'Totals.' },
      { name: 'checkout-page', type: 'registry:block', title: 'Checkout Page', description: 'A page.' },
    ] as never)
    expect(table.split('\n').map((row) => row.split(/\s{2,}/)[1])).toEqual(['ui', 'sections', 'templates'])
  })
})
