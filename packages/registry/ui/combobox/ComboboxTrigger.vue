<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script lang="ts">
/** Shows the chosen option and opens the combobox list when pressed. */
export default {}
</script>

<script setup lang="ts">
import type { ComboboxTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxTrigger, injectComboboxRootContext, injectFieldRootContext, useForwardProps } from 'reka-ui'
import { computed, inject, onBeforeUnmount, onMounted, useAttrs, watch } from 'vue'
import { comboboxRequired } from './keys'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = defineProps<ComboboxTriggerProps & { class?: HTMLAttributes['class'] }>()
defineSlots<{
  default?: () => unknown
  /** Replaces the chevron; leave it empty to show none. */
  icon?: () => unknown
}>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)

// Joins a Field around the combobox as its control, as Reka's Select trigger does. Delete once Reka's Combobox reads the Field itself.
const field = injectFieldRootContext(null)
const combobox = injectComboboxRootContext()
const required = inject(comboboxRequired, () => false)
const attrs = useAttrs()
const id = () => (attrs.id as string | undefined) ?? field?.fieldId.value
const fieldAttrs = computed(() =>
  field
    ? {
        ...field.dataAttributes.value,
        id: id(),
        'aria-labelledby': field.labelId.value,
        'aria-describedby': field.describedBy.value,
        'aria-invalid': (field.invalid.value && !field.disabled.value) || undefined,
        onFocus: () => field.handleControlFocus(),
        // Opening the list moves focus into its search, which is still the combobox.
        onBlur: () => !combobox.open.value && field.handleControlBlur(),
      }
    : {},
)
watch(combobox.modelValue, (next) => field?.handleControlInput({ value: next }))
let unregister: (() => void) | undefined
onMounted(() => {
  unregister = field?.registerControl({
    id,
    element: () => combobox.triggerElement.value,
    getValue: () => combobox.modelValue.value,
    required,
  })
})
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <ComboboxTrigger
    data-slot="combobox-trigger"
    v-bind="{ ...fieldAttrs, ...forwarded }"
    :class="['fui-combobox-trigger whitespace-nowrap outline-none transition disabled:cursor-not-allowed disabled:fui-disabled **:data-icon:pointer-events-none **:data-icon:shrink-0', props.class]"
    tabindex="0"
  >
    <slot />
    <slot name="icon">
      <IconPlaceholder
        lucide="ChevronDownIcon"
        tabler="IconChevronDown"
        hugeicons="ArrowDown01Icon"
        phosphor="CaretDownIcon"
        remixicon="RiArrowDownSLine"
        data-icon
        class="fui-combobox-chevron pointer-events-none"
      />
    </slot>
  </ComboboxTrigger>
</template>
