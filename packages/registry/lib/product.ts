// SPDX-License-Identifier: FSL-1.1-MIT
import type { PriceType } from '@library/lib/format'

/** A colour or style of a product, offered as a swatch on its card. */
export interface ProductSibling {
  key: string
  name?: string
  cover?: { src?: string }
  link?: { path?: string }
  colors?: {
    mainColorHex?: string
    exactColorHex?: string
    exactColorName?: string
  }
}

export interface Product {
  name?: string
  key?: string
  brand?: string
  description?: string
  link?: { path?: string }
  price: PriceType
  cover?: { src?: string }
  rating?: number
  reviewCount?: number
  badge?: string
  clearout?: boolean
  inStore?: boolean
  siblings?: { items?: ProductSibling[] }
}
