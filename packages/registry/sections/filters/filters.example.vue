<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Filters, type FiltersGroup } from '.'

defineOptions({ inheritAttrs: false })

// The demo shop's men's jackets, as the category grid shows them. Blizzard
// Defender is one product in three colours.
const JACKETS = [
  {
    name: 'Summit Series Winter Parka',
    price: { amount: 13200, currency: 'EUR', ref: 15900 },
    colours: [{ colour: 'Charcoal', hex: '#4a4a47' }],
  },
  {
    name: 'Glacier Explorer',
    price: { amount: 9400, currency: 'EUR' },
    colours: [{ colour: 'Slate blue', hex: '#5f7680' }],
    inStock: false,
  },
  {
    name: 'Winter Cliffs Hiking Jacket',
    price: { amount: 5200, currency: 'EUR' },
    colours: [{ colour: 'Ochre', hex: '#c08a3c' }],
  },
  {
    name: 'Frost Cruiser Softshell',
    price: { amount: 10700, currency: 'EUR' },
    colours: [{ colour: 'Steel grey', hex: '#8e98a4' }],
    inStock: false,
  },
  {
    name: 'Glacier Hiker Coat',
    price: { amount: 8400, currency: 'EUR', ref: 10500 },
    colours: [{ colour: 'Dark olive', hex: '#55573f' }],
  },
  {
    name: 'Summit Strider',
    price: { amount: 8100, currency: 'EUR' },
    colours: [{ colour: 'Saffron', hex: '#e5a63c' }],
  },
  {
    name: 'Polar Light Ski Jacket',
    price: { amount: 7900, currency: 'EUR' },
    colours: [{ colour: 'Dusty pink', hex: '#d6aaa6' }],
  },
  {
    name: 'Glacier Fever Functional Jacket',
    price: { amount: 6500, currency: 'EUR' },
    colours: [{ colour: 'Mustard', hex: '#cf9e42' }],
  },
  {
    name: 'Arctic Fox Winter Jacket',
    price: { amount: 6100, currency: 'EUR', ref: 7900 },
    colours: [{ colour: 'Light grey', hex: '#d0d0ce' }],
  },
  {
    name: 'Arctic Mission Jacket',
    price: { amount: 8700, currency: 'EUR' },
    colours: [{ colour: 'Dark brown', hex: '#4d3e34' }],
  },
  {
    name: 'Blizzard Defender',
    price: { amount: 12600, currency: 'EUR' },
    colours: [
      { colour: 'Aubergine', hex: '#3d3347' },
      { colour: 'Dusty rose', hex: '#b98a87' },
      { colour: 'Salmon', hex: '#dc967b' },
    ],
  },
  {
    name: 'High Altitude Trekking Jacket',
    price: { amount: 6200, currency: 'EUR' },
    colours: [{ colour: 'Olive', hex: '#a09d5c' }],
  },
  {
    name: 'Arctic Fox Hybrid Coat',
    price: { amount: 6800, currency: 'EUR' },
    colours: [{ colour: 'Terracotta', hex: '#c4735f' }],
    inStock: false,
  },
  {
    name: 'Summit Stormer Parka',
    price: { amount: 5700, currency: 'EUR' },
    colours: [{ colour: 'Amber', hex: '#e2a240' }],
  },
  {
    name: 'Mountaineer Hybrid Jacket',
    price: { amount: 9100, currency: 'EUR' },
    colours: [{ colour: 'Charcoal', hex: '#4a4a47' }],
  },
  {
    name: 'Aurora Functional Jacket',
    price: { amount: 7400, currency: 'EUR' },
    colours: [{ colour: 'Rust', hex: '#b0593f' }],
  },
  {
    name: 'Frost Escape Parka',
    price: { amount: 14900, currency: 'EUR' },
    colours: [{ colour: 'Sun yellow', hex: '#e5ad40' }],
  },
  {
    name: 'Alpine Trekker',
    price: { amount: 12600, currency: 'EUR' },
    colours: [{ colour: 'Stone grey', hex: '#9c9c9a' }],
    inStock: false,
  },
  {
    name: 'Arctic Mission Parka',
    price: { amount: 11980, currency: 'EUR' },
    colours: [{ colour: 'Burnt orange', hex: '#c8704f' }],
  },
]
type Jacket = (typeof JACKETS)[number]

const HEX: Record<string, string> = Object.fromEntries(
  JACKETS.flatMap((jacket) =>
    jacket.colours.map(({ colour, hex }) => [colour, hex]),
  ).sort(([a], [b]) => a.localeCompare(b)),
)

// Every men's jacket comes in all five sizes.
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

const MIN =
  Math.floor(Math.min(...JACKETS.map((j) => j.price.amount)) / 1000) * 1000
const MAX =
  Math.ceil(Math.max(...JACKETS.map((j) => j.price.amount)) / 1000) * 1000

const chosen = reactive({
  size: new Set<string>(['M']),
  colour: new Set<string>(),
})
const price = ref([MIN, MAX])
const inStock = ref(false)

const priced = (jacket: Jacket) =>
  jacket.price.amount >= (price.value[0] ?? MIN) &&
  jacket.price.amount <= (price.value[1] ?? MAX)
const stocked = (jacket: Jacket) => !inStock.value || jacket.inStock !== false
const coloured = (jacket: Jacket) =>
  !chosen.colour.size ||
  jacket.colours.some(({ colour }) => chosen.colour.has(colour))

const results = computed(
  () =>
    JACKETS.filter(
      (jacket) => priced(jacket) && stocked(jacket) && coloured(jacket),
    ).length,
)

const groups = computed<FiltersGroup[]>({
  get: () => [
    {
      value: 'size',
      label: 'Size',
      options: SIZES.map((size) => ({
        option: size,
        value: size,
        count: results.value,
        selected: chosen.size.has(size),
      })),
    },
    {
      value: 'colour',
      label: 'Colour',
      kind: 'swatch' as const,
      options: Object.entries(HEX).map(([colour, hex]) => {
        const count = JACKETS.filter(
          (jacket) =>
            priced(jacket) &&
            stocked(jacket) &&
            jacket.colours.some((c) => c.colour === colour),
        ).length
        const selected = chosen.colour.has(colour)
        return {
          value: colour,
          hex,
          label: colour,
          count,
          selected,
          disabled: !count && !selected,
        }
      }),
    },
  ],
  set: (next: FiltersGroup[]) => {
    for (const group of next) {
      const set = group.value === 'size' ? chosen.size : chosen.colour
      set.clear()
      for (const option of group.options)
        if (option.selected) set.add(option.value)
    }
  },
})

const productsLabel = (count: number) =>
  `${count} ${count === 1 ? 'product' : 'products'}`
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <Filters
      v-model:groups="groups"
      v-model:price="price"
      v-model:in-stock="inStock"
      description="Men · Jackets"
      :results="results"
      :price-min="MIN"
      :price-max="MAX"
      :price-step="500"
      :default-open="['price', 'colour']"
      :results-label="productsLabel"
      :show-results-label="(count: number) => `Show ${productsLabel(count)}`"
      v-bind="$attrs" />
  </div>
</template>
