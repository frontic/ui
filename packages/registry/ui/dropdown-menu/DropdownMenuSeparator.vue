<script setup lang="ts">
import type { DropdownMenuSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuSeparator, useForwardProps } from 'reka-ui'

const props = defineProps<
  DropdownMenuSeparatorProps & {
    class?: HTMLAttributes['class']
  }
>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuSeparator data-slot="dropdown-menu-separator" v-bind="forwarded" :class="['fui-dropdown-menu-separator', props.class]" />
</template>
