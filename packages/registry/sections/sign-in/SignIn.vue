<script lang="ts">
/** Lets the shopper sign in with an emailed code, a passkey or a password. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, useId } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldDescription, FieldLabel, FieldSeparator } from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@library/components/ui/input-otp'

const props = withDefaults(
  defineProps<{
    /** The address the code was sent to. */
    email: string
    /** Digits in the emailed code; the slots split into two halves. */
    codeLength?: number
    /** Under the code, e.g. when the code can be sent again. */
    codeHint?: string
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Shown above the email field. */
    emailLabel?: string
    /** Shown on the button that lets the shopper change the email address. */
    changeLabel?: string
    /** Shown above the code slots. */
    codeLabel?: string
    /** Shown on the button that submits the code. */
    submitLabel?: string
    /** Shown on the divider above the other sign-in options. */
    separatorLabel?: string
    /** Shown on the button that signs in with a passkey. */
    passkeyLabel?: string
    /** Shown on the button that switches to signing in with a password. */
    passwordLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    codeLength: 6,
    title: 'Sign in',
    description: 'No password needed. We email you a code.',
    emailLabel: 'Email',
    changeLabel: 'Change',
    codeLabel: 'Verification code',
    submitLabel: 'Verify and sign in',
    separatorLabel: 'or',
    passkeyLabel: 'Use a passkey',
    passwordLabel: 'Sign in with password',
  },
)
const emit = defineEmits<{
  /** Fires when the customer asks to change the email address the code was sent to. */
  change: []
  /** Fires with the entered code when the customer completes or submits it. */
  submit: [code: string]
  /** Fires when the customer chooses to sign in with a passkey. */
  passkey: []
  /** Fires when the customer chooses to sign in with a password instead. */
  password: []
}>()

/** The code entered so far; submitted once all its digits are filled. */
const code = defineModel<string>('code', { default: '' })

const id = useId()
const half = computed(() => Math.ceil(props.codeLength / 2))
const complete = computed(() => code.value.length === props.codeLength)
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="flex flex-col gap-6" @submit.prevent="complete && emit('submit', code)">
        <Field>
          <FieldLabel :for="`${id}-email`">{{ emailLabel }}</FieldLabel>
          <div class="flex gap-2">
            <Input :id="`${id}-email`" type="email" :model-value="email" readonly />
            <Button type="button" variant="outline" color="neutral" @click="emit('change')">{{ changeLabel }}</Button>
          </div>
        </Field>
        <Field>
          <FieldLabel>{{ codeLabel }}</FieldLabel>
          <InputOTP v-model="code" :maxlength="codeLength" @complete="emit('submit', $event)">
            <InputOTPGroup class="min-w-0">
              <InputOTPSlot v-for="index in half" :key="index" :index="index - 1" />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup class="min-w-0">
              <InputOTPSlot v-for="index in codeLength - half" :key="index" :index="half + index - 1" />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription v-if="codeHint">{{ codeHint }}</FieldDescription>
        </Field>
        <Button type="submit" class="w-full" :disabled="!complete">{{ submitLabel }}</Button>
        <FieldSeparator>{{ separatorLabel }}</FieldSeparator>
        <div class="flex flex-col gap-2">
          <Button type="button" variant="outline" color="neutral" class="w-full" @click="emit('passkey')">
            <IconPlaceholder lucide="KeyRoundIcon" tabler="IconKey" hugeicons="Key01Icon" phosphor="KeyIcon" remixicon="RiKey2Line" data-icon />
            {{ passkeyLabel }}
          </Button>
          <Button type="button" variant="ghost" color="neutral" class="w-full" @click="emit('password')">
            <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
            {{ passwordLabel }}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</template>
