<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Input } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Input
    type="email"
    placeholder="you@example.com"
    autocomplete="email"
    aria-label="Email"
    class="max-w-sm"
    v-bind="$attrs" />
</template>
