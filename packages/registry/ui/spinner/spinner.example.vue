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
