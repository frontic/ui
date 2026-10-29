<script lang="ts">
/** Explains the purpose of the sheet below its title. */
export default {}
</script>

<script setup lang="ts">
import type { DialogDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DialogDescription, useForwardProps } from 'reka-ui'

const props = defineProps<DialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DialogDescription data-slot="sheet-description" :class="['fui-sheet-description', props.class]" v-bind="forwarded">
    <slot />
  </DialogDescription>
</template>
