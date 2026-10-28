<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds what the dialog shows while open. */
export default {}
</script>

<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { DialogClose, DialogContent, DialogPortal, injectDialogRootContext, Presence, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { usingKeyboard, useReturnFocus } from '@library/lib/focus'
import DialogOverlay from './DialogOverlay.vue'

const dialogContent = cva('fui-dialog-content', {
  variants: { layout: { fill: 'fui-dialog-content-fill', scroll: 'fui-dialog-content-scroll' } },
  defaultVariants: { layout: 'fill' },
})

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    Omit<DialogContentProps, 'forceMount'> & {
      class?: HTMLAttributes['class']
      /** Keeps the content mounted; you control its visibility (render it with v-if). */
      forceMount?: boolean
      /** Shows a close button in the dialog's top corner. */
      showCloseButton?: boolean
      /** Screen-reader text of the close button. */
      closeLabel?: string
    }
  >(),
  {
    showCloseButton: true,
    closeLabel: 'Close',
  },
)
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton', 'closeLabel')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDialogRootContext()

// Open from the start or opened by a pointer, the overlay focuses itself, which names its title and description, so no control inside shows a focus ring until the keyboard moves on; opened from the keyboard, reka's focus on the first control stays, ring and all.
function focusSelf(event: Event) {
  if (event.defaultPrevented || usingKeyboard()) return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).focus({ preventScroll: true })
}

// A non-modal dialog leaves focus where an outside click or focus took it. Reka's content is always mounted here, so Reka focuses the trigger as the dialog closes.
const returnFocus = useReturnFocus(() => root.triggerElement.value, { counts: () => !root.modal.value, open: () => root.open.value, keptMounted: () => true })
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <Presence v-slot="{ present }" :present="root.open.value" :force-mount="props.forceMount || !root.unmountOnHide.value">
      <div
        v-show="props.forceMount || root.unmountOnHide.value || present"
        data-slot="dialog-frame"
        :data-state="root.open.value ? 'open' : 'closed'"
        class="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 @container data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 duration-100"
      >
        <DialogContent
          data-slot="dialog-content"
          v-bind="{ ...$attrs, ...forwarded }"
          @open-auto-focus="focusSelf"
          @interact-outside="returnFocus.onInteractOutside"
          @close-auto-focus="returnFocus.onCloseAutoFocus"
          force-mount
          :class="[dialogContent({ layout: 'fill' }), '@container pointer-events-auto relative z-50 max-h-full overflow-y-auto @2xl:max-w-md', props.class]"
        >
          <slot />

          <DialogClose v-if="showCloseButton" data-slot="dialog-close" as-child>
            <Button variant="ghost" color="neutral" size="icon-sm" class="absolute top-5 inset-e-5">
              <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
              <span class="sr-only">{{ closeLabel }}</span>
            </Button>
          </DialogClose>
        </DialogContent>
      </div>
    </Presence>
  </DialogPortal>
</template>
