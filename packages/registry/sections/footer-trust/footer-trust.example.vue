<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { FooterTrust, type FooterLink, type FooterTrustItem } from '.'

defineOptions({ inheritAttrs: false })

const items: FooterTrustItem[] = [
  { icon: 'shipping', title: 'Free shipping', description: 'On all orders' },
  { icon: 'returns', title: 'Free returns', description: 'On all orders' },
  {
    icon: 'payment',
    title: 'Secure payment',
    description: 'Encrypted and verified by your bank',
  },
  {
    icon: 'support',
    title: 'Customer support',
    description: 'Mon–Fri, 9am–5pm',
  },
]

const paymentMethods = ['Visa', 'Mastercard', 'Amex', 'PayPal', 'Klarna']

const legalLinks: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Imprint', href: '#' },
]
</script>

<template>
  <FooterTrust
    brand-name="Basecamp Store"
    :items="items"
    :payment-methods="paymentMethods"
    :legal-links="legalLinks"
    v-bind="$attrs" />
</template>
