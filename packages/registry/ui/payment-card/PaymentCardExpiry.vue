<script lang="ts">
/** Takes a card's expiry as MM/YY, adding the slash as it is typed; or frames a payment provider's hosted expiry field. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PaymentCardHostedField } from './hosted'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@library/components/ui/input-group'
import { formatPaymentCardExpiry, paymentCardExpiryProblem } from './card'
import { retype, useValidityMessage } from './input'
import PaymentCardHost from './PaymentCardHost.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** A provider's hosted field's state, when the default slot holds its iframe instead of our input. */
    hosted?: PaymentCardHostedField
    /** Shown while the field is empty. */
    placeholder?: string
    /** Shown when the expiry has too few digits. */
    incompleteMessage?: string
    /** Shown when the month is not 01 to 12. */
    invalidMessage?: string
    /** Shown when the month is already past. */
    expiredMessage?: string
    class?: HTMLAttributes['class']
  }>(),
  { placeholder: 'MM/YY', incompleteMessage: 'Enter the expiry as MM/YY.', invalidMessage: 'Enter a month from 01 to 12.', expiredMessage: 'This card has expired.' },
)

/** The expiry as MM/YY. */
const expiry = defineModel<string>({ default: '' })

defineSlots<{
  /** Holds a payment provider's hosted expiry field in place of our input; pass its state as `hosted`. */
  default?: () => unknown
  /** Sits at the end of the field. */
  end?: () => unknown
}>()

const group = useTemplateRef<{ $el: HTMLElement }>('group')
const input = () => group.value?.$el.querySelector<HTMLInputElement>('input[data-slot="input-group-control"]')

const display = ref(formatPaymentCardExpiry(expiry.value))
watch(expiry, (next) => {
  if (next !== display.value) display.value = formatPaymentCardExpiry(next)
})

function type(raw: string | number) {
  const text = String(raw)
  const formatted = formatPaymentCardExpiry(text)
  expiry.value = formatted
  return retype(display, input(), text, formatted)
}

const problem = computed(() => paymentCardExpiryProblem(expiry.value))
useValidityMessage(
  input,
  computed(() => ({ incomplete: props.incompleteMessage, invalid: props.invalidMessage, expired: props.expiredMessage, none: '' })[problem.value ?? 'none']),
)
</script>

<template>
  <InputGroup ref="group" data-slot="payment-card-expiry" :class="props.class">
    <PaymentCardHost v-if="$slots.default" :hosted="hosted" :incomplete-message="incompleteMessage">
      <slot />
    </PaymentCardHost>
    <InputGroupInput v-else v-bind="$attrs" :model-value="display" :placeholder="placeholder" inputmode="numeric" autocomplete="cc-exp" @update:model-value="type" />
    <InputGroupAddon v-if="$slots.end" align="inline-end">
      <slot name="end" />
    </InputGroupAddon>
  </InputGroup>
</template>
