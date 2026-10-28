<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { ref, useId } from 'vue'
import { Input } from '@library/components/ui/input'
import { Progress } from '@library/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@library/components/ui/radio-group'
import { Switch } from '@library/components/ui/switch'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  FieldValidity,
} from '.'

defineOptions({ inheritAttrs: false })

const id = useId()
const updates = ref(true)
const password = ref('')
const delivery = ref('standard')
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

const ratings = ['Weak', 'Fair', 'Good', 'Strong']
const checks = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/]

function strength(value: string) {
  if (value.length < 8) return 0
  return checks.filter((check) => check.test(value)).length
}
</script>

<template>
  <FieldGroup class="max-w-md">
    <FieldSet>
      <FieldLegend>Contact</FieldLegend>
      <FieldDescription
        >We send your order confirmation and tracking link
        here.</FieldDescription
      >
      <FieldGroup>
        <Field name="email" required validation-mode="onBlur" v-bind="$attrs">
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            placeholder="you@example.com"
            autocomplete="email" />
          <FieldError match="valueMissing"
            >Enter your email for the order confirmation.</FieldError
          >
          <FieldError match="typeMismatch"
            >Enter a full email address, like you@example.com.</FieldError
          >
        </Field>
        <Field name="password" validation-mode="onBlur">
          <FieldLabel>Create account</FieldLabel>
          <FieldDescription
            >Optional. Add a password to track this order
            later.</FieldDescription
          >
          <Input
            v-model="password"
            type="password"
            minlength="8"
            autocomplete="new-password" />
          <Progress
            :model-value="strength(password) * 25"
            aria-label="Password strength" />
          <FieldValidity v-slot="{ validity }">
            <FieldDescription v-if="password && !validity.tooShort">{{
              strength(password)
                ? ratings[strength(password) - 1]
                : 'Use at least 8 characters.'
            }}</FieldDescription>
          </FieldValidity>
          <FieldError match="tooShort"
            >A password needs at least 8 characters.</FieldError
          >
        </Field>
        <Field orientation="horizontal">
          <Switch :id="`${id}-updates`" v-model="updates" />
          <FieldContent>
            <FieldLabel :for="`${id}-updates`">Order updates</FieldLabel>
            <FieldDescription>Email me when my order ships.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </FieldSet>
    <FieldSeparator />
    <FieldSet>
      <FieldLegend>Delivery</FieldLegend>
      <RadioGroup v-model="delivery">
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
    </FieldSet>
  </FieldGroup>
</template>
