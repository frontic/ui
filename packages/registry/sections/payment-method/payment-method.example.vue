<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { ref } from 'vue'
import { PaymentMethod, type PaymentOption } from '.'

defineOptions({ inheritAttrs: false })

const options: PaymentOption[] = [
  { value: 'card', label: 'Card', detail: 'Visa · Mastercard · Amex' },
  {
    value: 'paypal',
    label: 'PayPal',
    description: 'You confirm the payment on PayPal and come straight back.',
  },
  {
    value: 'klarna',
    label: 'Klarna · Pay later',
    detail: 'Unavailable',
    disabled: true,
  },
]

// Frost Escape Parka, two pairs of Mountain Ghost Winter Tactics Gloves and the
// Forest Whisperer Beanie
const total = { amount: 14900 + 9000 * 2 + 11200, currency: 'EUR' }

const method = ref('card')
const cardNumber = ref('4921882010434826')
const expiry = ref('08/29')
const cvc = ref('')
const code = ref('5830')
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <PaymentMethod
      v-model:method="method"
      v-model:card-number="cardNumber"
      v-model:expiry="expiry"
      v-model:cvc="cvc"
      v-model:code="code"
      :options="options"
      :card-brands="['visa', 'mastercard', 'amex']"
      :total="total"
      description="Encrypted and verified by your bank."
      code-hint="Texted by your bank to +49 ••• 77."
      v-bind="$attrs" />
  </div>
</template>
