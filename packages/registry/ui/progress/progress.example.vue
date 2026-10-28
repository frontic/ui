<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Progress } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <div class="flex w-xs max-w-full flex-col gap-8 text-sm">
    <div class="flex flex-col gap-2">
      <div class="flex justify-between gap-4">
        <span>Free shipping</span>
        <span class="text-muted-foreground">€30 to go</span>
      </div>
      <Progress :model-value="70" aria-label="Free shipping" v-bind="$attrs" />
    </div>
    <div class="flex flex-col gap-2">
      <span>Checking stock at Basecamp Berlin…</span>
      <Progress :model-value="null" aria-label="Checking stock" />
    </div>
  </div>
</template>
