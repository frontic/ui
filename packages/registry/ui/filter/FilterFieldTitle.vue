<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
const props = withDefaults(defineProps<PrimitiveProps>(), { as: 'div' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="filter-field-title" class="fui-filter-field-title">
    <slot />
  </Primitive>
</template>
