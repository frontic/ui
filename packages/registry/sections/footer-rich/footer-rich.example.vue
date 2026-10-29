<script setup lang="ts">
import { FooterRich, type FooterLink, type FooterLinkGroup } from '.'

defineOptions({ inheritAttrs: false })

const linkGroups: FooterLinkGroup[] = [
  {
    title: 'Shop',
    links: [
      { label: 'Women', href: '#' },
      { label: 'Men', href: '#' },
      { label: 'Equipment', href: '#' },
      { label: 'Sale', href: '#' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Order status', href: '#' },
      { label: 'Shipping & returns', href: '#' },
      { label: 'Size guide', href: '#' },
      { label: 'Contact us', href: '#' },
    ],
  },
  {
    title: 'Basecamp',
    links: [
      { label: 'About us', href: '#' },
      { label: 'Store locator', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
]

const legalLinks: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Imprint', href: '#' },
  { label: 'Cookie settings', href: '#' },
]
</script>

<template>
  <FooterRich
    brand-name="Basecamp"
    newsletter-description="10% off your first order, and the new season before anyone else."
    copyright="© {year} Basecamp Store. All rights reserved."
    :link-groups="linkGroups"
    :legal-links="legalLinks"
    v-bind="$attrs" />
</template>
