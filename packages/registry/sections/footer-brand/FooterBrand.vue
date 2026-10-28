<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the brand with link groups, a newsletter signup, social links and legal links. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FooterLink, FooterLinkGroup, FooterSocialLink } from './types'
import { ref } from 'vue'
import { Button } from '@library/components/ui/button'
import { Input } from '@library/components/ui/input'
import { Separator } from '@library/components/ui/separator'
import { interpolate } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The store's name, shown as the logo when there is no `logoSrc` and as the logo image's alt text. */
    brandName?: string
    /** URL of the logo image; the brand name shows as text when left out. */
    logoSrc?: string
    /** Shown under the logo. */
    tagline?: string
    /** Titled columns of links, such as Shop, Help and Company. */
    linkGroups?: FooterLinkGroup[]
    /** Shown as the newsletter signup's heading. */
    newsletterHeading?: string
    /** Shown under the newsletter heading. */
    newsletterDescription?: string
    /** Shown in the empty email field and read as its screen-reader name. */
    emailPlaceholder?: string
    /** Shown on the button that subscribes to the newsletter. */
    subscribeLabel?: string
    /** Links to the store's social profiles, shown as icons. */
    socialLinks?: FooterSocialLink[]
    /** Shown in the bottom row; `{year}` is replaced with the current year. */
    copyright?: string
    /** Links in the bottom row, such as the imprint and privacy policy. */
    legalLinks?: FooterLink[]
    /** Where the logo links to. */
    homeHref?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    brandName: 'STORE',
    logoSrc: '',
    tagline: '',
    linkGroups: () => [],
    newsletterHeading: 'Subscribe to our newsletter',
    newsletterDescription: 'Be the first to know about new collections, exclusive offers, and style tips.',
    emailPlaceholder: 'Enter your email',
    subscribeLabel: 'Subscribe',
    socialLinks: () => [],
    copyright: '© {year} STORE. All rights reserved.',
    legalLinks: () => [],
    homeHref: '/',
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
  <footer data-slot="footer-brand" :class="['fui-footer-brand @container', props.class]">
    <div class="mx-auto max-w-7xl px-4 @2xl:px-6 @5xl:px-8">
      <div class="grid gap-8 py-12 @5xl:grid-cols-6 @5xl:gap-12 @5xl:py-16">
        <div class="@5xl:col-span-2">
          <div class="flex flex-col items-start gap-2">
            <a :href="homeHref" class="inline-block outline-none focus-visible:fui-focus-ring">
              <span v-if="!logoSrc" data-slot="logo" class="fui-logo">{{ brandName }}</span>
              <img v-else :src="logoSrc" :alt="brandName" class="h-8 w-auto" />
            </a>
            <p v-if="tagline" data-slot="hint" class="fui-hint">
              {{ tagline }}
            </p>
          </div>
          <div class="mt-8">
            <div class="flex flex-col gap-1">
              <h3 data-slot="footer-brand-title" class="fui-footer-brand-title">
                {{ newsletterHeading }}
              </h3>
              <p data-slot="hint" class="fui-hint">
                {{ newsletterDescription }}
              </p>
            </div>
            <form class="mt-4 flex flex-col gap-2 @sm:flex-row" @submit.prevent="emit('subscribe', email)">
              <Input v-model="email" type="email" :placeholder="emailPlaceholder" :aria-label="emailPlaceholder" class="flex-1" />
              <Button type="submit">{{ subscribeLabel }}</Button>
            </form>
          </div>
          <div v-if="socialLinks.length" class="mt-6 flex gap-4">
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
        <div class="grid grid-cols-2 gap-x-6 gap-y-10 @2xl:grid-cols-4 @5xl:col-span-4">
          <div v-for="group in linkGroups" :key="group.title" class="flex flex-col gap-3">
            <h3 data-slot="footer-brand-title" class="fui-footer-brand-title">
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
      <Separator />
      <div class="flex flex-col gap-4 py-6 @3xl:flex-row @3xl:items-center @3xl:justify-between">
        <p data-slot="hint" class="fui-hint">
          {{ interpolate(copyright, { year }) }}
        </p>
        <div v-if="legalLinks.length" class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a v-for="link in legalLinks" :key="link.label" :href="link.href" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">{{ link.label }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>
