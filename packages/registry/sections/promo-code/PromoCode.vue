<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the shopper apply promo codes and shows the discounts they take off the order. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PriceType } from '@library/components/ui/price'
import type { AppliedDiscount, PromoNotice } from './types'
import { discounted, MINUS_SIGN } from '@library/lib/cart'
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Price } from '@library/components/ui/price'
import { Separator } from '@library/components/ui/separator'
import PromoCodeField from './PromoCodeField.vue'

const props = withDefaults(
  defineProps<{
    /** The order before codes: `amount` in minor units, with its currency and precision. */
    subtotal: PriceType
    /** The codes and gift cards on the order, each shown as a removable chip and a summary row. */
    applied?: AppliedDiscount[]
    /** A success message under the code field, e.g. after a code was applied. */
    notice?: PromoNotice
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Shown above the code field. */
    codeLabel?: string
    /** Shown in the empty code field. */
    placeholder?: string
    /** Shown on the button that applies the entered code. */
    applyLabel?: string
    /** Shown under the code field, e.g. which codes can be combined. */
    hint?: string
    /** Screen-reader label of the button that removes a code from the order. */
    removeLabel?: (label: string) => string
    /** Shown beside the order amount before codes. */
    subtotalLabel?: string
    /** Shown beside the amount left to pay after all codes. */
    totalLabel?: string
    /** Put before each amount a code takes off. */
    minusSign?: string
    /** BCP 47 locale the amounts are formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    applied: () => [],
    title: 'Promo code',
    codeLabel: 'Code',
    placeholder: 'Enter a code',
    applyLabel: 'Apply',
    removeLabel: (label: string) => `Remove ${label}`,
    subtotalLabel: 'Subtotal',
    totalLabel: 'To pay',
    minusSign: MINUS_SIGN,
  },
)
const emit = defineEmits<{
  /** Fires with the trimmed code when the shopper applies a non-empty promo code. */
  apply: [code: string]
  /** Fires with the applied code when the shopper removes it. */
  remove: [code: AppliedDiscount]
}>()
/** The code typed into the field. */
const code = defineModel<string>({ default: '' })

const money = (amount: number): PriceType => ({ ...props.subtotal, amount })
const total = computed(() => discounted(props.subtotal, props.applied))
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <PromoCodeField
        v-model="code"
        :applied="applied"
        :notice="notice"
        :code-label="codeLabel"
        :placeholder="placeholder"
        :apply-label="applyLabel"
        :hint="hint"
        :remove-label="removeLabel"
        @apply="emit('apply', $event)"
        @remove="emit('remove', $event)"
      />
    </CardContent>
    <CardFooter class="flex-col items-stretch gap-3">
      <Separator />
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span data-slot="hint" class="fui-hint">{{ subtotalLabel }}</span>
          <Price align="end" :price="subtotal" size="sm" :locale="locale" />
        </div>
        <div v-for="entry in applied" :key="entry.id" class="flex items-center justify-between">
          <span data-slot="hint" class="fui-hint">{{ entry.lineLabel ?? entry.label }}</span>
          <span class="flex items-center">{{ minusSign }}<Price align="end" :price="money(entry.amount)" size="sm" :locale="locale" /></span>
        </div>
      </div>
      <Separator />
      <div class="flex items-center justify-between">
        <span data-slot="heading" class="fui-heading">{{ totalLabel }}</span>
        <Price align="end" :price="total" size="lg" :locale="locale" />
      </div>
    </CardFooter>
  </Card>
</template>
