<script setup lang="ts">
import type { SelectTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SelectIcon, SelectTrigger, useForwardProps } from 'reka-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { IconPlaceholder } from '@registry/icon-placeholder'

const trigger = cva('fui-select-trigger whitespace-nowrap outline-none transition disabled:cursor-not-allowed disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0', {
  variants: {
    size: { md: 'fui-select-trigger-md', sm: 'fui-select-trigger-sm' },
  },
  defaultVariants: { size: 'md' },
})

const props = withDefaults(
  defineProps<
    SelectTriggerProps & {
      class?: HTMLAttributes['class']
      /** The height of the trigger. */
      size?: VariantProps<typeof trigger>['size']
    }
  >(),
  { size: 'md' },
)

const delegatedProps = reactiveOmit(props, 'class', 'size')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger data-slot="select-trigger" :data-size="size" v-bind="forwardedProps" :class="[trigger({ size }), props.class]">
    <slot />
    <SelectIcon as-child>
      <IconPlaceholder
        lucide="ChevronDownIcon"
        tabler="IconChevronDown"
        hugeicons="ArrowDown01Icon"
        phosphor="CaretDownIcon"
        remixicon="RiArrowDownSLine"
        data-icon
        class="fui-select-chevron pointer-events-none"
      />
    </SelectIcon>
  </SelectTrigger>
</template>
