<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { RecentOrders, type OrderStatus, type RecentOrder } from '.'

defineOptions({ inheritAttrs: false })

const PRODUCTS = {
  blizzardDefender: { name: 'Blizzard Defender', amount: 12600 },
  polarLightSkiJacket: { name: 'Polar Light Ski Jacket', amount: 7900 },
  winterwonderParka: { name: 'Winterwonder Parka', amount: 13200 },
  frostEscapeParka: { name: 'Frost Escape Parka', amount: 14900 },
  northernLightHybridJacket: {
    name: 'Northern Light Hybrid Jacket',
    amount: 11500,
  },
  mountainViewSkiGoggles: { name: 'Mountain View Ski Goggles', amount: 6695 },
  snowflakeSkiGoggles: { name: 'Snowflake Ski Goggles', amount: 12700 },
  alpineViewHorizon: { name: 'Alpine View Horizon', amount: 8400 },
  trailMaster22: { name: 'TrailMaster 22', amount: 14100 },
  alpinTechNavigator45: { name: 'AlpinTech Navigator 45', amount: 15000 },
  trailSprinter22: { name: 'Trail Sprinter 22', amount: 4800 },
}
type Product = (typeof PRODUCTS)[keyof typeof PRODUCTS]
const P = PRODUCTS
const ALL = Object.values(PRODUCTS)

const order = (
  number: string,
  date: string,
  status: OrderStatus,
  items: Product[],
): RecentOrder => ({
  number: `#${number}`,
  date,
  status,
  items: items.map((item) => item.name),
  total: {
    amount: items.reduce((sum, item) => sum + item.amount, 0),
    currency: 'EUR',
  },
})

const day = (month: number, date: number) =>
  new Date(Date.UTC(2026, month - 1, date)).toISOString().slice(0, 10)

const placed: RecentOrder[] = [
  order('FR-20418', day(10, 6), 'processing', [
    P.blizzardDefender,
    P.alpineViewHorizon,
  ]),
  order('FR-20377', day(10, 2), 'shipped', [P.alpinTechNavigator45]),
  order('FR-20291', day(9, 24), 'delivered', [
    P.northernLightHybridJacket,
    P.trailMaster22,
    P.mountainViewSkiGoggles,
  ]),
  order('FR-20155', day(9, 12), 'returned', [P.polarLightSkiJacket]),
  order('FR-20087', day(9, 3), 'delivered', [
    P.winterwonderParka,
    P.frostEscapeParka,
    P.snowflakeSkiGoggles,
    P.trailSprinter22,
  ]),
  // Older orders for the later pages, drawn from the same catalog.
  ...Array.from({ length: 18 }, (_, i) =>
    order(
      `FR-${20030 - i * 57}`,
      day(9, 3 - (i + 1) * 4),
      i % 7 === 3 ? 'returned' : 'delivered',
      Array.from(
        { length: (i % 3) + 1 },
        (_, k) => ALL[(i * 2 + k) % ALL.length]!,
      ),
    ),
  ),
]

const PAGE_SIZE = 5
const page = ref(1)
const orders = computed(() =>
  placed.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
</script>

<template>
  <div class="mx-auto w-full max-w-5xl">
    <RecentOrders
      v-model:page="page"
      :orders="orders"
      :total="placed.length"
      :page-size="PAGE_SIZE"
      v-bind="$attrs" />
  </div>
</template>
