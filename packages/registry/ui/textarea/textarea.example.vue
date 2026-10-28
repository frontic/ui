<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Textarea } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Textarea
    aria-label="Gift message"
    placeholder="Add a gift message"
    maxlength="200"
    class="max-w-sm"
    v-bind="$attrs" />
</template>
