<script lang="ts" setup>
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), {
  as: 'a',
})
</script>

<template>
  <Primitive data-slot="breadcrumb-link" :as="props.as" :as-child="props.asChild" :class="['fui-breadcrumb-link transition-colors', props.class]">
    <slot />
  </Primitive>
</template>
