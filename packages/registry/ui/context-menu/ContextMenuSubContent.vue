<script setup lang="ts">
import type { DropdownMenuSubContentEmits, DropdownMenuSubContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuSubContent, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<DropdownMenuSubContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DropdownMenuSubContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuSubContent
    data-slot="context-menu-sub-content"
    v-bind="forwarded"
    :class="[
      'fui-context-menu-sub-content z-50 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 data-side-bottom:slide-in-from-top-2 data-side-left:slide-in-from-right-2 data-side-right:slide-in-from-left-2 data-side-top:slide-in-from-bottom-2 duration-100 origin-(--reka-context-menu-content-transform-origin) overflow-hidden',
      props.class,
    ]"
  >
    <slot />
  </ContextMenuSubContent>
</template>
