<script setup lang="ts">
import { ref } from 'vue'
import { ReturnRequest, type ReturnChoice, type ReturnItem } from '.'

defineOptions({ inheritAttrs: false })

const items: ReturnItem[] = [
  {
    id: 'jacket',
    name: 'Northern Light Hybrid Jacket',
    detail: 'Lavender · S',
    price: { amount: 11500, currency: 'EUR' },
  },
  {
    id: 'backpack',
    name: 'TrailMaster 22',
    detail: 'Brown · 20L',
    price: { amount: 14100, currency: 'EUR' },
  },
  {
    id: 'goggles',
    name: 'Mountain View Ski Goggles',
    detail: 'Final sale, not returnable',
    price: { amount: 6695, currency: 'EUR' },
    returnable: false,
  },
]

const refundMethods: ReturnChoice[] = [
  { value: 'original', label: 'Visa •• 4242' },
  { value: 'credit', label: 'Store credit' },
]

const selected = ref(['jacket'])
const reason = ref('fit')
const comment = ref('Runs a little small, swapping for an M.')
const refundTo = ref('original')
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <ReturnRequest
      v-model:selected="selected"
      v-model:reason="reason"
      v-model:comment="comment"
      v-model:refund-to="refundTo"
      description="Order #FR-20291 · delivered Sep 26"
      :items="items"
      :refund-methods="refundMethods"
      v-bind="$attrs" />
  </div>
</template>
