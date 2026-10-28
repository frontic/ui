<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  TagGroup,
  TagGroupItem,
  TagGroupItemDelete,
  TagGroupItemText,
} from '@library/components/ui/tag-group'
import {
  Filter,
  FilterGroup,
  FilterList,
  FilterPrice,
  FilterRange,
  FilterRating,
  FilterReset,
  FilterSwatch,
  FilterSwitch,
} from '.'

defineOptions({ inheritAttrs: false })

// The demo shop's men's jackets: catalog prices in euros, ratings, colours, and
// whether a reference price marks them on sale. Blizzard Defender is one
// product in three colours.
const JACKETS: {
  price: number
  rating: number
  colours: string[]
  sale?: boolean
}[] = [
  { price: 132, rating: 4.7, colours: ['Charcoal'], sale: true },
  { price: 94, rating: 4.4, colours: ['Slate blue'] },
  { price: 52, rating: 4.1, colours: ['Ochre'] },
  { price: 107, rating: 4.6, colours: ['Steel grey'] },
  { price: 84, rating: 4.3, colours: ['Dark olive'], sale: true },
  { price: 81, rating: 4.0, colours: ['Saffron'] },
  { price: 79, rating: 4.8, colours: ['Dusty pink'] },
  { price: 65, rating: 4.2, colours: ['Mustard'] },
  { price: 61, rating: 4.5, colours: ['Light grey'], sale: true },
  { price: 87, rating: 4.4, colours: ['Dark brown'] },
  { price: 126, rating: 4.9, colours: ['Aubergine', 'Dusty rose', 'Salmon'] },
  { price: 62, rating: 3.9, colours: ['Olive'] },
  { price: 68, rating: 4.3, colours: ['Terracotta'] },
  { price: 57, rating: 4.1, colours: ['Amber'] },
  { price: 91, rating: 4.6, colours: ['Charcoal'] },
  { price: 74, rating: 4.2, colours: ['Rust'] },
  { price: 149, rating: 4.8, colours: ['Sun yellow'] },
  { price: 126, rating: 4.7, colours: ['Stone grey'] },
  { price: 119.8, rating: 4.5, colours: ['Burnt orange'] },
]

const HEX: Record<string, string> = {
  Amber: '#e2a240',
  Aubergine: '#3d3347',
  'Burnt orange': '#c8704f',
  Charcoal: '#4a4a47',
  'Dark brown': '#4d3e34',
  'Dark olive': '#55573f',
  'Dusty pink': '#d6aaa6',
  'Dusty rose': '#b98a87',
  'Light grey': '#d0d0ce',
  Mustard: '#cf9e42',
  Ochre: '#c08a3c',
  Olive: '#a09d5c',
  Rust: '#b0593f',
  Saffron: '#e5a63c',
  Salmon: '#dc967b',
  'Slate blue': '#5f7680',
  'Steel grey': '#8e98a4',
  'Stone grey': '#9c9c9a',
  'Sun yellow': '#e5ad40',
  Terracotta: '#c4735f',
}

// Every men's jacket comes in all five sizes.
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const MIN = Math.floor(Math.min(...JACKETS.map((j) => j.price)) / 10) * 10
const MAX = Math.ceil(Math.max(...JACKETS.map((j) => j.price)) / 10) * 10

const sizes = reactive(new Set<string>())
const colours = reactive(new Set<string>())
const price = ref<{ from?: number; to?: number }>({ from: MIN, to: MAX })
const onSale = ref(false)
const rating = ref(0)

const inRange = computed(() =>
  JACKETS.filter(
    (j) =>
      j.price >= (price.value.from ?? MIN) &&
      j.price <= (price.value.to ?? MAX) &&
      (!onSale.value || j.sale) &&
      j.rating >= rating.value,
  ),
)
const shown = computed(() =>
  inRange.value.filter(
    (j) => !colours.size || j.colours.some((c) => colours.has(c)),
  ),
)

const sizeOptions = computed(() =>
  SIZES.map((size) => ({
    option: size,
    value: size,
    count: shown.value.length,
    selected: sizes.has(size),
  })),
)
const colourOptions = computed(() =>
  Object.entries(HEX).map(([colour, hex]) => {
    const count = inRange.value.filter((j) => j.colours.includes(colour)).length
    return {
      value: colour,
      hex,
      label: colour,
      count,
      selected: colours.has(colour),
      disabled: !count && !colours.has(colour),
    }
  }),
)

// Every active filter as a chip; removing one clears that filter.
const active = computed(() => [
  ...(onSale.value
    ? [{ key: 'sale', label: 'On sale', clear: () => (onSale.value = false) }]
    : []),
  ...[...sizes].map((size) => ({
    key: `size-${size}`,
    label: `Size ${size}`,
    clear: () => sizes.delete(size),
  })),
  ...[...colours].map((colour) => ({
    key: `colour-${colour}`,
    label: colour,
    clear: () => colours.delete(colour),
  })),
  ...(price.value.from !== MIN || price.value.to !== MAX
    ? [
        {
          key: 'price',
          label: `€${price.value.from ?? MIN} – €${price.value.to ?? MAX}`,
          clear: () => (price.value = { from: MIN, to: MAX }),
        },
      ]
    : []),
  ...(rating.value
    ? [
        {
          key: 'rating',
          label: `${rating.value} stars & up`,
          clear: () => (rating.value = 0),
        },
      ]
    : []),
])

function remove(keys: unknown[]) {
  for (const chip of active.value) if (keys.includes(chip.key)) chip.clear()
}

function toggle(set: Set<string>, value: string) {
  if (set.has(value)) set.delete(value)
  else set.add(value)
}

function resetAll() {
  sizes.clear()
  colours.clear()
  price.value = { from: MIN, to: MAX }
  onSale.value = false
  rating.value = 0
}
</script>

<template>
  <Filter :reset="resetAll" class="flex w-72 flex-col gap-2" v-bind="$attrs">
    <TagGroup v-if="active.length" aria-label="Active filters" @remove="remove">
      <TagGroupItem v-for="chip in active" :key="chip.key" :value="chip.key">
        <TagGroupItemText>{{ chip.label }}</TagGroupItemText>
        <TagGroupItemDelete />
      </TagGroupItem>
    </TagGroup>
    <FilterSwitch
      label="On sale"
      description="Reduced from the original price"
      :value="onSale"
      @change="onSale = $event" />
    <FilterGroup
      type="collapsible"
      label="Size"
      :active-count="sizes.size || undefined">
      <FilterList :options="sizeOptions" @toggle="toggle(sizes, $event)" />
    </FilterGroup>
    <FilterGroup
      type="collapsible"
      default-open
      label="Colour"
      :active-count="colours.size || undefined">
      <FilterSwatch
        :options="colourOptions"
        @toggle="toggle(colours, $event)" />
    </FilterGroup>
    <FilterGroup
      type="collapsible"
      label="Price"
      :active-count="price.from !== MIN || price.to !== MAX ? 1 : undefined">
      <FilterPrice
        :min="MIN"
        :max="MAX"
        :step="10"
        :precision="0"
        :value="price"
        @change="price = $event" />
      <FilterRange
        unit="€"
        :min="MIN"
        :max="MAX"
        :step="10"
        :value="price"
        @change="price = { from: $event.from ?? MIN, to: $event.to ?? MAX }" />
    </FilterGroup>
    <FilterGroup
      type="collapsible"
      label="Rating"
      :active-count="rating ? 1 : undefined">
      <FilterRating :value="rating" @change="rating = $event" />
    </FilterGroup>
    <FilterReset />
  </Filter>
</template>
