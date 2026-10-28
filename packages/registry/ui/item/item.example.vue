<script setup lang="ts">
import { Button } from '@library/components/ui/button'
import { Image } from '@library/components/ui/image'
import { IconPlaceholder } from '@registry/icon-placeholder'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '.'

defineOptions({ inheritAttrs: false })

const orders = [
  {
    number: '10482',
    status: 'Arriving Thursday',
    inTransit: true,
    summary: '3 items · €184.00',
    product: 'frost-escape-parka',
    name: 'Frost Escape Parka',
    address: 'Hauptstraße 12, Munich',
  },
  {
    number: '10317',
    status: 'Delivered 12 Oct',
    summary: '1 item · €126.00',
    product: 'blizzard-defender-aubergine',
    name: 'Blizzard Defender',
    address: 'Hauptstraße 12, Munich',
  },
  {
    number: '10095',
    status: 'Delivered 28 Sep',
    summary: '2 items · €249.00',
    product: 'polar-light-ski-jacket',
    name: 'Polar Light Ski Jacket',
    address: 'Lindenstraße 9, Munich',
  },
]

const thumbnail = (product: string) =>
  `https://static.frontic.com/cdn-cgi/image/width=160,format=auto/ui/products/${product}.jpg`
</script>

<template>
  <ItemGroup class="max-w-md">
    <template v-for="(order, index) in orders" :key="order.number">
      <ItemSeparator v-if="index" />
      <Item
        :as="order.inTransit ? 'div' : 'a'"
        :href="order.inTransit ? undefined : `#order-${order.number}`"
        v-bind="$attrs">
        <ItemHeader>{{ order.status }}</ItemHeader>
        <ItemMedia variant="image">
          <Image :src="thumbnail(order.product)" :alt="order.name" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Order #{{ order.number }}</ItemTitle>
          <ItemDescription>{{ order.summary }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            v-if="order.inTransit"
            variant="outline"
            size="sm"
            as="a"
            :href="`#track-${order.number}`"
            >Track</Button
          >
          <IconPlaceholder
            v-else
            lucide="ChevronRightIcon"
            tabler="IconChevronRight"
            hugeicons="ArrowRight01Icon"
            phosphor="CaretRightIcon"
            remixicon="RiArrowRightSLine"
            class="size-4 rtl:-scale-x-100"
            data-icon />
        </ItemActions>
        <ItemFooter>To {{ order.address }}</ItemFooter>
      </Item>
    </template>
  </ItemGroup>
</template>
