<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Badge } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Badge variant="new" v-bind="$attrs">New</Badge>
</template>
