<script lang="ts">
/** Gives help text for a field, such as what to enter. */
export default {}
</script>

<script setup lang="ts">
import type { FieldDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { FieldDescription, injectFieldRootContext, useForwardProps } from 'reka-ui'

const props = defineProps<FieldDescriptionProps & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

const field = injectFieldRootContext(null)
</script>

<template>
  <component
    :is="field ? FieldDescription : 'p'"
    v-bind="field ? { ...forwarded, as: props.as ?? 'p' } : { id: props.id }"
    data-slot="field-description"
    :class="['fui-field-description group-data-horizontal/field:text-balance nth-last-2:-mt-1', props.class]"
  >
    <slot />
  </component>
</template>
