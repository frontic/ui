<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { Price } from '@library/components/ui/price'
import {
  Search,
  SearchEmpty,
  SearchGroup,
  SearchHighlight,
  SearchInput,
  SearchItem,
  SearchOverlay,
  SearchOverlayTrigger,
  SearchQuery,
  SearchResults,
  SearchTag,
} from '.'

defineOptions({ inheritAttrs: false })

const eur = (amount: number) => ({ amount, currency: 'EUR' })
const catalog = [
  { name: 'Frost Escape Parka', price: eur(14900) },
  { name: 'Blizzard Defender', price: eur(12600) },
  { name: 'Snowflake Ski Goggles', price: eur(12700) },
  { name: 'TrailMaster 22', price: eur(14100) },
]
const suggestions = ['parka', 'goggles', 'TrailMaster']

const query = ref('')
const products = computed(() => {
  const text = query.value.trim().toLowerCase()
  return text
    ? catalog.filter((product) => product.name.toLowerCase().includes(text))
    : []
})
</script>

<template>
  <SearchOverlay>
    <template #trigger>
      <div class="flex w-md max-w-full items-center justify-between gap-4">
        <span>Basecamp</span>
        <SearchOverlayTrigger as-child>
          <Button
            variant="ghost"
            color="neutral"
            size="icon-md"
            aria-label="Search">
            <IconPlaceholder
              lucide="SearchIcon"
              tabler="IconSearch"
              hugeicons="SearchIcon"
              phosphor="MagnifyingGlassIcon"
              remixicon="RiSearchLine"
              data-icon />
          </Button>
        </SearchOverlayTrigger>
      </div>
    </template>
    <Search v-model:query="query" v-bind="$attrs">
      <SearchInput placeholder="Search jackets, goggles, packs" />
      <SearchResults>
        <SearchGroup v-if="!query.trim()" heading="Popular searches">
          <div class="flex flex-wrap gap-2 px-3 pb-3">
            <SearchTag
              v-for="suggestion in suggestions"
              :key="suggestion"
              :query="suggestion" />
          </div>
        </SearchGroup>
        <template v-else>
          <SearchQuery />
          <SearchGroup v-if="products.length" heading="Products">
            <SearchItem
              v-for="product in products"
              :key="product.name"
              :value="product.name"
              href="#">
              <SearchHighlight
                :text="product.name"
                class="min-w-0 flex-1 truncate" />
              <Price :price="product.price" align="end" />
            </SearchItem>
          </SearchGroup>
          <SearchEmpty v-else>No results for "{{ query }}".</SearchEmpty>
        </template>
      </SearchResults>
    </Search>
  </SearchOverlay>
</template>
