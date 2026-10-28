<script setup lang="ts">
import { FooterMinimal, type FooterLink, type FooterSocialLink } from '.'

defineOptions({ inheritAttrs: false })

const links: FooterLink[] = [
  { label: 'Women', href: '#' },
  { label: 'Men', href: '#' },
  { label: 'Equipment', href: '#' },
  { label: 'Help', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

const socialLinks: FooterSocialLink[] = [
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'X', href: '#', icon: 'x' },
  { label: 'Facebook', href: '#', icon: 'facebook' },
]
</script>

<template>
  <FooterMinimal
    brand-name="Basecamp"
    :links="links"
    :social-links="socialLinks"
    v-bind="$attrs" />
</template>
