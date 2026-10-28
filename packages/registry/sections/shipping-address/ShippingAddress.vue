<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Lets the shopper enter a shipping address and continue to the next checkout step. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { CountryOption } from './types'
import { useId } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@library/components/ui/card'
import { Checkbox } from '@library/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@library/components/ui/field'
import { Input } from '@library/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@library/components/ui/native-select'

const props = withDefaults(
  defineProps<{
    /** The countries the shopper can ship to, shown in the country select. */
    countries: CountryOption[]
    /** Shown as the card's title. */
    title?: string
    /** Shown under the title. */
    description?: string
    /** Where the address sits in the checkout, e.g. `Step 2 of 4`. */
    step?: string
    /** Shown above the first name field. */
    firstNameLabel?: string
    /** Shown above the last name field. */
    lastNameLabel?: string
    /** Shown above the street field. */
    streetLabel?: string
    /** Shown above the postcode field. */
    postcodeLabel?: string
    /** Shown above the city field. */
    cityLabel?: string
    /** Shown above the country select. */
    countryLabel?: string
    /** Shown under the country select, e.g. which countries you ship to. */
    countryHint?: string
    /** Shown in the country select until the shopper picks one. */
    countryPlaceholder?: string
    /** Shown beside the checkbox that uses this address for billing too. */
    sameAsBillingLabel?: string
    /** Shown on the button that submits the address. */
    continueLabel?: string
    /** Bare drops the edge, shadow and inset, for a section placed inside another Card. */
    surface?: 'raised' | 'bare'
    class?: HTMLAttributes['class']
  }>(),
  {
    surface: 'raised',
    title: 'Shipping address',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    streetLabel: 'Street and number',
    postcodeLabel: 'Postcode',
    cityLabel: 'City',
    countryLabel: 'Country',
    countryPlaceholder: 'Choose a country',
    sameAsBillingLabel: 'Billing address is the same',
    continueLabel: 'Continue',
  },
)
const emit = defineEmits<{
  /** Fires when the shopper submits the address form to continue, once every field is filled. */
  continue: []
}>()
/** The first name the shopper entered. */
const firstName = defineModel<string>('firstName', { default: '' })
/** The last name the shopper entered. */
const lastName = defineModel<string>('lastName', { default: '' })
/** The street and house number the shopper entered. */
const street = defineModel<string>('street', { default: '' })
/** The postcode the shopper entered. */
const postcode = defineModel<string>('postcode', { default: '' })
/** The city the shopper entered. */
const city = defineModel<string>('city', { default: '' })
/** The selected country, by value. */
const country = defineModel<string>('country', { default: '' })
/** Whether the billing address is the same as this one. */
const sameAsBilling = defineModel<boolean>('sameAsBilling', { default: true })

const id = useId()
</script>

<template>
  <Card :surface="surface" :class="props.class">
    <CardHeader>
      <CardTitle as="h3">{{ title }}</CardTitle>
      <CardDescription v-if="description">{{ description }}</CardDescription>
      <CardAction v-if="step" class="col-start-2 row-span-2 row-start-1 justify-self-end">
        <Badge variant="primary" size="sm">{{ step }}</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <form :id="`${id}-form`" @submit.prevent="emit('continue')">
        <FieldGroup>
          <FieldGroup>
            <div class="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel :for="`${id}-first-name`">{{ firstNameLabel }}</FieldLabel>
                <Input :id="`${id}-first-name`" v-model="firstName" required autocomplete="shipping given-name" />
              </Field>
              <Field>
                <FieldLabel :for="`${id}-last-name`">{{ lastNameLabel }}</FieldLabel>
                <Input :id="`${id}-last-name`" v-model="lastName" required autocomplete="shipping family-name" />
              </Field>
            </div>
            <Field>
              <FieldLabel :for="`${id}-street`">{{ streetLabel }}</FieldLabel>
              <Input :id="`${id}-street`" v-model="street" required autocomplete="shipping address-line1" />
            </Field>
            <div class="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel :for="`${id}-postcode`">{{ postcodeLabel }}</FieldLabel>
                <Input :id="`${id}-postcode`" v-model="postcode" required autocomplete="shipping postal-code" />
              </Field>
              <Field class="col-span-2">
                <FieldLabel :for="`${id}-city`">{{ cityLabel }}</FieldLabel>
                <Input :id="`${id}-city`" v-model="city" required autocomplete="shipping address-level2" />
              </Field>
            </div>
            <Field>
              <FieldLabel :for="`${id}-country`">{{ countryLabel }}</FieldLabel>
              <NativeSelect :id="`${id}-country`" v-model="country" required autocomplete="shipping country" class="w-full">
                <NativeSelectOption value="" disabled>{{ countryPlaceholder }}</NativeSelectOption>
                <NativeSelectOption v-for="option in countries" :key="option.value" :value="option.value">{{ option.label }}</NativeSelectOption>
              </NativeSelect>
              <FieldDescription v-if="countryHint">{{ countryHint }}</FieldDescription>
            </Field>
          </FieldGroup>
          <Field orientation="horizontal">
            <Checkbox :id="`${id}-billing`" v-model="sameAsBilling" />
            <FieldLabel :for="`${id}-billing`">{{ sameAsBillingLabel }}</FieldLabel>
          </Field>
        </FieldGroup>
      </form>
    </CardContent>
    <CardFooter>
      <Button type="submit" :form="`${id}-form`" color="checkout" class="w-full">
        {{ continueLabel }}
        <IconPlaceholder lucide="ArrowRightIcon" tabler="IconArrowRight" hugeicons="ArrowRight01Icon" phosphor="ArrowRightIcon" remixicon="RiArrowRightLine" class="rtl:-scale-x-100" data-icon />
      </Button>
    </CardFooter>
  </Card>
</template>
