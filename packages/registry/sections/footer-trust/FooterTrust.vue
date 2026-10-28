<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows trust points such as shipping and returns, accepted payment methods and legal links. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FooterLink, FooterTrustItem } from './types'
import { Badge } from '@library/components/ui/badge'
import { Separator } from '@library/components/ui/separator'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { interpolate } from '@library/lib/text'

const props = withDefaults(
  defineProps<{
    /** The trust points across the top, such as shipping, returns and support, each with an icon. */
    items?: FooterTrustItem[]
    /** Names of the accepted payment methods, one badge each, e.g. `Visa`. */
    paymentMethods?: string[]
    /** Links in the bottom row, such as the imprint and privacy policy. */
    legalLinks?: FooterLink[]
    /** The store's name, filled into `{brand}` in the copyright. */
    brandName?: string
    /** Shown before the payment method badges. */
    paymentsLabel?: string
    /** Shown in the bottom row; `{year}` becomes the current year and `{brand}` the brand name. */
    copyright?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    items: () => [],
    paymentMethods: () => [],
    legalLinks: () => [],
    brandName: 'STORE',
    paymentsLabel: 'We accept',
    copyright: '© {year} {brand}',
  },
)
const year = String(new Date().getFullYear())
</script>

<template>
  <footer data-slot="footer-trust" :class="['fui-footer-trust @container', props.class]">
    <Separator />
    <div class="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 @2xl:px-6 @4xl:grid-cols-4 @5xl:px-8">
      <div v-for="item in items" :key="item.title" class="flex flex-col gap-3 @lg:flex-row @lg:items-center">
        <div data-slot="footer-trust-icon" class="fui-footer-trust-icon flex shrink-0 items-center justify-center">
          <IconPlaceholder v-if="item.icon === 'shipping'" lucide="TruckIcon" tabler="IconTruck" hugeicons="TruckIcon" phosphor="TruckIcon" remixicon="RiTruckLine" data-icon />
          <IconPlaceholder
            v-else-if="item.icon === 'payment'"
            lucide="ShieldCheckIcon"
            tabler="IconShieldCheck"
            hugeicons="ShieldCheckIcon"
            phosphor="ShieldCheckIcon"
            remixicon="RiShieldCheckLine"
            data-icon
          />
          <IconPlaceholder
            v-else-if="item.icon === 'returns'"
            lucide="RefreshCcwIcon"
            tabler="IconRefresh"
            hugeicons="RefreshCcwIcon"
            phosphor="ArrowsCounterClockwiseIcon"
            remixicon="RiRefreshLine"
            data-icon
          />
          <IconPlaceholder v-else lucide="CircleHelpIcon" tabler="IconHelp" hugeicons="HelpCircleIcon" phosphor="QuestionIcon" remixicon="RiQuestionLine" data-icon />
        </div>
        <div class="flex flex-col gap-0.5">
          <p data-slot="section-title" class="fui-section-title">
            {{ item.title }}
          </p>
          <p data-slot="meta" class="fui-meta">{{ item.description }}</p>
        </div>
      </div>
    </div>
    <Separator />
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 @2xl:px-6 @3xl:flex-row @3xl:items-center @3xl:justify-between @5xl:px-8">
      <div v-if="paymentMethods.length" class="flex flex-wrap items-center gap-2">
        <div v-if="paymentsLabel" class="me-1">
          <span data-slot="meta" class="fui-meta">{{ paymentsLabel }}</span>
        </div>
        <Badge v-for="method in paymentMethods" :key="method">{{ method }}</Badge>
      </div>
      <div class="flex flex-col gap-2 @md:flex-row @md:items-center @md:gap-5">
        <span data-slot="hint" class="fui-hint">{{ interpolate(copyright, { year, brand: brandName }) }}</span>
        <div v-if="legalLinks.length" class="flex flex-wrap items-center gap-x-5 gap-y-2">
          <a v-for="link in legalLinks" :key="link.label" :href="link.href" data-slot="link" class="fui-link outline-none focus-visible:fui-focus-ring">{{ link.label }}</a>
        </div>
      </div>
    </div>
  </footer>
</template>
