<script setup lang="ts">
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import {
  PaymentCard,
  PaymentCardCvc,
  PaymentCardExpiry,
  PaymentCardNumber,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <PaymentCard v-bind="$attrs">
    <FieldGroup class="w-sm max-w-full">
      <Field name="number" required validation-mode="onBlur">
        <FieldLabel>Card number</FieldLabel>
        <PaymentCardNumber />
        <FieldError />
      </Field>
      <div class="grid grid-cols-2 gap-4">
        <Field name="expiry" required validation-mode="onBlur">
          <FieldLabel>Expiry</FieldLabel>
          <PaymentCardExpiry />
          <FieldError />
        </Field>
        <Field name="cvc" required validation-mode="onBlur">
          <FieldLabel>Security code</FieldLabel>
          <PaymentCardCvc />
          <FieldError />
        </Field>
      </div>
      <Field name="holder">
        <FieldLabel>Name on card</FieldLabel>
        <Input autocomplete="cc-name" />
      </Field>
    </FieldGroup>
  </PaymentCard>
</template>
