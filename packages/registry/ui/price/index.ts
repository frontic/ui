// SPDX-License-Identifier: FSL-1.1-MIT
import type { ComputedRef, InjectionKey } from 'vue'

export { default as Price } from './Price.vue'
export { default as PriceAmount } from './PriceAmount.vue'
export { default as PriceRef } from './PriceRef.vue'
export { default as PriceDiscount } from './PriceDiscount.vue'
export { default as PriceHint } from './PriceHint.vue'
export { formatPrice, type PriceType } from '@library/lib/format'

export interface PriceContext {
  formattedPrice: ComputedRef<string>
  formattedRef: ComputedRef<string>
  isDiscounted: ComputedRef<boolean>
  discountPercent: ComputedRef<number>
  size: ComputedRef<PriceSize>
  refLabel: ComputedRef<string>
  amountLabel: ComputedRef<string>
}

export const PRICE_INJECTION_KEY = Symbol('price-context') as InjectionKey<PriceContext>

export type PriceSize = 'sm' | 'md' | 'lg'

export type PriceAlign = 'start' | 'end'
