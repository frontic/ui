<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { Price } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Price :price="{ amount: 9000, currency: 'EUR', ref: 11100 }" v-bind="$attrs">
    <template #hint>Incl. VAT, plus <a href="#">shipping</a></template>
  </Price>
</template>
