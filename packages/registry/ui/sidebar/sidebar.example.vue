<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Button } from '@library/components/ui/button'
import {
  FilterPrice,
  FilterSwatch,
  FilterSwitch,
} from '@library/components/ui/filter'
import { Price } from '@library/components/ui/price'
import {
  TagGroup,
  TagGroupItem,
  TagGroupItemDelete,
  TagGroupItemText,
} from '@library/components/ui/tag-group'
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

// The demo shop's men's jackets, as the category grid shows them. Blizzard
// Defender is one product in three colours.
const JACKETS = [
  {
    name: 'Summit Series Winter Parka',
    brand: 'Northridge',
    price: { amount: 13200, currency: 'EUR', ref: 15900 },
    colours: [{ colour: 'Charcoal', hex: '#4a4a47' }],
  },
  {
    name: 'Glacier Explorer',
    brand: 'Ridgeline',
    price: { amount: 9400, currency: 'EUR' },
    colours: [{ colour: 'Slate blue', hex: '#5f7680' }],
    inStock: false,
  },
  {
    name: 'Winter Cliffs Hiking Jacket',
    brand: 'Tarnfell',
    price: { amount: 5200, currency: 'EUR' },
    colours: [{ colour: 'Ochre', hex: '#c08a3c' }],
  },
  {
    name: 'Frost Cruiser Softshell',
    brand: 'Highmoor',
    price: { amount: 10700, currency: 'EUR' },
    colours: [{ colour: 'Steel grey', hex: '#8e98a4' }],
    inStock: false,
  },
  {
    name: 'Glacier Hiker Coat',
    brand: 'Northridge',
    price: { amount: 8400, currency: 'EUR', ref: 10500 },
    colours: [{ colour: 'Dark olive', hex: '#55573f' }],
  },
  {
    name: 'Summit Strider',
    brand: 'Ridgeline',
    price: { amount: 8100, currency: 'EUR' },
    colours: [{ colour: 'Saffron', hex: '#e5a63c' }],
  },
  {
    name: 'Polar Light Ski Jacket',
    brand: 'Tarnfell',
    price: { amount: 7900, currency: 'EUR' },
    colours: [{ colour: 'Dusty pink', hex: '#d6aaa6' }],
  },
  {
    name: 'Glacier Fever Functional Jacket',
    brand: 'Highmoor',
    price: { amount: 6500, currency: 'EUR' },
    colours: [{ colour: 'Mustard', hex: '#cf9e42' }],
  },
  {
    name: 'Arctic Fox Winter Jacket',
    brand: 'Northridge',
    price: { amount: 6100, currency: 'EUR', ref: 7900 },
    colours: [{ colour: 'Light grey', hex: '#d0d0ce' }],
  },
  {
    name: 'Arctic Mission Jacket',
    brand: 'Ridgeline',
    price: { amount: 8700, currency: 'EUR' },
    colours: [{ colour: 'Dark brown', hex: '#4d3e34' }],
  },
  {
    name: 'Blizzard Defender',
    brand: 'Tarnfell',
    price: { amount: 12600, currency: 'EUR' },
    colours: [
      { colour: 'Aubergine', hex: '#3d3347' },
      { colour: 'Dusty rose', hex: '#b98a87' },
      { colour: 'Salmon', hex: '#dc967b' },
    ],
  },
  {
    name: 'High Altitude Trekking Jacket',
    brand: 'Highmoor',
    price: { amount: 6200, currency: 'EUR' },
    colours: [{ colour: 'Olive', hex: '#a09d5c' }],
  },
  {
    name: 'Arctic Fox Hybrid Coat',
    brand: 'Northridge',
    price: { amount: 6800, currency: 'EUR' },
    colours: [{ colour: 'Terracotta', hex: '#c4735f' }],
    inStock: false,
  },
  {
    name: 'Summit Stormer Parka',
    brand: 'Ridgeline',
    price: { amount: 5700, currency: 'EUR' },
    colours: [{ colour: 'Amber', hex: '#e2a240' }],
  },
  {
    name: 'Mountaineer Hybrid Jacket',
    brand: 'Tarnfell',
    price: { amount: 9100, currency: 'EUR' },
    colours: [{ colour: 'Charcoal', hex: '#4a4a47' }],
  },
  {
    name: 'Aurora Functional Jacket',
    brand: 'Highmoor',
    price: { amount: 7400, currency: 'EUR' },
    colours: [{ colour: 'Rust', hex: '#b0593f' }],
  },
  {
    name: 'Frost Escape Parka',
    brand: 'Northridge',
    price: { amount: 14900, currency: 'EUR' },
    colours: [{ colour: 'Sun yellow', hex: '#e5ad40' }],
  },
  {
    name: 'Alpine Trekker',
    brand: 'Ridgeline',
    price: { amount: 12600, currency: 'EUR' },
    colours: [{ colour: 'Stone grey', hex: '#9c9c9a' }],
    inStock: false,
  },
  {
    name: 'Arctic Mission Parka',
    brand: 'Tarnfell',
    price: { amount: 11980, currency: 'EUR' },
    colours: [{ colour: 'Burnt orange', hex: '#c8704f' }],
  },
]

const HEX: Record<string, string> = Object.fromEntries(
  JACKETS.flatMap((jacket) =>
    jacket.colours.map(({ colour, hex }) => [colour, hex]),
  ).sort(([a], [b]) => a.localeCompare(b)),
)
const MIN =
  Math.floor(Math.min(...JACKETS.map((j) => j.price.amount)) / 1000) * 10
const MAX =
  Math.ceil(Math.max(...JACKETS.map((j) => j.price.amount)) / 1000) * 10

const CATEGORIES = ['Jackets', 'Goggles', 'Backpacks']

const inStock = ref(false)
const colours = reactive(new Set<string>())
const brands = reactive(new Set<string>())
const expanded = reactive(new Set(['Jackets']))

/** Stands in for the shop's API: the brand list arrives a moment later. */
async function loadBrands() {
  await new Promise((resolve) => setTimeout(resolve, 600))
  return [...new Set(JACKETS.map((j) => j.brand))].sort()
}

const brandList = ref<string[]>()
const brandQuery = ref('')
let loading: Promise<void> | undefined

// Loads once the Brand group first shows: on a phone the sidebar mounts
// only when opened.
function showBrands() {
  loading ??= loadBrands().then((list) => {
    brandList.value = list
  })
}
const price = ref<{ from?: number; to?: number }>({ from: MIN, to: MAX })

const priced = computed(() =>
  JACKETS.filter(
    (j) =>
      (!inStock.value || j.inStock !== false) &&
      j.price.amount >= (price.value.from ?? MIN) * 100 &&
      j.price.amount <= (price.value.to ?? MAX) * 100,
  ),
)
const shown = computed(() =>
  priced.value.filter(
    (j) =>
      (!colours.size || j.colours.some(({ colour }) => colours.has(colour))) &&
      (!brands.size || brands.has(j.brand)),
  ),
)

const brandOptions = computed(() =>
  (brandList.value ?? [])
    .filter((brand) =>
      brand.toLowerCase().includes(brandQuery.value.toLowerCase()),
    )
    .map((brand) => ({
      brand,
      count: priced.value.filter((j) => j.brand === brand).length,
    })),
)

const colourOptions = computed(() =>
  Object.entries(HEX).map(([colour, hex]) => {
    const count = priced.value.filter((j) =>
      j.colours.some((c) => c.colour === colour),
    ).length
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
  ...(inStock.value
    ? [
        {
          key: 'stock',
          label: 'In stock',
          clear: () => (inStock.value = false),
        },
      ]
    : []),
  ...[...brands].map((brand) => ({
    key: `brand-${brand}`,
    label: brand,
    clear: () => brands.delete(brand),
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
])

function remove(keys: unknown[]) {
  for (const chip of active.value) if (keys.includes(chip.key)) chip.clear()
}

function toggle(set: Set<string>, value: string) {
  if (set.has(value)) set.delete(value)
  else set.add(value)
}

function clearAll() {
  inStock.value = false
  brands.clear()
  colours.clear()
  price.value = { from: MIN, to: MAX }
}
</script>

<template>
  <SidebarProvider>
    <Sidebar
      label="Filters"
      description="Narrow the men's jackets by stock, brand, colour and price."
      v-bind="$attrs">
      <SidebarHeader>
        <TagGroup
          v-if="active.length"
          aria-label="Active filters"
          @remove="remove">
          <TagGroupItem
            v-for="chip in active"
            :key="chip.key"
            :value="chip.key">
            <TagGroupItemText>{{ chip.label }}</TagGroupItemText>
            <TagGroupItemDelete />
          </TagGroupItem>
        </TagGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Category</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="category in CATEGORIES" :key="category">
                <SidebarMenuButton
                  as="a"
                  href="#"
                  :is-active="category === 'Jackets'">
                  <span>{{ category }}</span>
                </SidebarMenuButton>
                <SidebarMenuAction
                  :aria-expanded="expanded.has(category)"
                  @click="toggle(expanded, category)">
                  <IconPlaceholder
                    lucide="ChevronDownIcon"
                    tabler="IconChevronDown"
                    hugeicons="ArrowDown01Icon"
                    phosphor="CaretDownIcon"
                    remixicon="RiArrowDownSLine"
                    :class="expanded.has(category) && 'rotate-180'"
                    data-icon />
                  <span class="sr-only">{{ category }} subcategories</span>
                </SidebarMenuAction>
                <SidebarMenuSub v-if="expanded.has(category)">
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      href="#"
                      :is-active="category === 'Jackets'"
                      >Men</SidebarMenuSubButton
                    >
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#">Women</SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <FilterSwitch
              label="In stock"
              description="Ready to ship today"
              :value="inStock"
              @change="inStock = $event" />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup @vue:mounted="showBrands">
          <SidebarGroupLabel>Brand</SidebarGroupLabel>
          <SidebarGroupContent class="flex flex-col gap-2">
            <SidebarInput
              v-model="brandQuery"
              type="search"
              placeholder="Search brands"
              aria-label="Search brands" />
            <SidebarMenu>
              <template v-if="!brandList">
                <SidebarMenuItem v-for="row in 4" :key="row">
                  <SidebarMenuSkeleton />
                </SidebarMenuItem>
              </template>
              <SidebarMenuItem
                v-for="option in brandOptions"
                v-else
                :key="option.brand">
                <SidebarMenuButton
                  :is-active="brands.has(option.brand)"
                  :aria-pressed="brands.has(option.brand)"
                  @click="toggle(brands, option.brand)">
                  <span>{{ option.brand }}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>{{ option.count }}</SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Colour</SidebarGroupLabel>
          <SidebarGroupAction v-if="colours.size" @click="colours.clear()">
            <IconPlaceholder
              lucide="XIcon"
              tabler="IconX"
              hugeicons="Cancel01Icon"
              phosphor="XIcon"
              remixicon="RiCloseLine"
              data-icon />
            <span class="sr-only">Clear colours</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <FilterSwatch
              :options="colourOptions"
              aria-label="Colour"
              @toggle="toggle(colours, $event)" />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Price</SidebarGroupLabel>
          <SidebarGroupContent>
            <FilterPrice
              aria-label="Price"
              :min="MIN"
              :max="MAX"
              :step="10"
              :precision="0"
              :value="price"
              @change="price = $event" />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="outline"
          color="neutral"
          :disabled="!active.length"
          @click="clearAll"
          >Clear all</Button
        >
      </SidebarFooter>
      <SidebarRail label="Toggle filters" />
    </Sidebar>
    <SidebarInset>
      <header class="flex items-center gap-2 p-4">
        <SidebarTrigger label="Toggle filters" />
        <h2>Men's jackets</h2>
        <span class="ms-auto">{{ shown.length }} products</span>
      </header>
      <ul class="flex flex-col px-4 pb-4">
        <li
          v-for="jacket in shown"
          :key="jacket.name"
          class="flex items-center justify-between gap-4 border-b border-border py-2">
          <span>{{ jacket.name }}</span>
          <Price :price="jacket.price" />
        </li>
      </ul>
    </SidebarInset>
  </SidebarProvider>
</template>
