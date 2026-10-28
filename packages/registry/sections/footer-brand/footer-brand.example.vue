<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import {
  FooterBrand,
  type FooterLink,
  type FooterLinkGroup,
  type FooterSocialLink,
} from '.'

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
    title: 'Account',
    links: [
      { label: 'Sign in', href: '#' },
      { label: 'Orders', href: '#' },
      { label: 'Wishlist', href: '#' },
      { label: 'Gift cards', href: '#' },
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

const socialLinks: FooterSocialLink[] = [
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'X', href: '#', icon: 'x' },
  { label: 'Facebook', href: '#', icon: 'facebook' },
  { label: 'YouTube', href: '#', icon: 'youtube' },
]

const legalLinks: FooterLink[] = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Imprint', href: '#' },
  { label: 'Cookie settings', href: '#' },
]
</script>

<template>
  <FooterBrand
    brand-name="Basecamp"
    tagline="Outdoor gear for every season, from the trail to the slopes."
    newsletter-description="10% off your first order, and the new season before anyone else."
    copyright="© {year} Basecamp Store. All rights reserved."
    :link-groups="linkGroups"
    :social-links="socialLinks"
    :legal-links="legalLinks"
    v-bind="$attrs" />
</template>
