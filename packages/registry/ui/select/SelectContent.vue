<script lang="ts">
/** Holds the options of the select while it is open. */
export default {}
</script>

<script setup lang="ts">
import type { SelectContentEmits, SelectContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { injectSelectRootContext, SelectContent, SelectPortal, SelectViewport, useForwardPropsEmits } from 'reka-ui'
import { useReturnFocus } from '@library/lib/focus'
import { SelectScrollDownButton, SelectScrollUpButton } from '.'

const selectContent = cva('fui-select-content', {
  variants: { position: { popper: 'fui-select-content-popper', 'item-aligned': 'fui-select-content-item-aligned' } },
  defaultVariants: { position: 'popper' },
})

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SelectContentProps & { class?: HTMLAttributes['class'] }>(), {
  position: 'popper',
  align: 'center',
  sideOffset: 4,
})
const emits = defineEmits<SelectContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const root = injectSelectRootContext()

// The option focused on opening wears the ring even when a pointer opened the select, and the trigger would inherit it.
const { onCloseAutoFocus } = useReturnFocus(() => root.triggerElement.value)
</script>

<template>
  <SelectPortal>
    <SelectContent
      data-slot="select-content"
      :data-align-trigger="position === 'item-aligned'"
      v-bind="{ ...$attrs, ...forwarded }"
      @close-auto-focus="onCloseAutoFocus"
      :class="[
        selectContent({ position }),
        'relative z-50 data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 data-side-bottom:slide-in-from-top-2 data-side-left:slide-in-from-right-2 data-side-right:slide-in-from-left-2 data-side-top:slide-in-from-bottom-2 duration-100 max-h-(--reka-select-content-available-height) origin-(--reka-select-content-transform-origin) overflow-x-hidden overflow-y-auto',
        props.class,
      ]"
    >
      <SelectScrollUpButton />
      <SelectViewport :data-position="position" :class="[position === 'popper' && 'h-(--reka-select-trigger-height) w-full min-w-(--reka-select-trigger-width)']">
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </SelectContent>
  </SelectPortal>
</template>
