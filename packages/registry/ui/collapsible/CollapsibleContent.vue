<script setup lang="ts">
import type { CollapsibleContentProps } from 'reka-ui'
import { CollapsibleContent, useForwardProps } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()
const forwarded = useForwardProps(props)
</script>

<template>
  <CollapsibleContent data-slot="collapsible-content" v-bind="forwarded" class="fui-collapsible-content data-open:animate-collapsible-down data-closed:animate-collapsible-up overflow-hidden">
    <slot />
  </CollapsibleContent>
</template>
