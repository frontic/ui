<script setup lang="ts">
import { computed, ref } from 'vue'
import { PromoCode, type AppliedDiscount } from '.'

defineOptions({ inheritAttrs: false })

// Blizzard Defender, €126.00
const subtotal = { amount: 12600, currency: 'EUR' }
const known: Record<string, AppliedDiscount> = {
  WELCOME10: {
    id: 'WELCOME10',
    kind: 'promo',
    label: 'WELCOME10',
    amount: Math.round(subtotal.amount / 10),
  },
  'GC-5530-1194': {
    id: 'GC-5530-1194',
    kind: 'gift-card',
    label: 'Gift card ••• 4821',
    lineLabel: 'Gift card',
    amount: 5000,
  },
}

const code = ref('GC-5530-1194')
const applied = ref<AppliedDiscount[]>([
  known.WELCOME10!,
  known['GC-5530-1194']!,
])
const notice = computed(() =>
  applied.value.some((entry) => entry.id === 'WELCOME10')
    ? {
        title: 'WELCOME10 applied',
        description:
          '10% off your first order, thanks for subscribing to our newsletter.',
      }
    : undefined,
)

function apply(value: string) {
  const entry = known[value.toUpperCase()]
  if (entry && !applied.value.some((a) => a.id === entry.id))
    applied.value = [...applied.value, entry]
}

function remove(entry: AppliedDiscount) {
  applied.value = applied.value.filter((a) => a.id !== entry.id)
}
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <PromoCode
      v-model="code"
      :subtotal="subtotal"
      :applied="applied"
      :notice="notice"
      description="Have a voucher or gift card? Apply it before you pay."
      hint="One promo code per order. Gift cards can be combined."
      @apply="apply"
      @remove="remove"
      v-bind="$attrs" />
  </div>
</template>
