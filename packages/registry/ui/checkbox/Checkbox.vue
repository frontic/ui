<script lang="ts">
/** Lets the user switch an option on or off. */
export default {}
</script>

<script setup lang="ts">
import type { CheckboxCheckedState, CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<CheckboxRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<CheckboxRootEmits>()

defineSlots<{
  /** Replaces the check icon; gets the checkbox's value and its checked state, `indeterminate` included. */
  default?: (props: { modelValue: boolean | 'indeterminate'; state: CheckboxCheckedState }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :class="[
      'fui-checkbox peer relative outline-none transition-shadow after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:fui-focus-ring aria-invalid:fui-invalid aria-checked:aria-invalid:fui-invalid group-has-disabled/field:opacity-50 disabled:cursor-not-allowed disabled:fui-disabled',
      props.class,
    ]"
  >
    <CheckboxIndicator data-slot="checkbox-indicator" class="grid place-content-center text-current transition-none">
      <slot v-bind="slotProps">
        <IconPlaceholder v-if="slotProps.state === 'indeterminate'" data-icon lucide="MinusIcon" tabler="IconMinus" hugeicons="MinusSignIcon" phosphor="MinusIcon" remixicon="RiSubtractLine" />
        <IconPlaceholder v-else data-icon lucide="CheckIcon" tabler="IconCheck" hugeicons="Tick02Icon" phosphor="CheckIcon" remixicon="RiCheckLine" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
