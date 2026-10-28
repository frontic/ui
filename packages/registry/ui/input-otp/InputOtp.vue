<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Lets the user enter a one-time code across several slots. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { OTPInputEmits, OTPInputProps, SlotProps } from 'vue-input-otp'
import { reactiveOmit } from '@vueuse/core'
import { useForwardPropsEmits } from 'reka-ui'
import { OTPInput } from 'vue-input-otp'
import { normalizeClass, useAttrs } from 'vue'
import { useFieldControl } from '@library/composables/use-field-control'

// Codes read left to right on any page; the wrapper sets that without a box of its own, so the container stays the parent's flex item.
defineOptions({ inheritAttrs: false })

const props = defineProps<
  OTPInputProps & {
    /** The code, bound with v-model. */
    modelValue?: string
    class?: HTMLAttributes['class']
  }
>()

const emits = defineEmits<OTPInputEmits & { (event: 'update:modelValue', value: string): void }>()

defineSlots<{
  /** Holds the code's slots and separators; gets each slot's character and state, and whether the input is focused or hovered. */
  default?: (props: { slots: SlotProps[]; isFocused: boolean; isHovering: boolean }) => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Delete once Reka's PinInput reads the Field itself.
const attrs = useAttrs()
const { joined, report, field } = useFieldControl({
  props,
  forwarded,
  element: (): HTMLElement | null => document.getElementById((attrs.id as string | undefined) ?? field?.fieldId.value ?? ''),
  id: () => attrs.id as string | undefined,
  focus: 'focus',
  normalize: (value) => String(value ?? ''),
  isFilled: (value) => String(value ?? '').length >= props.maxlength,
})
</script>

<template>
  <div data-slot="input-otp-root" dir="ltr" class="contents">
    <OTPInput
      v-slot="slotProps"
      v-bind="{ ...joined, ...$attrs }"
      :container-class="normalizeClass(['fui-input-otp has-disabled:fui-disabled', props.class])"
      data-slot="input-otp"
      :spellcheck="false"
      class="disabled:cursor-not-allowed"
      @update:model-value="report"
    >
      <slot v-bind="slotProps" />
    </OTPInput>
  </div>
</template>
