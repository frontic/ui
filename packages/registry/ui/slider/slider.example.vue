<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Slider } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <!-- The men's jackets run from €52 to €149. -->
  <Slider
    :default-value="[60, 120]"
    :min="50"
    :max="150"
    :step="10"
    :format-options="{
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }"
    locale="en-IE"
    label="Price"
    show-legend
    class="w-72"
    v-bind="$attrs" />
</template>
