<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`
const items = [
  {
    name: 'Blizzard Defender',
    detail: 'Aubergine · M',
    price: { amount: 12600, currency: 'EUR' },
    image: image('blizzard-defender-aubergine'),
  },
  {
    name: 'Polar Light Ski Jacket',
    detail: 'Dusty pink · S',
    price: { amount: 7900, currency: 'EUR' },
    image: image('polar-light-ski-jacket'),
  },
]
const total = {
  amount: items.reduce((sum, item) => sum + item.price.amount, 0),
  currency: 'EUR',
}
</script>

<template>
  <Collapsible
    v-slot="{ open }"
    class="flex w-sm max-w-full flex-col border-y border-border"
    v-bind="$attrs">
    <CollapsibleTrigger
      class="flex w-full items-center gap-2 py-4 text-start text-sm">
      <span class="flex-1">{{ open ? 'Hide' : 'Show' }} order summary</span>
      <IconPlaceholder
        lucide="ChevronDownIcon"
        tabler="IconChevronDown"
        hugeicons="ArrowDown01Icon"
        phosphor="CaretDownIcon"
        remixicon="RiArrowDownSLine"
        :class="['size-4 transition-transform', open && 'rotate-180']" />
      <Price :price="total" align="end" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <ul class="flex flex-col gap-3 pb-4">
        <li
          v-for="item in items"
          :key="item.name"
          class="flex items-center gap-3 text-sm">
          <Image
            :src="item.image"
            :alt="item.name"
            class="size-12 shrink-0 object-cover" />
          <span class="flex flex-1 flex-col">
            <span>{{ item.name }}</span>
            <span class="text-muted-foreground">{{ item.detail }}</span>
          </span>
          <Price :price="item.price" align="end" />
        </li>
      </ul>
    </CollapsibleContent>
  </Collapsible>
</template>
