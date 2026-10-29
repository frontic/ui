<script setup lang="ts">
import { Rating } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Rating :rating="4.6" :count="128" show-value v-bind="$attrs" />
</template>
