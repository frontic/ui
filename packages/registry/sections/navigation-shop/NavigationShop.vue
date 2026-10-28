<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows store navigation with full-width flyouts of link columns and featured tiles, laid out beside, above or captioned, plus a mobile menu. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { NavigationCategory, NavigationColumn, NavigationFeatured, NavigationProps } from './types'
import { createReusableTemplate } from '@vueuse/core'
import { cva } from 'class-variance-authority'
import { computed } from 'vue'
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { MegaMenu, MegaMenuContent, MegaMenuItem, MegaMenuLink, MegaMenuList, MegaMenuTrigger, MegaMenuViewport } from '@library/components/ui/mega-menu'
import { Separator } from '@library/components/ui/separator'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@library/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@library/components/ui/tabs'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(defineProps<NavigationProps & { class?: HTMLAttributes['class'] }>(), {
  layout: 'beside',
  pages: () => [],
  menuLabel: 'Open menu',
  sheetTitle: 'Navigation menu',
  featuredCta: 'Shop now',
})
/** Whether the mobile menu is open. */
const open = defineModel<boolean>('open', { default: false })
/** The category whose flyout is open, by name; empty when none is. */
const menu = defineModel<string>('menu', { default: '' })
defineSlots<{
  /** Adds content below the mobile menu; gets `close` to shut the menu sheet. */
  'mobile-footer'?: (props: { close: () => void }) => unknown
}>()

const trigger = cva('fui-navigation-shop-trigger', {
  variants: { layout: { beside: 'fui-navigation-shop-trigger-beside', above: 'fui-navigation-shop-trigger-above', captioned: 'fui-navigation-shop-trigger-captioned' } },
  defaultVariants: { layout: 'beside' },
})
const page = cva('fui-navigation-shop-page inline-flex items-center justify-center', {
  variants: {
    layout: { beside: 'fui-navigation-shop-page-beside', above: 'fui-navigation-shop-page-above', captioned: 'fui-navigation-shop-page-captioned' },
    tone: { highlight: 'fui-navigation-shop-page-highlight' },
  },
  defaultVariants: { layout: 'beside' },
})
const content = cva('fui-navigation-shop-content', {
  variants: { layout: { beside: 'fui-navigation-shop-content-beside', above: 'fui-navigation-shop-content-above', captioned: 'fui-navigation-shop-content-captioned' } },
  defaultVariants: { layout: 'beside' },
})
const viewport = cva('fui-navigation-shop-viewport', {
  variants: { layout: { beside: 'fui-navigation-shop-viewport-beside', above: 'fui-navigation-shop-viewport-above', captioned: 'fui-navigation-shop-viewport-captioned' } },
  defaultVariants: { layout: 'beside' },
})
const featuredImage = cva('fui-navigation-shop-featured-image overflow-hidden', {
  variants: {
    layout: { beside: 'fui-navigation-shop-featured-image-beside', above: 'fui-navigation-shop-featured-image-above', captioned: 'fui-navigation-shop-featured-image-captioned' },
  },
  defaultVariants: { layout: 'beside' },
})

const hasMenu = (category: NavigationCategory) => !!(category.featured?.length || category.columns?.length)
const menus = computed(() => props.categories.filter(hasMenu))
const links = computed<{ name: string; href?: string; highlight?: boolean }[]>(() => [...props.categories.filter((category) => !hasMenu(category)), ...props.pages])
const GRID = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3']
/** A captioned flyout leads with a wide tile; the other layouts keep every tile square. */
const wide = (item: NavigationFeatured, at: number) => props.layout === 'captioned' && (item.wide ?? at === 0)
/** The captioned flyout's three link columns, two stacked in each and the rest in the last: five read [[0, 1], [2, 3], [4]]. */
function groupColumns(columns: NavigationColumn[] = []): NavigationColumn[][] {
  const groups: NavigationColumn[][] = [[], [], []]
  columns.forEach((column, i) => groups[Math.min(Math.floor(i / 2), 2)]!.push(column))
  return groups.filter((group) => group.length)
}
const close = () => {
  open.value = false
}

const [DefineColumn, ReuseColumn] = createReusableTemplate<{ column: NavigationColumn }>()
const [DefineTile, ReuseTile] = createReusableTemplate<{ item: NavigationFeatured }>()
</script>

<template>
  <DefineColumn v-slot="{ column }">
    <div>
      <p data-slot="section-title" class="fui-section-title">{{ column.name }}</p>
      <ul role="list" class="mt-4 space-y-3">
        <li v-for="link in column.links" :key="link.name" class="flex">
          <MegaMenuLink as-child>
            <a :href="link.href" data-slot="link" class="fui-link">{{ link.name }}</a>
          </MegaMenuLink>
        </li>
      </ul>
    </div>
  </DefineColumn>
  <DefineTile v-slot="{ item }">
    <div class="group relative">
      <div data-slot="navigation-shop-featured-image" :class="[featuredImage({ layout }), 'aspect-square']">
        <Image :src="item.imageSrc" :alt="item.imageAlt" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div class="mt-4 flex flex-col gap-1">
        <MegaMenuLink as-child>
          <a :href="item.href" data-slot="line-title" class="fui-line-title">
            <span aria-hidden="true" class="absolute inset-0 z-10" />
            {{ item.name }}
          </a>
        </MegaMenuLink>
        <p aria-hidden="true" data-slot="hint" class="fui-hint">{{ featuredCta }}</p>
      </div>
    </div>
  </DefineTile>

  <div data-slot="navigation-shop" :class="['fui-navigation-shop-root', props.class]">
    <Sheet v-model:open="open">
      <SheetTrigger as-child>
        <Button variant="ghost" color="neutral" size="icon-md" :aria-label="menuLabel" class="@5xl:hidden">
          <IconPlaceholder lucide="MenuIcon" tabler="IconMenu" hugeicons="Menu09Icon" phosphor="ListIcon" remixicon="RiListUnordered" data-icon />
        </Button>
      </SheetTrigger>
      <SheetContent side="start" class="w-full max-w-xs overflow-y-auto p-0">
        <SheetTitle class="sr-only">{{ sheetTitle }}</SheetTitle>
        <Tabs v-if="menus.length" :default-value="menus[0]!.name" class="mt-2">
          <div>
            <TabsList variant="line" class="w-full ps-4 pe-14">
              <TabsTrigger v-for="category in menus" :key="category.name" :value="category.name" variant="line" class="flex-1">{{ category.name }}</TabsTrigger>
            </TabsList>
            <Separator class="-mt-px" />
          </div>
          <TabsContent v-for="category in menus" :key="category.name" :value="category.name" class="space-y-8 px-4 pt-6 pb-8">
            <div v-if="category.featured?.length" class="grid grid-cols-2 gap-x-4 gap-y-6">
              <div v-for="(item, at) in category.featured" :key="item.name" :class="['group relative', { 'col-span-2': wide(item, at) }]">
                <div data-slot="navigation-shop-featured-image" :class="[featuredImage({ layout }), wide(item, at) ? 'aspect-2/1' : 'aspect-square']">
                  <Image :src="item.imageSrc" :alt="item.imageAlt" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div class="mt-3 flex flex-col gap-1">
                  <a :href="item.href" data-slot="line-title" class="fui-line-title outline-none focus-visible:fui-focus-ring" @click="close">
                    <span aria-hidden="true" class="absolute inset-0 z-10" />
                    {{ item.name }}
                  </a>
                  <p aria-hidden="true" data-slot="hint" class="fui-hint">{{ featuredCta }}</p>
                </div>
              </div>
            </div>
            <div v-for="column in category.columns" :key="column.name">
              <p data-slot="section-title" class="fui-section-title">{{ column.name }}</p>
              <ul role="list" class="mt-2 flex flex-col">
                <li v-for="link in column.links" :key="link.name" data-slot="link" class="fui-link flow-root">
                  <a :href="link.href" data-slot="focus-ring" class="block py-2 outline-none focus-visible:fui-focus-ring" @click="close">{{ link.name }}</a>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
        <div v-if="links.length">
          <Separator v-if="menus.length" />
          <div class="flex flex-col px-4 py-4">
            <div v-for="link in links" :key="link.name" data-slot="section-title" class="fui-section-title flow-root">
              <component :is="link.href ? 'a' : 'span'" :href="link.href" data-slot="focus-ring" class="block py-2 outline-none focus-visible:fui-focus-ring" @click="close">{{ link.name }}</component>
            </div>
          </div>
        </div>
        <div v-if="$slots['mobile-footer']">
          <Separator />
          <div class="space-y-6 px-4 py-6">
            <slot name="mobile-footer" :close="close" />
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <MegaMenu v-model="menu" class="static hidden @5xl:flex @5xl:w-auto @5xl:self-stretch">
      <MegaMenuList :class="layout === 'captioned' && 'gap-8'">
        <MegaMenuItem v-for="category in categories" :key="category.name" :value="category.name">
          <MegaMenuLink v-if="!hasMenu(category) && category.href" as-child>
            <a :href="category.href" data-slot="navigation-shop-page" :class="page({ layout })">{{ category.name }}</a>
          </MegaMenuLink>
          <span v-else-if="!hasMenu(category)" data-slot="navigation-shop-page" :class="page({ layout, class: 'pointer-events-none' })">{{ category.name }}</span>
          <MegaMenuTrigger v-else data-slot="navigation-shop-trigger" :chevron="layout !== 'captioned'" :class="[trigger({ layout }), layout === 'captioned' && 'duration-200 ease-out']">{{
            category.name
          }}</MegaMenuTrigger>
          <MegaMenuContent v-if="hasMenu(category)" data-slot="navigation-shop-content" :class="content({ layout })">
            <div class="mx-auto max-w-7xl px-4 @2xl:px-6 @5xl:px-8">
              <div v-if="layout === 'beside'" class="grid grid-cols-2 gap-x-8 gap-y-10 py-10">
                <div :class="['col-start-2 grid gap-x-6 gap-y-10', (category.featured?.length ?? 0) > 2 ? 'grid-cols-3' : 'grid-cols-2']">
                  <ReuseTile v-for="item in category.featured" :key="item.name" :item="item" />
                </div>
                <div :class="['row-start-1 grid content-start gap-x-8 gap-y-10', GRID[Math.min(category.columns?.length ?? 0, 3)]]">
                  <ReuseColumn v-for="column in category.columns" :key="column.name" :column="column" />
                </div>
              </div>
              <div v-else-if="layout === 'above'" class="py-10">
                <div v-if="category.featured?.length" :class="['grid gap-6', GRID[Math.min(category.featured.length, 3)]]">
                  <ReuseTile v-for="item in category.featured" :key="item.name" :item="item" />
                </div>
                <Separator v-if="category.featured?.length && category.columns?.length" class="mt-8" />
                <div v-if="category.columns?.length" data-slot="navigation-shop-columns" :class="['fui-navigation-shop-columns', { 'pt-8': category.featured?.length }]">
                  <div :class="['grid gap-x-8 gap-y-10', GRID[Math.min(category.columns.length, 3)]]">
                    <ReuseColumn v-for="column in category.columns" :key="column.name" :column="column" />
                  </div>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 gap-x-8 gap-y-10 py-10">
                <div class="grid grid-cols-2 gap-6">
                  <div
                    v-for="(item, at) in category.featured"
                    :key="item.name"
                    data-slot="navigation-shop-featured-image"
                    :class="[featuredImage({ layout }), 'group relative', { 'col-span-2': wide(item, at) }]"
                  >
                    <Image
                      :src="item.imageSrc"
                      :alt="item.imageAlt"
                      :class="['w-full object-cover transition-transform duration-300 group-hover:scale-105', wide(item, at) ? 'aspect-2/1' : 'aspect-square']"
                    />
                    <div class="absolute inset-0 flex flex-col justify-end">
                      <div data-slot="navigation-shop-caption" class="fui-navigation-shop-caption">
                        <div class="flex flex-col gap-0.5">
                          <MegaMenuLink as-child>
                            <a :href="item.href" data-slot="line-title" class="fui-line-title">
                              <span aria-hidden="true" class="absolute inset-0" />
                              {{ item.name }}
                            </a>
                          </MegaMenuLink>
                          <p aria-hidden="true" data-slot="hint" class="fui-hint">{{ featuredCta }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-x-8 gap-y-10">
                  <div v-for="(group, at) in groupColumns(category.columns)" :key="at" class="space-y-10">
                    <ReuseColumn v-for="column in group" :key="column.name" :column="column" />
                  </div>
                </div>
              </div>
            </div>
          </MegaMenuContent>
        </MegaMenuItem>
        <MegaMenuItem v-for="link in pages" :key="link.name">
          <MegaMenuLink as-child>
            <a :href="link.href" data-slot="navigation-shop-page" :class="page({ layout, tone: link.highlight ? 'highlight' : undefined })">{{ link.name }}</a>
          </MegaMenuLink>
        </MegaMenuItem>
      </MegaMenuList>
      <MegaMenuViewport data-slot="navigation-shop-viewport" :class="viewport({ layout })" />
    </MegaMenu>
  </div>
</template>
