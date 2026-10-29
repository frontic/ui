<script setup lang="ts">
import type { PaymentCardBrand } from './card'
import { providePaymentCardContext } from './context'

/** The brand the number's first digits show, or a provider's hosted field reports. */
const brand = defineModel<PaymentCardBrand | undefined>('brand')

providePaymentCardContext({ brand })
</script>

<template>
  <slot />
</template>
