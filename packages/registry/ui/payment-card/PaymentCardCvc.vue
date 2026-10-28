<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Takes a card's security code, as long as the brand the number shows asks for; or frames a payment provider's hosted code field. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PaymentCardHostedField } from './hosted'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@library/components/ui/input-group'
import { digitsOf, paymentCardCvcLengths } from './card'
import { injectPaymentCardContext } from './context'
import { retype, useValidityMessage } from './input'
import PaymentCardHost from './PaymentCardHost.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** A provider's hosted field's state, when the default slot holds its iframe instead of our input. */
    hosted?: PaymentCardHostedField
    /** Shown while the field is empty. */
    placeholder?: string
    /** Shown when the code has too few digits. */
    incompleteMessage?: string
    class?: HTMLAttributes['class']
  }>(),
  { placeholder: 'CVC', incompleteMessage: 'Enter the full security code.' },
)

/** The code's digits. */
const cvc = defineModel<string>({ default: '' })

defineSlots<{
  /** Holds a payment provider's hosted code field in place of our input; pass its state as `hosted`. */
  default?: () => unknown
  /** Sits at the end of the field. */
  end?: () => unknown
}>()

const group = useTemplateRef<{ $el: HTMLElement }>('group')
const input = () => group.value?.$el.querySelector<HTMLInputElement>('input[data-slot="input-group-control"]')
const card = injectPaymentCardContext(null)
const length = computed(() => paymentCardCvcLengths(card?.brand.value))

const display = ref(digitsOf(cvc.value))
watch(cvc, (next) => {
  if (next !== display.value) display.value = digitsOf(next)
})

function type(raw: string | number) {
  const text = String(raw)
  const formatted = digitsOf(text).slice(0, length.value.max)
  cvc.value = formatted
  return retype(display, input(), text, formatted)
}

// A brand found after the code was typed may ask for fewer digits.
watch(length, ({ max }) => digitsOf(cvc.value).length > max && type(cvc.value))

useValidityMessage(
  input,
  computed(() => {
    const digits = digitsOf(cvc.value)
    return digits && digits.length < length.value.min ? props.incompleteMessage : ''
  }),
)
</script>

<template>
  <InputGroup ref="group" data-slot="payment-card-cvc" :class="props.class">
    <PaymentCardHost v-if="$slots.default" :hosted="hosted" :incomplete-message="incompleteMessage">
      <slot />
    </PaymentCardHost>
    <InputGroupInput v-else v-bind="$attrs" :model-value="display" :placeholder="placeholder" :maxlength="length.max" inputmode="numeric" autocomplete="cc-csc" @update:model-value="type" />
    <InputGroupAddon v-if="$slots.end" align="inline-end">
      <slot name="end" />
    </InputGroupAddon>
  </InputGroup>
</template>
