<script lang="ts">
/** Shows the search in an overlay: near the top on wide screens, full screen on phones with a Cancel button. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTitle, Presence } from 'reka-ui'
import { provide, toRef } from 'vue'
import { searchOverlay } from './keys'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    /** Names the overlay for screen readers. */
    title?: string
    /** The phone's Cancel button, which closes the overlay. */
    cancelLabel?: string
  }>(),
  { title: 'Search', cancelLabel: 'Cancel' },
)

/** Whether the overlay is open; focus returns to what opened it when it closes. */
const open = defineModel<boolean>('open', { default: false })

provide(searchOverlay, { cancelLabel: toRef(props, 'cancelLabel'), close: () => (open.value = false) })

defineSlots<{
  /** The search shown in the overlay. */
  default?: () => unknown
  /** A SearchOverlayTrigger that opens the overlay and takes focus back when it closes. */
  trigger?: () => unknown
}>()
</script>

<template>
  <DialogRoot v-model:open="open">
    <slot name="trigger" />
    <DialogPortal>
      <DialogOverlay class="fui-search-overlay-backdrop fixed inset-0 z-50 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0" />
      <Presence :present="open">
        <div
          data-slot="search-overlay-frame"
          :data-state="open ? 'open' : 'closed'"
          class="pointer-events-none fixed inset-0 z-50 @container data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 duration-100"
        >
          <DialogContent
            data-slot="search-overlay"
            force-mount
            :class="['fui-search-overlay pointer-events-auto fixed inset-0 outline-none @2xl:inset-x-4 @2xl:top-16 @2xl:bottom-auto @2xl:mx-auto @2xl:max-h-160 @2xl:max-w-2xl', props.class]"
          >
            <DialogTitle class="sr-only">{{ props.title }}</DialogTitle>
            <slot />
          </DialogContent>
        </div>
      </Presence>
    </DialogPortal>
  </DialogRoot>
</template>
