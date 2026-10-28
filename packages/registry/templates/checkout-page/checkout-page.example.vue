<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckoutPage,
  type AppliedDiscount,
  type CartLine,
  type PaymentMethod,
  type ShippingMethod,
} from '.'

defineOptions({ inheritAttrs: false })

const items: CartLine[] = [
  {
    id: 'frost-escape-parka',
    name: 'Frost Escape Parka',
    variant: 'Sun yellow · M',
    price: { amount: 14900, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/frost-escape-parka.jpg',
  },
  {
    id: 'snowflake-ski-goggles',
    name: 'Snowflake Ski Goggles',
    variant: 'Mint · One size',
    price: { amount: 12700, currency: 'EUR', ref: 15900 },
    quantity: 2,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/snowflake-ski-goggles.jpg',
  },
  {
    id: 'trailmaster-22',
    name: 'TrailMaster 22',
    variant: 'Brown · 20L',
    price: { amount: 14100, currency: 'EUR' },
    quantity: 1,
    image:
      'https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/trailmaster-22.jpg',
  },
]

const customer = {
  email: 'lena.berg@example.com',
  firstName: 'Lena',
  lastName: 'Berg',
  address: 'Torstraße',
  houseNumber: '109',
  zip: '10119',
  city: 'Berlin',
  country: 'DE',
}

const shipping: ShippingMethod[] = [
  {
    value: 'standard',
    label: 'Standard',
    description: '3 to 5 working days',
    amount: 499,
    freeFrom: 60000,
  },
  {
    value: 'express',
    label: 'Express',
    description: 'Next working day',
    amount: 1290,
  },
]

const payments: PaymentMethod[] = [
  { value: 'card', label: 'Credit card' },
  {
    value: 'paypal',
    label: 'PayPal',
    description:
      'After you click Pay now, PayPal opens to finish your purchase.',
  },
  {
    value: 'klarna',
    label: 'Pay with Klarna',
    description:
      'Pay in 30 days or in three instalments. Klarna opens after you click Pay now.',
  },
]

const policies = [
  { label: 'Refund policy', href: '#refunds' },
  { label: 'Shipping', href: '#shipping' },
  { label: 'Privacy policy', href: '#privacy' },
  { label: 'Terms of service', href: '#terms' },
  { label: 'Contact', href: '#contact' },
]
const known: Record<string, AppliedDiscount> = {
  WELCOME10: {
    id: 'WELCOME10',
    kind: 'promo',
    label: 'WELCOME10',
    amount: 5440,
  },
  'GC-5530-1194': {
    id: 'GC-5530-1194',
    kind: 'gift-card',
    label: 'Gift card ••• 4821',
    lineLabel: 'Gift card',
    amount: 5000,
  },
}
const discounts = ref<AppliedDiscount[]>([
  known.WELCOME10!,
  known['GC-5530-1194']!,
])
const applyDiscount = (code: string) => {
  const entry = known[code.toUpperCase()]
  if (entry && !discounts.value.some((d) => d.id === entry.id))
    discounts.value = [...discounts.value, entry]
}
const removeDiscount = (entry: AppliedDiscount) =>
  (discounts.value = discounts.value.filter((d) => d.id !== entry.id))
</script>

<template>
  <CheckoutPage
    :items="items"
    :default-values="customer"
    :payment-methods="payments"
    :policy-links="policies"
    :tax-rate="0.19"
    :discounts="discounts"
    discount-hint="One promo code per order. Gift cards can be combined."
    @apply-discount="applyDiscount"
    @remove-discount="removeDiscount"
    :shipping-methods="shipping"
    store-name="Basecamp"
    sign-in-href="#sign-in"
    v-bind="$attrs" />
</template>
