<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds what the alert dialog shows while open. */
export default {}
</script>

<script setup lang="ts">
import type { AlertDialogContentEmits, AlertDialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { nextTick } from 'vue'
import { cva } from 'class-variance-authority'
import { AlertDialogContent, AlertDialogOverlay, AlertDialogPortal, injectDialogRootContext, Presence, useForwardPropsEmits } from 'reka-ui'
import { usingKeyboard, useReturnFocus } from '@library/lib/focus'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    Omit<AlertDialogContentProps, 'forceMount'> & {
      class?: HTMLAttributes['class']
      /** Keeps the content mounted; you control its visibility (render it with v-if). */
      forceMount?: boolean
      /** The dialog width: `sm` stays narrow, `md` widens on larger screens. */
      size?: 'md' | 'sm'
    }
  >(),
  {
    size: 'md',
  },
)
const emits = defineEmits<AlertDialogContentEmits>()

const content = cva('fui-alert-dialog-content group/alert-dialog-content @container pointer-events-auto fixed inset-x-4 top-1/2 z-50 -translate-y-1/2', {
  variants: { size: { md: 'fui-alert-dialog-content-md', sm: 'fui-alert-dialog-content-sm' } },
  defaultVariants: { size: 'md' },
})

const delegatedProps = reactiveOmit(props, 'class', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDialogRootContext()

// Open from the start or opened by a pointer, the dialog focuses itself, which names its title and description, so no button shows a focus ring until the keyboard moves on; opened from the keyboard, Reka's focus on Cancel stays, ring and all. Reka focuses Cancel a tick later, so this runs after it.
function focusDialog(event: Event) {
  if (event.defaultPrevented || usingKeyboard()) return
  event.preventDefault()
  const dialog = event.currentTarget as HTMLElement
  void nextTick(() => nextTick(() => dialog.focus({ preventScroll: true })))
}

// Reka's content is always mounted here, so Reka focuses the trigger as the alert dialog closes.
const returnFocus = useReturnFocus(() => root.triggerElement.value, { open: () => root.open.value, keptMounted: () => true })
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay
      data-slot="alert-dialog-overlay"
      class="fui-alert-dialog-overlay data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 duration-100 fixed inset-0 z-50 supports-backdrop-filter:backdrop-blur-sm"
    />
    <Presence v-slot="{ present }" :present="root.open.value" :force-mount="props.forceMount || !root.unmountOnHide.value">
      <div
        v-show="props.forceMount || root.unmountOnHide.value || present"
        data-slot="alert-dialog-frame"
        :data-state="root.open.value ? 'open' : 'closed'"
        class="pointer-events-none fixed inset-0 z-50 @container data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 duration-100"
      >
        <AlertDialogContent
          data-slot="alert-dialog-content"
          :data-size="size"
          :data-size-sm="size === 'sm' ? '' : undefined"
          v-bind="{ ...$attrs, ...forwarded }"
          force-mount
          :class="[content({ size }), props.class]"
          @open-auto-focus="focusDialog"
          @close-auto-focus="returnFocus.onCloseAutoFocus"
        >
          <slot />
        </AlertDialogContent>
      </div>
    </Presence>
  </AlertDialogPortal>
</template>
