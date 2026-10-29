<script setup lang="ts">
import { defineComponent, h, markRaw } from 'vue'
import { Button } from '@library/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@library/components/ui/item'
import { Price } from '@library/components/ui/price'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Toast, toast } from '.'

defineOptions({ inheritAttrs: false })

const JACKET = {
  name: 'Polar Light Ski Jacket',
  variant: 'Dusty pink · M',
  price: { amount: 7900, currency: 'EUR' },
  image:
    'https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/polar-light-ski-jacket.jpg',
}

// What the toast shows under its title: the cart line that was added, and the
// way to the cart.
const CartLine = markRaw(
  defineComponent(
    () => () =>
      h('div', { class: 'flex flex-col gap-3' }, [
        h(Item, { size: 'sm', class: 'p-0' }, () => [
          h(ItemMedia, { variant: 'image' }, () =>
            h('img', { src: JACKET.image, alt: '' }),
          ),
          h(ItemContent, null, () => [
            h(ItemTitle, null, () => JACKET.name),
            h(ItemDescription, null, () => JACKET.variant),
          ]),
          h(ItemActions, null, () =>
            h(Price, { price: JACKET.price, size: 'sm' }),
          ),
        ]),
        h(
          Button,
          {
            as: 'a',
            href: '#cart',
            variant: 'outline',
            color: 'neutral',
            size: 'sm',
            class: 'w-full',
            onClick: () => toast.dismiss(),
          },
          () => 'View cart',
        ),
      ]),
  ),
)

function addToCart() {
  toast.success('Added to cart', { description: CartLine })
}
</script>

<template>
  <div>
    <Button color="buy" @click="addToCart">
      <IconPlaceholder
        lucide="ShoppingBagIcon"
        tabler="IconShoppingBag"
        hugeicons="ShoppingBag01Icon"
        phosphor="BagIcon"
        remixicon="RiShoppingBagLine"
        data-icon />
      Add to cart
    </Button>
    <Toast v-bind="$attrs" />
  </div>
</template>
