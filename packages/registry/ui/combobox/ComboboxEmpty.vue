<script setup lang="ts">
import type { ComboboxEmptyProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxEmpty, useForwardProps } from 'reka-ui'

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ComboboxEmpty data-slot="combobox-empty" v-bind="forwarded" :class="['fui-combobox-empty', props.class]">
    <slot />
  </ComboboxEmpty>
</template>
