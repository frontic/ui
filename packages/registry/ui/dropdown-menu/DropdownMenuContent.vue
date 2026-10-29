<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { DropdownMenuContent, DropdownMenuPortal, injectDropdownMenuRootContext, useForwardPropsEmits } from 'reka-ui'
import { isRightClick, useReturnFocus } from '@library/lib/focus'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DropdownMenuContentProps & { class?: HTMLAttributes['class'] }>(), {
  align: 'start',
  sideOffset: 4,
})
const emits = defineEmits<DropdownMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDropdownMenuRootContext()

// A non-modal menu leaves focus where an outside click or focus took it, a modal one after a right click; Reka gives focus back a task after the menu closes.
const returnFocus = useReturnFocus(() => root.triggerElement.value, { counts: (event) => !root.modal.value || isRightClick(event.detail.originalEvent), defer: true })
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      data-slot="dropdown-menu-content"
      v-bind="{ ...$attrs, ...forwarded }"
      @interact-outside="returnFocus.onInteractOutside"
      @close-auto-focus="returnFocus.onCloseAutoFocus"
      :class="[
        'fui-dropdown-menu-content z-50 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 data-side-bottom:slide-in-from-top-2 data-side-left:slide-in-from-right-2 data-side-right:slide-in-from-left-2 data-side-top:slide-in-from-bottom-2 duration-100 max-h-(--reka-dropdown-menu-content-available-height) origin-(--reka-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto data-closed:overflow-hidden',
        props.class,
      ]"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
