<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { OrderTracking, type TrackingStep } from '.'

defineOptions({ inheritAttrs: false })

const steps: TrackingStep[] = [
  { title: 'Ordered', date: '2026-10-02', note: 'Payment confirmed' },
  {
    title: 'Packed',
    date: '2026-10-03',
    note: 'Packed at our warehouse in Munich',
  },
  {
    title: 'Shipped',
    date: '2026-10-05',
    note: 'Left the sorting centre this morning · next stop your local depot',
  },
  { title: 'Delivered', note: 'Expected by Oct 9' },
]
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <OrderTracking
      title="Order #FR-20377"
      description="AlpinTech Navigator 45 · placed Oct 2"
      status="In transit"
      :steps="steps"
      :current="3"
      eta="Arriving Friday, Oct 9"
      eta-detail="by 14:00"
      carrier="DHL Parcel"
      tracking-number="00340434161094042557"
      tracking-url="https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=00340434161094042557"
      track-label="Track on DHL"
      v-bind="$attrs" />
  </div>
</template>
