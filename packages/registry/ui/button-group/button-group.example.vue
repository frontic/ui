<!-- SPDX-License-Identifier: FSL-1.1-MIT -->
<!-- Portions derived from shadcn-vue (MIT); see https://registry.ui.frontic.com/THIRD-PARTY-NOTICES -->
<script setup lang="ts">
import { IconPlaceholder } from '@registry/icon-placeholder'
import { Button } from '@library/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@library/components/ui/dropdown-menu'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '.'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <ButtonGroup aria-label="Order actions" v-bind="$attrs">
    <ButtonGroup>
      <Button
        variant="outline"
        color="neutral"
        size="icon-md"
        aria-label="Back to orders">
        <IconPlaceholder
          lucide="ArrowLeftIcon"
          tabler="IconArrowLeft"
          hugeicons="ArrowLeft01Icon"
          phosphor="ArrowLeftIcon"
          remixicon="RiArrowLeftLine"
          class="rtl:-scale-x-100"
          data-icon />
      </Button>
    </ButtonGroup>
    <ButtonGroupText class="whitespace-nowrap">#10482</ButtonGroupText>
    <ButtonGroup>
      <Button variant="outline" color="neutral">Track</Button>
      <Button variant="outline" color="neutral">Invoice</Button>
    </ButtonGroup>
    <ButtonGroup>
      <Button>Reorder</Button>
      <ButtonGroupSeparator />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button size="icon-md" aria-label="More order actions">
            <IconPlaceholder
              lucide="MoreHorizontalIcon"
              tabler="IconDots"
              hugeicons="MoreHorizontalCircle01Icon"
              phosphor="DotsThreeIcon"
              remixicon="RiMoreLine"
              data-icon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Return items</DropdownMenuItem>
          <DropdownMenuItem>Contact support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem color="destructive">Cancel order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  </ButtonGroup>
</template>
