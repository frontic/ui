<script setup lang="ts">
import { ref } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const image = (name: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/${name}.jpg`

const jackets = [
  {
    key: 'frost-escape-parka',
    name: 'Frost Escape Parka',
    href: 'https://sw.demo-shop.com/frost-escape-parka-3abd4b58',
    image: image('frost-escape-parka'),
    price: { amount: 14900, currency: 'EUR' },
    specs: { 'Made for': 'Ski', Material: 'Fleece', Colour: 'Sun yellow' },
  },
  {
    key: 'blizzard-defender',
    name: 'Blizzard Defender',
    href: 'https://sw.demo-shop.com/blizzard-defender-455fb5a3',
    image: image('blizzard-defender-aubergine'),
    price: { amount: 12600, currency: 'EUR' },
    specs: { 'Made for': 'Snowboard', Material: 'Nylon', Colour: 'Aubergine' },
  },
  {
    key: 'northern-light-hybrid-jacket',
    name: 'Northern Light Hybrid Jacket',
    href: 'https://sw.demo-shop.com/nordlicht-hybrid-jacket-558734f9',
    image: image('northern-light-hybrid-jacket-charcoal'),
    price: { amount: 11500, currency: 'EUR' },
    specs: { 'Made for': 'Outdoor', Material: 'Polyester', Colour: 'Charcoal' },
  },
]
const specs = ['Made for', 'Material', 'Colour'] as const

const compared = ref(jackets.map((jacket) => jacket.key))
const shown = () =>
  jackets.filter((jacket) => compared.value.includes(jacket.key))
const remove = (key: string) =>
  (compared.value = compared.value.filter((k) => k !== key))
</script>

<template>
  <Drawer default-open v-bind="$attrs">
    <DrawerTrigger as-child>
      <Button variant="outline" color="neutral"
        >Compare ({{ shown().length }})</Button
      >
    </DrawerTrigger>
    <DrawerContent>
      <DrawerHeader>
        <div class="mx-auto flex w-full max-w-2xl flex-col gap-1 @md:gap-2">
          <DrawerTitle>Compare jackets</DrawerTitle>
          <DrawerDescription
            >{{ shown().length }} of 4 places taken. Add more from any product
            page.</DrawerDescription
          >
        </div>
      </DrawerHeader>
      <DrawerBody>
        <p
          v-if="!shown().length"
          class="mx-auto max-w-2xl py-8 text-center text-muted-foreground">
          Nothing to compare yet.
        </p>
        <div v-else class="mx-auto grid max-w-2xl grid-cols-3 gap-x-4 gap-y-3">
          <div
            v-for="jacket in shown()"
            :key="jacket.key"
            class="relative flex flex-col gap-2">
            <Image
              :src="jacket.image"
              :alt="jacket.name"
              class="aspect-square w-full object-contain" />
            <Button
              variant="ghost"
              color="neutral"
              size="icon-sm"
              class="absolute top-1 inset-e-1"
              @click="remove(jacket.key)">
              <IconPlaceholder
                lucide="XIcon"
                tabler="IconX"
                hugeicons="Cancel01Icon"
                phosphor="XIcon"
                remixicon="RiCloseLine"
                data-icon />
              <span class="sr-only">Remove {{ jacket.name }}</span>
            </Button>
            <a :href="jacket.href" class="font-medium">{{ jacket.name }}</a>
            <Price :price="jacket.price" />
          </div>
          <template v-for="spec in specs" :key="spec">
            <p
              class="col-span-3 mt-2 border-t border-border pt-3 text-xs font-semibold tracking-wide uppercase">
              {{ spec }}
            </p>
            <p v-for="jacket in shown()" :key="jacket.key">
              {{ jacket.specs[spec] }}
            </p>
          </template>
        </div>
      </DrawerBody>
      <DrawerFooter>
        <div
          class="mx-auto flex w-full max-w-2xl flex-col gap-2 @md:flex-row @md:justify-end">
          <Button
            variant="outline"
            color="neutral"
            :disabled="!shown().length"
            @click="compared = []"
            >Clear all</Button
          >
          <DrawerClose as-child><Button>Done</Button></DrawerClose>
        </div>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
</template>
