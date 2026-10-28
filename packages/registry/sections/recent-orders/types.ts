// SPDX-License-Identifier: FSL-1.1-MIT
import type { PriceType } from '@library/components/ui/price'

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'returned'

export interface RecentOrder {
  /** Shown as the order's reference, e.g. `#FR-20418`. */
  number: string
  /** ISO date the order was placed, shown in the item's locale. */
  date: string
  status: OrderStatus
  /** The names of the ordered products; the first is shown, the rest counted. */
  items: string[]
  total: PriceType
}
