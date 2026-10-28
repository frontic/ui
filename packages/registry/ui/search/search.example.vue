<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  Search,
  SearchEmpty,
  SearchGroup,
  SearchHighlight,
  SearchInput,
  SearchItem,
  SearchLoading,
  SearchQuery,
  SearchResults,
  SearchTag,
} from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/${name}.jpg`
const eur = (amount: number) => ({ amount, currency: 'EUR' })
const catalog = [
  {
    name: 'Frost Escape Parka',
    meta: 'Sun yellow · Jackets',
    price: eur(14900),
    image: image('frost-escape-parka'),
  },
  {
    name: 'Winterwonder Parka',
    meta: 'Jackets',
    price: eur(18900),
    image: image('winterwonder-parka'),
  },
  {
    name: 'Blizzard Defender',
    meta: 'Aubergine · Jackets',
    price: eur(12600),
    image: image('blizzard-defender-aubergine'),
  },
  {
    name: 'Polar Light Ski Jacket',
    meta: 'Dusty pink · Jackets',
    price: eur(7900),
    image: image('polar-light-ski-jacket'),
  },
  {
    name: 'Snowflake Ski Goggles',
    meta: 'Mint · Goggles',
    price: eur(12700),
    image: image('snowflake-ski-goggles'),
  },
  {
    name: 'Mountain View Ski Goggles',
    meta: 'Goggles',
    price: eur(9900),
    image: image('mountain-view-ski-goggles'),
  },
  {
    name: 'TrailMaster 22',
    meta: 'Brown · 20L · Backpacks',
    price: eur(14100),
    image: image('trailmaster-22'),
  },
]
const categories = ['Parkas', 'Ski jackets', 'Ski goggles', 'Backpacks']
const suggestions = ['parka', 'ski goggles', 'backpack', 'Northridge']

const query = ref('')
const answered = ref('')
const loading = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(query, (next) => {
  clearTimeout(timer)
  loading.value = !!next.trim()
  timer = setTimeout(() => {
    answered.value = next.trim()
    loading.value = false
  }, 300)
})

const matches = (text: string) =>
  text.toLowerCase().includes(answered.value.toLowerCase())
const products = computed(() =>
  answered.value
    ? catalog
        .filter((product) => matches(product.name) || matches(product.meta))
        .slice(0, 4)
    : [],
)
const found = computed(() => (answered.value ? categories.filter(matches) : []))
const href = (text: string) => `#${encodeURIComponent(text)}`
</script>

<template>
  <Search
    v-model:query="query"
    :loading="loading"
    class="w-md max-w-full"
    v-bind="$attrs">
    <SearchInput placeholder="Search jackets, goggles, packs" />
    <SearchResults>
      <template v-if="!query.trim()">
        <SearchGroup heading="Popular searches">
          <div class="flex flex-wrap gap-2 px-3 pb-3">
            <SearchTag
              v-for="suggestion in suggestions"
              :key="suggestion"
              :query="suggestion" />
          </div>
        </SearchGroup>
      </template>
      <template v-else>
        <SearchQuery />
        <SearchLoading v-if="loading" />
        <template v-else>
          <SearchGroup v-if="products.length" heading="Products">
            <SearchItem
              v-for="product in products"
              :key="product.name"
              :value="product.name"
              :href="href(product.name)">
              <Image
                :src="product.image"
                alt=""
                class="size-12 shrink-0 object-cover" />
              <span class="flex min-w-0 flex-1 flex-col">
                <SearchHighlight :text="product.name" class="truncate" />
                <span class="truncate text-muted-foreground">{{
                  product.meta
                }}</span>
              </span>
              <Price :price="product.price" align="end" />
            </SearchItem>
          </SearchGroup>
          <SearchGroup v-if="found.length" heading="Categories">
            <SearchItem
              v-for="category in found"
              :key="category"
              :value="category"
              :href="href(category)">
              <SearchHighlight :text="category" />
            </SearchItem>
          </SearchGroup>
          <SearchEmpty v-if="!products.length && !found.length"
            >No results for "{{ answered }}". Try one of these:</SearchEmpty
          >
          <div
            v-if="!products.length && !found.length"
            class="flex flex-wrap gap-2 px-3 pb-3">
            <SearchTag
              v-for="suggestion in suggestions"
              :key="suggestion"
              :query="suggestion" />
          </div>
        </template>
      </template>
    </SearchResults>
  </Search>
</template>
