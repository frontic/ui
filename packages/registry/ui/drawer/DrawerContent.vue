<script lang="ts">
/** Holds what the drawer shows while open. */
export default {}
</script>

<script lang="ts" setup>
import type { DrawerContentEmits, DrawerContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { DrawerContent, DrawerHandle, DrawerPortal, injectDrawerRootContext, useForwardPropsEmits } from 'reka-ui'
import { usingKeyboard, useReturnFocus } from '@library/lib/focus'
import DrawerOverlay from './DrawerOverlay.vue'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<DrawerContentProps & { class?: HTMLAttributes['class'] }>(), { finalFocus: true })
const emits = defineEmits<DrawerContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDrawerRootContext()
const content = cva(
  'fui-drawer-content group/drawer-content @container fixed z-50 outline-none will-change-transform data-open:animate-in data-closed:animate-out transition-transform duration-500 ease-out data-swiping:duration-0 data-swiping:select-none',
  {
    variants: {
      direction: {
        down: 'fui-drawer-content-down',
        up: 'fui-drawer-content-up',
        left: 'fui-drawer-content-left',
        right: 'fui-drawer-content-right',
      },
    },
    defaultVariants: { direction: 'down' },
  },
)
const DIRECTION_LAYOUT = {
  down: 'data-open:slide-in-from-bottom-full data-closed:slide-out-to-bottom-full inset-x-0 bottom-0 mt-24 max-h-4/5',
  up: 'data-open:slide-in-from-top-full data-closed:slide-out-to-top-full inset-x-0 top-0 mb-24 max-h-4/5',
  left: 'data-open:slide-in-from-left-full data-closed:slide-out-to-left-full inset-y-0 left-0 max-w-3/4',
  right: 'data-open:slide-in-from-right-full data-closed:slide-out-to-right-full inset-y-0 right-0 max-w-3/4',
}

// Open from the start or opened by a pointer, the overlay focuses itself, which names its title and description, so no control inside shows a focus ring until the keyboard moves on; opened from the keyboard, reka's focus on the first control stays, ring and all.
function focusSelf(event: Event) {
  if (event.defaultPrevented || usingKeyboard()) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
}

// A drawer gives focus back to its trigger unless told otherwise; a non-modal one leaves focus where an outside click or focus took it.
// A task later: a drawer that unmounts inside the press that closes it would otherwise lose focus to that press.
const returnFocus = useReturnFocus(() => root.triggerElement.value, { counts: () => root.modal.value !== true, when: () => props.finalFocus === true, defer: true })
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ ...$attrs, ...forwarded }"
      @open-auto-focus="focusSelf"
      @interact-outside="returnFocus.onInteractOutside"
      @close-auto-focus="returnFocus.onCloseAutoFocus"
      :style="{ transform: 'translate3d(var(--drawer-swipe-movement-x, 0px), var(--drawer-swipe-movement-y, 0px), 0)' }"
      :class="[content({ direction: root.swipeDirection.value }), DIRECTION_LAYOUT[root.swipeDirection.value], props.class]"
    >
      <DrawerHandle v-if="root.swipeDirection.value === 'down'" class="fui-drawer-handle mx-auto shrink-0" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
