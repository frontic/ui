<script setup lang="ts">
import { REGEXP_ONLY_DIGITS } from 'vue-input-otp'
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@library/components/ui/field'
import { InputOtp, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Field name="code" class="w-fit max-w-full">
    <FieldLabel>Verification code</FieldLabel>
    <InputOtp
      :maxlength="6"
      :pattern="REGEXP_ONLY_DIGITS"
      autocomplete="one-time-code"
      v-bind="$attrs">
      <InputOTPGroup>
        <InputOTPSlot v-for="index in 3" :key="index" :index="index - 1" />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot v-for="index in 3" :key="index" :index="index + 2" />
      </InputOTPGroup>
    </InputOtp>
    <FieldDescription>We sent it to you@example.com.</FieldDescription>
  </Field>
</template>
