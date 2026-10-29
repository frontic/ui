<script setup lang="ts">
import { ref } from 'vue'
import { ShippingAddress, type CountryOption } from '.'

defineOptions({ inheritAttrs: false })

const countries: CountryOption[] = [
  { value: 'de', label: 'Germany' },
  { value: 'at', label: 'Austria' },
  { value: 'ch', label: 'Switzerland' },
  { value: 'it', label: 'Italy' },
  { value: 'nl', label: 'Netherlands' },
]

const firstName = ref('Lena')
const lastName = ref('Huber')
const street = ref('Lindwurmstraße 88')
const postcode = ref('80337')
const city = ref('München')
const country = ref('de')
const sameAsBilling = ref(true)
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <ShippingAddress
      v-model:first-name="firstName"
      v-model:last-name="lastName"
      v-model:street="street"
      v-model:postcode="postcode"
      v-model:city="city"
      v-model:country="country"
      v-model:same-as-billing="sameAsBilling"
      :countries="countries"
      description="Where should we send your order?"
      step="Step 2 of 4"
      country-hint="Free shipping and returns on all orders."
      continue-label="Continue to delivery"
      v-bind="$attrs" />
  </div>
</template>
