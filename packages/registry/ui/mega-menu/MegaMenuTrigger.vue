<script setup lang="ts">
import type { NavigationMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NavigationMenuTrigger, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<
    NavigationMenuTriggerProps & {
      /** Shows a chevron after the label that turns while the panel is open. */
      chevron?: boolean
      class?: HTMLAttributes['class']
    }
  >(),
  { chevron: true },
)

const delegatedProps = reactiveOmit(props, 'class', 'chevron')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <NavigationMenuTrigger
    data-slot="mega-menu-trigger"
    v-bind="forwardedProps"
    :class="['fui-mega-menu-trigger group/mega-menu-trigger transition-colors outline-none focus-visible:fui-focus-ring', props.class]"
  >
    <slot />
    <IconPlaceholder
      v-if="props.chevron"
      lucide="ChevronDownIcon"
      tabler="IconChevronDown"
      hugeicons="ArrowDown01Icon"
      phosphor="CaretDownIcon"
      remixicon="RiArrowDownSLine"
      data-icon
      class="relative top-px ms-1 transition duration-300 group-aria-expanded/mega-menu-trigger:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuTrigger>
</template>
