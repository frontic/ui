<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Holds what the dialog shows while open, scrolling when the content is tall. */
export default {}
</script>

<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { DialogClose, DialogContent, DialogOverlay, DialogPortal, injectDialogRootContext, Presence, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'

const dialogContent = cva('fui-dialog-content', {
  variants: { layout: { fill: 'fui-dialog-content-fill', scroll: 'fui-dialog-content-scroll' } },
  defaultVariants: { layout: 'fill' },
})

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class']
      /** Screen-reader text of the close button in the dialog's top corner. */
      closeLabel?: string
    }
  >(),
  {
    closeLabel: 'Close',
  },
)
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'closeLabel')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectDialogRootContext()
</script>

<template>
  <DialogPortal>
    <DialogOverlay data-slot="dialog-overlay" class="fui-dialog-overlay data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 duration-100 fixed inset-0 z-50" />
    <Presence v-slot="{ present }" :present="root.open.value" :force-mount="props.forceMount || !root.unmountOnHide.value">
      <div
        v-show="props.forceMount || root.unmountOnHide.value || present"
        data-slot="dialog-frame"
        :data-state="root.open.value ? 'open' : 'closed'"
        :class="[
          'fixed inset-0 z-50 grid place-items-center overflow-y-auto py-8 @container data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 duration-100',
          !root.open.value && 'pointer-events-none',
        ]"
      >
        <DialogContent
          data-slot="dialog-content"
          :class="[dialogContent({ layout: 'scroll' }), '@container relative z-50', props.class]"
          v-bind="{ ...$attrs, ...forwarded }"
          force-mount
          @pointer-down-outside="
            (event) => {
              const originalEvent = event.detail.originalEvent
              const target = originalEvent.target as HTMLElement
              if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
                event.preventDefault()
              }
            }
          "
        >
          <slot />

          <DialogClose data-slot="dialog-close" as-child>
            <Button variant="ghost" color="neutral" size="icon-sm" class="absolute top-4 inset-e-4">
              <IconPlaceholder lucide="XIcon" tabler="IconX" hugeicons="Cancel01Icon" phosphor="XIcon" remixicon="RiCloseLine" data-icon />
              <span class="sr-only">{{ closeLabel }}</span>
            </Button>
          </DialogClose>
        </DialogContent>
      </div>
    </Presence>
  </DialogPortal>
</template>
