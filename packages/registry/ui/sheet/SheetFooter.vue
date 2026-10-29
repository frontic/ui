<script lang="ts">
/** Holds the actions at the bottom of the sheet. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { Primitive } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>(), { as: 'div' })
</script>

<template>
  <Primitive :as="props.as" :as-child="props.asChild" data-slot="sheet-footer" :class="['fui-sheet-footer', props.class]">
    <slot />
  </Primitive>
</template>
