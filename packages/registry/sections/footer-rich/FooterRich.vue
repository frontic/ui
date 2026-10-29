<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FooterLink, FooterLinkGroup, FooterSocialLink } from './types'
import { ref } from 'vue'
import { Button } from '@library/components/ui/button'
import { Input } from '@library/components/ui/input'
import { interpolate } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** Titled columns of links beside the newsletter signup, such as Shop, Help and Company. */
    linkGroups?: FooterLinkGroup[]
    /** Links in the bottom row, such as the imprint and privacy policy. */
    legalLinks?: FooterLink[]
    /** The store's name, shown in the bottom row before the copyright. */
    brandName?: string
    /** Shown as the newsletter signup's heading. */
    newsletterHeading?: string
    /** Shown under the newsletter heading. */
    newsletterDescription?: string
    /** Shown in the empty email field and read as its screen-reader name. */
    emailPlaceholder?: string
    /** Shown on the button that subscribes to the newsletter. */
    subscribeLabel?: string
    /** Shown after the brand name; `{year}` is replaced with the current year. */
    copyright?: string
    /** Links to the store's social profiles, shown as icons under the signup. */
    socialLinks?: FooterSocialLink[]
    class?: HTMLAttributes['class']
  }>(),
  {
    linkGroups: () => [],
    legalLinks: () => [],
    brandName: 'STORE',
    newsletterHeading: 'Stay in the loop',
    newsletterDescription: 'Subscribe to get special offers, new arrivals, and style tips.',
    emailPlaceholder: 'Enter your email',
    subscribeLabel: 'Subscribe',
    copyright: '© {year} All rights reserved.',
    socialLinks: () => [
      { label: 'Instagram', href: '#', icon: 'instagram' },
      { label: 'X', href: '#', icon: 'x' },
      { label: 'Facebook', href: '#', icon: 'facebook' },
      { label: 'YouTube', href: '#', icon: 'youtube' },
    ],
  },
)
const emit = defineEmits<{
  /** Fires with the entered email when the visitor submits the newsletter form. */
  subscribe: [email: string]
}>()

const email = ref('')
const year = String(new Date().getFullYear())

const socialIcons: Record<FooterSocialLink['icon'], string> = {
  instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm9 9.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01',
  x: 'M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768m2.46-2.46L20 4',
  facebook: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  youtube:
    'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17M10 15l5-3-5-3z',
  pinterest:
    'M12 2a10 10 0 0 0-3.64 19.33c-.1-.94-.2-2.4 0-3.43l1.45-6.15s-.37-.74-.37-1.84c0-1.72 1-3 2.24-3 1.06 0 1.57.8 1.57 1.75 0 1.06-.68 2.65-1.03 4.12-.29 1.23.62 2.24 1.84 2.24 2.21 0 3.9-2.33 3.9-5.68 0-2.97-2.13-5.04-5.18-5.04-3.53 0-5.6 2.64-5.6 5.38 0 1.06.41 2.2.92 2.82.1.12.11.23.08.35l-.34 1.4c-.06.23-.18.28-.42.17-1.56-.73-2.54-3-2.54-4.82C4.33 7.12 7.53 4.2 12.28 4.2c3.78 0 6.72 2.7 6.72 6.3 0 3.76-2.37 6.78-5.66 6.78-1.1 0-2.14-.58-2.5-1.26l-.68 2.6c-.25.95-.92 2.14-1.37 2.86A10 10 0 0 0 12 2z',
  tiktok: 'M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5',
}
</script>

<template>
  <footer data-slot="footer-rich" :class="['fui-footer-rich @container', props.class]">
    <div data-slot="footer-rich-newsletter" class="fui-footer-rich-newsletter">
      <div class="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 @2xl:px-6 @4xl:grid-cols-5 @4xl:gap-12 @5xl:px-8">
        <div class="flex flex-col gap-4 @4xl:col-span-2">
          <div class="flex flex-col gap-1">
            <h3 data-slot="footer-rich-heading" class="fui-footer-rich-heading">
              {{ newsletterHeading }}
            </h3>
            <p data-slot="hint" class="fui-hint">{{ newsletterDescription }}</p>
          </div>
          <form class="flex flex-col gap-2 @sm:flex-row" @submit.prevent="emit('subscribe', email)">
            <Input v-model="email" type="email" :placeholder="emailPlaceholder" :aria-label="emailPlaceholder" class="flex-1" />
            <Button type="submit">{{ subscribeLabel }}</Button>
          </form>
          <div v-if="socialLinks.length" class="flex gap-4">
            <a v-for="social in socialLinks" :key="social.label" :href="social.href" :aria-label="social.label" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                data-icon
                aria-hidden="true"
              >
                <path :d="socialIcons[social.icon]" />
              </svg>
            </a>
          </div>
        </div>
        <div v-if="linkGroups.length" class="grid grid-cols-2 gap-x-6 gap-y-10 @xl:grid-cols-3 @4xl:col-span-3">
          <div v-for="group in linkGroups" :key="group.title" class="flex flex-col gap-3">
            <h3 data-slot="footer-rich-title" class="fui-footer-rich-title">
              {{ group.title }}
            </h3>
            <ul class="flex flex-col gap-2">
              <li v-for="link in group.links" :key="link.label">
                <a :href="link.href" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div data-slot="footer-rich-legal" class="fui-footer-rich-legal">
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 @2xl:px-6 @3xl:flex-row @3xl:items-center @3xl:justify-between @5xl:px-8">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span data-slot="footer-rich-legal-logo" class="fui-footer-rich-legal-logo">{{ brandName }}</span>
          <span data-slot="footer-rich-legal-note" class="fui-footer-rich-legal-note">{{ interpolate(copyright, { year }) }}</span>
        </div>
        <div v-if="legalLinks.length" class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a v-for="link in legalLinks" :key="link.label" :href="link.href" data-slot="footer-rich-legal-link" class="fui-footer-rich-legal-link outline-none focus-visible:fui-focus-ring">{{
            link.label
          }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>
