<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows an optional announcement, the logo, navigation, and search, account and cart buttons. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Badge } from '@library/components/ui/badge'
import { Button } from '@library/components/ui/button'
import { NavigationShop, type NavigationCategory, type NavigationLink } from '@library/components/sections/navigation-shop'
import { IconPlaceholder } from '@registry/icon-placeholder'

const props = withDefaults(
  defineProps<{
    /** The top-level categories; one with featured tiles or link columns opens a flyout, one without is a plain link. */
    categories?: NavigationCategory[]
    /** Plain links after the categories, such as Sale or Journal. */
    pages?: NavigationLink[]
    /** Screen-reader name of the button that opens the mobile menu. */
    menuLabel?: string
    /** Screen-reader title of the mobile menu. */
    sheetTitle?: string
    /** Shown under each featured tile's name, e.g. `Shop now`. */
    featuredCta?: string
    /** Shown in a bar above the header; hidden when empty. */
    announcement?: string
    /** Shown as the logo, or as the logo image's alt text when `logoSrc` is set. */
    logoText?: string
    /** URL of the logo image; `logoText` shows in its place when empty. */
    logoSrc?: string
    /** Where the logo links to. */
    homeHref?: string
    /** Number on the cart button's badge; the badge hides at 0. */
    cartCount?: number
    /** Screen-reader name of the search button. */
    searchLabel?: string
    /** Screen-reader name of the account button. */
    accountLabel?: string
    /** Screen-reader name of the cart button. */
    cartLabel?: string
    /** Shown on the cart badge in place of counts above 9. */
    cartOverflowLabel?: string
    class?: HTMLAttributes['class']
  }>(),
  {
    categories: () => [],
    pages: () => [],
    announcement: '',
    logoText: 'STORE',
    logoSrc: '',
    homeHref: '/',
    cartCount: 0,
    searchLabel: 'Search',
    accountLabel: 'Account',
    cartLabel: 'Cart',
    cartOverflowLabel: '9+',
  },
)
/** The navigation's open flyout, by category name. */
const menu = defineModel<string>('menu', { default: '' })
/** Whether the navigation's mobile sheet is open. */
const menuOpen = defineModel<boolean>('menuOpen', { default: false })
const emit = defineEmits<{
  /** Fires when the shopper clicks the search button; not used when the search slot fills it. */
  search: []
  /** Fires when the shopper clicks the account button. */
  account: []
  /** Fires when the shopper clicks the cart button. */
  cart: []
}>()
defineSlots<{
  /** Replaces the navigation; gets the categories and pages. */
  navigation?: (props: { categories: NavigationCategory[]; pages: NavigationLink[] }) => unknown
  /** Holds the search, rendered twice: inline in the bar from @5xl, and as the button that opens an overlay below that. */
  search?: (props: { presentation: 'inline' | 'overlay' }) => unknown
}>()
</script>

<template>
  <header data-slot="header-shop" :class="['fui-header-shop @container sticky top-0 z-50', props.class]">
    <div v-if="announcement" data-slot="header-shop-announcement" class="fui-header-shop-announcement">
      <div class="mx-auto flex h-8 w-full max-w-384 items-center justify-center px-4 @2xl:px-6 @5xl:px-8">{{ announcement }}</div>
    </div>
    <div data-slot="header-shop-bar" class="fui-header-shop-bar">
      <div class="mx-auto flex h-14 w-full max-w-384 items-center justify-between gap-6 px-4 @2xl:px-6 @5xl:px-8">
        <a :href="homeHref" data-slot="logo" class="fui-logo outline-none focus-visible:fui-focus-ring">
          <img v-if="logoSrc" :src="logoSrc" :alt="logoText" class="h-8 w-auto" />
          <template v-else>{{ logoText }}</template>
        </a>
        <div class="flex-1">
          <slot name="navigation" :categories="categories" :pages="pages">
            <NavigationShop v-model:menu="menu" v-model:open="menuOpen" :categories="categories" :pages="pages" :menu-label="menuLabel" :sheet-title="sheetTitle" :featured-cta="featuredCta" />
          </slot>
        </div>
        <div v-if="$slots.search" class="hidden w-64 @5xl:block">
          <slot name="search" presentation="inline" />
        </div>
        <div class="flex items-center gap-1">
          <div v-if="$slots.search" class="flex @5xl:hidden">
            <slot name="search" presentation="overlay" />
          </div>
          <Button v-else variant="ghost" color="neutral" size="icon-md" :aria-label="searchLabel" @click="emit('search')">
            <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon />
          </Button>
          <div class="hidden @2xl:flex">
            <Button variant="ghost" color="neutral" size="icon-md" :aria-label="accountLabel" @click="emit('account')">
              <IconPlaceholder lucide="UserIcon" tabler="IconUser" hugeicons="User02Icon" phosphor="UserIcon" remixicon="RiUserLine" data-icon />
            </Button>
          </div>
          <Button variant="ghost" color="neutral" size="icon-md" :aria-label="cartLabel" class="relative" @click="emit('cart')">
            <IconPlaceholder lucide="ShoppingBagIcon" tabler="IconShoppingBag" hugeicons="ShoppingBag01Icon" phosphor="BagIcon" remixicon="RiShoppingBagLine" data-icon />
            <Badge v-if="cartCount > 0" variant="primary" size="sm" class="absolute -top-1 -inset-e-1">{{ cartCount > 9 ? cartOverflowLabel : cartCount }}</Badge>
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>
