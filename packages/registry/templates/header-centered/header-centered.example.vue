<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { HeaderCentered, type NavigationCategory, type NavigationLink } from '.'
import {
  SearchSuggestions,
  type SearchProduct,
  type SearchResult,
} from '@library/components/sections/search-suggestions'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const categories: NavigationCategory[] = [
  {
    name: 'Women',
    featured: [
      {
        name: 'Mountain View Ski Goggles',
        href: '#',
        imageSrc: image('mountain-view-ski-goggles'),
        imageAlt: 'Mountain View Ski Goggles',
        wide: true,
      },
      {
        name: 'Winterwonder Parka',
        href: '#',
        imageSrc: image('winterwonder-parka'),
        imageAlt: 'Winterwonder Parka',
      },
      {
        name: 'Northern Light Hybrid Jacket',
        href: '#',
        imageSrc: image('northern-light-hybrid-jacket-lavender'),
        imageAlt: 'Northern Light Hybrid Jacket',
      },
    ],
    columns: [
      {
        name: 'Winter',
        links: [
          { name: 'Jackets', href: '#' },
          { name: 'Beanies', href: '#' },
          { name: 'Goggles', href: '#' },
          { name: 'Helmets', href: '#' },
          { name: 'Gloves', href: '#' },
        ],
      },
      {
        name: 'Equipment',
        links: [{ name: 'Backpacks', href: '#' }],
      },
    ],
  },
  {
    name: 'Men',
    featured: [
      {
        name: 'Snow Falcon Glide',
        href: '#',
        imageSrc: image('snow-falcon-glide'),
        imageAlt: 'Snow Falcon Glide',
        wide: true,
      },
      {
        name: 'Frost Escape Parka',
        href: '#',
        imageSrc: image('frost-escape-parka'),
        imageAlt: 'Frost Escape Parka',
      },
      {
        name: 'TrailMaster 22',
        href: '#',
        imageSrc: image('trailmaster-22'),
        imageAlt: 'TrailMaster 22',
      },
    ],
    columns: [
      {
        name: 'Winter',
        links: [
          { name: 'Jackets', href: '#' },
          { name: 'Beanies', href: '#' },
          { name: 'Goggles', href: '#' },
          { name: 'Helmets', href: '#' },
        ],
      },
      {
        name: 'Equipment',
        links: [{ name: 'Backpacks', href: '#' }],
      },
    ],
  },
  { name: 'Equipment', href: '#' },
]

const pages: NavigationLink[] = [{ name: 'Sale', href: '#', highlight: true }]

// The Women flyout shows open where the bar has room for it; on a phone the bar
// shows closed.
const menu = ref('Women')
const product = (
  name: string,
  slug: string,
  meta: string,
  amount: number,
): SearchProduct => ({
  name,
  href: `#/p/${slug}`,
  image: image(slug),
  meta,
  price: { amount, currency: 'EUR' },
})
const catalog = [
  product(
    'Frost Escape Parka',
    'frost-escape-parka',
    'Sun yellow · Jackets',
    14900,
  ),
  product('Winterwonder Parka', 'winterwonder-parka', 'Jackets', 18900),
  product(
    'Snowflake Ski Goggles',
    'snowflake-ski-goggles',
    'Mint · Goggles',
    12700,
  ),
  product('TrailMaster 22', 'trailmaster-22', 'Brown · 20L · Backpacks', 14100),
]
const suggestions = [
  { label: 'parka' },
  { label: 'ski goggles' },
  { label: 'backpack' },
]
const query = ref('')
const results = computed<SearchResult>(() => {
  const term = query.value.trim().toLowerCase()
  const has = (text: string) => text.toLowerCase().includes(term)
  return {
    query: query.value.trim(),
    products: catalog.filter((item) => has(item.name) || has(item.meta ?? '')),
    categories: [],
    brands: [],
  }
})
</script>

<template>
  <div class="@container">
    <div class="@5xl:min-h-180">
      <HeaderCentered
        v-model:menu="menu"
        logo-text="Basecamp"
        :categories="categories"
        :pages="pages"
        :cart-count="2"
        v-bind="$attrs">
        <template #search="{ presentation }">
          <SearchSuggestions
            v-model:query="query"
            :presentation="presentation"
            :results="results"
            :suggestions="suggestions"
            placeholder="Search jackets, goggles, packs" />
        </template>
      </HeaderCentered>
    </div>
  </div>
</template>
