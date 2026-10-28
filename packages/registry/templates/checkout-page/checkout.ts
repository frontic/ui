// SPDX-License-Identifier: FSL-1.1-MIT
export type { AppliedDiscount } from '@library/lib/cart'
export interface CheckoutValues {
  email: string
  newsletter: boolean
  country: string
  firstName: string
  lastName: string
  address: string
  houseNumber: string
  apartment: string
  zip: string
  city: string
  phone: string
  shippingMethod: string
  paymentMethod: string
  cardNumber: string
  expiry: string
  cvc: string
  cardName: string
  billingSameAsShipping: boolean
  billingFirstName: string
  billingLastName: string
  billingAddress: string
  billingZip: string
  billingCity: string
  billingCountry: string
  remember: boolean
  rememberPhone: string
}

export interface CheckoutOption {
  value: string
  label: string
}

export interface ShippingMethod {
  value: string
  label: string
  /** Shown under the label, e.g. the delivery time. */
  description?: string
  /** In minor units. */
  amount: number
  /** Subtotal after promo codes, in minor units, from which this method is free; free at exactly this amount. */
  freeFrom?: number
}

export interface PaymentMethod {
  value: string
  label: string
  /** Shown at the row's end, e.g. the accepted card brands. */
  marks?: string[]
  /** Shown below the row while it is selected, e.g. where the shopper is sent to pay. */
  description?: string
}

export interface PolicyLink {
  label: string
  href: string
}
