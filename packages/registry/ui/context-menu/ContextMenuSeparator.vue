<script setup lang="ts">
import type { ContextMenuSeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuSeparator, useForwardProps } from 'reka-ui'

const props = defineProps<ContextMenuSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ContextMenuSeparator data-slot="context-menu-separator" v-bind="forwarded" :class="['fui-context-menu-separator', props.class]" />
</template>
