<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { PaymentCardBrand } from '@library/components/ui/payment-card'
import type { PriceType } from '@library/components/ui/price'
import type { PaymentOption } from './types'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@library/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@library/components/ui/input-otp'
import { PaymentCard, PaymentCardCvc, PaymentCardExpiry, PaymentCardNumber } from '@library/components/ui/payment-card'
import { Price } from '@library/components/ui/price'
import { RadioAccordion, RadioAccordionContent, RadioAccordionItem, RadioAccordionTrigger } from '@library/components/ui/radio-accordion'

const props = withDefaults(
  defineProps<{
    /** The payment methods the shopper chooses from, one radio row each. */
    options: PaymentOption[]
    /** The amount the pay button charges. */
    total: PriceType
    /** The card's heading. */
    title?: string
    /** Shown under the heading. */
    description?: string
    /** The option that reveals the card fields while selected. */
    cardValue?: string
    /** The card brands whose marks show in the number field, such as the ones the shop accepts. Every brand with a mark when left out. */
    cardBrands?: PaymentCardBrand[]
    /** Shown above the card number field. */
    cardNumberLabel?: string
    /** Shown above the expiry field. */
    expiryLabel?: string
    /** Shown above the security code field. */
    cvcLabel?: string
    /** Shown above the 3-D Secure code field. */
    codeLabel?: string
    /** Shown under the code field, e.g. where the code was sent. */
    codeHint?: string
    /** How many digits the code has, one box each. */
    codeLength?: number
    /** Shown on the pay button, before the total. */
    payLabel?: string
    /** BCP 47 locale the total is formatted in, e.g. `de-DE`; the ConfigProvider's when left out. */
    locale?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Payment',
    cardValue: 'card',
    cardNumberLabel: 'Card number',
    expiryLabel: 'Expiry',
    cvcLabel: 'Security code',
    codeLabel: '3-D Secure code',
    codeLength: 6,
    payLabel: 'Pay',
  },
)
const emit = defineEmits<{
  /** Fires with the selected payment method when the shopper clicks the pay button. */
  pay: [method: string]
}>()
/** The chosen payment method, by its `value`. */
const method = defineModel<string>('method', { default: '' })
/** The card number's digits. */
const cardNumber = defineModel<string>('cardNumber', { default: '' })
/** The card's expiry as MM/YY. */
const expiry = defineModel<string>('expiry', { default: '' })
/** The card's security code. */
const cvc = defineModel<string>('cvc', { default: '' })
/** The 3-D Secure code typed into the code boxes. */
const code = defineModel<string>('code', { default: '' })
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <RadioAccordion v-model="method" variant="outline">
        <RadioAccordionItem v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
          <RadioAccordionTrigger>
            <span v-if="option.detail" class="flex flex-1 flex-wrap items-baseline justify-between gap-x-2">
              <span>{{ option.label }}</span>
              <span data-slot="meta" class="fui-meta">{{ option.detail }}</span>
            </span>
            <template v-else>{{ option.label }}</template>
          </RadioAccordionTrigger>
          <RadioAccordionContent v-if="option.description || option.value === cardValue" class="flex flex-col gap-4">
            <p v-if="option.description">{{ option.description }}</p>
            <PaymentCard v-if="option.value === cardValue">
              <FieldGroup>
                <Field>
                  <FieldLabel>{{ cardNumberLabel }}</FieldLabel>
                  <PaymentCardNumber v-model="cardNumber" :brands="cardBrands" />
                </Field>
                <div class="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>{{ expiryLabel }}</FieldLabel>
                    <PaymentCardExpiry v-model="expiry" />
                  </Field>
                  <Field>
                    <FieldLabel>{{ cvcLabel }}</FieldLabel>
                    <PaymentCardCvc v-model="cvc" />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>{{ codeLabel }}</FieldLabel>
                  <InputOTP v-model="code" :maxlength="codeLength" inputmode="numeric">
                    <InputOTPGroup>
                      <InputOTPSlot v-for="index in codeLength" :key="index" :index="index - 1" />
                    </InputOTPGroup>
                  </InputOTP>
                  <FieldDescription v-if="codeHint">{{ codeHint }}</FieldDescription>
                </Field>
              </FieldGroup>
            </PaymentCard>
          </RadioAccordionContent>
        </RadioAccordionItem>
      </RadioAccordion>
    </CardContent>
    <CardFooter>
      <Button color="checkout" class="w-full" @click="emit('pay', method)">
        <IconPlaceholder lucide="LockIcon" tabler="IconLock" hugeicons="SquareLock02Icon" phosphor="LockKeyIcon" remixicon="RiLockLine" data-icon />
        {{ payLabel }}
        <Price :price="total" size="sm" :locale="locale" class="text-current" />
      </Button>
    </CardFooter>
  </Card>
</template>
