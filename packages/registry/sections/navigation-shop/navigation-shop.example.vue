<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<script setup lang="ts">
import { useElementSize, useMutationObserver } from '@vueuse/core'
import { computed, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { NavigationShop, type NavigationCategory, type NavigationLink } from '.'

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

// Shown open: the Women flyout where the bar has room, the sheet where it folds
// into the menu button.
const menu = ref('Women')
const open = ref(false)
const stage = useTemplateRef<HTMLElement>('stage')
const { width } = useElementSize(stage)
const folded = computed(() => width.value > 0 && width.value < 1024)
watch(folded, (value) => (open.value = value))
// The flyout hangs below the bar, outside the demo's height; the demo grows to
// the tallest it has held, so closing one never shrinks the page under the
// reader.
const viewport = shallowRef<HTMLElement | null>(null)
useMutationObserver(
  stage,
  () =>
    (viewport.value =
      stage.value?.querySelector<HTMLElement>(
        '[data-slot="navigation-shop-viewport"]',
      ) ?? null),
  { childList: true, subtree: true },
)
const barSize = useElementSize(useTemplateRef('bar'))
const flyout = useElementSize(viewport)
const tallest = ref(0)
watch(
  [barSize.height, flyout.height],
  ([barHeight, flyoutHeight]) =>
    (tallest.value = Math.max(tallest.value, barHeight + flyoutHeight)),
)
</script>

<template>
  <div
    ref="stage"
    class="@container min-h-130"
    :style="{ height: `${tallest}px` }">
    <div ref="bar" class="relative">
      <NavigationShop
        v-model:menu="menu"
        v-model:open="open"
        :categories="categories"
        :pages="pages"
        v-bind="$attrs" />
    </div>
  </div>
</template>
