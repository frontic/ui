<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PaymentCardBrand } from './card'
import type { PaymentCardHostedField } from './hosted'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@library/components/ui/input-group'
import { digitsOf, formatPaymentCardNumber, paymentCardNumberProblem, paymentCardScheme } from './card'
import { injectPaymentCardContext } from './context'
import { retype, useValidityMessage } from './input'
import PaymentCardHost from './PaymentCardHost.vue'
import PaymentCardBrands from './PaymentCardBrands.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** A provider's hosted field's state, when the default slot holds its iframe instead of our input. */
    hosted?: PaymentCardHostedField
    /** The brands whose marks show at the end, such as the ones the shop accepts; a brand outside them shows a generic card. Every brand with a mark when left out. */
    brands?: PaymentCardBrand[]
    /** Shown while the field is empty. */
    placeholder?: string
    /** Shown when the number has too few digits. */
    incompleteMessage?: string
    /** Shown when the number is no card's. */
    invalidMessage?: string
    class?: HTMLAttributes['class']
  }>(),
  { placeholder: '1234 5678 9012 3456', incompleteMessage: 'Enter the full card number.', invalidMessage: 'This card number is not valid.' },
)

/** The number's digits, without spaces. */
const number = defineModel<string>({ default: '' })

defineSlots<{
  /** Holds a payment provider's hosted number field in place of our input; pass its state as `hosted`. */
  default?: () => unknown
  /** Replaces the brand logos at the end. */
  end?: () => unknown
}>()

const group = useTemplateRef<{ $el: HTMLElement }>('group')
const input = () => group.value?.$el.querySelector<HTMLInputElement>('input[data-slot="input-group-control"]')
const card = injectPaymentCardContext(null)

const display = ref(formatPaymentCardNumber(digitsOf(number.value)))
watch(number, (digits) => {
  if (digitsOf(display.value) !== digits) display.value = formatPaymentCardNumber(digitsOf(digits))
})

function type(raw: string | number) {
  const text = String(raw)
  const formatted = formatPaymentCardNumber(digitsOf(text))
  number.value = digitsOf(formatted)
  return retype(display, input(), text, formatted)
}

const brand = computed(() => props.hosted?.brand ?? paymentCardScheme(number.value)?.brand)
watch(brand, (next) => card && (card.brand.value = next), { immediate: true })

const problem = computed(() => paymentCardNumberProblem(digitsOf(number.value)))
useValidityMessage(
  input,
  computed(() => (problem.value === 'incomplete' ? props.incompleteMessage : problem.value === 'invalid' ? props.invalidMessage : '')),
)
</script>

<template>
  <InputGroup ref="group" data-slot="payment-card-number" :class="props.class">
    <PaymentCardHost v-if="$slots.default" :hosted="hosted" :incomplete-message="incompleteMessage">
      <slot />
    </PaymentCardHost>
    <InputGroupInput
      v-else
      dir="ltr"
      class="rtl:text-right"
      v-bind="$attrs"
      :model-value="display"
      :placeholder="placeholder"
      inputmode="numeric"
      autocomplete="cc-number"
      @update:model-value="type"
    />
    <InputGroupAddon align="inline-end">
      <slot name="end">
        <PaymentCardBrands :brand="brand" :brands="brands" />
      </slot>
    </InputGroupAddon>
  </InputGroup>
</template>
