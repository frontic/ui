<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the brand, a short row of links, social links and the copyright. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FooterLink, FooterSocialLink } from './types'
import { Separator } from '@library/components/ui/separator'
import { interpolate } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The row of links between the brand and the social icons. */
    links?: FooterLink[]
    /** The store's name, shown as a text logo. */
    brandName?: string
    /** Where the brand name links to. */
    homeHref?: string
    /** Links to the store's social profiles, shown as icons; none when left out. */
    socialLinks?: FooterSocialLink[]
    /** Names the row of links for screen readers, apart from the header's navigation. */
    navLabel?: string
    /** Shown beside the brand name; `{year}` is replaced with the current year. */
    copyright?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    links: () => [],
    brandName: 'STORE',
    homeHref: '/',
    copyright: '© {year}',
    socialLinks: () => [],
    navLabel: 'Footer',
  },
)
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
  <footer data-slot="footer-minimal" :class="['fui-footer-minimal @container', props.class]">
    <Separator />
    <div class="mx-auto flex w-full max-w-7xl flex-col items-center gap-5 px-4 py-8 @2xl:px-6 @3xl:flex-row @3xl:justify-between @5xl:px-8">
      <div class="flex items-baseline gap-3">
        <a :href="homeHref" data-slot="footer-minimal-logo" class="fui-footer-minimal-logo outline-none focus-visible:fui-focus-ring">{{ brandName }}</a>
        <span data-slot="hint" class="fui-hint">{{ interpolate(copyright, { year }) }}</span>
      </div>
      <nav v-if="links.length" :aria-label="navLabel" class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <a v-for="link in links" :key="link.label" :href="link.href" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">{{ link.label }}</a>
      </nav>
      <div v-if="socialLinks.length" class="flex items-center gap-4">
        <a v-for="social in socialLinks" :key="social.label" :href="social.href" :aria-label="social.label" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
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
  </footer>
</template>
