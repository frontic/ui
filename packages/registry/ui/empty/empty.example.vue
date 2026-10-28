<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <Empty v-bind="$attrs">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <IconPlaceholder
          lucide="ShoppingCartIcon"
          tabler="IconShoppingCart"
          hugeicons="ShoppingCart01Icon"
          phosphor="ShoppingCartIcon"
          remixicon="RiShoppingCartLine"
          data-icon />
      </EmptyMedia>
      <EmptyTitle>Your cart is empty</EmptyTitle>
      <EmptyDescription>Add a product and it shows up here.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button
        as="a"
        href="https://sw.demo-shop.com"
        variant="outline"
        color="neutral"
        >Continue shopping</Button
      >
    </EmptyContent>
  </Empty>
</template>
