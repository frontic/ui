<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxGroup, ComboboxLabel, useForwardProps } from 'reka-ui'

const props = defineProps<
  ComboboxGroupProps & {
    class?: HTMLAttributes['class']
    /** Shown as the group's label above its options. */
    heading?: string
  }
>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxGroup data-slot="combobox-group" v-bind="forwarded" :class="['overflow-hidden', props.class]">
    <ComboboxLabel v-if="heading" class="fui-combobox-label">
      {{ heading }}
    </ComboboxLabel>
    <slot />
  </ComboboxGroup>
</template>
