<script lang="ts">
/** Frames a payment provider's hosted field inside a card part and joins it to a Field around it, through a hidden input the Field validates. */
export default {}
</script>

<script setup lang="ts">
import type { PaymentCardHostedField } from './hosted'
import { injectFieldRootContext, VisuallyHidden } from 'reka-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useValidityMessage } from './input'

const props = defineProps<{
  /** The provider's field's state. */
  hosted?: PaymentCardHostedField
  /** Shown while the provider's field holds a partial entry and reports no error of its own. */
  incompleteMessage: string
}>()

const field = injectFieldRootContext(null)
const validity = useTemplateRef<{ $el: HTMLInputElement }>('validity')
const input = () => validity.value?.$el

const value = computed(() => (props.hosted && !props.hosted.empty ? 'entered' : ''))
const message = computed(() => (!props.hosted || props.hosted.empty ? '' : (props.hosted.error ?? (props.hosted.complete ? '' : props.incompleteMessage))))
useValidityMessage(input, message)

watch([message, value], async () => {
  await nextTick()
  field?.handleControlInput()
})

let unregister: (() => void) | undefined
onMounted(() => {
  unregister = field?.registerControl({
    id: () => field.fieldId.value,
    element: () => input(),
    getValue: () => value.value || undefined,
    validityElement: () => input(),
  })
})
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <div
    data-slot="payment-card-host"
    :aria-invalid="(field?.invalid.value && !field.disabled.value) || undefined"
    class="flex h-full min-w-0 flex-1 items-center"
    @focusin="field?.handleControlFocus()"
    @focusout="field?.handleControlBlur()"
  >
    <slot />
  </div>
  <VisuallyHidden
    :id="field?.fieldId.value"
    ref="validity"
    as="input"
    feature="focusable"
    aria-hidden="true"
    tabindex="-1"
    :value="value"
    :required="field?.required.value"
    @focus="hosted?.focus?.()"
  />
</template>
