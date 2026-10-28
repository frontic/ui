<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user select one option of its radio group. */
export default {}
</script>

<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupIndicator, RadioGroupItem, useForwardProps } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<RadioGroupItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <RadioGroupItem
    data-slot="radio-group-item"
    v-bind="forwardedProps"
    :class="[
      'fui-radio-group-item group/radio-group-item peer relative aspect-square outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:fui-focus-ring aria-invalid:fui-invalid group-aria-invalid/radio-group:fui-invalid disabled:cursor-not-allowed disabled:fui-disabled',
      props.class,
    ]"
  >
    <RadioGroupIndicator data-slot="radio-group-indicator" class="flex size-4.5 items-center justify-center">
      <slot>
        <IconPlaceholder
          data-icon
          lucide="CircleIcon"
          tabler="IconCircle"
          hugeicons="CircleIcon"
          phosphor="CircleIcon"
          remixicon="RiCircleLine"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-current"
        />
      </slot>
    </RadioGroupIndicator>
  </RadioGroupItem>
</template>
