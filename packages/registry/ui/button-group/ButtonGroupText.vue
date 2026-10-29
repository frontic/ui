<script lang="ts">
/** Shows a text label as part of a button group. */
export default {}
</script>

<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { inject } from 'vue'
import { BUTTON_GROUP_ORIENTATION } from './context'

interface Props extends PrimitiveProps {
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
})

const orientation = inject(BUTTON_GROUP_ORIENTATION, undefined)
</script>

<template>
  <Primitive data-slot="button-group-text" :data-orientation="orientation" :as="as" :as-child="asChild" :class="['fui-button-group-text **:data-icon:pointer-events-none', props.class]">
    <slot />
  </Primitive>
</template>
