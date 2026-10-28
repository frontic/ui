<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Groups a card's number, expiry and security code so they share the brand the number shows. */
export default {}
</script>

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
