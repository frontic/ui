<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Card } from '@library/components/ui/card'
import {
  CategoryGrid,
  type GridHeader,
  type Product,
  type UiFilter,
  type UiFilterValue,
  type UiSort,
} from '.'

defineOptions({ inheritAttrs: false })

const SHOP = 'https://sw.demo-shop.com'
const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

// The demo shop's men's jackets: catalog names, prices, colours, images and
// links. Each colour of a product is a variant.
const JACKETS = [
  {
    name: 'Summit Series Winter Parka',
    price: { amount: 13200, currency: 'EUR', ref: 15900 },
    rating: 4.7,
    reviewCount: 212,
    variants: [
      {
        slug: 'summit-series-winter-parka-57dec9f4',
        colour: 'Charcoal',
        hex: '#4a4a47',
        image: 'summit-series-winter-parka',
      },
    ],
  },
  {
    name: 'Glacier Explorer',
    price: { amount: 9400, currency: 'EUR' },
    rating: 4.4,
    reviewCount: 96,
    variants: [
      {
        slug: 'glacier-explorer-53fb49de',
        colour: 'Slate blue',
        hex: '#5f7680',
        image: 'glacier-explorer',
      },
    ],
  },
  {
    name: 'Winter Cliffs Hiking Jacket',
    price: { amount: 5200, currency: 'EUR' },
    rating: 4.1,
    reviewCount: 58,
    variants: [
      {
        slug: 'winter-cliffs-hiking-jacket-4d851b8e',
        colour: 'Ochre',
        hex: '#c08a3c',
        image: 'winter-cliffs-hiking-jacket',
      },
    ],
  },
  {
    name: 'Frost Cruiser Softshell',
    price: { amount: 10700, currency: 'EUR' },
    rating: 4.6,
    reviewCount: 143,
    variants: [
      {
        slug: 'frost-cruiser-softshell-4d57b624',
        colour: 'Steel grey',
        hex: '#8e98a4',
        image: 'frost-cruiser-softshell',
      },
    ],
  },
  {
    name: 'Glacier Hiker Coat',
    price: { amount: 8400, currency: 'EUR', ref: 10500 },
    rating: 4.3,
    reviewCount: 77,
    variants: [
      {
        slug: 'glacierhiker-coat-4cbce0c8',
        colour: 'Dark olive',
        hex: '#55573f',
        image: 'glacier-hiker-coat',
      },
    ],
  },
  {
    name: 'Summit Strider',
    price: { amount: 8100, currency: 'EUR' },
    rating: 4.0,
    reviewCount: 41,
    variants: [
      {
        slug: 'summit-strider-4a291024',
        colour: 'Saffron',
        hex: '#e5a63c',
        image: 'summit-strider',
      },
    ],
  },
  {
    name: 'Polar Light Ski Jacket',
    price: { amount: 7900, currency: 'EUR' },
    rating: 4.8,
    reviewCount: 187,
    variants: [
      {
        slug: 'polarlicht-ski-jacket-476160a6',
        colour: 'Dusty pink',
        hex: '#d6aaa6',
        image: 'polar-light-ski-jacket',
      },
    ],
  },
  {
    name: 'Glacier Fever Functional Jacket',
    price: { amount: 6500, currency: 'EUR' },
    rating: 4.2,
    reviewCount: 63,
    variants: [
      {
        slug: 'glacier-fever-functional-jacket-476c5729',
        colour: 'Mustard',
        hex: '#cf9e42',
        image: 'glacier-fever-functional-jacket',
      },
    ],
  },
  {
    name: 'Arctic Fox Winter Jacket',
    price: { amount: 6100, currency: 'EUR', ref: 7900 },
    rating: 4.5,
    reviewCount: 119,
    variants: [
      {
        slug: 'polarfuchs-winter-jacket-47b6cbf5',
        colour: 'Light grey',
        hex: '#d0d0ce',
        image: 'arctic-fox-winter-jacket',
      },
    ],
  },
  {
    name: 'Arctic Mission Jacket',
    price: { amount: 8700, currency: 'EUR' },
    rating: 4.4,
    reviewCount: 88,
    variants: [
      {
        slug: 'arktische-mission-jacket-45628700',
        colour: 'Dark brown',
        hex: '#4d3e34',
        image: 'arctic-mission-jacket',
      },
    ],
  },
  {
    name: 'Blizzard Defender',
    price: { amount: 12600, currency: 'EUR' },
    rating: 4.9,
    reviewCount: 264,
    variants: [
      {
        slug: 'blizzard-defender-455fb5a3',
        colour: 'Aubergine',
        hex: '#3d3347',
        image: 'blizzard-defender-aubergine',
      },
      {
        slug: 'blizzard-defender-41d5aa85',
        colour: 'Dusty rose',
        hex: '#b98a87',
        image: 'blizzard-defender-dusty-rose',
      },
      {
        slug: 'blizzard-defender-393a11b2',
        colour: 'Salmon',
        hex: '#dc967b',
        image: 'blizzard-defender-salmon',
      },
    ],
  },
  {
    name: 'High Altitude Trekking Jacket',
    price: { amount: 6200, currency: 'EUR' },
    rating: 3.9,
    reviewCount: 35,
    variants: [
      {
        slug: 'hoehenrausch-trekking-jacket-3fc839ea',
        colour: 'Olive',
        hex: '#a09d5c',
        image: 'high-altitude-trekking-jacket',
      },
    ],
  },
  {
    name: 'Arctic Fox Hybrid Coat',
    price: { amount: 6800, currency: 'EUR' },
    rating: 4.3,
    reviewCount: 72,
    variants: [
      {
        slug: 'arctic-fox-hybrid-coat-3f543a88',
        colour: 'Terracotta',
        hex: '#c4735f',
        image: 'arctic-fox-hybrid-coat',
      },
    ],
  },
  {
    name: 'Summit Stormer Parka',
    price: { amount: 5700, currency: 'EUR' },
    rating: 4.1,
    reviewCount: 49,
    variants: [
      {
        slug: 'gipfelstuermer-parka-3dcb8f45',
        colour: 'Amber',
        hex: '#e2a240',
        image: 'summit-stormer-parka',
      },
    ],
  },
  {
    name: 'Mountaineer Hybrid Jacket',
    price: { amount: 9100, currency: 'EUR' },
    rating: 4.6,
    reviewCount: 131,
    variants: [
      {
        slug: 'mountaineer-hybrid-jacket-3d91f9e2',
        colour: 'Charcoal',
        hex: '#4a4a47',
        image: 'mountaineer-hybrid-jacket',
      },
    ],
  },
  {
    name: 'Aurora Functional Jacket',
    price: { amount: 7400, currency: 'EUR' },
    rating: 4.2,
    reviewCount: 54,
    variants: [
      {
        slug: 'nordlichter-functional-jacket-3b5b93cb',
        colour: 'Rust',
        hex: '#b0593f',
        image: 'aurora-functional-jacket',
      },
    ],
  },
  {
    name: 'Frost Escape Parka',
    price: { amount: 14900, currency: 'EUR' },
    rating: 4.8,
    reviewCount: 236,
    variants: [
      {
        slug: 'frost-escape-parka-3abd4b58',
        colour: 'Sun yellow',
        hex: '#e5ad40',
        image: 'frost-escape-parka',
      },
    ],
  },
  {
    name: 'Alpine Trekker',
    price: { amount: 12600, currency: 'EUR' },
    rating: 4.7,
    reviewCount: 158,
    variants: [
      {
        slug: 'alpine-trekker-37813563',
        colour: 'Stone grey',
        hex: '#9c9c9a',
        image: 'alpine-trekker',
      },
    ],
  },
  {
    name: 'Arctic Mission Parka',
    price: { amount: 11980, currency: 'EUR' },
    rating: 4.5,
    reviewCount: 102,
    variants: [
      {
        slug: 'arktische-mission-jacket-397a17fd',
        colour: 'Burnt orange',
        hex: '#c8704f',
        image: 'arctic-mission-parka',
      },
    ],
  },
]
type Jacket = (typeof JACKETS)[number]

// Every men's jacket comes in all five sizes.
const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const VARIANTS = JACKETS.flatMap((jacket) => jacket.variants)
const COLOURS = [...new Set(VARIANTS.map((variant) => variant.colour))].sort()
const swatchColors = Object.fromEntries(
  VARIANTS.map((variant) => [variant.colour.toLowerCase(), variant.hex]),
)

const header: GridHeader = {
  announcement: 'Free shipping and returns on all orders',
  logoText: 'BASECAMP',
  cartCount: 3,
  categories: [
    {
      name: 'Women',
      columns: [
        {
          name: 'Winter',
          links: ['Jackets', 'Beanies', 'Goggles', 'Helmets', 'Gloves'].map(
            (name) => ({ name, href: '#' }),
          ),
        },
      ],
    },
    {
      name: 'Men',
      columns: [
        {
          name: 'Winter',
          links: ['Jackets', 'Beanies', 'Goggles', 'Helmets'].map((name) => ({
            name,
            href: '#',
          })),
        },
      ],
    },
    {
      name: 'Equipment',
      columns: [
        { name: 'Equipment', links: [{ name: 'Backpacks', href: '#' }] },
      ],
    },
  ],
}

const breadcrumbs = [
  { label: 'Home', href: '#' },
  { label: 'Men', href: '#' },
  { label: 'Jackets' },
]

const PER_PAGE = 6
const euros = JACKETS.map((jacket) => jacket.price.amount / 100)
const PRICE = {
  min: Math.floor(Math.min(...euros) / 10) * 10,
  max: Math.ceil(Math.max(...euros) / 10) * 10,
}

const state = reactive({
  colours: new Set<string>(),
  sizes: new Set<string>(),
  price: {} as { from?: number; to?: number },
  sort: 'default',
})
const page = ref(1)

const matches = (jacket: Jacket, skip?: 'colour') =>
  (skip === 'colour' ||
    !state.colours.size ||
    jacket.variants.some((variant) => state.colours.has(variant.colour))) &&
  jacket.price.amount / 100 >= (state.price.from ?? PRICE.min) &&
  jacket.price.amount / 100 <= (state.price.to ?? PRICE.max)

const SORTS: Record<string, (a: Jacket, b: Jacket) => number> = {
  'price.amount:asc': (a, b) => a.price.amount - b.price.amount,
  'price.amount:desc': (a, b) => b.price.amount - a.price.amount,
  'name:asc': (a, b) => a.name.localeCompare(b.name),
}

const results = computed(() => {
  const found = JACKETS.filter((jacket) => matches(jacket))
  return SORTS[state.sort] ? [...found].sort(SORTS[state.sort]) : found
})

const filters = computed<UiFilter[]>(() => [
  {
    key: 'colour',
    label: 'Colour',
    type: 'color',
    options: COLOURS.map((colour) => {
      const count = JACKETS.filter(
        (jacket) =>
          matches(jacket, 'colour') &&
          jacket.variants.some((variant) => variant.colour === colour),
      ).length
      const selected = state.colours.has(colour)
      return {
        option: colour,
        value: colour,
        count,
        selected,
        disabled: !count && !selected,
      }
    }),
  },
  {
    key: 'size',
    label: 'Size',
    type: 'default',
    options: SIZES.map((size) => ({
      option: size,
      value: size,
      count: results.value.length,
      selected: state.sizes.has(size),
      disabled: !results.value.length,
    })),
  },
  {
    key: 'price',
    label: 'Price',
    type: 'range',
    options: [],
    data: {
      total: { ...PRICE, total: JACKETS.length },
      result: { ...PRICE, total: results.value.length },
    },
  },
])

const activeFilters = computed(() =>
  state.price.from !== undefined || state.price.to !== undefined
    ? { price: state.price }
    : {},
)

const sortOptions: UiSort[] = [
  { key: 'default', label: 'Relevance', value: 'default' },
  {
    key: 'price.amount:asc',
    label: 'Price: Low to High',
    value: 'price.amount:asc',
  },
  {
    key: 'price.amount:desc',
    label: 'Price: High to Low',
    value: 'price.amount:desc',
  },
  { key: 'name:asc', label: 'Name: A–Z', value: 'name:asc' },
]

const products = computed<Product[]>(() =>
  results.value
    .slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE)
    .map((jacket) => {
      const shown =
        jacket.variants.find((variant) => state.colours.has(variant.colour)) ??
        jacket.variants[0]!
      return {
        key: shown.slug,
        name: jacket.name,
        price: jacket.price,
        cover: { src: image(shown.image) },
        link: { path: `${SHOP}/${shown.slug}` },
        rating: jacket.rating,
        reviewCount: jacket.reviewCount,
        ...(jacket.variants.length > 1
          ? {
              siblings: {
                items: jacket.variants.map((variant) => ({
                  key: variant.slug,
                  name: `${jacket.name}, ${variant.colour}`,
                  cover: { src: image(variant.image) },
                  link: { path: `${SHOP}/${variant.slug}` },
                  colors: {
                    exactColorHex: variant.hex,
                    exactColorName: variant.colour,
                  },
                })),
              },
            }
          : {}),
      }
    }),
)

const setOf = (field: string) =>
  field === 'colour'
    ? state.colours
    : field === 'size'
      ? state.sizes
      : undefined

function addFilter(field: string, value: UiFilterValue) {
  const set = setOf(field)
  if (set) set.add(String(value))
  else if (field === 'price' && typeof value === 'object') state.price = value
}

function removeFilter(field: string, value?: string) {
  const set = setOf(field)
  if (set) {
    if (value === undefined) set.clear()
    else set.delete(value)
  } else if (field === 'price') state.price = {}
}

function reset() {
  state.colours.clear()
  state.sizes.clear()
  state.price = {}
}
</script>

<template>
  <Card class="gap-0 py-0">
    <CategoryGrid
      v-model:page="page"
      :header="header"
      :breadcrumbs="breadcrumbs"
      title="Jackets"
      description="Parkas, softshells and ski jackets for cold days on the mountain and in town, every one in sizes S to XXL."
      :products="products"
      :total-results="results.length"
      :per-page="PER_PAGE"
      :filters="filters"
      :active-filters="activeFilters"
      :sort-options="sortOptions"
      :active-sorting="state.sort"
      :swatch-colors="swatchColors"
      @add-filter="addFilter"
      @remove-filter="removeFilter"
      @sort-result="(sort?: string) => (state.sort = sort ?? 'default')"
      @reset="reset"
      v-bind="$attrs" />
  </Card>
</template>
