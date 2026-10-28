<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { ref } from 'vue'
import { Image } from '@library/components/ui/image'
import { Price } from '@library/components/ui/price'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '.'

defineOptions({ inheritAttrs: false })

const sizes = ['S', 'M', 'L', 'XL']
const size = ref('M')
const notify = ref(false)
</script>

<template>
  <ContextMenu v-bind="$attrs">
    <ContextMenuTrigger
      class="flex w-xs max-w-full items-center gap-3 border border-dashed border-border p-3 text-sm">
      <Image
        src="https://static.frontic.com/cdn-cgi/image/width=640,format=auto/ui/products/blizzard-defender-aubergine.jpg"
        alt="Blizzard Defender"
        class="size-16 shrink-0 object-cover" />
      <span class="flex flex-1 flex-col gap-0.5">
        <span>Blizzard Defender</span>
        <span class="text-muted-foreground">Aubergine · {{ size }}</span>
        <Price :price="{ amount: 12600, currency: 'EUR' }" />
      </span>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuLabel>Wishlist</ContextMenuLabel>
        <ContextMenuItem
          >Add to cart<ContextMenuShortcut
            >⌘↵</ContextMenuShortcut
          ></ContextMenuItem
        >
        <ContextMenuSub>
          <ContextMenuSubTrigger>Size</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuRadioGroup v-model="size">
              <ContextMenuRadioItem
                v-for="option in sizes"
                :key="option"
                :value="option"
                >{{ option }}</ContextMenuRadioItem
              >
            </ContextMenuRadioGroup>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem
          >Share<ContextMenuShortcut>⌘S</ContextMenuShortcut></ContextMenuItem
        >
        <ContextMenuCheckboxItem v-model="notify"
          >Notify me when back in stock</ContextMenuCheckboxItem
        >
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuItem color="destructive"
        >Remove from wishlist</ContextMenuItem
      >
    </ContextMenuContent>
  </ContextMenu>
</template>
