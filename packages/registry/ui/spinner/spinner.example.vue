<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { Spinner } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <!-- An add-to-cart button while the cart answers. -->
  <Button color="buy" disabled>
    <Spinner data-icon="inline-start" aria-hidden="true" v-bind="$attrs" />
    Adding to cart
  </Button>
</template>
