<script lang="ts">
/** The card marks at the end of a number field: all it offers until the number shows its brand, then that brand's alone. */
export default {}
</script>

<script setup lang="ts">
import type { Component } from 'vue'
import type { PaymentCardBrand } from './card'
import { computed } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import PaymentCardLogoAmex from './PaymentCardLogoAmex.vue'
import PaymentCardLogoDiscover from './PaymentCardLogoDiscover.vue'
import PaymentCardLogoMastercard from './PaymentCardLogoMastercard.vue'
import PaymentCardLogoVisa from './PaymentCardLogoVisa.vue'

const props = defineProps<{
  /** The brand the number shows, if it shows one yet. */
  brand?: PaymentCardBrand
  /** The brands whose marks show, such as the ones the shop accepts; a brand outside them shows a generic card. Every brand with a mark when left out. */
  brands?: PaymentCardBrand[]
}>()

const LOGOS: Partial<Record<PaymentCardBrand, Component>> = { visa: PaymentCardLogoVisa, mastercard: PaymentCardLogoMastercard, amex: PaymentCardLogoAmex, discover: PaymentCardLogoDiscover }

const offered = computed(() => (props.brands ?? (Object.keys(LOGOS) as PaymentCardBrand[])).filter((brand) => LOGOS[brand]))
const shown = computed(() => (props.brand ? offered.value.filter((brand) => brand === props.brand) : offered.value))
</script>

<template>
  <span data-slot="payment-card-brands" :data-brand="brand" class="fui-payment-card-brands">
    <span v-for="name in shown" :key="name" data-slot="payment-card-brand" :data-brand="name" class="fui-payment-card-brand inline-flex overflow-hidden">
      <component :is="LOGOS[name]" class="h-full w-auto" />
    </span>
    <IconPlaceholder v-if="brand && !shown.length" lucide="CreditCardIcon" tabler="IconCreditCard" hugeicons="CreditCardIcon" phosphor="CreditCardIcon" remixicon="RiBankCardLine" data-icon />
  </span>
</template>
