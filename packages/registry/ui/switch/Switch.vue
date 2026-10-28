<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user turn a single setting on or off. */
export default {}
</script>

<script setup lang="ts">
import type { SwitchRootEmits, SwitchRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { cva, type VariantProps } from 'class-variance-authority'
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from 'reka-ui'
import { useTemplateRef } from 'vue'
import { useFieldControl } from '@library/composables/use-field-control'

const root = cva(
  'fui-switch peer group/switch relative outline-none transition-all after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:fui-focus-ring aria-invalid:fui-invalid data-disabled:cursor-not-allowed data-disabled:fui-disabled rtl:-scale-x-100',
  {
    variants: {
      size: { md: 'fui-switch-md', sm: 'fui-switch-sm' },
    },
    defaultVariants: { size: 'md' },
  },
)

const thumb = cva('fui-switch-thumb pointer-events-none block transition-transform rtl:-scale-x-100', {
  variants: {
    size: { md: 'fui-switch-thumb-md', sm: 'fui-switch-thumb-sm' },
  },
  defaultVariants: { size: 'md' },
})

const props = withDefaults(
  defineProps<
    SwitchRootProps & {
      class?: HTMLAttributes['class']
      /** The size of the track and thumb. */
      size?: VariantProps<typeof root>['size']
    }
  >(),
  {
    size: 'md',
  },
)

const emits = defineEmits<SwitchRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

defineSlots<{
  /** Holds content inside the thumb, such as an icon; gets the current value and whether the switch is on. */
  thumb?: (props: { modelValue: boolean; checked: boolean }) => unknown
}>()

// Delete once Reka's Switch reads the Field itself.
const { joined, report } = useFieldControl({
  props,
  forwarded,
  root: useTemplateRef<{ $el: HTMLElement }>('switchRoot'),
  element: (root) => root,
  id: () => props.id,
  focus: 'focus',
  normalize: (value) => value === (props.trueValue ?? true),
  isFilled: (value) => value === true,
})
</script>

<template>
  <SwitchRoot ref="switchRoot" v-slot="slotProps" data-slot="switch" :data-size="size" dir="ltr" v-bind="joined" @update:model-value="report" :class="[root({ size }), props.class]">
    <SwitchThumb data-slot="switch-thumb" :class="thumb({ size })">
      <slot name="thumb" v-bind="slotProps" />
    </SwitchThumb>
  </SwitchRoot>
</template>
