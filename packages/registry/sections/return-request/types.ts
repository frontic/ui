// SPDX-License-Identifier: FSL-1.1-MIT
import type { PriceType } from '@library/components/ui/price'

export interface ReturnItem {
  id: string
  name: string
  /** The variant bought, or why the item cannot go back. */
  detail?: string
  price: PriceType
  /** False for an item that cannot be returned, such as a final-sale one. */
  returnable?: boolean
}

export interface ReturnChoice {
  value: string
  label: string
}

export interface ReturnRequestValue {
  items: string[]
  reason?: string
  comment?: string
  refundTo?: string
}
