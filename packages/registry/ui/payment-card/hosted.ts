// SPDX-License-Identifier: FSL-1.1-MIT
import type { PaymentCardBrand } from './card'

/** What a payment provider's hosted field reports from its events, such as Stripe Elements' `change` event. */
export interface PaymentCardHostedField {
  /** Nothing is typed in it. */
  empty: boolean
  /** It holds a full, valid entry. */
  complete: boolean
  /** The provider's message for what is wrong with the entry. */
  error?: string
  /** The scheme the provider detected, for the number field. */
  brand?: PaymentCardBrand
  /** Moves focus into the provider's field; called when the Field's label is clicked. */
  focus?: () => void
}
