<script setup lang="ts">
import { ref, watch } from 'vue'
import { SearchSuggestions, type SearchProduct, type SearchResult } from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=320,format=auto/ui/products/${name}.jpg`
const product = (
  name: string,
  slug: string,
  meta: string,
  amount: number,
  extra: { ref?: number; badge?: SearchProduct['badge'] } = {},
): SearchProduct => ({
  name,
  href: `#/p/${slug}`,
  image: image(slug),
  meta,
  price: { amount, currency: 'EUR', ref: extra.ref },
  badge: extra.badge,
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
    'Summit Series Winter Parka',
    'summit-series-winter-parka',
    'Charcoal · Jackets',
    13200,
    { ref: 15900, badge: { label: 'Sale', variant: 'promo' } },
  ),
  product(
    'Blizzard Defender',
    'blizzard-defender-aubergine',
    'Aubergine · Jackets',
    12600,
  ),
  product(
    'Polar Light Ski Jacket',
    'polar-light-ski-jacket',
    'Dusty pink · Jackets',
    7900,
    { badge: { label: 'New', variant: 'new' } },
  ),
  product(
    'Snowflake Ski Goggles',
    'snowflake-ski-goggles',
    'Mint · Goggles',
    12700,
  ),
  product(
    'Mountain View Ski Goggles',
    'mountain-view-ski-goggles',
    'Goggles',
    9900,
  ),
  product('TrailMaster 22', 'trailmaster-22', 'Brown · 20L · Backpacks', 14100),
]
const categories = [
  { name: 'Parkas', href: '#/c/parkas', count: 14 },
  { name: 'Ski jackets', href: '#/c/ski-jackets', count: 22 },
  { name: 'Ski goggles', href: '#/c/ski-goggles', count: 9 },
  { name: 'Backpacks', href: '#/c/backpacks', count: 11 },
]
const brands = [{ name: 'Northridge', href: '#/b/northridge' }]
const suggestions = [
  { label: 'parka' },
  { label: 'ski goggles' },
  { label: 'backpack' },
  { label: 'Northridge' },
]
const pick = (...slugs: string[]) =>
  slugs.map((slug) => catalog.find((item) => item.href.endsWith(slug))!)
const collections = [
  {
    title: 'Staff picks',
    products: pick(
      'frost-escape-parka',
      'snowflake-ski-goggles',
      'trailmaster-22',
      'polar-light-ski-jacket',
    ),
  },
  {
    title: "Riders' favourites",
    products: pick(
      'blizzard-defender-aubergine',
      'mountain-view-ski-goggles',
      'winterwonder-parka',
      'summit-series-winter-parka',
    ),
  },
]

const query = ref('')
const results = ref<SearchResult | null>(null)
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (next) => {
  clearTimeout(timer)
  const term = next.trim().toLowerCase()
  if (!term) return
  loading.value = true
  timer = setTimeout(() => {
    const has = (text: string) => text.toLowerCase().includes(term)
    const products = catalog.filter(
      (item) => has(item.name) || has(item.meta ?? ''),
    )
    results.value = {
      query: next.trim(),
      products: products.slice(0, 3),
      categories: categories.filter((item) => has(item.name)),
      brands: brands.filter((item) => has(item.name)),
      total: products.length,
    }
    loading.value = false
  }, 350)
})
</script>

<template>
  <SearchSuggestions
    v-model:query="query"
    :results="results"
    :loading="loading"
    :suggestions="suggestions"
    :collections="collections"
    :search-href="(q: string) => `#/search?q=${encodeURIComponent(q)}`"
    placeholder="Search jackets, goggles, packs"
    class="w-md max-w-full"
    v-bind="$attrs" />
</template>
