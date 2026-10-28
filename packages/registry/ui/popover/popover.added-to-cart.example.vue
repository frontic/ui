<script setup lang="ts">
import { ref } from 'vue'
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '.'

defineOptions({ inheritAttrs: false })

const open = ref(true)
</script>

<template>
  <Popover v-model:open="open" v-bind="$attrs">
    <div class="flex w-xs max-w-full flex-col gap-4">
      <div class="flex justify-end">
        <PopoverAnchor as-child>
          <Button
            variant="ghost"
            color="neutral"
            size="icon-md"
            aria-label="Cart">
            <IconPlaceholder
              lucide="ShoppingBagIcon"
              tabler="IconShoppingBag"
              hugeicons="ShoppingBag01Icon"
              phosphor="BagIcon"
              remixicon="RiShoppingBagLine"
              data-icon />
          </Button>
        </PopoverAnchor>
      </div>
      <Button @click="open = true">Add to cart</Button>
    </div>
    <PopoverContent align="end">
      <PopoverHeader>
        <PopoverTitle>Added to cart</PopoverTitle>
        <PopoverDescription
          >Frost Escape Parka, Sun yellow, M</PopoverDescription
        >
      </PopoverHeader>
      <Button as="a" href="#cart" variant="outline" color="neutral"
        >View cart</Button
      >
    </PopoverContent>
  </Popover>
</template>
