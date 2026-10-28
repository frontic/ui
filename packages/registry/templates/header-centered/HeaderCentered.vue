<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script lang="ts">
/** Shows the logo and navigation with search, account and cart buttons. */
export default {}
</script>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useSlots } from 'vue'
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
    menuLabel: 'Open menu',
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
  /** Holds the search, rendered twice: inline beside the menu from @5xl, and as the button that opens an overlay below that. */
  search?: (props: { presentation: 'inline' | 'overlay' }) => unknown
}>()
// Below @5xl its own navigation is only a menu button: it moves into the bar and the navigation row folds away. A passed navigation keeps its row.
const ownNavigation = !useSlots().navigation
</script>

<template>
  <header data-slot="header-centered" :class="['fui-header-centered @container sticky top-0 z-50', props.class]">
    <div class="mx-auto flex h-16 w-full max-w-384 items-center justify-between px-4 @2xl:px-6 @5xl:px-8">
      <div class="flex flex-1 items-center gap-1">
        <div v-if="ownNavigation" class="flex @5xl:hidden">
          <Button variant="ghost" color="neutral" size="icon-md" :aria-label="menuLabel" @click="menuOpen = true">
            <IconPlaceholder lucide="MenuIcon" tabler="IconMenu" hugeicons="Menu09Icon" phosphor="ListIcon" remixicon="RiListUnordered" data-icon />
          </Button>
        </div>
        <template v-if="$slots.search">
          <div class="flex @5xl:hidden">
            <slot name="search" presentation="overlay" />
          </div>
          <div class="hidden w-64 @5xl:block">
            <slot name="search" presentation="inline" />
          </div>
        </template>
        <Button v-else variant="ghost" color="neutral" size="icon-md" :aria-label="searchLabel" @click="emit('search')">
          <IconPlaceholder lucide="SearchIcon" tabler="IconSearch" hugeicons="SearchIcon" phosphor="MagnifyingGlassIcon" remixicon="RiSearchLine" data-icon />
        </Button>
      </div>
      <a :href="homeHref" data-slot="header-centered-logo" class="fui-header-centered-logo outline-none focus-visible:fui-focus-ring">
        <img v-if="logoSrc" :src="logoSrc" :alt="logoText" class="h-8 w-auto" />
        <template v-else>{{ logoText }}</template>
      </a>
      <div class="flex flex-1 items-center justify-end gap-1">
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
    <div :class="{ 'hidden @5xl:block': ownNavigation }">
      <div data-slot="header-centered-nav" class="fui-header-centered-nav">
        <div class="mx-auto w-full max-w-384 px-4 py-2 @2xl:px-6 @5xl:px-8">
          <div class="flex justify-center">
            <slot name="navigation" :categories="categories" :pages="pages">
              <NavigationShop
                layout="captioned"
                v-model:menu="menu"
                v-model:open="menuOpen"
                :categories="categories"
                :pages="pages"
                :menu-label="menuLabel"
                :sheet-title="sheetTitle"
                :featured-cta="featuredCta"
              />
            </slot>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
