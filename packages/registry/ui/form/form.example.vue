<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { ref, useId } from 'vue'
import { z } from 'zod'
import { Button } from '@library/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@library/components/ui/radio-group'
import { Form } from '.'

defineOptions({ inheritAttrs: false })

const shipping = z.object({
  name: z.string().trim().min(1, 'Enter the name for the parcel.'),
  email: z.email('Enter a full email address, like you@example.com.'),
  postcode: z.string().regex(/^\d{5}$/, 'Enter a five-digit postcode.'),
  delivery: z.enum(
    ['standard', 'express'],
    'Choose how we deliver the parcel.',
  ),
})

const id = useId()
const options = [
  {
    value: 'standard',
    title: 'Standard',
    description: '3 to 5 working days · €4.99',
  },
  {
    value: 'express',
    title: 'Express',
    description: 'Next working day · €12.90',
  },
]

const errors = ref<Record<string, string>>({})
const sending = ref(false)

/** Stands in for the shop's API, which knows where Basecamp delivers. */
async function submit(values: Record<string, unknown>) {
  sending.value = true
  await new Promise((resolve) => setTimeout(resolve, 400))
  errors.value =
    values.postcode === '00000'
      ? { postcode: "We don't ship to this postcode yet." }
      : {}
  sending.value = false
}
</script>

<template>
  <Form
    :schema="shipping"
    :errors="errors"
    @form-submit="submit"
    v-bind="$attrs">
    <FieldGroup>
      <Field name="name">
        <FieldLabel>Full name</FieldLabel>
        <Input autocomplete="name" />
        <FieldError />
      </Field>
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input type="email" autocomplete="email" />
        <FieldDescription
          >We send your order confirmation here.</FieldDescription
        >
        <FieldError />
      </Field>
      <Field name="postcode">
        <FieldLabel>Postcode</FieldLabel>
        <Input inputmode="numeric" autocomplete="postal-code" />
        <FieldError />
      </Field>
      <Field name="delivery">
        <FieldLabel :native-label="false">Delivery</FieldLabel>
        <RadioGroup>
          <FieldLabel
            v-for="option in options"
            :key="option.value"
            :for="`${id}-${option.value}`">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>{{ option.title }}</FieldTitle>
                <FieldDescription>{{ option.description }}</FieldDescription>
              </FieldContent>
              <RadioGroupItem
                :id="`${id}-${option.value}`"
                :value="option.value" />
            </Field>
          </FieldLabel>
        </RadioGroup>
        <FieldError />
      </Field>
    </FieldGroup>
    <Button type="submit" :disabled="sending">Continue to payment</Button>
  </Form>
</template>
