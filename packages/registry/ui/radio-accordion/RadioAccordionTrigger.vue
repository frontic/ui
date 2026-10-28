<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Labels its option and lets the user pick it. */
export default {}
</script>

<script setup lang="ts">
import type { RadioGroupItemProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RadioGroupItem, useForwardProps } from 'reka-ui'
import { inject } from 'vue'
import { radioAccordionItem } from './keys'
import RadioAccordionIndicator from './RadioAccordionIndicator.vue'

const props = defineProps<Omit<RadioGroupItemProps, 'value' | 'disabled'> & { class?: HTMLAttributes['class'] }>()

const forwarded = useForwardProps(reactiveOmit(props, 'class'))

const item = inject(radioAccordionItem)!
</script>

<template>
  <RadioGroupItem
    v-bind="forwarded"
    :value="item.value.value"
    :disabled="item.disabled.value"
    data-slot="radio-accordion-trigger"
    :class="['fui-radio-accordion-trigger cursor-pointer outline-none focus-visible:fui-focus-ring disabled:cursor-not-allowed', props.class]"
  >
    <RadioAccordionIndicator />
    <slot />
  </RadioGroupItem>
</template>
