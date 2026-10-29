<script setup lang="ts">
import { Button } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Button color="buy" v-bind="$attrs">Add to cart</Button>
</template>
