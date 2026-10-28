<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { HeaderCheckout, type CheckoutStep } from '.'

defineOptions({ inheritAttrs: false })

const steps: CheckoutStep[] = [
  { label: 'Address', value: 1 },
  { label: 'Shipping', value: 2 },
  { label: 'Payment', value: 3 },
  { label: 'Review', value: 4 },
]
</script>

<template>
  <div class="@container relative">
    <HeaderCheckout
      logo-text="Basecamp"
      :steps="steps"
      :step="3"
      v-bind="$attrs" />
  </div>
</template>
