<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/${name}.jpg`
const eur = (amount: number) => ({ amount, currency: 'EUR' })
const items = [
  {
    name: 'Frost Escape Parka',
    variant: 'Sun yellow · M',
    price: eur(14900),
    image: image('frost-escape-parka'),
  },
  {
    name: 'Blizzard Defender',
    variant: 'Aubergine · L',
    price: eur(12600),
    image: image('blizzard-defender-aubergine'),
  },
  {
    name: 'Polar Light Ski Jacket',
    variant: 'Dusty pink · S',
    price: eur(7900),
    image: image('polar-light-ski-jacket'),
  },
  {
    name: 'Snowflake Ski Goggles',
    variant: 'Mint',
    price: eur(12700),
    image: image('snowflake-ski-goggles'),
  },
  {
    name: 'Mountain View Ski Goggles',
    variant: 'One size',
    price: eur(9900),
    image: image('mountain-view-ski-goggles'),
  },
  {
    name: 'TrailMaster 22',
    variant: 'Brown · 20L',
    price: eur(14100),
    image: image('trailmaster-22'),
  },
]
const subtotal = eur(items.reduce((sum, item) => sum + item.price.amount, 0))
</script>

<template>
  <Sheet default-open v-bind="$attrs">
    <SheetTrigger as-child>
      <Button variant="outline" color="neutral">Open cart</Button>
    </SheetTrigger>
    <SheetContent close-label="Close cart">
      <SheetHeader>
        <SheetTitle>Your cart</SheetTitle>
        <SheetDescription
          >{{ items.length }} items, ready for checkout.</SheetDescription
        >
      </SheetHeader>
      <SheetBody>
        <ul class="flex flex-col gap-4">
          <li v-for="item in items" :key="item.name" class="flex gap-4">
            <Image
              :src="item.image"
              :alt="item.name"
              class="size-20 shrink-0" />
            <div class="flex flex-1 flex-col gap-1 text-sm">
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-muted-foreground">{{ item.variant }}</span>
              <Price :price="item.price" />
            </div>
          </li>
        </ul>
      </SheetBody>
      <SheetFooter>
        <div class="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <Price :price="subtotal" />
        </div>
        <Button>Checkout</Button>
        <SheetClose as-child>
          <Button variant="outline" color="neutral">Keep shopping</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
