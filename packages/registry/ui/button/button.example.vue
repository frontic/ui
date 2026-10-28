<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Button } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Button color="buy" v-bind="$attrs">Add to cart</Button>
</template>
