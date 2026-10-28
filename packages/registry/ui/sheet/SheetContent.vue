<script lang="ts">
/** Holds what the sheet shows while open. */
export default {}
</script>

<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes, TransitionProps } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { DialogClose, DialogContent, DialogPortal, injectDialogRootContext, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { OverlayTransition, usingKeyboard, useReturnFocus } from '@library/lib/focus'
import SheetOverlay from './SheetOverlay.vue'

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes['class']
  /** Keeps the content mounted; you control its visibility (render it with v-if). */
  forceMount?: boolean
  /** The edge the sheet slides in from; `start` and `end` follow the reading direction, so `end` is the right in a left-to-right page and the left in a right-to-left one. */
  side?: 'top' | 'right' | 'bottom' | 'left' | 'start' | 'end'
  /** Shows the close button in the top corner on the end side. */
  showCloseButton?: boolean
  /** Read by screen readers on the close button. */
  closeLabel?: string
  /** Animates the sheet in and out with Vue's Transition in place of its own animation: a name, classes or JavaScript hooks. Focus goes back to the trigger once it has left. */
  transition?: TransitionProps
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'end',
  showCloseButton: true,
  closeLabel: 'Close',
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'side', 'showCloseButton', 'closeLabel', 'transition')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDialogRootContext()
const content = cva('fui-sheet-content fixed z-50 outline-none bg-clip-padding', {
  variants: {
    side: {
      top: 'fui-sheet-content-top',
      right: 'fui-sheet-content-right',
      bottom: 'fui-sheet-content-bottom',
      left: 'fui-sheet-content-left',
      start: 'fui-sheet-content-start',
      end: 'fui-sheet-content-end',
    },
  },
  defaultVariants: { side: 'end' },
})
const ANIMATE = 'data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 transition duration-200 ease-in-out'
const SIDE_SLIDE = {
  top: 'data-side-top:data-open:slide-in-from-top-10 data-side-top:data-closed:slide-out-to-top-10',
  right: 'data-side-right:data-open:slide-in-from-right-10 data-side-right:data-closed:slide-out-to-right-10',
  bottom: 'data-side-bottom:data-open:slide-in-from-bottom-10 data-side-bottom:data-closed:slide-out-to-bottom-10',
  left: 'data-side-left:data-open:slide-in-from-left-10 data-side-left:data-closed:slide-out-to-left-10',
  start: 'data-open:slide-in-from-start-10 data-closed:slide-out-to-start-10',
  end: 'data-open:slide-in-from-end-10 data-closed:slide-out-to-end-10',
}
const SIDE_LAYOUT = {
  top: 'inset-x-0 top-0 h-auto',
  right: 'inset-y-0 right-0 h-full max-w-3/4',
  bottom: 'inset-x-0 bottom-0 h-auto',
  left: 'inset-y-0 left-0 h-full max-w-3/4',
  start: 'inset-y-0 inset-s-0 h-full max-w-3/4',
  end: 'inset-y-0 inset-e-0 h-full max-w-3/4',
}

// Open from the start or opened by a pointer, the overlay focuses itself, which names its title and description, so no control inside shows a focus ring until the keyboard moves on; opened from the keyboard, reka's focus on the first control stays, ring and all.
function focusSelf(event: Event) {
  if (event.defaultPrevented || usingKeyboard()) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
}

// A non-modal sheet leaves focus where an outside click or focus took it. Kept mounted as it closes, the sheet has Reka focus its trigger the moment it closes.
const returnFocus = useReturnFocus(() => root.triggerElement.value, {
  counts: () => !root.modal.value,
  open: () => root.open.value,
  keptMounted: () => !root.unmountOnHide.value || !!props.forceMount,
  leaves: () => !!props.transition,
})
</script>

<template>
  <DialogPortal>
    <SheetOverlay />
    <OverlayTransition :transition="props.transition" :left="returnFocus.afterLeave">
      <DialogContent
        v-if="!props.transition || root.open.value"
        data-slot="sheet-content"
        :data-side="side"
        :class="[content({ side }), !props.transition && [ANIMATE, SIDE_SLIDE[side]], SIDE_LAYOUT[side], props.class]"
        v-bind="{ ...$attrs, ...forwarded }"
        :force-mount="!!props.transition || props.forceMount"
        @open-auto-focus="focusSelf"
        @interact-outside="returnFocus.onInteractOutside"
        @close-auto-focus="returnFocus.onCloseAutoFocus"
      >
        <slot />

        <DialogClose v-if="showCloseButton" data-slot="sheet-close" as-child>
          <Button variant="ghost" color="neutral" size="icon-sm" class="absolute top-4 inset-e-4">
            <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
            <span class="sr-only">{{ closeLabel }}</span>
          </Button>
        </DialogClose>
      </DialogContent>
    </OverlayTransition>
  </DialogPortal>
</template>
